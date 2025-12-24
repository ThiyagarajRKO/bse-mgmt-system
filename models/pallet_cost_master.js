module.exports = (sequelize, DataTypes) => {
  const PalletCostMaster = sequelize.define(
    "PalletCostMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      pallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "packaging_master",
          key: "id",
        },
      },
      cost_per_pallet: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      effective_from: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "pallet_cost_master",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  PalletCostMaster.associate = (models) => {
    PalletCostMaster.belongsTo(models.PackagingMaster, {
      foreignKey: "pallet_id",
      as: "pallet",
    });
  };

  return PalletCostMaster;
};
