module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      invoice_no: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      invoice_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      packing_list_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "packing_list",
          key: "id",
        },
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "customer_master",
          key: "id",
        },
      },
      supply_type: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      place_of_supply: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      total_taxable_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      total_cgst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_sgst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_igst: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_cess: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_gst: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      invoice_value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("DRAFT", "FINAL", "CANCELLED"),
        defaultValue: "DRAFT",
      },
      finalized_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      finalized_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "invoice",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.PackingList, {
      foreignKey: "packing_list_id",
      as: "packingList",
    });
    Invoice.belongsTo(models.CustomerMaster, {
      foreignKey: "customer_id",
      as: "customer",
    });
    Invoice.hasMany(models.InvoiceLineItem, {
      foreignKey: "invoice_id",
      as: "lineItems",
    });
    Invoice.hasMany(models.SalesRegister, {
      foreignKey: "invoice_id",
      as: "salesRegisterEntries",
    });
  };

  return Invoice;
};
