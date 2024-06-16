"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderProducts extends Model {
    static associate(models) {
      OrderProducts.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrderProducts.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrderProducts.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrderProducts.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      OrderProducts.belongsTo(models.Packing, {
        foreignKey: "packing_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  OrderProducts.init(
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
      total_price: {
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
      modelName: "OrderProducts",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Bulk Create Hook
  OrderProducts.beforeBulkCreate(async (data, options) => {
    try {
      data?.map((item) => {
        item.is_active = true;

        const total_price =
          parseFloat(item?.price) * parseFloat(item?.unit) -
          (parseFloat(data.discount) || 0);

        item.total_price = isNaN(total_price) ? 0 : total_price;

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
  OrderProducts.beforeCreate(async (data, options) => {
    try {
      const total_price =
        parseFloat(data?.price) * parseFloat(data?.unit) -
        (parseFloat(data.discount) || 0);

      data.total_price = isNaN(total_price) ? 0 : total_price;

      data.is_active = true;
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an OrderProducts data",
        err?.message || err
      );
    }
  });

  // Update Hook
  OrderProducts.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while updating an OrderProducts data",
        err?.message || err
      );
    }
  });

  // Delete Hook
  OrderProducts.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting an OrderProducts data",
        err?.message || err
      );
    }
  });

  return OrderProducts;
};