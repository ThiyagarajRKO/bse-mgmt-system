module.exports = (sequelize, DataTypes) => {
  const JournalTemplate = sequelize.define(
    "journal_template",
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      event_type: {
        type: DataTypes.ENUM(
          "PURCHASE_GRN",
          "SUPPLIER_PAYMENT",
          "RAW_ISSUE_TO_PRODUCTION",
          "PRODUCTION_COMPLETION",
          "BYPRODUCT_CREATION",
          "PACKAGING_CONSUMPTION",
          "PACKING_COMPLETION",
          "INTERNAL_TRANSFER",
          "TRANSFER_RECEIPT",
          "DISPATCH",
          "SALES_INVOICE",
          "SALES_TAX",
          "CUSTOMER_PAYMENT",
        ),
        allowNull: false,
        unique: true,
      },
      event_description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      debit_account_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      debit_account_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      credit_account_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      credit_account_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      auto_post: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
  );

  JournalTemplate.associate = (models) => {
    JournalTemplate.belongsTo(models.chart_of_accounts, {
      foreignKey: "debit_account_id",
      as: "debit_account",
    });
    JournalTemplate.belongsTo(models.chart_of_accounts, {
      foreignKey: "credit_account_id",
      as: "credit_account",
    });
    JournalTemplate.belongsTo(models.user_profiles, {
      foreignKey: "created_by",
      as: "creator",
    });
    JournalTemplate.belongsTo(models.user_profiles, {
      foreignKey: "updated_by",
      as: "updater",
    });
  };

  return JournalTemplate;
};
