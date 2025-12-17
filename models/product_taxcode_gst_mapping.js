// models/product_taxcode_gst_mapping.js
module.exports = (sequelize, DataTypes) => {
  const ProductTaxcodeGstMapping = sequelize.define(
    "ProductTaxcodeGstMapping",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      supply_type: DataTypes.STRING, // Domestic / Export
      cgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Central GST rate percentage",
      },
      sgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "State GST rate percentage",
      },
      igst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Integrated GST rate percentage",
      },
      effective_from: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      effective_to: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "product_taxcode_gst_mapping",
      underscored: true,
    }
  );

  ProductTaxcodeGstMapping.associate = (models) => {
    ProductTaxcodeGstMapping.belongsTo(models.ProductMaster, {
      foreignKey: "product_id",
      as: "product",
    });

    ProductTaxcodeGstMapping.belongsTo(models.TaxCodeMaster, {
      foreignKey: "tax_code_id",
      targetKey: "tax_code_id",
      as: "taxCode",
    });

    ProductTaxcodeGstMapping.belongsTo(models.ConsolidatedGstMaster, {
      foreignKey: "gst_master_id",
      as: "gst",
    });
  };

  /**
   * Check if a mapping already exists (active, non-deleted)
   * @param {string} productId - Product ID
   * @param {string} taxCodeId - Tax Code ID
   * @param {string} gstMasterId - GST Master ID
   * @param {string} supplyType - Supply Type (Domestic/Export)
   * @returns {Promise<boolean>} - True if duplicate exists
   */
  ProductTaxcodeGstMapping.checkDuplicate = async function (
    productId,
    taxCodeId,
    gstMasterId,
    supplyType
  ) {
    const existing = await this.findOne({
      where: {
        product_id: productId,
        tax_code_id: taxCodeId,
        gst_master_id: gstMasterId,
        supply_type: supplyType,
      },
      paranoid: true, // Only fetch non-deleted records
    });
    return !!existing;
  };

  /**
   * Get all active mappings for a product
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} - Active mappings for the product
   */
  ProductTaxcodeGstMapping.getActiveMappingsForProduct = async function (
    productId
  ) {
    return this.findAll({
      where: {
        product_id: productId,
      },
      paranoid: true, // Only fetch non-deleted records
      order: [["created_at", "DESC"]],
    });
  };

  /**
   * Find all duplicate mappings in the table
   * @returns {Promise<Array>} - Array of duplicate entries
   */
  ProductTaxcodeGstMapping.findDuplicates = async function () {
    const duplicates = await this.sequelize.query(
      `
      SELECT 
        product_id, 
        tax_code_id, 
        gst_master_id, 
        supply_type,
        COUNT(*) as duplicate_count,
        array_agg(id) as duplicate_ids
      FROM product_taxcode_gst_mapping
      WHERE deleted_at IS NULL
      GROUP BY product_id, tax_code_id, gst_master_id, supply_type
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      `,
      { type: this.sequelize.QueryTypes.SELECT }
    );
    return duplicates;
  };

  return ProductTaxcodeGstMapping;
};
