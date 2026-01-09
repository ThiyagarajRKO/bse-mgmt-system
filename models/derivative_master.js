"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DerivativeMaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // A derivative can have many product masters
      this.hasMany(models.ProductMaster, {
        foreignKey: "derivative_master_id",
        as: "Products",
      });
    }
  }
  DerivativeMaster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      derivative_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      derivative_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      processing_level: {
        type: DataTypes.ENUM(
          "Raw",
          "Semi-Processed",
          "Cooked",
          "RTC",
          "RTE",
          "Stock/Sauce",
          "Formed",
          "Dried/Cured",
          "Byproduct"
        ),
        allowNull: false,
      },
      hsn_code_applicable: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Comma-separated HSN codes",
      },
      default_gst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: "Default GST rate (%)",
      },
      heat_treated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      value_added: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      description: {
        type: DataTypes.TEXT,
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
      modelName: "DerivativeMaster",
      tableName: "derivative_master",
      timestamps: true,
      underscored: true,
    }
  );
  return DerivativeMaster;
};
