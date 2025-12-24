"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductPackagingMapping extends Model {
    static associate(models) {
      ProductPackagingMapping.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
      });
      ProductPackagingMapping.belongsTo(models.PackagingMaster, {
        foreignKey: "packaging_id",
      });
    }
  }

  ProductPackagingMapping.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      packaging_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      market: DataTypes.ENUM("RETAIL", "EXPORT"),
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      deleted_at: DataTypes.DATE,
      created_by: DataTypes.UUID,
      updated_by: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: "ProductPackagingMapping",
      tableName: "product_packaging_mapping",
      underscored: true,
      timestamps: false,
    }
  );

  return ProductPackagingMapping;
};
