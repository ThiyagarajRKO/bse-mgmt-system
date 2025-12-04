module.exports = (sequelize, DataTypes) => {
  const TaxCodeMaster = sequelize.define(
    "TaxCodeMaster",
    {
      tax_code_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      tax_code: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      tax_code_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tax_type: {
        type: DataTypes.ENUM(
          "GST",
          "IGST",
          "NON_GST",
          "ZERO_RATED",
          "EXEMPT",
          "REVERSE_CHARGE"
        ),
        allowNull: false,
        defaultValue: "GST",
      },
      supply_type: {
        type: DataTypes.ENUM("INWARD", "OUTWARD"),
        allowNull: false,
        defaultValue: "OUTWARD",
      },
      // Note: existing ConsolidatedGstMaster.gst_rate_id is STRING(50).
      // To avoid FK type mismatch we store gst_rate_id as STRING(50).
      gst_rate_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        references: {
          model: "ConsolidatedGstMaster",
          key: "gst_rate_id",
        },
      },
      hsn_code: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      ledger_cgst_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      ledger_sgst_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      ledger_igst_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      is_refundable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_export_applicable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_reverse_charge: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
        allowNull: false,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deleted_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "tax_code_master",
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );

  TaxCodeMaster.associate = (models) => {
    // Association with GST Master
    TaxCodeMaster.belongsTo(models.ConsolidatedGstMaster, {
      as: "gstMaster",
      foreignKey: "gst_rate_id",
      targetKey: "gst_rate_id",
    });

    // Associations with ledger master for CGST/SGST/IGST
    TaxCodeMaster.belongsTo(models.LedgerMaster, {
      as: "ledgerCgst",
      foreignKey: "ledger_cgst_id",
    });
    TaxCodeMaster.belongsTo(models.LedgerMaster, {
      as: "ledgerSgst",
      foreignKey: "ledger_sgst_id",
    });
    TaxCodeMaster.belongsTo(models.LedgerMaster, {
      as: "ledgerIgst",
      foreignKey: "ledger_igst_id",
    });

    // Association with Users for audit fields
    TaxCodeMaster.belongsTo(models.Users, {
      as: "creator",
      foreignKey: "created_by",
    });
    TaxCodeMaster.belongsTo(models.Users, {
      as: "updater",
      foreignKey: "updated_by",
    });
    TaxCodeMaster.belongsTo(models.Users, {
      as: "deleter",
      foreignKey: "deleted_by",
    });
  };

  return TaxCodeMaster;
};
