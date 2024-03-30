"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {

  class Adjustment extends Model {
    static associate(models) {
      Adjustment.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Adjustment.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Adjustment.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      Adjustment.belongsTo(models.Procurement, {
        foreignKey: "procurement_id",
        targetKey: "id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

    }
  }
  Adjustment.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      adjustment_adjusted_quantity: {
        type: DataTypes.INTEGER,
      },
      adjustment_adjusted_price: {
        type: DataTypes.INTEGER,
      },
      adjustment_reason: {
        type: DataTypes.STRING,
      },
      adjustment_surveyor: {
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
      modelName: "Adjustment",
      tableName: "adjustment",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );
  // Create Hook
  Adjustment.beforeCreate(async (data, options) => {
    try {
      if (data?.procurement_id) {
        const { adjustment_lot } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_lot"],
          where: { id: data?.procurement_id, is_active: true },
        });
        const { adjustment_product } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_product"],
          where: { id: data?.procurement_id, is_active: true },
        });
        const { adjustment_actual_quantity } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_quantity"],
          where: { id: data?.procurement_id, is_active: true },
        });
        const { adjustment_actual_price } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_price"],
          where: { id: data?.procurement_id, is_active: true },
        });

        data.adjustment_quantity_difference = data.adjustment_actual_quantity - data.adjustment_adjusted_quantity;
        data.adjustment_price_difference = data.adjustment_actual_price - data.adjustment_adjusted_price;
      }
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a adjustment data",
        err?.message || err
      );
    }
  });

  // Update Hook
  Adjustment.beforeUpdate(async (data, options) => {
    try {
      if (data?.procurement_id) {
        const { adjustment_lot } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_lot"],
          where: { id: data?.procurement_id, is_active: true },
        });
        const { adjustment_product } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_product"],
          where: { id: data?.procurement_id, is_active: true },
        });
        const { adjustment_actual_quantity } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_quantity"],
          where: { id: data?.procurement_id, is_active: true },
        });
        const { adjustment_actual_price } = await sequelize.models.Adjustment.findOne({
          attributes: ["procurement_price"],
          where: { id: data?.procurement_id, is_active: true },
        });

        data.adjustment_quantity_difference = data.adjustment_actual_quantity - data.adjustment_adjusted_quantity;
        data.adjustment_price_difference = data.adjustment_actual_price - data.adjustment_adjusted_price;
      }
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a procurement data", err?.message || err);
    }
  });

  // Delete Hook
  Adjustment.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a procurement data", err?.message || err);
    }
  });

  return Adjustment;
};
