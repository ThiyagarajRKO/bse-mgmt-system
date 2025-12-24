"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductPackagingRules extends Model {
    static associate(models) {
      // No associations needed for this lookup table
    }
  }

  ProductPackagingRules.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      parent_category_type: {
        type: DataTypes.ENUM(
          "Fish",
          "Crustacean",
          "Cephalopod",
          "Mollusk",
          "ALL"
        ),
        allowNull: false,
        comment: "Parent category from species master",
      },
      product_category: {
        type: DataTypes.ENUM("Fresh", "Frozen", "Cooked", "Live"),
        allowNull: false,
        comment: "Product category/type",
      },
      grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Grade level (A, Export, etc.) - null for all grades",
      },
      min_net_weight_kg: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        comment: "Minimum net weight in kg",
      },
      max_net_weight_kg: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        comment: "Maximum net weight in kg",
      },
      primary_packaging_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Primary packaging type (VAC, IQF, TRAY, etc.)",
      },
      secondary_packaging_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Secondary packaging type (BOX, BAG, etc.)",
      },
      tertiary_packaging_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "Tertiary packaging type (MC, PALLET, etc.)",
      },
      is_export: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether this rule applies to export products",
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Rule priority (lower number = higher priority)",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ProductPackagingRules",
      tableName: "product_packaging_rules",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  return ProductPackagingRules;
};
