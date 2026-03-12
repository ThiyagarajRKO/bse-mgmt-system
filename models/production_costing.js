"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductionCosting extends Model {
    static associate(models) {
      ProductionCosting.belongsTo(models.ProcurementLots, {
        as: "procurement_lot",
        foreignKey: "procurement_lot_id",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      ProductionCosting.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductionCosting.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductionCosting.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  ProductionCosting.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      procurement_lot_id: {
        type: DataTypes.UUID,
      },
      input_quantity: {
        type: DataTypes.DECIMAL(18, 2),
      },
      input_cost: {
        type: DataTypes.DECIMAL(18, 2),
      },
      output_quantity: {
        type: DataTypes.DECIMAL(18, 2),
      },
      cost_per_kg: {
        type: DataTypes.DECIMAL(18, 2),
      },
      processing_labour_cost: {
        type: DataTypes.DECIMAL(18, 2),
      },
      packaging_cost: {
        type: DataTypes.DECIMAL(18, 2),
      },
      cold_storage_cost: {
        type: DataTypes.DECIMAL(18, 2),
      },
      freight_cost: {
        type: DataTypes.DECIMAL(18, 2),
      },
      total_production_cost: {
        type: DataTypes.DECIMAL(18, 2),
      },
      byproduct_value: {
        type: DataTypes.DECIMAL(18, 2),
      },
      costing_date: {
        type: DataTypes.DATE,
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
      modelName: "ProductionCosting",
      tableName: "production_costing",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Hooks
  ProductionCosting.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
      data.costing_date = new Date();
      // Calculate cost_per_kg if not provided
      if (data.output_quantity && data.input_cost && !data.cost_per_kg) {
        data.cost_per_kg = (data.input_cost / data.output_quantity).toFixed(2);
      }
    } catch (err) {
      throw err;
    }
  });

  ProductionCosting.beforeUpdate(async (data, options) => {
    try {
      data.updated_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  ProductionCosting.beforeDestroy(async (data, options) => {
    try {
      data.deleted_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  return ProductionCosting;
};
