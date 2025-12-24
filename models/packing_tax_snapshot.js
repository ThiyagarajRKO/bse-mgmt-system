"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PackingTaxSnapshot extends Model {
    static associate(models) {
      PackingTaxSnapshot.belongsTo(models.Packing, {
        foreignKey: "packing_id",
      });
    }
  }

  PackingTaxSnapshot.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      packing_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      gst_rate: DataTypes.NUMERIC(5, 2),
      cgst: DataTypes.NUMERIC(5, 2),
      sgst: DataTypes.NUMERIC(5, 2),
      igst: DataTypes.NUMERIC(5, 2),
      taxable_value: DataTypes.NUMERIC(12, 2),
      tax_amount: DataTypes.NUMERIC(12, 2),
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.fn("now"),
      },
    },
    {
      sequelize,
      modelName: "PackingTaxSnapshot",
      tableName: "packing_tax_snapshot",
      underscored: true,
      timestamps: false,
    }
  );

  return PackingTaxSnapshot;
};
