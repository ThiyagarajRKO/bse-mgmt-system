/**
 * BOM Coverage Service
 *
 * Service to check and report on BOM coverage
 * Used for diagnostics and admin dashboards
 */

class BOMCoverageService {
  /**
   * Get comprehensive BOM coverage statistics
   * @returns {Object} Coverage statistics
   */
  static async getCoverageStats(db) {
    try {
      console.log("[BOM Coverage] Generating statistics...");

      // Get all procurement products
      const procurementProducts = await db.ProcurementProducts.count({
        where: { is_active: true },
      });

      // Get procurement products in BOM
      const procurementInBOM = await db.sequelize.query(
        `
        SELECT COUNT(DISTINCT procurement_product_id) as count
        FROM bill_of_materials
        WHERE is_active = true AND procurement_product_id IS NOT NULL
      `,
        { type: db.Sequelize.QueryTypes.SELECT },
      );

      const procurementCovered = procurementInBOM[0]?.count || 0;

      // Get all finished products
      const finishedProducts = await db.ProductMaster.count({
        where: {
          is_active: true,
          is_raw: false,
          is_producible: true,
        },
      });

      // Get finished products in BOM
      const finishedInBOM = await db.sequelize.query(
        `
        SELECT COUNT(DISTINCT product_master_id) as count
        FROM bill_of_materials
        WHERE is_active = true AND product_master_id IS NOT NULL
      `,
        { type: db.Sequelize.QueryTypes.SELECT },
      );

      const finishedCovered = finishedInBOM[0]?.count || 0;

      // Get BOM entries
      const bomEntries = await db.BillOfMaterials.count({
        where: { is_active: true },
      });

      // Get orphaned BOM entries
      const orphanedBOM = await db.sequelize.query(
        `
        SELECT COUNT(*) as count
        FROM bill_of_materials bom
        LEFT JOIN procurement_products pp ON bom.procurement_product_id = pp.id
        WHERE bom.is_active = true AND pp.id IS NULL
      `,
        { type: db.Sequelize.QueryTypes.SELECT },
      );

      const orphaned = orphanedBOM[0]?.count || 0;

      // Calculate percentages
      const procurementCoverage =
        procurementProducts > 0
          ? ((procurementCovered / procurementProducts) * 100).toFixed(1)
          : 0;

      const finishedCoverage =
        finishedProducts > 0
          ? ((finishedCovered / finishedProducts) * 100).toFixed(1)
          : 0;

      const stats = {
        procurement_products: {
          total: procurementProducts,
          in_bom: procurementCovered,
          coverage_percent: parseFloat(procurementCoverage),
        },
        finished_products: {
          total: finishedProducts,
          in_bom: finishedCovered,
          coverage_percent: parseFloat(finishedCoverage),
        },
        bom_entries: {
          total: bomEntries,
          orphaned: orphaned,
        },
        overall_coverage: Math.min(
          parseFloat(procurementCoverage),
          parseFloat(finishedCoverage),
        ),
        timestamp: new Date().toISOString(),
      };

      console.log("[BOM Coverage] Statistics generated:", stats);

      return stats;
    } catch (error) {
      console.error("[BOM Coverage] Error generating statistics:", error);
      throw error;
    }
  }

  /**
   * Get list of uncovered procurement products
   * @returns {Array} Uncovered procurement products
   */
  static async getUncoveredProcurementProducts(db) {
    try {
      console.log("[BOM Coverage] Finding uncovered procurement products...");

      const uncovered = await db.sequelize.query(
        `
        SELECT 
          pp.id,
          pp.product_master_id,
          pp.procurement_product_type,
          pp.supplier_master_id,
          pm.product_name,
          sm.species_name,
          pcm.product_category,
          (
            SELECT COUNT(*) FROM bill_of_materials
            WHERE procurement_product_id = pp.id AND is_active = true
          ) as bom_count
        FROM procurement_products pp
        LEFT JOIN product_master pm ON pp.product_master_id = pm.id
        LEFT JOIN species_master sm ON pm.species_master_id = sm.id
        LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
        WHERE pp.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM bill_of_materials
            WHERE procurement_product_id = pp.id AND is_active = true
          )
        ORDER BY sm.species_name, pm.product_name
      `,
        { type: db.Sequelize.QueryTypes.SELECT },
      );

      console.log(
        "[BOM Coverage] Found",
        uncovered.length,
        "uncovered products",
      );

      return uncovered;
    } catch (error) {
      console.error("[BOM Coverage] Error finding uncovered products:", error);
      throw error;
    }
  }

