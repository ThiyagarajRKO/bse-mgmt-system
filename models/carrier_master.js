"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CarrierMaster extends Model {
    static associate(models) {
      CarrierMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CarrierMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CarrierMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  CarrierMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      carrier_name: {
        type: DataTypes.STRING(100),
      },
      carrier_address: {
        type: DataTypes.TEXT,
      },
      carrier_country: {
        type: DataTypes.STRING(100),
      },
      carrier_phone: {
        type: DataTypes.STRING(25),
      },
      carrier_email: {
        type: DataTypes.STRING(100),
      },
      carrier_paymentterms: {
        type: DataTypes.STRING(100),
      },
      carrier_credit: {
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
      modelName: "CarrierMaster",
      tableName: "carrier_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  CarrierMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a carrier details",
        err?.message || err
      );
    }
  });

  // Update Hook
  CarrierMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a carrier", err?.message || err);
    }
  });

  // Delete Hook
  CarrierMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a carrier", err?.message || err);
    }
  });

  return CarrierMaster;
};
