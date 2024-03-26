"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("packaging_master", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      packaging_name: {
        type: Sequelize.TEXT,
      },
      packaging_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      packaging_height: {
        type: Sequelize.STRING(12),
      },
      packaging_width: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      packaging_length: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      packaging_material_composition: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      packaging_supplier: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_active: {
        defaultValue: false,
        type: Sequelize.BOOLEAN,
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("packaging_master");
  },
};
