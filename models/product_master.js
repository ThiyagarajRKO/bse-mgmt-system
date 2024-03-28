"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductMaster extends Model {
    static associate(models) {
      ProductMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ProductMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_name: {
        type: DataTypes.STRING,
      },
      product_short_name: {
        type: DataTypes.STRING,
      },
      product_code: {
        type: DataTypes.TEXT,
      },
      size_master_ids: {
        type: DataTypes.ARRAY(DataTypes.UUID),
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
      modelName: "ProductMaster",
      tableName: "product_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  ProductMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a vendor details",
        err?.message || err
      );
    }
  });

  // Update Hook
  ProductMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a vendor", err?.message || err);
    }
  });

  // Delete Hook
  ProductMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a vendor", err?.message || err);
    }
  });

  return ProductMaster;
};
