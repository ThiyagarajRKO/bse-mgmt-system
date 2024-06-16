"use strict";
const { Model } = require("sequelize");

const InventoryCategory = {
  Stationary: "STA",
  "Seafood Cleaning Chemicals": "SCC",
  "Floor Cleaning Chemicals": "FCC",
  "Cleaning Tools": "CTL",
};

module.exports = (sequelize, DataTypes) => {
  class InventoryMaster extends Model {
    static associate(models) {
      InventoryMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      InventoryMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      InventoryMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      InventoryMaster.belongsTo(models.SupplierMaster, {
        foreignKey: "supplier_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  InventoryMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      inventory_name: {
        type: DataTypes.STRING,
      },
      inventory_uom: {
        type: DataTypes.STRING,
      },
      inventory_category: {
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
      modelName: "InventoryMaster",
      tableName: "inventory_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  InventoryMaster.beforeCreate(async (data, options) => {
    try {
      if (data?.inventory_category && data?.supplier_master_id) {
        await sequelize.models.SupplierMaster.findOne({
          attribute: "supplier_name",
          where: { id: data?.supplier_master_id, is_active: true },
        });

        // let inventory_category =
        //   InventoryCategory[data?.inventory_category.trim()];
      }
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an inventory name",
        err?.message || err
      );
    }
  });

  // Update Hook
  InventoryMaster.beforeUpdate(async (data, options) => {
    try {
      if (data?.inventory_category && data?.supplier_master_id) {
        await sequelize.models.SupplierMaster.findOne({
          attribute: "supplier_name",
          where: { id: data?.supplier_master_id, is_active: true },
        });

        // let inventory_category =
        //   InventoryCategory[data?.inventory_category.trim()];
      }

      data.updated_at = new Date();
    } catch (err) {
      console.log("Error while updating an inventory", err?.message || err);
    }
  });

  // Delete Hook
  InventoryMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an inventory", err?.message || err);
    }
  });

  return InventoryMaster;
};
