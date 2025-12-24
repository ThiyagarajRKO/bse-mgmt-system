module.exports = (sequelize, DataTypes) => {
  const InvoiceLineItem = sequelize.define(
    "InvoiceLineItem",
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
      product_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      hsn_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      qty_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      rate_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      taxable_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      cgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      cgst_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      sgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      sgst_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      igst_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      igst_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      cess_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      cess_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_gst: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      line_total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      tax_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "invoice_line_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  InvoiceLineItem.associate = (models) => {
    InvoiceLineItem.belongsTo(models.Invoice, {
      foreignKey: "invoice_id",
      as: "invoice",
    });
  };

  return InvoiceLineItem;
};
