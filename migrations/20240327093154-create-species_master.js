"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("species_master", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      species_code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      species_name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      scientific_name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable("species_master");
  },
};
