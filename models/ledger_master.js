module.exports = (sequelize, DataTypes) => {
  const LedgerMaster = sequelize.define(
    "LedgerMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      company_id: { type: DataTypes.UUID, allowNull: false },
      ledger_code: { type: DataTypes.STRING(64), allowNull: false },
      ledger_name: { type: DataTypes.STRING(255), allowNull: false },
      coa_account_id: { type: DataTypes.UUID, allowNull: false },
      currency: { type: DataTypes.STRING(12), defaultValue: "USD" },
      is_bank: { type: DataTypes.BOOLEAN, defaultValue: false },
      bank_name: DataTypes.STRING(255),
      bank_account_no: DataTypes.STRING(128),
      bank_ifsc: DataTypes.STRING(64),
      opening_balance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_by: DataTypes.UUID,
      updated_by: DataTypes.UUID,
      deleted_by: DataTypes.UUID,
    },
    {
      tableName: "ledger_master",
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );

  LedgerMaster.associate = (models) => {
    LedgerMaster.belongsTo(models.ChartOfAccounts, {
      foreignKey: "coa_account_id",
      as: "coa_account",
    });
  };

  return LedgerMaster;
};
