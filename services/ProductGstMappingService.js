/**
 * Product GST Mapping Service
 * Handles creation, updates, and duplicate prevention for product tax code GST mappings
 */

const db = require("../models");

class ProductGstMappingService {
  /**
   * Create a new product GST mapping with duplicate check
   * @param {Object} data - Mapping data
   * @param {string} data.product_id - Product ID
   * @param {string} data.tax_code_id - Tax Code ID
   * @param {string} data.gst_master_id - GST Master ID
   * @param {string} data.supply_type - Supply Type (Domestic/Export)
   * @param {string} data.created_by - User creating the record
   * @returns {Promise<Object>} - Created mapping or error
   */
  static async createMapping(data) {
    try {
      // Check for existing duplicate
      const isDuplicate = await db.ProductTaxcodeGstMapping.checkDuplicate(
        data.product_id,
        data.tax_code_id,
        data.gst_master_id,
        data.supply_type
      );

      if (isDuplicate) {
        return {
          success: false,
          error: "DUPLICATE_MAPPING",
          message:
            "A mapping already exists for this product, tax code, GST master, and supply type combination",
        };
      }

      // Create the mapping
      const mapping = await db.ProductTaxcodeGstMapping.create(data);
      return {
        success: true,
        data: mapping,
        message: "Product GST mapping created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.name || "CREATE_ERROR",
        message: error.message,
      };
    }
  }

  /**
   * Bulk create mappings with duplicate prevention
   * @param {Array<Object>} mappings - Array of mapping data
   * @param {string} createdBy - User creating the records
   * @returns {Promise<Object>} - Results of bulk creation
   */
  static async bulkCreateMappings(mappings, createdBy) {
    const results = {
      successful: [],
      failed: [],
      duplicates: [],
      total: mappings.length,
    };

    for (const mapping of mappings) {
      const data = { ...mapping, created_by: createdBy };

      // Check for duplicate
      const isDuplicate = await db.ProductTaxcodeGstMapping.checkDuplicate(
        data.product_id,
        data.tax_code_id,
        data.gst_master_id,
        data.supply_type
      );

      if (isDuplicate) {
        results.duplicates.push({
          ...data,
          reason: "Duplicate mapping already exists",
        });
      } else {
        try {
          const created = await db.ProductTaxcodeGstMapping.create(data);
          results.successful.push(created);
        } catch (error) {
          results.failed.push({
            ...data,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Find all duplicate mappings in the table
   * @returns {Promise<Array>} - Duplicate mappings
   */
  static async findDuplicates() {
    try {
      const duplicates = await db.ProductTaxcodeGstMapping.findDuplicates();
      return {
        success: true,
        count: duplicates.length,
        data: duplicates,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Remove duplicate mappings, keeping the oldest record
   * @returns {Promise<Object>} - Results of deduplication
   */
  static async removeDuplicates() {
    let transaction;
    const results = {
      processed: 0,
      removed: 0,
      errors: [],
    };

    try {
      transaction = await db.sequelize.transaction();

      // Find all duplicates
      const duplicates = await db.ProductTaxcodeGstMapping.sequelize.query(
        `
        SELECT 
          product_id, 
          tax_code_id, 
          gst_master_id, 
          supply_type,
          array_agg(id ORDER BY created_at ASC) as ids,
          COUNT(*) as count
        FROM product_taxcode_gst_mapping
        WHERE deleted_at IS NULL
        GROUP BY product_id, tax_code_id, gst_master_id, supply_type
        HAVING COUNT(*) > 1
        `,
        { type: db.sequelize.QueryTypes.SELECT, transaction }
      );

      for (const duplicate of duplicates) {
        results.processed++;
        const idsToDelete = duplicate.ids.slice(1); // Keep first (oldest), delete rest

        try {
          await db.ProductTaxcodeGstMapping.destroy({
            where: { id: idsToDelete },
            transaction,
          });
          results.removed += idsToDelete.length;
        } catch (error) {
          results.errors.push({
            mapping: `${duplicate.product_id}-${duplicate.tax_code_id}-${duplicate.gst_master_id}`,
            error: error.message,
          });
        }
      }

      await transaction.commit();

      return {
        success: true,
        message: `Deduplication complete. Processed ${results.processed} duplicate groups, removed ${results.removed} records.`,
        ...results,
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      return {
        success: false,
        error: error.message,
        ...results,
      };
    }
  }

  /**
   * Get all active mappings for a product
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} - Active mappings
   */
  static async getMappingsForProduct(productId) {
    try {
      const mappings =
        await db.ProductTaxcodeGstMapping.getActiveMappingsForProduct(
          productId
        );
      return {
        success: true,
        data: mappings,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a mapping (handles duplicate prevention)
   * @param {string} id - Mapping ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated mapping or error
   */
  static async updateMapping(id, data) {
    try {
      const mapping = await db.ProductTaxcodeGstMapping.findByPk(id);

      if (!mapping) {
        return {
          success: false,
          error: "NOT_FOUND",
          message: "Mapping not found",
        };
      }

      // If critical fields are being updated, check for duplicates
      if (
        data.product_id ||
        data.tax_code_id ||
        data.gst_master_id ||
        data.supply_type
      ) {
        const isDuplicate = await db.ProductTaxcodeGstMapping.checkDuplicate(
          data.product_id || mapping.product_id,
          data.tax_code_id || mapping.tax_code_id,
          data.gst_master_id || mapping.gst_master_id,
          data.supply_type || mapping.supply_type
        );

        if (isDuplicate) {
          return {
            success: false,
            error: "DUPLICATE_MAPPING",
            message:
              "Update would create a duplicate mapping. Operation cancelled.",
          };
        }
      }

      await mapping.update(data);
      return {
        success: true,
        data: mapping,
        message: "Mapping updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ProductGstMappingService;
