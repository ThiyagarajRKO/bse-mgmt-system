"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create packaging_cost_master table
    await queryInterface.createTable("packaging_cost_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      packaging_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "packaging_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cost_uom: {
        type: Sequelize.ENUM("PCS", "KG"),
        allowNull: false,
        defaultValue: "PCS",
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
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
    });

    // Create carton_cost_master table
    await queryInterface.createTable("carton_cost_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      carton_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "packaging_master", // Assuming master cartons are also in packaging_master
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cost_per_carton: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
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
    });

    // Create pallet_cost_master table
    await queryInterface.createTable("pallet_cost_master", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      pallet_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "packaging_master", // Assuming pallets are also in packaging_master
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cost_per_pallet: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
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
    });

    // Add indexes for performance
    await queryInterface.addIndex("packaging_cost_master", [
      "packaging_id",
      "effective_from",
    ]);
    await queryInterface.addIndex("carton_cost_master", [
      "carton_id",
      "effective_from",
    ]);
    await queryInterface.addIndex("pallet_cost_master", [
      "pallet_id",
      "effective_from",
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("pallet_cost_master");
    await queryInterface.dropTable("carton_cost_master");
    await queryInterface.dropTable("packaging_cost_master");
  },
};
