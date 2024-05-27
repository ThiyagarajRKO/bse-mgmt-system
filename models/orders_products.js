"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrdersProducts extends Model {
    static associate(models) {
      OrdersProducts.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrdersProducts.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrdersProducts.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrdersProducts.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrdersProducts.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  OrdersProducts.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      unit: {
        type: DataTypes.FLOAT,
      },
      price: {
        type: DataTypes.FLOAT,
      },
      discount: {
        type: DataTypes.FLOAT,
      },
      description: {
        type: DataTypes.TEXT,
      },
      delivery_status: {
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
      modelName: "OrdersProducts",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Bulk Create Hook
  OrdersProducts.beforeBulkCreate(async (data, options) => {
    try {
      data?.map((item) => {
        item.is_active = true;

        item.created_by = options?.profile_id;
      });
    } catch (err) {
      console.log(
        "Error while appending an peeling products data",
        err?.message || err
      );
    }
  });

  // Create Hook
  OrdersProducts.beforeCreate(async (data, options) => {
    try {
      data.is_active = true;
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an OrdersProducts data",
        err?.message || err
      );
    }
  });

  // Update Hook
  OrdersProducts.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while updating an OrdersProducts data",
        err?.message || err
      );
    }
  });

  // Delete Hook
  OrdersProducts.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting an OrdersProducts data",
        err?.message || err
      );
    }
  });

  return OrdersProducts;
};
