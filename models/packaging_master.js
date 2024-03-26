"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const PackagingTypes = {
    Pouch: "PO",
    "Master Carton": "MC",
    "Duplex Carton": "DC",
  };

  const PackagingMaterials = {
    Plastic: "PA",
    Cardboard: "CB",
    Thermocol: "TC",
  };

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
      },
      packaging_type: {
        type: DataTypes.STRING,
      },
      packaging_height: {
        type: DataTypes.INTEGER,
      },
      packaging_width: {
        type: DataTypes.INTEGER,
      },
      packaging_length: {
        type: DataTypes.INTEGER,
      },
      packaging_material_composition: {
        type: DataTypes.STRING(50),
      },
      packaging_supplier: {
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
      data.packaging_name = `${PackagingTypes[data?.packaging_type]}-${
        data?.packaging_length
      }x${data?.packaging_width}x${data?.packaging_height}-${
        PackagingMaterials[data?.packaging_material_composition]
      }-${data?.packaging_supplier
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUpperCase()}`;

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
      data.packaging_name = `${PackagingTypes[data?.packaging_type]}-${
        data?.packaging_length
      }x${data?.packaging_width}x${data?.packaging_height}-${
        PackagingMaterials[data?.packaging_material_composition]
      }-${data?.packaging_supplier
        ?.trim()
        ?.replaceAll(" ", "")
        ?.toUppserCase()}`;

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
