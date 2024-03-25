"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RoleMaster extends Model {
    static associate(models) {
      RoleMaster.belongsTo(models.Users, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      RoleMaster.belongsTo(models.Users, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      RoleMaster.belongsTo(models.Users, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  RoleMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      role_name: {
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
      modelName: "RoleMaster",
      tableName: "role_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  RoleMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a driver details",
        err?.message || err
      );
    }
  });

  // Update Hook
  RoleMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a driver", err?.message || err);
    }
  });

  // Delete Hook
  RoleMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a driver", err?.message || err);
    }
  });

  return RoleMaster;
};
