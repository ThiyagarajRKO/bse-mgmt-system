"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductCategoryGradeMapping extends Model {
    static associate(models) {
      ProductCategoryGradeMapping.belongsTo(models.ProductCategoryMaster, {
        foreignKey: "product_category_master_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      ProductCategoryGradeMapping.belongsTo(models.GradeMaster, {
        foreignKey: "grade_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  ProductCategoryGradeMapping.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_category_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      grade_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "ProductCategoryGradeMapping",
      tableName: "product_category_to_grade_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      timestamps: false,
    }
  );

  return ProductCategoryGradeMapping;
};
