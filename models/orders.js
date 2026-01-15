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
      Orders.hasMany(models.OrderProducts, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Orders.hasMany(models.SalesPayments, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Orders.hasMany(models.production_orders, {
        foreignKey: "order_id",
        as: "production_orders",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      Orders.hasMany(models.Dispatches, {
        foreignKey: "order_id",
        as: "dispatches",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      Orders.hasMany(models.ProcurementLots, {
        foreignKey: "order_id",
        as: "procurement_lots",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      Orders.hasMany(models.ProcurementProducts, {
        foreignKey: "order_id",
        as: "procurement_products",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      Orders.hasMany(models.Peeling, {
        foreignKey: "order_id",
        as: "peeling_records",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      Orders.hasMany(models.PeeledDispatches, {
        foreignKey: "order_id",
        as: "peeled_dispatches",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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

      data.order_no = `${year}${month}${day}${parseInt(order_count) + 1}`;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending an Orders data", err?.message || err);
    }
  });

  // Create Order Products after order is created
  Orders.afterCreate(async (data, options) => {
    try {
      console.log(`[Orders] afterCreate hook fired for order ${data.id}`);
      console.log(`[Orders] options.OrderProducts:`, options?.OrderProducts);
      console.log(`[Orders] Is array:`, Array.isArray(options?.OrderProducts));

      if (options?.OrderProducts && Array.isArray(options.OrderProducts)) {
        try {
          console.log(
            `[Orders] Creating ${options.OrderProducts.length} products...`
          );

          const productsData = options.OrderProducts.map((product) => ({
            ...product,
            order_id: data.id,
            is_active: true,
            created_by: options.profile_id,
          }));

          console.log(
            `[Orders] Products data to create:`,
            JSON.stringify(productsData, null, 2)
          );

          const createdOrderProducts =
            await sequelize.models.OrderProducts.bulkCreate(productsData, {
              profile_id: options.profile_id,
            });

          console.log(
            `[Orders] ✓ Created ${createdOrderProducts.length} order products for order ${data.id}`
          );
        } catch (bulkCreateErr) {
          console.error(
            `[Orders] Error creating order products:`,
            bulkCreateErr.message || bulkCreateErr
          );
        }
      } else {
        console.log(
          `[Orders] No OrderProducts to create (undefined, null, or not an array)`
        );
      }

      // Automatically create order tracking pipeline (production, dispatch, peeling)
      try {
        const {
          createOrderTrackingPipeline,
        } = require("../src/services/order-tracking-service.js");

        // Call tracking pipeline asynchronously to avoid blocking order creation
        createOrderTrackingPipeline(data, options)
          .then(() => {
            console.log(
              `[Orders] Order tracking pipeline completed for order ${data.id}`
            );
          })
          .catch((trackingErr) => {
            console.error(
              `[Orders] Order tracking pipeline failed for order ${data.id}:`,
              trackingErr.message
            );
          });
      } catch (trackingErr) {
        console.error(
          "Error initializing order tracking service:",
          trackingErr
        );
      }
    } catch (err) {
      console.log("Error while creating order products", err?.message || err);
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
