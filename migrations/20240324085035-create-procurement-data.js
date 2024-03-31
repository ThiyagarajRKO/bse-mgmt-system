"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("procurement", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      procurement_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      procurement_lot: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      procurement_product_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      procurement_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      adjusted_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      procurement_price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      adjusted_price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      procurement_purchaser: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      procurement_product_type: {
        type: Sequelize.ENUM(
          "CLEANED",
          "PEELED",
          "SOAKED",
          "RE-GLAZED",
          "GRADED",
          "COOKED",
          "SORTED",
          "VALUE ADDED",
          "UNPROCESSED"
        ),
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
      location_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "location_master" },
          key: "id",
        },
      },
      product_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "product_master" },
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
    await queryInterface.dropTable("procurement");
  },
};
