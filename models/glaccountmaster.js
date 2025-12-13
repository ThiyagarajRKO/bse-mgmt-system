"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GlAccountMaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GlAccountMaster.belongsTo(models.GlAccountMaster, {
        as: "parent",
        foreignKey: "parent_account_code",
        targetKey: "account_code",
      });
      GlAccountMaster.hasMany(models.GlAccountMaster, {
        as: "children",
        foreignKey: "parent_account_code",
        sourceKey: "account_code",
      });
      GlAccountMaster.belongsTo(models.CompanyMaster, {
        as: "company",
        foreignKey: "company_id",
      });
    }
  }
  GlAccountMaster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      account_code: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      account_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      account_type: {
        type: DataTypes.ENUM(
          "Asset",
          "Liability",
          "Income",
          "Expense",
          "Equity"
        ),
        allowNull: false,
      },
      account_group: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      parent_account_code: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      is_posting_account: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_tax_ledger: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      gst_component: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          isIn: [["CGST", "SGST", "IGST", null]],
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
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
      sequelize,
      modelName: "GlAccountMaster",
      tableName: "gl_account_master",
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );
  return GlAccountMaster;
};
