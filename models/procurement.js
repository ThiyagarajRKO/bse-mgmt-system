"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const ProcurementProductTypes = {

    CLEANED: "CLEANED",
    PEELED: "PEELED",
    SOAKED: "SOAKED",
    RE_GLAZED: "RE - GLAZED",
    GRADED: "GRADED",
    COOKED: "COOKED",
    SORTED: "SORTED",
    VALUE_ADDED: "VALUE ADDED",
    UNPROCESSED: "UNPROCESSED"
  }

  class Procurement extends Model {
    static associate(models) {
      Procurement.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Procurement.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Procurement.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Procurement.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Procurement.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Procurement.belongsTo(models.VendorMaster, {
        foreignKey: "vendor_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Procurement.init(
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
      procurement_product_type: {
        type: DataTypes.STRING,
      },
      procurement_quantity: {
        type: DataTypes.INTEGER,
      },
      procurement_price: {
        type: DataTypes.INTEGER,
      },
      procurement_purchaser: {
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
      modelName: "Procurement",
      tableName: "procurement",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );
  // Create Hook
  Procurement.beforeCreate(async (data, options) => {
    try {
      if (data?.vendor_master_id) {
        const { vendor_name } = await sequelize.models.VendorMaster.findOne({
          attribute: "vendor_name",
          where: { id: data?.vendor_master_id, is_active: true },
        });
        if (data?.location_master_id) {
          const { location_name } = await sequelize.models.LocationMaster.findOne({
            attribute: "location_name",
            where: { id: data?.location_master_id, is_active: true },
          });
          if (data?.product_master_id) {
            const { product_name } = await sequelize.models.ProductMaster.findOne({
              attribute: "product_name",
              where: { id: data?.product_master_id_master_id, is_active: true },
            });

            data.procurement_lot = `${location_name?.trim()?.replaceAll(" ", "")?.toUpperCase()}-${data?.procurement_date}`
          }
        }
      }

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a procurement data",
        err?.message || err
      );
    }
  });

  // Update Hook
  Procurement.beforeUpdate(async (data, options) => {
    try {
      if (data?.vendor_master_id) {
        const { vendor_name } = await sequelize.models.VendorMaster.findOne({
          attribute: "vendor_name",
          where: { id: data?.vendor_master_id, is_active: true },
        });

        if (data?.location_master_id) {
          const { location_name } = await sequelize.models.LocationMaster.findOne({
            attribute: "location_name",
            where: { id: data?.location_master_id, is_active: true },
          });

          if (data?.product_master_id) {
            const { product_name } = await sequelize.models.ProductMaster.findOne({
              attribute: "product_name",
              where: { id: data?.product_master_id_master_id, is_active: true },
            });


            data.procurement_lot = `${location_name?.trim()?.replaceAll(" ", "")?.toUpperCase()}-${data?.procurement_date}`
          }
        }
      }
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a procurement data", err?.message || err);
    }
  });

  // Delete Hook
  Procurement.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a procurement data", err?.message || err);
    }
  });

  return Procurement;
};
