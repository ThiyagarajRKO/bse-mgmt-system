"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("qa_checklist", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      batch_no: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Batch/lot number from peeling operation",
      },
      peeling_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "peeling",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      peeled_product_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "peeling_products",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        comment:
          "Reference to peeled product (QA positioned between PeelingProducts and PeeledDispatches)",
      },
      peeled_dispatch_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "peeled_dispatches",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        comment:
          "Reference to peeled dispatch (optional, for backward compatibility)",
      },
      species_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Species being processed",
      },
      product_form: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Product form/type after peeling",
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Quantity in kg",
      },
      status: {
        type: DataTypes.ENUM("PENDING", "PASS", "FAIL", "ON_HOLD"),
        defaultValue: "PENDING",
        allowNull: false,
        comment: "QA inspection status",
      },
      inspection_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date of QA inspection",
      },
      inspector_name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Name of QA inspector",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Additional remarks/notes",
      },
      defects: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Defects found during inspection",
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        onUpdate: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("qa_checklist", ["batch_no"]);
    await queryInterface.addIndex("qa_checklist", ["status"]);
    await queryInterface.addIndex("qa_checklist", ["peeling_id"]);
    await queryInterface.addIndex("qa_checklist", ["peeled_product_id"]);
    await queryInterface.addIndex("qa_checklist", ["peeled_dispatch_id"]);
    await queryInterface.addIndex("qa_checklist", ["species_name"]);
    await queryInterface.addIndex("qa_checklist", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("qa_checklist");
  },
};
