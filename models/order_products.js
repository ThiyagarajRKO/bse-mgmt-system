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

  // Bulk Create Hook
  OrderProducts.afterBulkCreate(async (data, options) => {
    try {
      data?.map((item) => {
        updateInventoryQuantity(sequelize, item, options);
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

  // Create Hook
  OrderProducts.afterCreate(async (data, options) => {
    updateInventoryQuantity(sequelize, data, options);
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

  // Update Hook
  OrderProducts.afterUpdate(async (data, options) => {
    updateInventoryQuantity(sequelize, data, options);
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

const updateInventoryQuantity = async (sequelize, data, options) => {
  try {
    // Finding Product Master Id
    const packingData = await sequelize.models.Packing.findOne({
      attributes: ["id"],
      include: [
        {
          as: "pd",
          attributes: ["id"],
          model: sequelize.models.PeeledDispatches,
          where: {
            is_active: true,
          },
          include: [
            {
              as: "pp",
              attributes: ["product_master_id"],
              model: sequelize.models.PeelingProducts,
              where: {
                is_active: true,
              },
            },
          ],
        },
      ],
      where: {
        id: data?.packing_id,
        is_active: true,
      },
    });

    const packing = await sequelize.models.Packing.findOne({
      subQuery: false,
      attributes: [
        [
          sequelize.fn("sum", sequelize.col("packing_quantity")),
          "total_quantity",
        ],
        [
          sequelize.literal(
            '(SELECT SUM(op.unit) FROM order_products op WHERE op.packing_id = "Packing".id)'
          ),
          "total_sold_quantity",
        ],
      ],
      where: {
        is_active: true,
      },
      include: [
        {
          as: "pd",
          attributes: [],
          model: sequelize.models.PeeledDispatches,
          where: {
            is_active: true,
          },
          include: [
            {
              as: "pp",
              attributes: [],
              model: sequelize.models.PeelingProducts,
              where: {
                is_active: true,
                product_master_id: packingData?.pd?.pp?.product_master_id,
              },
            },
          ],
        },
      ],
      group: ["Packing.id"],
    });

    const finalQuantity =
      packing?.dataValues?.total_quantity -
      packing?.dataValues?.total_sold_quantity;

    await sequelize.models.SalesInventory.update(
      {
        quantity: finalQuantity,
        updated_at: new Date(),
        updated_by: options?.profile_id,
      },
      {
        where: {
          product_master_id: packingData?.pd?.pp?.product_master_id,
          is_active: true,
        },
      }
    ).catch(console.log);
  } catch (err) {
    console.log(
      "Error while inserting a sales order data",
      err?.message || err
    );
  }
};
