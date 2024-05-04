"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PriceListProductMaster extends Model {
    static associate(models) {
      PriceListProductMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PriceListProductMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PriceListProductMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PriceListProductMaster.belongsTo(models.PriceListMaster, {
        foreignKey: "price_list_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PriceListProductMaster.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PriceListProductMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      price_value: {
        type: DataTypes.FLOAT,
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
      modelName: "PriceListProductMaster",
      tableName: "price_list_product_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Bulk Create Hook
  PriceListProductMaster.beforeBulkCreate(async (data, options) => {
    try {
      data?.map((item) => {
        item.is_active = true;

        item.created_by = options?.profile_id;
      });
    } catch (err) {
      console.log(
        "Error while appending an price list products data",
        err?.message || err
      );
    }
  });

  // Create Hook
  PriceListProductMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a price list details",
        err?.message || err
      );
    }
  });

  // Update Hook
  PriceListProductMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a price list ", err?.message || err);
    }
  });

  // Delete Hook
  PriceListProductMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a price list", err?.message || err);
    }
  });

  return PriceListProductMaster;
};
