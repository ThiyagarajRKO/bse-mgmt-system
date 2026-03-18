"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("qa_postpack_inspections", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      packing_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "packing",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      batch_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Batch or lot identifier for traceability",
      },
      sample_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Number of samples inspected",
      },
      // Seal Integrity Check
      seal_integrity: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Seal complete, no leaks",
      },
      vacuum_proper: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Proper vacuum, no air pockets",
      },
      tray_damage: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "No cracked trays",
      },
      carton_condition: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "No crushed cartons",
      },
      ice_buildup_acceptable: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Acceptable freezing condition",
      },
      // Label Verification
      label_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment:
          "All label fields correct (product, species, weight, grade, date, batch, origin, HSN)",
      },
      // Net Weight Verification
      net_weight_avg: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: "Average net weight of samples (kg)",
      },
      net_weight_compliant: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Average >= declared, individual packs within tolerance",
      },
      // Glazing Verification (for frozen seafood)
      glazing_pct: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: "Glazing percentage (%)",
      },
      glazing_compliant: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Domestic: 5-10%, Export: 5-8%",
      },
      // Product Appearance
      product_appearance_pass: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment:
          "Natural color, no freezer burn, dehydration, or excessive ice crystals",
      },
      // Foreign Matter Check
      foreign_matter_found: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Zero tolerance check - plastic, shell, metal, parasites",
      },
      // Temperature Verification
      temperature_core: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: "Core temperature (°C), must be ≤ -18°C for frozen seafood",
      },
      temperature_compliant: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Core temperature ≤ -18°C",
      },
      // Carton Weight Check
      carton_weight_expected: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: "Expected master carton weight (kg)",
      },
      carton_weight_actual: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: "Actual master carton weight (kg)",
      },
      carton_weight_compliant: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Within tolerance (±1-2%)",
      },
      // Traceability Verification
      traceability_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: "Carton → batch → production → raw material verified",
      },
      // Final QA Decision
      qa_status: {
        type: Sequelize.ENUM("PASS", "HOLD", "FAIL"),
        allowNull: false,
        defaultValue: "PASS",
        comment:
          "PASS: Released to cold storage | HOLD: Needs investigation | FAIL: Repack/reject",
      },
      qa_decision_remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Detailed remarks on QA decision",
      },
      // Follow-up Action
      follow_up_action: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "SALEABLE, BLOCKED, REWORK, REJECT",
      },
      inventory_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Resulting inventory status after QA decision",
      },
      // Audit Trail
      inspected_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      inspected_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.NOW,
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deleted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "user_profiles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex("qa_postpack_inspections", ["packing_id"]);
    await queryInterface.addIndex("qa_postpack_inspections", ["order_id"]);
    await queryInterface.addIndex("qa_postpack_inspections", ["batch_id"]);
    await queryInterface.addIndex("qa_postpack_inspections", ["qa_status"]);
    await queryInterface.addIndex("qa_postpack_inspections", ["inspected_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("qa_postpack_inspections");
  },
};
