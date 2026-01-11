"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BomMaster extends Model {
    static associate(models) {
      // Association with BomInput
      BomMaster.hasMany(models.BomInput, {
        foreignKey: "bom_id",
        as: "inputs",
        onDelete: "CASCADE",
      });

      // Association with BomOutput
      BomMaster.hasMany(models.BomOutput, {
        foreignKey: "bom_id",
        as: "outputs",
        onDelete: "CASCADE",
      });

      // Association with BomCost
      BomMaster.hasMany(models.BomCost, {
        foreignKey: "bom_id",
        as: "costs",
        onDelete: "CASCADE",
      });

      // Association with SpeciesMaster
      BomMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        onDelete: "RESTRICT",
      });
    }
  }

  BomMaster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      bom_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      bom_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      input_uom: {
        type: DataTypes.STRING(10),
        defaultValue: "KG",
      },
      output_uom: {
        type: DataTypes.STRING(10),
        defaultValue: "KG",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "BomMaster",
      tableName: "bom_master",
      timestamps: true,
      underscored: true,
    }
  );

  return BomMaster;
};
