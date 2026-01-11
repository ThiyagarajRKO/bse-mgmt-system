"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BomInput extends Model {
    static associate(models) {
      // Association with BomMaster
      BomInput.belongsTo(models.BomMaster, {
        foreignKey: "bom_id",
        onDelete: "CASCADE",
      });

      // Association with ProductMaster (raw material)
      BomInput.belongsTo(models.ProductMaster, {
        foreignKey: "raw_product_id",
        as: "RawProduct",
        onDelete: "RESTRICT",
      });
    }
  }

  BomInput.init(
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
      raw_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 4),
        defaultValue: 1,
      },
      uom: {
        type: DataTypes.STRING(10),
        defaultValue: "KG",
      },
    },
    {
      sequelize,
      modelName: "BomInput",
      tableName: "bom_input",
      timestamps: true,
      underscored: true,
    }
  );

  return BomInput;
};
