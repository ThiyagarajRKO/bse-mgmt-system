module.exports = (sequelize, DataTypes) => {
  const PackagingCostMaster = sequelize.define(
    "PackagingCostMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      packaging_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "packaging_master",
          key: "id",
        },
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      cost_uom: {
        type: DataTypes.ENUM("PCS", "KG"),
        allowNull: false,
        defaultValue: "PCS",
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
      tableName: "packaging_cost_master",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  PackagingCostMaster.associate = (models) => {
    PackagingCostMaster.belongsTo(models.PackagingMaster, {
      foreignKey: "packaging_id",
      as: "packaging",
    });
  };

  return PackagingCostMaster;
};
