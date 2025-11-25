module.exports = (sequelize, DataTypes) => {
  const ConsolidatedGstMaster = sequelize.define(
    "ConsolidatedGstMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      company_id: { type: DataTypes.UUID, allowNull: true },
      gst_rate_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      gst_name: { type: DataTypes.STRING(100), allowNull: false },
      hsn_code: DataTypes.STRING(32),
      description: DataTypes.TEXT,
      cgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      sgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      igst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      export_gst: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      effective_from: { type: DataTypes.DATE, allowNull: true },
      effective_to: { type: DataTypes.DATE, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_by: DataTypes.UUID,
      updated_by: DataTypes.UUID,
      deleted_by: DataTypes.UUID,
    },
    {
      tableName: "consolidated_gst_master",
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );

  ConsolidatedGstMaster.associate = (models) => {
    ConsolidatedGstMaster.hasMany(models.ProductGstMapping, {
      foreignKey: "gst_master_id",
      as: "product_mappings",
    });
  };

  return ConsolidatedGstMaster;
};
