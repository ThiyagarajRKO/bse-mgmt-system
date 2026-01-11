"use strict";

module.exports = (sequelize, DataTypes) => {
  const BillOfMaterials = sequelize.define(
    "BillOfMaterials",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
      },
      procurement_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "procurement_products",
          key: "id",
        },
      },
      quantity_required: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      unit_of_measure: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "bill_of_materials",
      timestamps: true,
      underscored: true,
    }
  );

  BillOfMaterials.associate = (models) => {
    BillOfMaterials.belongsTo(models.ProductMaster, {
      foreignKey: "product_master_id",
      as: "ProductMaster",
    });

    BillOfMaterials.belongsTo(models.ProcurementProducts, {
      foreignKey: "procurement_product_id",
      as: "ProcurementProduct",
    });
  };

  return BillOfMaterials;
};
