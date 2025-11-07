"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CompanyMaster extends Model {
    static associate(models) {
      // ===== User Association =====
      if (models.UserProfiles) {
        CompanyMaster.belongsTo(models.UserProfiles, {
          as: "creator",
          foreignKey: "created_by",
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        });
      }

      // ===== Division (direct) =====
      if (models.DivisionMaster) {
        CompanyMaster.hasMany(models.DivisionMaster, {
          foreignKey: "company_id",
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        });
      }

      // ===== Location (direct) =====
      if (models.LocationMaster) {
        CompanyMaster.hasMany(models.LocationMaster, {
          foreignKey: "company_id",
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        });
      }

      // ===== Units (direct) =====
      if (models.UnitMaster) {
        CompanyMaster.hasMany(models.UnitMaster, {
          foreignKey: "company_id",
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        });
      }
    }
  }

  CompanyMaster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      company_short_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      company_gstin: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      company_pan: {
        type: DataTypes.STRING(20),
      },
      company_address: {
        type: DataTypes.TEXT,
      },
      company_country: {
        type: DataTypes.STRING(100),
      },
      company_bank_ac: {
        type: DataTypes.STRING(50),
      },
      company_ifsc: {
        type: DataTypes.STRING(20),
      },
      company_currency: {
        type: DataTypes.STRING(20),
      },
      company_fin_year_start: {
        type: DataTypes.STRING(20),
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "CompanyMaster",
      tableName: "company_master",
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
      createdAt: false,
      updatedAt: false,
    }
  );

  return CompanyMaster;
};
