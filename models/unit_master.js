"use strict";
const { Model } = require("sequelize");

const UnitTypes = {
  "Collection Center": "CLC",
  "Peeling Center": "PC",
  "Cooking Center": "COC",
  "Distribution Center": "DC",
  "Cold Storage": "CS",
};

module.exports = (sequelize, DataTypes) => {
  class UnitMaster extends Model {
    static associate(models) {
      UnitMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Has Many
      UnitMaster.hasMany(models.Dispatches, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.hasMany(models.PeeledDispatches, {
        foreignKey: "unit_master_id",
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
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  UnitMaster.beforeCreate(async (data, options) => {
    try {
      if (data?.unit_type && data?.location_master_id) {
        const { location_name } = await sequelize.models.LocationMaster.findOne(
          {
            attribute: "location_name",
            where: { id: data?.location_master_id, is_active: true },
          }
        );

        let unit_type = UnitTypes[data?.unit_type.trim()];

        data.unit_code = `${location_name
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}-${unit_type}-${data?.unit_name
          .trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}`;
      }
      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending an unit name", err?.message || err);
    }
  });

  // Update Hook
  UnitMaster.beforeUpdate(async (data, options) => {
    try {
      if (data?.unit_name && data?.unit_type && data?.location_master_id) {
        const { location_name } = await sequelize.models.LocationMaster.findOne(
          {
            attribute: "location_name",
            where: { id: data?.location_master_id, is_active: true },
          }
        );

        let unit_type = UnitTypes[data?.unit_type.trim()];

        data.unit_code = `${location_name
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}-${unit_type}-${data?.unit_name
          .trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}`;
      }

      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating an unit name", err?.message || err);
    }
  });

  // Delete Hook
  UnitMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an unit", err?.message || err);
    }
  });

  return UnitMaster;
};
