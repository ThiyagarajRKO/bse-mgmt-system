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
      PackagingMaster.belongsTo(models.VendorMaster, {
        foreignKey: "vendor_master_id",
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
      packaging_code: {
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
      packaging_weight: {
        type: DataTypes.INTEGER,
      },
      packaging_material_composition: {
        type: DataTypes.STRING(50),
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
      if (data?.packaging_type && data?.vendor_master_id) {
        const { vendor_name } = await sequelize.models.VendorMaster.findOne({
          attribute: "vendor_name",
          where: { id: data?.vendor_master_id, is_active: true },
        });
        if (packaging_weight = null) {
          data.packaging_code = `${PackagingTypes[data?.packaging_type]}-${data?.packaging_length
            } cm x${data?.packaging_width} cm x ${data?.packaging_height}cm-${PackagingMaterials[data?.packaging_material_composition]
            }-${vendor_name?.trim()?.replaceAll(" ", "")?.toUpperCase()}`;
        }
        else {

          data.packaging_code = `${PackagingTypes[data?.packaging_type]}-${data?.packaging_weight
            }kgs-${PackagingMaterials[data?.packaging_material_composition]
            }-${vendor_name?.trim()?.replaceAll(" ", "")?.toUpperCase()}`;
        }
      }

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a packaging data",
        err?.message || err
      );
    }
  });

  // Update Hook
  PackagingMaster.beforeUpdate(async (data, options) => {
    try {
      if (data?.packaging_type && data?.vendor_master_id) {
        const { vendor_name } = await sequelize.models.VendorMaster.findOne({
          attribute: "vendor_name",
          where: { id: data?.vendor_master_id, is_active: true },
        });
        if (packaging_weight = null) {
          data.packaging_code = `${PackagingTypes[data?.packaging_type]}-${data?.packaging_length
            } cm x${data?.packaging_width} cm x ${data?.packaging_height}cm-${PackagingMaterials[data?.packaging_material_composition]
            }-${vendor_name?.trim()?.replaceAll(" ", "")?.toUpperCase()}`;
        }
        else {

          data.packaging_code = `${PackagingTypes[data?.packaging_type]}-${data?.packaging_weight
            }kgs-${PackagingMaterials[data?.packaging_material_composition]
            }-${vendor_name?.trim()?.replaceAll(" ", "")?.toUpperCase()}`;
        }
      }
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a packaging data", err?.message || err);
    }
  });

  // Delete Hook
  PackagingMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a packaging data", err?.message || err);
    }
  });

  return PackagingMaster;
};
