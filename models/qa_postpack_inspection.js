"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PostPackQAInspection extends Model {
    static associate(models) {
      PostPackQAInspection.belongsTo(models.Packing, {
        foreignKey: "packing_id",
        as: "packing",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PostPackQAInspection.belongsTo(models.Orders, {
        foreignKey: "order_id",
        as: "order",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PostPackQAInspection.belongsTo(models.UserProfiles, {
        foreignKey: "inspected_by",
        as: "inspector",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PostPackQAInspection.belongsTo(models.UserProfiles, {
        foreignKey: "approved_by",
        as: "approver",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PostPackQAInspection.belongsTo(models.UserProfiles, {
        foreignKey: "created_by",
        as: "creator",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PostPackQAInspection.belongsTo(models.UserProfiles, {
        foreignKey: "updated_by",
        as: "updater",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      PostPackQAInspection.belongsTo(models.UserProfiles, {
        foreignKey: "deleted_by",
        as: "deleter",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  PostPackQAInspection.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      packing_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      batch_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      sample_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Seal Integrity Check
      seal_integrity: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      vacuum_proper: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      tray_damage: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      carton_condition: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      ice_buildup_acceptable: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Label Verification
      label_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Net Weight Verification
      net_weight_avg: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      net_weight_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Glazing Verification
      glazing_pct: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      glazing_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Product Appearance
      product_appearance_pass: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Foreign Matter Check
      foreign_matter_found: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Temperature Verification
      temperature_core: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      temperature_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Carton Weight Check
      carton_weight_expected: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      carton_weight_actual: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      carton_weight_compliant: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Traceability Verification
      traceability_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      // Final QA Decision
      qa_status: {
        type: DataTypes.ENUM("PASS", "HOLD", "FAIL"),
        allowNull: false,
        defaultValue: "PASS",
      },
      qa_decision_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Follow-up Action
      follow_up_action: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      inventory_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Audit Trail
      inspected_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      inspected_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
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
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PostPackQAInspection",
      tableName: "qa_postpack_inspections",
      timestamps: false,
      paranoid: false,
    },
  );

  return PostPackQAInspection;
};
