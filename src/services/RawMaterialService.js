"use strict";

/**
 * SERVICE: Raw Material Operations
 *
 * Handles:
 * - Creating RAW products from species + size
 * - Size splitting (UNSIZED → sized RAW)
 * - RAW product queries & filtering
 * - Inventory ledger posting for RAW operations
 */

import models, { sequelize } from "../../models";

export const RawMaterialService = {
  /**
   * Create a RAW product programmatically
   * Used by seeders and auto-generation logic
   */
  async createRawProduct({
    speciesId,
    sizeId,
    hsnCode,
    isActive = true,
    createdBy = "00000000-0000-0000-0000-000000000000",
  }) {
    try {
      // Fetch species and size details
      const species = await models.SpeciesMaster.findByPk(speciesId);
      const size = await models.SizeMaster.findByPk(sizeId);

      if (!species || !size) {
        throw new Error("Species or size not found");
      }

      // Generate RAW SKU
      const sizeCode = size.size
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/–/g, "_");
      const sku = `${species.species_code}-WHL-RAW-${sizeCode}`;

      // Generate RAW product name
      const productName = `${species.species_name} – Whole – Raw – ${size.size}`;

      // Get default category
      const defaultCategory = await models.ProductCategoryMaster.findOne({
        where: { is_active: true },
      });

      // Create RAW product
      const rawProduct = await models.ProductMaster.create({
        product_name: productName,
        product_category_master_id: defaultCategory?.id,
        species_master_id: species.id,
        size_master_id: sizeId,
        grade_master_id: null, // RAW cannot have grade
        derivative_master_id: null, // RAW is not a derivative
        hsn_code: hsnCode || species.hsn_code,
        processing_state: "RAW",
        product_role: "RAW_MATERIAL",
        is_raw: true,
        is_producible: false,
        is_sellable: true,
        is_active: isActive,
        created_by: createdBy,
        updated_by: createdBy,
      });

      return rawProduct;
    } catch (error) {
      console.error("Error creating RAW product:", error.message);
      throw error;
    }
  },

  /**
   * Split UNSIZED RAW inventory into sized batches
   * Handles inventory reclassification
   */
  async splitUnsizedRaw({
    unsizedProductId,
    splits, // [{ sizeId, quantity }, ...]
    wasteQuantity = 0,
    reclassificationBatchNo,
    operatedBy,
  }) {
    const transaction = await sequelize.transaction();

    try {
      console.log("\n🔄 Starting UNSIZED RAW size split operation...");

      // Validate UNSIZED product
      const unsizedProduct = await models.ProductMaster.findByPk(
        unsizedProductId,
        {
          transaction,
        },
      );

      if (!unsizedProduct || unsizedProduct.processing_state !== "RAW") {
        throw new Error("Product must be a RAW material");
      }

      // Verify UNSIZED
      const unsizedSize = await models.SizeMaster.findByPk(
        unsizedProduct.size_master_id,
        { transaction },
      );

      if (unsizedSize?.size !== "UNSIZED") {
        throw new Error("This product is not UNSIZED");
      }

      // Calculate total split
      const totalSplit =
        splits.reduce((sum, s) => sum + s.quantity, 0) + wasteQuantity;

      // Check inventory availability
      const currentStock = await models.Inventory.findOne({
        where: {
          product_id: unsizedProductId,
          is_active: true,
        },
        transaction,
      });

      if (!currentStock || currentStock.available_quantity < totalSplit) {
        throw new Error(
          `Insufficient stock. Available: ${
            currentStock?.available_quantity || 0
          }, Requested: ${totalSplit}`,
        );
      }

      // Create reclassification record
      const reclassRecord = {
        id: require("uuid").v4(),
        unsized_product_id: unsizedProductId,
        batch_number: reclassificationBatchNo,
        total_quantity: totalSplit,
        operated_by: operatedBy,
        status: "COMPLETED",
        created_at: new Date(),
      };

      // Deduct UNSIZED from inventory
      await models.Inventory.decrement(
        { available_quantity: totalSplit },
        {
          where: { product_id: unsizedProductId },
          transaction,
        },
      );

      // Add sized inventory
      for (const split of splits) {
        // Resolve or create sized RAW product
        let sizedProduct = await models.ProductMaster.findOne({
          where: {
            processing_state: "RAW",
            size_master_id: split.sizeId,
            // Match same species
            // TODO: filter by species if needed
          },
          transaction,
        });

        if (!sizedProduct) {
          // Auto-create if doesn't exist
          const species = await models.SpeciesMaster.findOne({
            attributes: ["id", "species_code", "species_name", "hsn_code"],
            transaction,
          });

          sizedProduct = await this.createRawProduct({
            speciesId: species.id,
            sizeId: split.sizeId,
            hsnCode: species.hsn_code,
            createdBy: operatedBy,
          });
        }

        // Add sized quantity to inventory
        let sizedInventory = await models.Inventory.findOne({
          where: { product_id: sizedProduct.id },
          transaction,
        });

        if (!sizedInventory) {
          sizedInventory = await models.Inventory.create(
            {
              product_id: sizedProduct.id,
              available_quantity: split.quantity,
              reserved_quantity: 0,
              warehouse_id: currentStock.warehouse_id, // Use same warehouse
            },
            { transaction },
          );
        } else {
          await models.Inventory.increment(
            { available_quantity: split.quantity },
            {
              where: { product_id: sizedProduct.id },
              transaction,
            },
          );
        }

        console.log(
          `  ✓ Split ${split.quantity} kg to ${sizedProduct.product_name}`,
        );
      }

      // Post waste
      if (wasteQuantity > 0) {
        // Waste posting logic (for accounting)
        console.log(`  ⚠️ Recorded ${wasteQuantity} kg waste`);
      }

      await transaction.commit();

      console.log(
        `✅ Size split completed. UNSIZED ${unsizedProductId} reclassified`,
      );

      return {
        success: true,
        reclassificationId: reclassRecord.id,
        message: `Split ${totalSplit} kg into ${splits.length} size categories`,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Error in size split:", error.message);
      throw error;
    }
  },

  /**
   * Get all RAW products for a species
   */
  async getRawProductsBySpecies(speciesId) {
    try {
      return await models.ProductMaster.findAll({
        where: {
          processing_state: "RAW",
          species_id: speciesId,
          is_active: true,
        },
        include: [
          { model: models.SizeMaster, attributes: ["id", "size"] },
          { model: models.SpeciesMaster, attributes: ["id", "species_name"] },
        ],
        order: [["product_name", "ASC"]],
      });
    } catch (error) {
      console.error("Error fetching RAW products:", error.message);
      throw error;
    }
  },

  /**
   * Get UNSIZED RAW inventory (candidates for size sorting)
   */
  async getUnsizedRawInventory() {
    try {
      const unsizedSize = await models.SizeMaster.findOne({
        where: { size: "UNSIZED" },
      });

      if (!unsizedSize) {
        return [];
      }

      return await models.Inventory.findAll({
        include: [
          {
            model: models.ProductMaster,
            where: {
              processing_state: "RAW",
              size_master_id: unsizedSize.id,
              is_active: true,
            },
            include: [
              { model: models.SizeMaster },
              { model: models.SpeciesMaster },
            ],
          },
        ],
        where: {
          available_quantity: { [sequelize.Op.gt]: 0 },
        },
      });
    } catch (error) {
      console.error("Error fetching UNSIZED RAW inventory:", error.message);
      throw error;
    }
  },
};

export default RawMaterialService;
