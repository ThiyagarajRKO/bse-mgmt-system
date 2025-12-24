module.exports = (sequelize, DataTypes) => {
  const PackingList = sequelize.define(
    "PackingList",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      packing_list_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      sales_order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      species: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      size: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      primary_pack: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      units_per_carton: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_cartons: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      net_weight_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gross_weight_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      cbm: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
      },
      pallets: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      market: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("DRAFT", "APPROVED", "LOCKED"),
        defaultValue: "DRAFT",
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      locked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      locked_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "packing_list",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  PackingList.associate = (models) => {
    PackingList.belongsTo(models.Orders, {
      foreignKey: "sales_order_id",
      as: "salesOrder",
    });
    PackingList.hasMany(models.Invoice, {
      foreignKey: "packing_list_id",
      as: "invoices",
    });
  };

  return PackingList;
};
