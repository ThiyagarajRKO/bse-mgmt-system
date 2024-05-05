"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ShippingMaster extends Model {
    static associate(models) {
      ShippingMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ShippingMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ShippingMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ShippingMaster.belongsTo(models.CarrierMaster, {
        foreignKey: "carrier_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ShippingMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      shipping_source: {
        type: DataTypes.STRING,
      },
      shipping_destination: {
        type: DataTypes.STRING,
      },
      shipping_price: {
        type: DataTypes.FLOAT,
      },
      shipping_notes: {
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
      shipping_carrier_names: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.CarrierMaster?.carrier_name
            ?.trim()
            ?.replaceAll(" ", "")
            ?.toUpperCase()}-${this.CarrierMaster?.carrier_country
            ?.trim()
            ?.replaceAll(" ", "")
            ?.toUpperCase()}`;
        },
      },
    },
    {
      sequelize,
      modelName: "ShippingMaster",
      tableName: "shipping_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );
  // Create Hook
  ShippingMaster.beforeCreate(async (data, options) => {
    try {
      const carrier = await sequelize.models.CarrierMaster.findOne({
        required: true,
        attributes: ["carrier_name", "carrier_country"],
        where: { id: data.carrier_master_id, is_active: true },
      });

      if (carrier) {
        data.shipping_carrier_names = `${carrier.carrier_name
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}-${carrier.carrier_country
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}`;
      }

      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while inserting a shipping data", err?.message || err);
    }
  });

  // Update Hook
  ShippingMaster.beforeUpdate(async (data, options) => {
    try {
      const carrier = await sequelize.models.CarrierMaster.findOne({
        required: true,
        attributes: ["carrier_name", "carrier_country"],
        where: { id: data.carrier_master_id, is_active: true },
      });

      if (carrier) {
        data.shipping_carrier_names = `${carrier.carrier_name
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}-${carrier.carrier_country
          ?.trim()
          ?.replaceAll(" ", "")
          ?.toUpperCase()}`;
      }

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a shipping data", err?.message || err);
    }
  });

  // Delete Hook
  ShippingMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a shipping data", err?.message || err);
    }
  });

  return ShippingMaster;
};
