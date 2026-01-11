"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BomCost extends Model {
    static associate(models) {
      // Association with BomMaster
      BomCost.belongsTo(models.BomMaster, {
        foreignKey: "bom_id",
        onDelete: "CASCADE",
      });
    }
  }

  BomCost.init(
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
      cost_type: {
        type: DataTypes.ENUM("LABOUR", "PACKAGING", "ENERGY", "OVERHEAD"),
        allowNull: false,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "INR",
      },
    },
    {
      sequelize,
      modelName: "BomCost",
      tableName: "bom_cost",
      timestamps: true,
      underscored: true,
    }
  );

  return BomCost;
};
