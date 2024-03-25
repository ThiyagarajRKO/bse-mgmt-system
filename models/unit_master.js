"use strict";
const { Model } = require("sequelize");

const UnitTypes = {
  "Collection Center": "clc",
  "Peeling Center": "pc",
  "Cooking Center": "coc",
  "Distribution Center": "dc",
};

module.exports = (sequelize, DataTypes) => {
  class UnitMaster extends Model {
    static associate(models) {
      UnitMaster.belongsTo(models.UserProfiles, {
        as: "creator_profile",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "updater_profile",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "deleter_profile",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  UnitMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      unit_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      unit_code: {
        type: DataTypes.TEXT,
      },
      unit_type: {
        type: DataTypes.STRING,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "UnitMaster",
      tableName: "unit_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  UnitMaster.beforeCreate(async (unit, options) => {
    try {
      if (unit?.unit_type && unit?.location_master_id) {
        const { location_name } = await sequelize.models.LocationMaster.findOne(
          {
            attribute: "location_name",
            where: { id: unit?.location_master_id, is_active: true },
          }
        );

        let unit_type = UnitTypes[unit?.unit_type.trim()];

        unit.unit_code = `${location_name
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toLowerCase()}-${unit_type}-${unit?.unit_name
          .trim()
          ?.replaceAll(" ", "")
          ?.toLowerCase()}`;
      }
    } catch (err) {
      console.log("Error while appending unit name", err?.message || err);
    }
  });

  UnitMaster.beforeUpdate(async (unit, options) => {
    try {
      if (unit?.unit_name && unit?.unit_type && unit?.location_master_id) {
        const { location_name } = await sequelize.models.LocationMaster.findOne(
          {
            attribute: "location_name",
            where: { id: unit?.location_master_id, is_active: true },
          }
        );

        let unit_type = UnitTypes[unit?.unit_type.trim()];

        unit.unit_code = `${location_name
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toLowerCase()}-${unit_type}-${unit?.unit_name
          .trim()
          ?.replaceAll(" ", "")
          ?.toLowerCase()}`;
      }

      unit.updated_at = new Date();
    } catch (err) {
      console.log("Error while appending unit name", err?.message || err);
    }
  });

  return UnitMaster;
};
