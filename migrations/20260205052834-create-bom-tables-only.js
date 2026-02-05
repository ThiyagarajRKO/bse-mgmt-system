"use strict";

/**
 * Create BOM Tables Only (Schema Migration)
 *
 * This migration creates the BOM (Bill of Materials) tables without populating data.
 * Data population should be handled by seeders for better maintainability.
 *
 * Tables created:
 * - bom_master: Species + derivative based BOM definitions
 * - bom_input: Raw material inputs for BOMs
 * - bom_output: Derivative product outputs with yields
 * - bom_cost: Cost drivers for BOM calculations
 * - derivative_grade_size_rule: Yield modifiers for grades/sizes
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n📋 Creating BOM tables...\n");

    // Check if tables already exist to avoid conflicts
    const existingTables = await queryInterface.showAllTables();
    const bomTables = [
      "bom_master",
      "bom_input",
      "bom_output",
      "bom_cost",
      "derivative_grade_size_rule",
    ];

    for (const tableName of bomTables) {
      if (existingTables.includes(tableName)) {
        console.log(`⚠️  Table ${tableName} already exists, skipping...`);
        continue;
      }

      // BOM Master - species + derivative based
      if (tableName === "bom_master") {
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
      }

      // BOM Input - raw materials
      if (tableName === "bom_input") {
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
      }

      // BOM Output - derivative products with base yield
      if (tableName === "bom_output") {
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
      }

      // Derivative Grade/Size Rules - yield modifiers
      if (tableName === "derivative_grade_size_rule") {
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
      }

      // BOM Cost Drivers
      if (tableName === "bom_cost") {
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
      }
    }

    // Add indexes (only if tables were created)
    const indexesAdded = [];
    if (!existingTables.includes("bom_master")) {
      await queryInterface.addIndex("bom_master", ["species_id"]);
      await queryInterface.addIndex("bom_master", ["bom_code"]);
      indexesAdded.push("bom_master indexes");
    }
    if (!existingTables.includes("bom_input")) {
      await queryInterface.addIndex("bom_input", ["bom_id"]);
      indexesAdded.push("bom_input indexes");
    }
    if (!existingTables.includes("bom_output")) {
      await queryInterface.addIndex("bom_output", ["bom_id"]);
      indexesAdded.push("bom_output indexes");
    }
    if (!existingTables.includes("derivative_grade_size_rule")) {
      await queryInterface.addIndex("derivative_grade_size_rule", [
        "species_id",
        "derivative_code",
      ]);
      indexesAdded.push("derivative_grade_size_rule indexes");
    }

    if (indexesAdded.length > 0) {
      console.log(`✓ Added indexes: ${indexesAdded.join(", ")}`);
    }

    console.log("✓ BOM tables creation completed\n");
  },

  async down(queryInterface, Sequelize) {
    console.log("\n🗑️  Removing BOM tables...\n");

    // Remove in reverse order due to foreign key constraints
    const tables = [
      "bom_cost",
      "bom_output",
      "bom_input",
      "derivative_grade_size_rule",
      "bom_master",
    ];

    for (const tableName of tables) {
      try {
        await queryInterface.dropTable(tableName);
        console.log(`✓ Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Table ${tableName} not found or already dropped`);
      }
    }

    console.log("✓ BOM tables removal completed\n");
  },
};
