"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("accounting_audit_trail", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "journal_entry" },
          key: "id",
        },
      },
      module: {
        type: Sequelize.ENUM(
          "PROCUREMENT",
          "INVENTORY",
          "PRODUCTION",
          "QA",
          "PACKING",
          "DISPATCH",
          "SALES",
          "PAYMENTS",
          "MANUAL",
        ),
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM(
          "CREATE",
          "UPDATE",
          "DELETE",
          "POST",
          "REVERSE",
          "APPROVE",
          "REJECT",
        ),
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        defaultValue: Sequelize.fn("now"),
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
    });

    // Add indexes
    await queryInterface.addIndex("accounting_audit_trail", [
      "journal_entry_id",
    ]);
    await queryInterface.addIndex("accounting_audit_trail", ["module"]);
    await queryInterface.addIndex("accounting_audit_trail", ["reference_id"]);
    await queryInterface.addIndex("accounting_audit_trail", ["created_at"]);
    await queryInterface.addIndex("accounting_audit_trail", ["created_by"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("accounting_audit_trail");
  },
};
