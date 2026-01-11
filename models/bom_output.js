"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BomOutput extends Model {
    static associate(models) {
      // Association with BomMaster
      BomOutput.belongsTo(models.BomMaster, {
        foreignKey: "bom_id",
        onDelete: "CASCADE",
      });

      // Association with ProductMaster (finished product)
      BomOutput.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
        as: "Product",
        onDelete: "SET NULL",
      });
    }
  }

  BomOutput.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "bom_master",
          key: "id",
        },
      },
      derivative_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "product_master",
          key: "id",
        },
        comment: "NULL for waste products",
      },
      base_yield_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      loss_type: {
        type: DataTypes.ENUM("WASTE", "EVAPORATION", "TRIM"),
        defaultValue: "WASTE",
      },
    },
    {
      sequelize,
      modelName: "BomOutput",
      tableName: "bom_output",
      timestamps: true,
      underscored: true,
    }
  );

  return BomOutput;
};
