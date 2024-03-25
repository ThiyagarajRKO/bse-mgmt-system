"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("user_profiles", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dob: {
        type: Sequelize.STRING,
      },
      experience: {
        type: Sequelize.STRING,
      },
      skills: {
        type: Sequelize.STRING,
      },
      appearance_url: {
        type: Sequelize.STRING,
      },
      is_admin: {
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        defaultValue: "e7daa45c-627d-455a-ac57-ec32aa57d009",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "role_master" },
          key: "id",
        },
      },
      is_active: {
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      is_banned: {
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
          model: { schema: "auth", tableName: "users" },
          key: "id",
        },
      },
      updated_by: {
        type: Sequelize.UUID,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { schema: "auth", tableName: "users" },
          key: "id",
        },
      },
      deleted_by: {
        type: Sequelize.UUID,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { schema: "auth", tableName: "users" },
          key: "id",
        },
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("user_profiles");
  },
};
