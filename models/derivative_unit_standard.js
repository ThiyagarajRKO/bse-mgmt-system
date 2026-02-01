"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DerivativeUnitStandard extends Model {
    static associate(models) {
      // Define associations
      DerivativeUnitStandard.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_id",
        as: "derivative",
      });
    }
  }

  DerivativeUnitStandard.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "derivative_master",
          key: "id",
        },
      },
      unit_type: {
        type: DataTypes.ENUM("COUNT", "KG"),
        allowNull: false,
      },
      avg_unit_weight_g: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true, // Required only for COUNT type
        validate: {
          isRequiredForCount(value) {
            if (this.unit_type === "COUNT" && !value) {
              throw new Error(
                "avg_unit_weight_g is required for COUNT unit_type",
              );
            }
          },
        },
      },
      min_unit_weight_g: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      max_unit_weight_g: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "DerivativeUnitStandard",
      tableName: "derivative_unit_standard",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ["derivative_id", "unit_type"],
          where: {
            is_active: true,
          },
        },
      ],
    },
  );

  return DerivativeUnitStandard;
};
