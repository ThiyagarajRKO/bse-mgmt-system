"use strict";

/**
 * CREATE GRADE × SIZE COMPATIBILITY RULES TABLE
 *
 * Enforces ERP-ready validation rules:
 * - Which grades are allowed at each size
 * - For each species category + product form
 * - With blocking rules for invalid combinations
 *
 * Used by:
 * - Product creation validation
 * - Packing workflow enforcement
 * - Pricing tier assignment
 * - Yield planning
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("Creating grade_size_compatibility_rule table...");

      // Check if table exists
      const tableExists = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_size_compatibility_rule' LIMIT 1`
      );

      if (tableExists[0] && tableExists[0].length > 0) {
        console.log("✅ Table already exists, skipping...");
        return;
      }

      await queryInterface.createTable("grade_size_compatibility_rule", {
        id: {
          primaryKey: true,
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
        },
        species_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            "Species category: Fish, FlatFish, Tuna, Shrimp, Crab, Lobster, Cephalopod, Octopus, Bivalve, Gastropod",
        },
        product_form: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment:
            "Product form: WHOLE, FILLET, LOIN, SAKU_BLOCK, WHOLE_LIVE, MEAT_PACK, TAIL_MEAT, TUBES, etc.",
        },
        min_size: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          comment: "Minimum size value (in specified unit)",
        },
        max_size: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          comment: "Maximum size value (in specified unit)",
        },
        unit: {
          type: Sequelize.STRING(20),
          allowNull: false,
          comment: "Unit: kg, g, count/kg, cm, pcs/kg, etc.",
        },
        grade_a: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: "Is Grade A (Premium Export/Sashimi) allowed?",
        },
        grade_b: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: "Is Grade B (Standard Export/Retail) allowed?",
        },
        grade_c: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: "Is Grade C (Processing/Foodservice) allowed?",
        },
        grade_d: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: "Is Grade D (Industrial/Mince) allowed?",
        },
        is_blocked: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: "Block this size entirely (scrap/trim/unusable)",
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Human-readable reason (market rule, processing note)",
        },
        priority: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: "Priority for recommendations (lower = higher priority)",
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn("now"),
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
          comment: "Audit trail: who created this rule",
        },
        updated_by: {
          type: Sequelize.UUID,
          comment: "Audit trail: who last updated this rule",
        },
        deleted_by: {
          type: Sequelize.UUID,
          comment: "Audit trail: who soft-deleted this rule",
        },
      });

      // Create indexes for fast lookups
      await queryInterface.addIndex("grade_size_compatibility_rule", {
        fields: ["species_type", "product_form", "is_active"],
        name: "idx_grade_size_compat_species_form_active",
      });

      await queryInterface.addIndex("grade_size_compatibility_rule", {
        fields: ["min_size", "max_size", "is_blocked"],
        name: "idx_grade_size_compat_size_blocked",
      });

      // Foreign keys for audit trail
      await queryInterface.addConstraint("grade_size_compatibility_rule", {
        fields: ["created_by"],
        type: "FOREIGN KEY",
        name: "fk_grade_size_compat_created_by",
        references: {
          table: "user_profiles",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      console.log("✅ Table created with indexes and constraints");
    } catch (error) {
      console.error("❌ Error creating table:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Dropping grade_size_compatibility_rule table...");

      // Check if table exists before trying to drop
      const tableExists = await queryInterface.sequelize.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grade_size_compatibility_rule' LIMIT 1`
      );

      if (!tableExists[0] || tableExists[0].length === 0) {
        console.log("✅ Table doesn't exist, skipping...");
        return;
      }

      // Drop foreign keys
      await queryInterface
        .removeConstraint(
          "grade_size_compatibility_rule",
          "fk_grade_size_compat_created_by"
        )
        .catch(() => {});

      // Drop indexes
      await queryInterface
        .removeIndex(
          "grade_size_compatibility_rule",
          "idx_grade_size_compat_species_form_active"
        )
        .catch(() => {});

      await queryInterface
        .removeIndex(
          "grade_size_compatibility_rule",
          "idx_grade_size_compat_size_blocked"
        )
        .catch(() => {});

      // Drop table
      await queryInterface.dropTable("grade_size_compatibility_rule");

      console.log("✅ Table dropped successfully");
    } catch (error) {
      console.error("Error dropping table:", error);
      throw error;
    }
  },
};
