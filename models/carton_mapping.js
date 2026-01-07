"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CartonMapping extends Model {
    static associate(models) {
      CartonMapping.belongsTo(models.BatchMaster, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CartonMapping.belongsTo(models.Packing, {
        foreignKey: "packing_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CartonMapping.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CartonMapping.belongsTo(models.CustomerMaster, {
        foreignKey: "customer_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      CartonMapping.hasMany(models.DispatchItems, {
        foreignKey: "carton_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CartonMapping.hasMany(models.TraceabilityMap, {
        foreignKey: "carton_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  CartonMapping.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      carton_id: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      packing_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      net_weight_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gross_weight_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      units_per_carton: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      production_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      packing_date: {
        type: DataTypes.DATE,
      },
      best_before_date: {
        type: DataTypes.DATE,
      },
      carton_status: {
        type: DataTypes.ENUM(
          "CREATED",
          "PACKED",
          "READY_FOR_DISPATCH",
          "DISPATCHED",
          "DELIVERED",
          "RETURNED"
        ),
        defaultValue: "CREATED",
      },
      customer_id: {
        type: DataTypes.UUID,
      },
      delivery_date: {
        type: DataTypes.DATE,
      },
      remarks: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: "carton_mapping",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return CartonMapping;
};
