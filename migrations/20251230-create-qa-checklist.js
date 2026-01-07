"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create qa_checklist table
    // Quality assurance records for batches
    await queryInterface.createTable("qa_checklist", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      qa_record_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      batch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "batch_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      packing_list_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "packing_list",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      test_parameter_1: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "e.g. Temperature, Color, Texture",
      },
      test_result_1: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      test_parameter_2: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      test_result_2: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      test_parameter_3: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      test_result_3: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      microbiological_test: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      microbiological_result: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      overall_status: {
        type: Sequelize.ENUM("PENDING", "PASSED", "FAILED", "CONDITIONAL"),
        defaultValue: "PENDING",
      },
      qa_remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      qa_performed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      qa_performed_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      qa_approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      qa_approved_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex("qa_checklist", ["qa_record_no"]);
    await queryInterface.addIndex("qa_checklist", ["batch_id"]);
    await queryInterface.addIndex("qa_checklist", ["overall_status"]);
    await queryInterface.addIndex("qa_checklist", ["qa_performed_date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("qa_checklist");
  },
};
