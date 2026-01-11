"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // BOM Master - species + derivative based
    await queryInterface.createTable("bom_master", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      bom_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: "e.g. BOM_CUTTLE_STD, BOM_SNAPPER_FILLET",
      },
      bom_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "e.g. Standard Cuttlefish Processing",
      },
      input_uom: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "KG",
        comment: "KG or PCS - normalized input",
      },
      output_uom: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "KG",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // BOM Input - raw materials
    await queryInterface.createTable("bom_input", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "bom_master",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      raw_product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 3),
        defaultValue: 1,
        comment: "Normalized: 1 kg or 1 pc",
      },
      uom: {
        type: Sequelize.STRING(50),
        defaultValue: "KG",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // BOM Output - derivative products with base yield
    await queryInterface.createTable("bom_output", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "bom_master",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      derivative_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "e.g. TUBES, TENTACLES, RINGS, WASTE",
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "product_master",
          key: "id",
        },
        comment: "Finished product - NULL for waste",
      },
      base_yield_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "0-100 percent",
      },
      loss_type: {
        type: Sequelize.ENUM("WASTE", "EVAPORATION", "TRIM"),
        defaultValue: "WASTE",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Derivative Grade/Size Rules - yield modifiers
    await queryInterface.createTable("derivative_grade_size_rule", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      derivative_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "e.g. TUBES, TENTACLES",
      },
      size_min_grams: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      size_max_grams: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      allowed_grades: {
        type: Sequelize.JSON,
        defaultValue: ["A", "B", "C", "D"],
        comment: "Array of allowed grades",
      },
      yield_multiplier: {
        type: Sequelize.DECIMAL(5, 3),
        defaultValue: 1.0,
        comment: "Multiplier applied to base yield",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // BOM Cost Drivers
    await queryInterface.createTable("bom_cost", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "bom_master",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      cost_type: {
        type: Sequelize.ENUM("LABOUR", "PACKAGING", "ENERGY", "OVERHEAD"),
        allowNull: false,
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: "INR",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex("bom_master", ["species_id"]);
    await queryInterface.addIndex("bom_master", ["bom_code"]);
    await queryInterface.addIndex("bom_input", ["bom_id"]);
    await queryInterface.addIndex("bom_output", ["bom_id"]);
    await queryInterface.addIndex("derivative_grade_size_rule", [
      "species_id",
      "derivative_code",
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("bom_cost");
    await queryInterface.dropTable("derivative_grade_size_rule");
    await queryInterface.dropTable("bom_output");
    await queryInterface.dropTable("bom_input");
    await queryInterface.dropTable("bom_master");
  },
};
