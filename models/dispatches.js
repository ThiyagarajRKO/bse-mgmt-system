"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Dispatches extends Model {
    static associate(models) {
      Dispatches.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.ProcurementProducts, {
        as: "pp",
        foreignKey: "procurement_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.VehicleMaster, {
        foreignKey: "vehicle_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.DriverMaster, {
        foreignKey: "driver_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.hasMany(models.Peeling, {
        foreignKey: "dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Dispatches.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      dispatch_quantity: {
        type: DataTypes.FLOAT,
      },
      temperature: {
        type: DataTypes.FLOAT,
      },
      delivery_status: {
        type: DataTypes.STRING,
      },
      delivery_notes: {
        type: DataTypes.TEXT,
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
      modelName: "Dispatches",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  Dispatches.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an dispatch data",
        err?.message || err
      );
    }
  });

  // Create Hook
  Dispatches.afterCreate(async (data, options) => {
    updateInventoryQuantity(sequelize, data, options);
  });

  // Update Hook
  Dispatches.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating an dispatch data", err?.message || err);
    }
  });

  // Update Hook
  Dispatches.afterUpdate(async (data, options) => {
    updateInventoryQuantity(sequelize, data, options);
  });

  // Delete Hook
  Dispatches.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an dispatch data", err?.message || err);
    }
  });

  return Dispatches;
};

const updateInventoryQuantity = async (sequelize, data, options) => {
  try {
    const procurementProductData =
      await sequelize.models.ProcurementProducts.findOne({
        attributes: ["product_master_id", "procurement_product_type"],
        where: {
          id: data?.procurement_product_id,
          is_active: true,
        },
        raw: true,
      });

    const procurementProduct =
      await sequelize.models.ProcurementProducts.findOne({
        attributes: [
          [
            sequelize.fn("sum", sequelize.col("procurement_quantity")),
            "total_quantity",
          ],
          [
            sequelize.fn("sum", sequelize.col("adjusted_quantity")),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dp.dispatch_quantity) FROM dispatches dp WHERE dp.procurement_product_id = "ProcurementProducts".id and dp.is_active = true)`
            ),
            "total_dispatched_quantity",
          ],
        ],
        where: {
          product_master_id: procurementProductData?.product_master_id,
          procurement_product_type:
            procurementProductData?.procurement_product_type,
          is_active: true,
        },
        group: ["ProcurementProducts.id"],
        raw: true,
      });

    const finalQuantity =
      (procurementProduct?.total_adjusted_quantity ||
        procurementProduct?.total_quantity) -
      procurementProduct?.total_dispatched_quantity;

    await sequelize.models.PurchaseInventory.update(
      {
        quantity: finalQuantity,
        updated_at: new Date(),
        updated_by: options?.profile_id,
      },
      {
        where: {
          product_master_id: procurementProductData?.product_master_id,
          procurement_product_type:
            procurementProductData?.procurement_product_type,
          is_active: true,
        },
      }
    ).catch(console.log);
  } catch (err) {
    console.log(
      "Error while inserting a procurements data",
      err?.message || err
    );
  }
};
