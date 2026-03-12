"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("journal_entry", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      entry_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
      entry_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      reference_type: {
        type: Sequelize.ENUM(
          "PROCUREMENT",
          "PRODUCTION",
          "QA",
          "PACKING",
          "DISPATCH",
          "SALES",
          "PAYMENT",
          "MANUAL",
        ),
        allowNull: false,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      total_debit: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      total_credit: {
        type: Sequelize.DECIMAL(18, 2),
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: "INR",
      },
      is_posted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      posted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      posted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "user_profiles" },
          key: "id",
        },
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
    await queryInterface.addIndex("journal_entry", ["entry_date"]);
    await queryInterface.addIndex("journal_entry", ["reference_type"]);
    await queryInterface.addIndex("journal_entry", ["reference_id"]);
    await queryInterface.addIndex("journal_entry", ["is_posted"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("journal_entry");
  },
};
