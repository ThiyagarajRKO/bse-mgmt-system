module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ledger_master');"
    );

    if (!tableExists[0][0].exists) {
      await queryInterface.createTable("ledger_master", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()"),
          primaryKey: true,
        },
        company_id: { type: Sequelize.UUID, allowNull: false },
        ledger_code: { type: Sequelize.STRING(64), allowNull: false },
        ledger_name: { type: Sequelize.STRING(255), allowNull: false },
        coa_account_id: { type: Sequelize.UUID, allowNull: false },
        currency: { type: Sequelize.STRING(12), defaultValue: "USD" },
        is_bank: { type: Sequelize.BOOLEAN, defaultValue: false },
        bank_name: Sequelize.STRING(255),
        bank_account_no: Sequelize.STRING(128),
        bank_ifsc: Sequelize.STRING(64),
        opening_balance: { type: Sequelize.DECIMAL(20, 2), defaultValue: 0 },
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
        "ledger_master",
        "uq_ledger_company_code"
      );
    } catch (e) {
      // Constraint doesn't exist, continue
    }

    await queryInterface.addConstraint("ledger_master", {
      fields: ["company_id", "ledger_code"],
      type: "unique",
      name: "uq_ledger_company_code",
    });

    // Foreign key to chart_of_accounts
    await queryInterface
      .addConstraint("ledger_master", {
        fields: ["coa_account_id"],
        type: "foreign key",
        name: "fk_ledger_coa",
        references: {
          table: "chart_of_accounts",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface
      .addIndex("ledger_master", ["company_id"], {
        name: "idx_ledger_company",
      })
      .catch(() => {});
    await queryInterface
      .addIndex(
        "ledger_master",
        [queryInterface.sequelize.literal("lower(ledger_name)")],
        {
          using: "gin",
          operator: "gin_trgm_ops",
          name: "idx_ledger_name_trgm",
        }
      )
      .catch(() => {});
  },

  down: async (queryInterface) => {
    // Remove foreign key constraint first
    try {
      await queryInterface.removeConstraint("ledger_master", "fk_ledger_coa");
    } catch (e) {
      // Constraint doesn't exist
    }
    try {
      await queryInterface.removeConstraint(
        "ledger_master",
        "uq_ledger_company_code"
      );
    } catch (e) {
      // Constraint doesn't exist
    }
    try {
      await queryInterface.removeIndex("ledger_master", "idx_ledger_company");
    } catch (e) {
      // Index doesn't exist
    }
    try {
      await queryInterface.removeIndex("ledger_master", "idx_ledger_name_trgm");
    } catch (e) {
      // Index doesn't exist
    }
  },
};
