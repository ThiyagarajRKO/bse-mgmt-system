"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PackagingMaster extends Model {
    static associate(models) {
      PackagingMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PackagingMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PackagingMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PackagingMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },

      packaging_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      packaging_type: {
        type: DataTypes.STRING,
      },
      packaging_height: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      packaging_width: {
        type: DataTypes.STRING(12),
      },
      packaging_length: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      packaging_material_composition: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      packaging_supplier: {
        type: DataTypes.STRING,
        allowNull: false,
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
      modelName: "PackagingMaster",
      tableName: "packaging_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  PackagingMaster.beforeCreate(async (data, options) => {
    try {
      if (
        data?.packaging_type &&
        data?.packaging_length &&
        data?.packaging_width &&
        data?.packaging_height
      ) {
        data.packaging_name = `${data?.packaging_type}-${data?.packaging_length}x${data?.packaging_width}x${data?.packaging_height}`;
      }
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a driver details",
        err?.message || err
      );
    }
  });

  // Update Hook
  PackagingMaster.beforeUpdate(async (data, options) => {
    try {
      if (
        data?.packaging_type &&
        data?.packaging_length &&
        data?.packaging_width &&
        data?.packaging_height
      ) {
        data.packaging_name = `${data?.packaging_type}-${data?.packaging_length}x${data?.packaging_width}x${data?.packaging_height}`;
      }

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a driver", err?.message || err);
    }
  });

  // Delete Hook
  PackagingMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a driver", err?.message || err);
    }
  });

  return PackagingMaster;
};
