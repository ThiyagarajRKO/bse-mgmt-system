"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Create derivative_gst_mapping table
     * Maps: Species + Derivative + Processing State → GST Master (HSN + Tax Rates)
     *
     * Purpose: Allow different HSN codes and GST rates based on processing derivative
     * Example:
     *   - Albacore Tuna (RAW, Whole) → HSN 0303, 5% GST
     *   - Albacore Tuna (PROCESSED, Fillet) → HSN 0304, 5% GST
     *   - Albacore Tuna (PROCESSED, Cooked) → HSN 1604, 12% GST
     */
    await queryInterface.createTable("derivative_gst_mapping", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      species_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        comment: "FK to species_master",
      },
      derivative_master_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "derivative_master",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        comment: "FK to derivative_master. NULL means raw/unprocessed product",
      },
      processing_state: {
        type: Sequelize.ENUM("RAW", "PROCESSED"),
        allowNull: false,
        defaultValue: "PROCESSED",
        comment: "Distinguishes raw vs processed products",
      },
      gst_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "consolidated_gst_master",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        comment:
          "FK to consolidated_gst_master. Contains HSN code and GST rates",
      },
      hsn_code_override: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment:
          "Optional HSN override for this derivative. If set, use instead of product_master.hsn_code",
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Date when this mapping becomes effective",
      },
      effective_to: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Date when this mapping expires",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: "Soft flag for activation/deactivation",
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
        comment: "Soft delete timestamp",
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      deleted_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
    });

    // Add unique constraint: Only one mapping per (species, derivative, processing_state)
    await queryInterface.addConstraint("derivative_gst_mapping", {
      fields: ["species_master_id", "derivative_master_id", "processing_state"],
      type: "unique",
      name: "uq_derivative_gst_mapping_species_derivative_state",
    });

    // Add index for fast lookups
    await queryInterface.addIndex("derivative_gst_mapping", [
      "species_master_id",
      "derivative_master_id",
      "processing_state",
      "is_active",
    ]);

    console.log("✅ Created derivative_gst_mapping table");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("derivative_gst_mapping");
    console.log("✅ Dropped derivative_gst_mapping table");
  },
};
