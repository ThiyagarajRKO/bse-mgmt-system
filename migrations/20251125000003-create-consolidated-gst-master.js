module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'consolidated_gst_master');"
    );

    if (!tableExists[0][0].exists) {
      await queryInterface.createTable("consolidated_gst_master", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()"),
          primaryKey: true,
        },
        company_id: { type: Sequelize.UUID, allowNull: true },
        hsn_code: Sequelize.STRING(32),
        description: Sequelize.TEXT,
        gst_rate_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
        gst_type: { type: Sequelize.STRING(32), allowNull: false },
        is_export: { type: Sequelize.BOOLEAN, defaultValue: false },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
        created_by: Sequelize.UUID,
        updated_by: Sequelize.UUID,
        deleted_by: Sequelize.UUID,
        created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("now") },
        updated_at: Sequelize.DATE,
        deleted_at: Sequelize.DATE,
      });
    }

    // Drop existing constraint if exists
    try {
      await queryInterface.removeConstraint(
        "consolidated_gst_master",
        "uq_gst_company_hsn"
      );
    } catch (e) {
      // Constraint doesn't exist, continue
    }

    await queryInterface.addConstraint("consolidated_gst_master", {
      fields: ["company_id", "hsn_code"],
      type: "unique",
      name: "uq_gst_company_hsn",
    });

    await queryInterface
      .addIndex(
        "consolidated_gst_master",
        [queryInterface.sequelize.literal("lower(hsn_code)")],
        {
          name: "idx_gst_hsn_lower",
        }
      )
      .catch(() => {});
    await queryInterface
      .addIndex(
        "consolidated_gst_master",
        [queryInterface.sequelize.literal("lower(description)")],
        {
          using: "gin",
          operator: "gin_trgm_ops",
          name: "idx_gst_desc_trgm",
        }
      )
      .catch(() => {});
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeConstraint(
        "consolidated_gst_master",
        "uq_gst_company_hsn"
      );
    } catch (e) {
      // Constraint doesn't exist
    }
    try {
      await queryInterface.removeIndex(
        "consolidated_gst_master",
        "idx_gst_hsn_lower"
      );
    } catch (e) {
      // Index doesn't exist
    }
    try {
      await queryInterface.removeIndex(
        "consolidated_gst_master",
        "idx_gst_desc_trgm"
      );
    } catch (e) {
      // Index doesn't exist
    }
  },
};
