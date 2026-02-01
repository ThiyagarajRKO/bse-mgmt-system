"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("derivative_unit_standard", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      derivative_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "derivative_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      unit_type: {
        type: Sequelize.ENUM("COUNT", "KG"),
        allowNull: false,
      },
      avg_unit_weight_g: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
      },
      min_unit_weight_g: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
      },
      max_unit_weight_g: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
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
    });

    // Add indexes
    await queryInterface.addIndex(
      "derivative_unit_standard",
      ["derivative_id", "unit_type"],
      {
        where: {
          is_active: true,
        },
        unique: true,
      },
    );

    // Add check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE derivative_unit_standard
      ADD CONSTRAINT chk_count_weight CHECK (
        (unit_type = 'COUNT' AND avg_unit_weight_g IS NOT NULL)
        OR (unit_type = 'KG')
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("derivative_unit_standard");
  },
};
