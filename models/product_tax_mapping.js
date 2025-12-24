module.exports = (sequelize, DataTypes) => {
  const ProductTaxMapping = sequelize.define(
    "ProductTaxMapping",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      tax_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
          model: "tax_master",
          key: "tax_code",
        },
      },
      supply_type: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
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
      tableName: "product_tax_mapping",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ProductTaxMapping.associate = (models) => {
    ProductTaxMapping.belongsTo(models.SpeciesMaster, {
      foreignKey: "product_id",
      as: "product",
    });
    ProductTaxMapping.belongsTo(models.TaxMaster, {
      foreignKey: "tax_code",
      sourceKey: "tax_code",
      as: "taxMaster",
    });
  };

  return ProductTaxMapping;
};
