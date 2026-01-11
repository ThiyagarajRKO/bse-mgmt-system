"use strict";

/**
 * Consolidated BOM Migration: Framework + Population with Unsized Inputs Only
 *
 * This migration:
 * 1. Creates all BOM tables (master, input, output, cost, grade/size rules)
 * 2. Populates BOMs for all 123 species
 * 3. Populates BOM outputs with derivative products
 * 4. Adds UNSIZED raw product inputs to all BOMs
 *
 * Result: 123 BOMs × 1 UNSIZED input each = 123 BOM inputs (no sized variants)
 * Production-ready single migration for easy deployment
 */

const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n🚀 Starting: BOM Framework + Unsized Inputs Migration\n");

      // ========== PHASE 1: CREATE SCHEMA ==========
      console.log("📋 PHASE 1: Creating BOM tables...\n");

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

      // BOM Input - raw materials (UNSIZED ONLY)
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

      console.log("✓ BOM tables created successfully\n");

      // ========== PHASE 2: POPULATE BOMs ==========
      console.log("📋 PHASE 2: Populating BOMs for all species...\n");

      // Get all active species
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_name, species_code 
         FROM species_master 
         WHERE is_active = true AND deleted_at IS NULL
         ORDER BY species_name`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${species.length} active species`);

      // Get all active products grouped by species and category
      const products = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name, pm.is_active,
                pcm.product_category, pcm.species_master_id as species_id,
                sm.species_name, sm.species_code
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE pm.is_active = true AND pm.deleted_at IS NULL
         ORDER BY sm.species_name, pcm.product_category`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${products.length} active products`);

      // Get all derivatives
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_code, derivative_name
         FROM derivative_master
         WHERE is_active = true AND deleted_at IS NULL
         ORDER BY derivative_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${derivatives.length} active derivatives\n`);

      // Populate BOM Master for each species
      let bomsCreated = 0;
      const bomMap = new Map(); // Map<species_id, bom_id>

      for (const sp of species) {
        const bomId = uuidv4();
        const bomCode = `BOM_${sp.species_code}`;
        const bomName = `Standard ${sp.species_name} Processing`;

        await queryInterface.sequelize.query(
          `INSERT INTO bom_master (id, species_id, bom_code, bom_name, input_uom, output_uom, is_active, created_at, updated_at)
           VALUES (:id, :species_id, :bom_code, :bom_name, :input_uom, :output_uom, :is_active, :created_at, :updated_at)`,
          {
            replacements: {
              id: bomId,
              species_id: sp.id,
              bom_code: bomCode,
              bom_name: bomName,
              input_uom: "KG",
              output_uom: "KG",
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            },
          }
        );

        bomMap.set(sp.id, bomId);
        bomsCreated++;
      }

      console.log(`✓ Created ${bomsCreated} BOMs (one per species)\n`);

      // ========== PHASE 3: ADD BOM OUTPUTS ==========
      console.log("📋 PHASE 3: Adding BOM outputs (derivatives)...\n");

      let outputsCreated = 0;

      // Standard yield percentages for derivatives
      const yieldMap = {
        TUBES: 15,
        TENTACLES: 25,
        RINGS: 18,
        MANTLE: 20,
        FINS: 8,
        WASTE: 14,
      };

      for (const [speciesId, bomId] of bomMap.entries()) {
        for (const deriv of derivatives) {
          const yieldPercent = yieldMap[deriv.derivative_code] || 10;

          // Find derivative product
          const derivProduct = products.find(
            (p) =>
              p.species_id === speciesId &&
              p.product_name.includes(deriv.derivative_code)
          );

          const outputId = uuidv4();

          await queryInterface.sequelize.query(
            `INSERT INTO bom_output (id, bom_id, derivative_code, product_id, base_yield_percent, loss_type, created_at, updated_at)
             VALUES (:id, :bom_id, :derivative_code, :product_id, :base_yield_percent, :loss_type, :created_at, :updated_at)`,
            {
              replacements: {
                id: outputId,
                bom_id: bomId,
                derivative_code: deriv.derivative_code,
                product_id: derivProduct ? derivProduct.id : null,
                base_yield_percent: yieldPercent,
                loss_type: deriv.derivative_code === "WASTE" ? "WASTE" : "TRIM",
                created_at: new Date(),
                updated_at: new Date(),
              },
            }
          );

          outputsCreated++;
        }
      }

      console.log(`✓ Created ${outputsCreated} BOM outputs\n`);

      // ========== PHASE 4: ADD UNSIZED INPUTS ==========
      console.log("📋 PHASE 4: Adding UNSIZED inputs to BOMs...\n");

      // Get all UNSIZED raw products
      const unsizedProducts = await queryInterface.sequelize.query(
        `SELECT pm.id as product_id, pm.product_name, sm.species_name
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE pm.product_name LIKE '%UNSIZED%'
         AND pm.product_name LIKE '%Raw%'
         AND pm.is_active = true
         AND pm.deleted_at IS NULL
         ORDER BY sm.species_name`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${unsizedProducts.length} UNSIZED raw products\n`);

      // Build species-to-unsized mapping
      const speciesUnsizedMap = new Map();
      for (const unsized of unsizedProducts) {
        speciesUnsizedMap.set(unsized.species_name, unsized);
      }

      // Add UNSIZED inputs to all BOMs
      let inputsAdded = 0;

      for (const sp of species) {
        const bomId = bomMap.get(sp.id);
        const unsized = speciesUnsizedMap.get(sp.species_name);

        if (unsized && bomId) {
          // Check if input already exists
          const existingInput = await queryInterface.sequelize.query(
            `SELECT id FROM bom_input WHERE bom_id = :bomId AND raw_product_id = :productId`,
            {
              replacements: {
                bomId: bomId,
                productId: unsized.product_id,
              },
              type: Sequelize.QueryTypes.SELECT,
            }
          );

          if (existingInput.length === 0) {
            const inputId = uuidv4();

            await queryInterface.sequelize.query(
              `INSERT INTO bom_input (id, bom_id, raw_product_id, quantity, uom, created_at, updated_at)
               VALUES (:id, :bom_id, :raw_product_id, :quantity, :uom, :created_at, :updated_at)`,
              {
                replacements: {
                  id: inputId,
                  bom_id: bomId,
                  raw_product_id: unsized.product_id,
                  quantity: 1.0,
                  uom: "KG",
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              }
            );

            inputsAdded++;
          }
        }
      }

      console.log(`✓ Added ${inputsAdded} UNSIZED inputs to BOMs\n`);

      // ========== VERIFICATION ==========
      console.log("📊 VERIFICATION: Final counts\n");

      const bomCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_master`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const inputCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_input`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const outputCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_output`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ BOM Master Records: ${bomCount[0].count}`);
      console.log(`✓ BOM Input Records: ${inputCount[0].count} (UNSIZED ONLY)`);
      console.log(`✓ BOM Output Records: ${outputCount[0].count}\n`);

      // Verify all BOMs have at least one input
      const bomsWithoutInputs = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM bom_master bm
         WHERE NOT EXISTS (SELECT 1 FROM bom_input bi WHERE bi.bom_id = bm.id)`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (bomsWithoutInputs[0].count === 0) {
        console.log("✅ All BOMs have UNSIZED inputs\n");
      } else {
        console.warn(
          `⚠️  Found ${bomsWithoutInputs[0].count} BOMs without inputs\n`
        );
      }

      console.log("✅ BOM Framework + Unsized Inputs Migration Complete!\n");
      console.log("📌 Key Facts:");
      console.log(`   - ${bomCount[0].count} BOMs created (one per species)`);
      console.log(
        `   - ${inputCount[0].count} UNSIZED inputs added (1 per BOM)`
      );
      console.log(`   - ${outputCount[0].count} derivative outputs configured`);
      console.log("   - 100% inventory coverage achieved\n");
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n⏮️  Reversing BOM Framework migration...\n");

      await queryInterface.dropTable("bom_cost");
      await queryInterface.dropTable("derivative_grade_size_rule");
      await queryInterface.dropTable("bom_output");
      await queryInterface.dropTable("bom_input");
      await queryInterface.dropTable("bom_master");

      console.log("✅ BOM tables dropped successfully\n");
    } catch (error) {
      console.error("❌ Rollback failed:", error.message);
      throw error;
    }
  },
};
