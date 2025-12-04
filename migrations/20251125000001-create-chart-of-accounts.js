module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    );

    // Check if table exists and modify it
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chart_of_accounts');"
    );

    if (tableExists[0][0].exists) {
      // Add company_id column if it doesn't exist
      const columnExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'company_id');"
      );
      if (!columnExists[0][0].exists) {
        await queryInterface.addColumn("chart_of_accounts", "company_id", {
          type: Sequelize.UUID,
          allowNull: true,
        });
      }
      // Add description column if it doesn't exist
      const descExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chart_of_accounts' AND column_name = 'description');"
      );
      if (!descExists[0][0].exists) {
        await queryInterface.addColumn("chart_of_accounts", "description", {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
    } else {
      await queryInterface.createTable("chart_of_accounts", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal("gen_random_uuid()"),
          primaryKey: true,
        },
        company_id: { type: Sequelize.UUID, allowNull: true },
        account_code: { type: Sequelize.STRING(64), allowNull: false },
        account_name: { type: Sequelize.STRING(255), allowNull: false },
        parent_account_id: { type: Sequelize.UUID, allowNull: true },
        account_type: { type: Sequelize.STRING(16), allowNull: false },
        level: { type: Sequelize.INTEGER, defaultValue: 0 },
        is_posting: { type: Sequelize.BOOLEAN, defaultValue: true },
        description: { type: Sequelize.TEXT, allowNull: true },
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
        "chart_of_accounts",
        "uq_coa_company_code"
      );
    } catch (e) {
      // Constraint doesn't exist, continue
    }

    await queryInterface.addConstraint("chart_of_accounts", {
      fields: ["company_id", "account_code"],
      type: "unique",
      name: "uq_coa_company_code",
    });

    // Self-referencing foreign key for parent_account_id
    await queryInterface
      .addConstraint("chart_of_accounts", {
        fields: ["parent_account_id"],
        type: "foreign key",
        name: "fk_coa_parent",
        references: {
          table: "chart_of_accounts",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      })
      .catch(() => {}); // Ignore if exists

    await queryInterface
      .addIndex("chart_of_accounts", ["company_id"], {
        name: "idx_coa_company_id",
      })
      .catch(() => {}); // Ignore if exists
    await queryInterface
      .addIndex(
        "chart_of_accounts",
        [queryInterface.sequelize.literal("lower(account_name)")],
        {
          using: "gin",
          operator: "gin_trgm_ops",
          name: "idx_coa_name_trgm",
        }
      )
      .catch(() => {}); // Ignore if exists
    await queryInterface
      .addIndex(
        "chart_of_accounts",
        [queryInterface.sequelize.literal("lower(account_code)")],
        {
          name: "idx_coa_code_lower",
        }
      )
      .catch(() => {}); // Ignore if exists
  },

  down: async (queryInterface) => {
    // Remove foreign key constraint first
    try {
      await queryInterface.removeConstraint(
        "chart_of_accounts",
        "fk_coa_parent"
      );
    } catch (e) {
      // Constraint doesn't exist
    }
    // Don't drop the table in down since it might be used by other migrations
    try {
      await queryInterface.removeConstraint(
        "chart_of_accounts",
        "uq_coa_company_code"
      );
    } catch (e) {
      // Constraint doesn't exist
    }
    try {
      await queryInterface.removeIndex(
        "chart_of_accounts",
        "idx_coa_company_id"
      );
    } catch (e) {
      // Index doesn't exist
    }
    try {
      await queryInterface.removeIndex(
        "chart_of_accounts",
        "idx_coa_name_trgm"
      );
    } catch (e) {
      // Index doesn't exist
    }
    try {
      await queryInterface.removeIndex(
        "chart_of_accounts",
        "idx_coa_code_lower"
      );
    } catch (e) {
      // Index doesn't exist
    }
  },
};
