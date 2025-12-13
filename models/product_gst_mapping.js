module.exports = (sequelize, DataTypes) => {
  const ProductGstMapping = sequelize.define(
    "ProductGstMapping",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      product_id: { type: DataTypes.UUID, allowNull: false },
      tax_code_id: { type: DataTypes.UUID, allowNull: true },
      gst_master_id: { type: DataTypes.UUID, allowNull: false },
      supply_type: DataTypes.STRING(50),
      cgst_rate: DataTypes.DECIMAL(5, 2),
      sgst_rate: DataTypes.DECIMAL(5, 2),
      igst_rate: DataTypes.DECIMAL(5, 2),
      effective_from: DataTypes.DATE,
      effective_to: DataTypes.DATE,
      note: DataTypes.TEXT,
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_by: DataTypes.UUID,
      updated_by: DataTypes.UUID,
      deleted_by: DataTypes.UUID,
    },
    {
      tableName: "product_gst_mapping",
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );

  ProductGstMapping.associate = (models) => {
    ProductGstMapping.belongsTo(models.ConsolidatedGstMaster, {
      foreignKey: "gst_master_id",
      as: "gst_master",
    });
    ProductGstMapping.belongsTo(models.ProductMaster, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return ProductGstMapping;
};
