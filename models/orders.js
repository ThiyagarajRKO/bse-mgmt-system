"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Orders extends Model {
    static associate(models) {
      Orders.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Orders.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Orders.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Orders.belongsTo(models.CustomerMaster, {
        foreignKey: "customer_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Orders.belongsTo(models.ShippingMaster, {
        foreignKey: "shipping_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      // Has to Many
      Orders.hasMany(models.OrdersProducts, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Orders.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      order_no: {
        type: DataTypes.BIGINT,
      },
      payment_terms: {
        type: DataTypes.STRING,
      },
      payment_type: {
        type: DataTypes.STRING,
      },
      shipping_method: {
        type: DataTypes.STRING,
      },
      shipping_address: {
        type: DataTypes.TEXT,
      },
      shipping_date: {
        type: DataTypes.DATE,
      },
      expected_delivery_date: {
        type: DataTypes.DATE,
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
      modelName: "Orders",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  Orders.beforeCreate(async (data, options) => {
    try {
      const order_count = await sequelize.models.Orders.count();

      // Get year, month, and day from the procurement_date
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // Adding 1 because getMonth() returns zero-based month
      const day = currentDate.getDate().toString().padStart(2, "0");

      data.order_no = `${year}${month}${day}${order_count}`;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending an Orders data", err?.message || err);
    }
  });

  // Update Hook
  Orders.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating an Orders data", err?.message || err);
    }
  });

  // Delete Hook
  Orders.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an Orders data", err?.message || err);
    }
  });

  return Orders;
};
