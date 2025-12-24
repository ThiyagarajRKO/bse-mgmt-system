module.exports = (sequelize, DataTypes) => {
  const CartonCostMaster = sequelize.define(
    "CartonCostMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      carton_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "packaging_master",
          key: "id",
        },
      },
      cost_per_carton: {
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
      tableName: "carton_cost_master",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CartonCostMaster.associate = (models) => {
    CartonCostMaster.belongsTo(models.PackagingMaster, {
      foreignKey: "carton_id",
      as: "carton",
    });
  };

  return CartonCostMaster;
};
