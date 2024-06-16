"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SupplierMaster extends Model {
    static associate(models) {
      SupplierMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SupplierMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SupplierMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SupplierMaster.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Has Many
      SupplierMaster.hasMany(models.ProcurementProducts, {
        foreignKey: "supplier_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  SupplierMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      supplier_name: {
        type: DataTypes.STRING(100),
      },
      supplier_profile_url: {
        type: DataTypes.TEXT,
      },
      address: {
        type: DataTypes.TEXT,
      },
      representative: {
        type: DataTypes.STRING(100),
      },
      phone: {
        type: DataTypes.STRING(25),
      },
      email: {
        type: DataTypes.STRING(100),
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
      modelName: "SupplierMaster",
      tableName: "supplier_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  SupplierMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a supplier details",
        err?.message || err
      );
    }
  });

  // Update Hook
  SupplierMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a supplier", err?.message || err);
    }
  });

  // Delete Hook
  SupplierMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a supplier", err?.message || err);
    }
  });

  return SupplierMaster;
};
