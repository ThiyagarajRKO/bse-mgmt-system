module.exports = (sequelize, DataTypes) => {
  const ChartOfAccounts = sequelize.define(
    "ChartOfAccounts",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company_id: { type: DataTypes.UUID, allowNull: true },
      account_code: { type: DataTypes.STRING(64), allowNull: false },
      account_name: { type: DataTypes.STRING(255), allowNull: false },
      parent_account_id: { type: DataTypes.UUID, allowNull: true },
      account_type: { type: DataTypes.STRING(16), allowNull: false },
      level: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_posting: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      created_by: { type: DataTypes.UUID },
      updated_by: { type: DataTypes.UUID },
      deleted_by: { type: DataTypes.UUID },
    },
    {
      tableName: "chart_of_accounts",
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );

  ChartOfAccounts.associate = (models) => {
    ChartOfAccounts.belongsTo(models.ChartOfAccounts, {
      as: "parent",
      foreignKey: "parent_account_id",
    });
    ChartOfAccounts.hasMany(models.ChartOfAccounts, {
      as: "children",
      foreignKey: "parent_account_id",
    });
    ChartOfAccounts.hasMany(models.LedgerMaster, {
      as: "ledgers",
      foreignKey: "coa_account_id",
    });
  };

  ChartOfAccounts.beforeCreate(async (coa, opts) => {
    if (coa.parent_account_id) {
      const parent = await sequelize.models.ChartOfAccounts.findByPk(
        coa.parent_account_id
      );
      coa.level = parent ? parent.level + 1 : 0;
    }
  });

  return ChartOfAccounts;
};
