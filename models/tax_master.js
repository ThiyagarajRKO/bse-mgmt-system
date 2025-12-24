module.exports = (sequelize, DataTypes) => {
  const TaxMaster = sequelize.define(
    "TaxMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      tax_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      tax_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      hsn_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      cgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      sgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      igst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      cess_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      tax_type: {
        type: DataTypes.ENUM("GST", "ZERO_RATED", "EXEMPT", "NIL_RATED"),
        defaultValue: "GST",
      },
      is_reverse_charge: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      effective_from: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "tax_master",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  TaxMaster.associate = (models) => {
    TaxMaster.hasMany(models.ProductTaxMapping, {
      foreignKey: "tax_code",
      sourceKey: "tax_code",
      as: "productMappings",
    });
  };

  return TaxMaster;
};
