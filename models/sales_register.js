module.exports = (sequelize, DataTypes) => {
  const SalesRegister = sequelize.define(
    "SalesRegister",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "invoice",
          key: "id",
        },
      },
      invoice_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      invoice_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customer_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      hsn_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      taxable_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      cgst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      sgst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      igst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      cess: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_gst: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      supply_type: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      place_of_supply: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "sales_register",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  SalesRegister.associate = (models) => {
    SalesRegister.belongsTo(models.Invoice, {
      foreignKey: "invoice_id",
      as: "invoice",
    });
  };

  return SalesRegister;
};
