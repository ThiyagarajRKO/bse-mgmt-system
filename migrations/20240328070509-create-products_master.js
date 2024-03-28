"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("product_master", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      species_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "species_master" },
          key: "id",
        },
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_short_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_code: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      size_master_ids: {
        type: Sequelize.ARRAY(Sequelize.UUID),
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
    await queryInterface.dropTable("product_master");
  },
};