  /**
   * Get BOM entries for a specific finished product
   * @param {string} productId - Product master ID
   * @returns {Array} BOM entries for the product
   */
  static async getBOMForProduct(db, productId) {
    try {
      console.log(`[BOM Coverage] Getting BOM for product ${productId}...`);

      const bom = await db.sequelize.query(
        `
        SELECT 
          bom.id,
          bom.quantity_required,
          bom.unit_of_measure,
          pp.id as procurement_product_id,
          pp.procurement_product_type,
          pm_raw.id as raw_product_id,
          pm_raw.product_name as raw_product_name,
          sm.species_name,
          pcm.product_category
        FROM bill_of_materials bom
        LEFT JOIN procurement_products pp ON bom.procurement_product_id = pp.id
        LEFT JOIN product_master pm_raw ON pp.product_master_id = pm_raw.id
        LEFT JOIN species_master sm ON pm_raw.species_master_id = sm.id
        LEFT JOIN product_category_master pcm ON pm_raw.product_category_master_id = pcm.id
        WHERE bom.product_master_id = :productId
          AND bom.is_active = true
        ORDER BY pm_raw.product_name
      `,
        {
          replacements: { productId },
          type: db.Sequelize.QueryTypes.SELECT,
        },
      );

      console.log(`[BOM Coverage] Found ${bom.length} BOM entries for product`);

      return bom;
    } catch (error) {
      console.error("[BOM Coverage] Error getting BOM for product:", error);
      throw error;
    }
  }

  /**
   * Get BOM entries for a specific procurement product
   * @param {string} procurementProductId - Procurement product ID
   * @returns {Array} BOM entries using this procurement product
   */
  static async getBOMForProcurementProduct(db, procurementProductId) {
    try {
      console.log(
        `[BOM Coverage] Getting BOM for procurement product ${procurementProductId}...`,
      );

      const bom = await db.sequelize.query(
        `
        SELECT 
          bom.id,
          bom.quantity_required,
          bom.unit_of_measure,
          pm_finished.id as finished_product_id,
          pm_finished.product_name as finished_product_name,
          sm.species_name
        FROM bill_of_materials bom
        JOIN product_master pm_finished ON bom.product_master_id = pm_finished.id
        LEFT JOIN species_master sm ON pm_finished.species_master_id = sm.id
        WHERE bom.procurement_product_id = :procurementProductId
          AND bom.is_active = true
        ORDER BY pm_finished.product_name
      `,
        {
          replacements: { procurementProductId },
          type: db.Sequelize.QueryTypes.SELECT,
        },
      );

      console.log(
        `[BOM Coverage] Found ${bom.length} finished products using this procurement product`,
      );

      return bom;
    } catch (error) {
      console.error(
        "[BOM Coverage] Error getting BOM for procurement product:",
        error,
      );
      throw error;
    }
  }

  /**
   * Check if a product has valid BOM (for diagnostics)
   * @param {string} productId - Product master ID
   * @returns {Object} Health check result
   */
  static async checkProductBOMHealth(db, productId) {
    try {
      console.log(
        `[BOM Coverage] Checking BOM health for product ${productId}...`,
      );

      // Get product details
      const product = await db.ProductMaster.findOne({
        where: { id: productId, is_active: true },
        attributes: [
          "id",
          "product_name",
          "is_raw",
          "species_master_id",
          "product_category_master_id",
        ],
      });

      if (!product) {
        return {
          healthy: false,
          errors: ["Product not found"],
          product_id: productId,
        };
      }

      const errors = [];

      // Check if it's a finished product
      if (product.is_raw) {
        errors.push("Product is marked as raw, not finished");
      }

      // Check if it has species
      if (!product.species_master_id) {
        errors.push("Product has no species assigned");
      }

      // Check BOM entries
      const bomCount = await db.BillOfMaterials.count({
        where: {
          product_master_id: productId,
          is_active: true,
        },
      });

      if (bomCount === 0) {
        errors.push("Product has no BOM entries");
      }

      // Get orphaned references
      const orphanedBOM = await db.sequelize.query(
        `
        SELECT COUNT(*) as count FROM bill_of_materials bom
        LEFT JOIN procurement_products pp ON bom.procurement_product_id = pp.id
        WHERE bom.product_master_id = :productId
          AND bom.is_active = true
          AND pp.id IS NULL
      `,
        {
          replacements: { productId },
          type: db.Sequelize.QueryTypes.SELECT,
        },
      );

      const orphaned = orphanedBOM[0]?.count || 0;
      if (orphaned > 0) {
        errors.push(`Product has ${orphaned} orphaned BOM entries`);
      }

      const health = {
        healthy: errors.length === 0,
        product_id: productId,
        product_name: product.product_name,
        bom_entries: bomCount,
        orphaned_entries: orphaned,
        errors: errors,
        timestamp: new Date().toISOString(),
      };

      console.log("[BOM Coverage] Health check complete:", health);

      return health;
    } catch (error) {
      console.error("[BOM Coverage] Error checking BOM health:", error);
      throw error;
    }
  }
}

export default BOMCoverageService;
