"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("packaging_master", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      packaging_code: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      packaging_type: {
        type: Sequelize.ENUM("Pouch", "Master Carton", "Duplex Carton"),
        allowNull: false,
      },
      packaging_height: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      packaging_width: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      packaging_length: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      packaging_weight: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      packaging_material_composition: {
        type: Sequelize.ENUM("Plastic", "Cardboard", "Thermocol"),
        allowNull: false,
      },
      vendor_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "vendor_master" },
          key: "id",
        },
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
