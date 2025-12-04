"use strict";

/**
 * Grade Size Mapping Migration
 *
 * Creates the grade_size_mapping table to establish relationships between
 * grades and available sizes for products.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("grade_size_mapping", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      grade_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "grade_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      size_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "size_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add composite unique constraint
    await queryInterface.addConstraint("grade_size_mapping", {
      fields: ["grade_id", "size_id"],
      type: "unique",
      name: "unique_grade_size_combination",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("grade_size_mapping");
  },
};
