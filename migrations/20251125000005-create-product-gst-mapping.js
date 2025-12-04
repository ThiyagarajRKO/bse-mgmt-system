module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("product_gst_mapping", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      product_id: { type: Sequelize.UUID, allowNull: false },
      company_id: { type: Sequelize.UUID, allowNull: true },
      gst_master_id: { type: Sequelize.UUID, allowNull: false },
      override_gst_rate: Sequelize.DECIMAL(5, 2),
      effective_from: Sequelize.DATEONLY,
      effective_to: Sequelize.DATEONLY,
      note: Sequelize.TEXT,
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      deleted_by: Sequelize.UUID,
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("now") },
      updated_at: Sequelize.DATE,
      deleted_at: Sequelize.DATE,
    });

    await queryInterface.addConstraint("product_gst_mapping", {
      fields: ["product_id", "company_id", "gst_master_id"],
      type: "unique",
      name: "uq_product_gst_company",
    });

    // Add foreign keys
    await queryInterface
      .addConstraint("product_gst_mapping", {
        fields: ["gst_master_id"],
        type: "foreign key",
        name: "fk_pg_gst_master",
        references: {
          table: "consolidated_gst_master",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface
      .addConstraint("product_gst_mapping", {
        fields: ["product_id"],
        type: "foreign key",
        name: "fk_pg_product",
        references: {
          table: "product_master",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface.addIndex("product_gst_mapping", ["product_id"], {
      name: "idx_product_gst_product",
    });
    await queryInterface.addIndex(
      "product_gst_mapping",
      ["effective_from", "effective_to"],
      {
        name: "idx_product_gst_date",
      }
    );
  },

  down: async (queryInterface) => {
    // Remove foreign key constraints first
    try {
      await queryInterface.removeConstraint(
        "product_gst_mapping",
        "fk_pg_product"
      );
    } catch (e) {}
    try {
      await queryInterface.removeConstraint(
        "product_gst_mapping",
        "fk_pg_gst_master"
      );
    } catch (e) {}
    await queryInterface.dropTable("product_gst_mapping");
  },
};
