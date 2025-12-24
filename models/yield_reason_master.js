"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class YieldReasonMaster extends Model {
    static associate(models) {
      // Define associations if needed
    }
  }

  YieldReasonMaster.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      reason_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      reason_description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          "PROCESSING_LOSS",
          "HANDLING_DAMAGE",
          "QUALITY_ISSUE",
          "OVER_PROCESSING",
          "MIXED_BATCH"
        ),
        allowNull: false,
      },
      requires_supervisor_approval: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      modelName: "YieldReasonMaster",
      tableName: "yield_reason_master",
      timestamps: true,
      paranoid: false,
    }
  );

  return YieldReasonMaster;
};
