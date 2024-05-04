"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("carrier_master", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      carrier_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      carrier_address: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      carrier_country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      carrier_phone: {
        type: Sequelize.STRING(25),
        allowNull: false,
      },
      carrier_email: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      carrier_paymentterms: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      carrier_credit: {
        type: Sequelize.FLOAT,
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
    await queryInterface.dropTable("carrier_master");
  },
};
