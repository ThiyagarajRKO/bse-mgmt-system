"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class QAChecklist extends Model {
    static associate(models) {
      QAChecklist.belongsTo(models.BatchMaster, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      QAChecklist.belongsTo(models.PackingList, {
        foreignKey: "packing_list_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      QAChecklist.belongsTo(models.UserProfiles, {
        as: "performer",
        foreignKey: "qa_performed_by",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      QAChecklist.belongsTo(models.UserProfiles, {
        as: "approver",
        foreignKey: "qa_approved_by",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  QAChecklist.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      qa_record_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      packing_list_id: {
        type: DataTypes.UUID,
      },
      test_parameter_1: {
        type: DataTypes.STRING(100),
      },
      test_result_1: {
        type: DataTypes.STRING(100),
      },
      test_parameter_2: {
        type: DataTypes.STRING(100),
      },
      test_result_2: {
        type: DataTypes.STRING(100),
      },
      test_parameter_3: {
        type: DataTypes.STRING(100),
      },
      test_result_3: {
        type: DataTypes.STRING(100),
      },
      microbiological_test: {
        type: DataTypes.STRING(100),
      },
      microbiological_result: {
        type: DataTypes.STRING(100),
      },
      overall_status: {
        type: DataTypes.ENUM("PENDING", "PASSED", "FAILED", "CONDITIONAL"),
        defaultValue: "PENDING",
      },
      qa_remarks: {
        type: DataTypes.TEXT,
      },
      qa_performed_by: {
        type: DataTypes.UUID,
      },
      qa_performed_date: {
        type: DataTypes.DATE,
      },
      qa_approved_by: {
        type: DataTypes.UUID,
      },
      qa_approved_date: {
        type: DataTypes.DATE,
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
      tableName: "qa_checklist",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return QAChecklist;
};
