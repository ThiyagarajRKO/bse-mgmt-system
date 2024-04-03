"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProcurementLots extends Model {
    static associate(models) {
      ProcurementLots.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementLots.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementLots.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementLots.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementLots.belongsTo(models.VendorMaster, {
        foreignKey: "vendor_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementLots.hasOne(models.ProcurementProducts, {
        foreignKey: "procurement_lot_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ProcurementLots.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      procurement_date: {
        type: DataTypes.DATE,
      },
      procurement_lot: {
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
      modelName: "ProcurementLots",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );
  // Create Hook
  ProcurementLots.beforeCreate(async (data, options) => {
    try {
      const unit_data = await sequelize.models.UnitMaster.findOne({
        attributes: ["unit_code"],
        include: [
          {
            model: sequelize.models.LocationMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where: { id: data?.unit_master_id, is_active: true },
      });

      const { vendor_name } = await sequelize.models.VendorMaster.findOne({
        attributes: ["vendor_name"],
        where: { id: data?.vendor_master_id, is_active: true }, // Fixed variable name
      });

      // Get year, month, and day from the procurement_date
      const year = data?.procurement_date.getFullYear();
      const month = (data?.procurement_date.getMonth() + 1)
        .toString()
        .padStart(2, "0"); // Adding 1 because getMonth() returns zero-based month
      const day = data?.procurement_date.getDate().toString().padStart(2, "0");

      // Construct the procurement_lot in YYYYMMDD format
      data.procurement_lot = `${unit_data["LocationMaster"]?.location_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${year}${month}${day}-${vendor_name
        ?.trim()
        ?.substring(0, 3)
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a procurements data",
        err?.message || err
      );
    }
  });

  // Update Hook
  ProcurementLots.beforeUpdate(async (data, options) => {
    try {
      const unit_data = await sequelize.models.UnitMaster.findOne({
        attributes: ["unit_code"],
        include: [
          {
            model: sequelize.models.LocationMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where: { id: data?.unit_master_id, is_active: true },
      });

      const { vendor_name } = await sequelize.models.VendorMaster.findOne({
        attributes: ["vendor_name"],
        where: { id: data?.vendor_master_id, is_active: true }, // Fixed variable name
      });

      // Get year, month, and day from the procurement_date
      const year = data?.procurement_date.getFullYear();
      const month = (data?.procurement_date.getMonth() + 1)
        .toString()
        .padStart(2, "0"); // Adding 1 because getMonth() returns zero-based month
      const day = data?.procurement_date.getDate().toString().padStart(2, "0");

      // Construct the procurement_lot in YYYYMMDD format
      data.procurement_lot = `${unit_data["LocationMaster"]?.location_name
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${year}${month}${day}-${vendor_name
        ?.trim()
        ?.substring(0, 3)
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error while updating a procurements data",
        err?.message || err
      );
    }
  });

  // Delete Hook
  ProcurementLots.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting a procurements data",
        err?.message || err
      );
    }
  });

  return ProcurementLots;
};
