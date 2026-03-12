"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("journal_line", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "journal_entry" },
          key: "id",
        },
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "chart_of_accounts" },
          key: "id",
        },
      },
      debit: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      credit: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: "INR",
      },
      line_description: {
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
      updated_at: {
        type: Sequelize.DATE,
      },
      deleted_at: {
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
      updated_by: {
        type: Sequelize.UUID,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
      deleted_by: {
        type: Sequelize.UUID,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
      },
    });

    // Add indexes
    await queryInterface.addIndex("journal_line", ["journal_entry_id"]);
    await queryInterface.addIndex("journal_line", ["account_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("journal_line");
  },
};
