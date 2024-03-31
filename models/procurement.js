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
    UNPROCESSED: "UNPROCESSED",
  };

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
      procurement_product_name: {
        type: DataTypes.STRING,
      },
      procurement_product_type: {
        type: DataTypes.STRING,
      },
      procurement_quantity: {
        type: DataTypes.INTEGER,
      },
      adjusted_quantity: {
        type: DataTypes.INTEGER,
      },
      procurement_price: {
        type: DataTypes.FLOAT,
      },
      adjusted_price: {
        type: DataTypes.FLOAT,
      },
      adjusted_reason: {
        type: DataTypes.TEXT,
      },
      adjusted_surveyor: {
        type: DataTypes.STRING,
      },
      procurement_totalamount: {
        type: DataTypes.FLOAT,
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
      const { location_name } = await sequelize.models.LocationMaster.findOne({
        attributes: ["location_name"],
        where: { id: data?.location_master_id, is_active: true },
      });

      const { product_name } = await sequelize.models.ProductMaster.findOne({
        attributes: ["product_name"],
        where: { id: data?.product_master_id, is_active: true }, // Fixed variable name
      });
      // Get year, month, and day from the procurement_date
      const year = data?.procurement_date.getFullYear();
      const month = (data?.procurement_date.getMonth() + 1)
        .toString()
        .padStart(2, "0"); // Adding 1 because getMonth() returns zero-based month
      const day = data?.procurement_date.getDate().toString().padStart(2, "0");

      // Construct the procurement_lot in YYYYMMDD format
      data.procurement_lot = `${location_name
        ?.trim()
        ?.substring(0, 3)
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${year}${month}${day}`;
      data.procurement_totalamount =
        data.procurement_quantity * data.procurement_price;
      data.procurement_product_name = product_name;

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
      const { location_name } = await sequelize.models.LocationMaster.findOne({
        attributes: ["location_name"],
        where: { id: data?.location_master_id, is_active: true },
      });

      const { product_name } = await sequelize.models.ProductMaster.findOne({
        attributes: ["product_name"],
        where: { id: data?.product_master_id, is_active: true }, // Fixed variable name
      });
      // Get year, month, and day from the procurement_date
      const year = data?.procurement_date.getFullYear();
      const month = (data?.procurement_date.getMonth() + 1)
        .toString()
        .padStart(2, "0"); // Adding 1 because getMonth() returns zero-based month
      const day = data?.procurement_date.getDate().toString().padStart(2, "0");

      // Construct the procurement_lot in YYYYMMDD format
      data.procurement_lot = `${location_name
        ?.trim()
        ?.substring(0, 3)
        ?.replaceAll(" ", "")
        ?.toUpperCase()}-${year}${month}${day}`;
      data.procurement_totalamount =
        data.procurement_quantity * data.procurement_price;
      data.procurement_product_name = product_name;

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error while updating a procurement data",
        err?.message || err
      );
    }
  });

  // Delete Hook
  Procurement.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting a procurement data",
        err?.message || err
      );
    }
  });

  return Procurement;
};
