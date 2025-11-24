"use strict";
const { Model } = require("sequelize");

const UnitTypes = {
  "Collection Center": "CLC",
  "Peeling Center": "PC",
  "Cooking Center": "COC",
  "Distribution Center": "DC",
  "Cold Storage": "CS",
};

module.exports = (sequelize, DataTypes) => {
  class UnitMaster extends Model {
    static associate(models) {
      UnitMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
      });

      UnitMaster.belongsTo(models.CompanyMaster, {
        as: "company",
        foreignKey: "company_id",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      UnitMaster.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });
    }
  }

  UnitMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      unit_name: DataTypes.TEXT,
      unit_code: DataTypes.TEXT,
      unit_type: DataTypes.STRING,
      company_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      is_active: DataTypes.BOOLEAN,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      deleted_at: DataTypes.DATE,
      created_by: DataTypes.UUID,
      updated_by: DataTypes.UUID,
      deleted_by: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: "UnitMaster",
      tableName: "unit_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // -------------------------------------------------------------------------
  // 🔵 BEFORE CREATE HOOK — NOW ADDS COMPANY + LOCATION
  // -------------------------------------------------------------------------
  UnitMaster.beforeCreate(async (data, options) => {
    try {
      const location = await sequelize.models.LocationMaster.findOne({
        attributes: ["location_name"],
        where: { id: data.location_master_id, is_active: true },
      });

      const company = await sequelize.models.CompanyMaster.findOne({
        attributes: ["company_name"], // <-- ✔ company available
        where: { id: data.company_id, is_active: true },
      });

      if (!location || !company) return;

      const typeCode = UnitTypes[data.unit_type.trim()];

      // Example final code:
      // AKK-PRAWN-PEL-UNITNAME
      data.unit_code =
        `${company.company_name.replaceAll(" ", "").toUpperCase()}-` +
        `${location.location_name.replaceAll(" ", "").toUpperCase()}-` +
        `${typeCode}-` +
        `${data.unit_name.replaceAll(" ", "").toUpperCase()}`;

      data.created_by = options.profile_id;
      data.created_at = new Date();
    } catch (err) {
      console.error("Before Create Error:", err);
    }
  });

  // -------------------------------------------------------------------------
  // 🟣 BEFORE UPDATE HOOK — NOW ADDS COMPANY + LOCATION
  // -------------------------------------------------------------------------
  UnitMaster.beforeUpdate(async (data, options) => {
    try {
      const location = await sequelize.models.LocationMaster.findOne({
        attributes: ["location_name"],
        where: { id: data.location_master_id, is_active: true },
      });

      const company = await sequelize.models.CompanyMaster.findOne({
        attributes: ["company_name"], // <-- ✔ available
        where: { id: data.company_id, is_active: true },
      });

      if (!location || !company) return;

      const typeCode = UnitTypes[data.unit_type.trim()];

      data.unit_code =
        `${company.company_name.replaceAll(" ", "").toUpperCase()}-` +
        `${location.location_name.replaceAll(" ", "").toUpperCase()}-` +
        `${typeCode}-` +
        `${data.unit_name.replaceAll(" ", "").toUpperCase()}`;

      data.updated_by = options.profile_id;
      data.updated_at = new Date();
    } catch (err) {
      console.error("Before Update Error:", err);
    }
  });

  return UnitMaster;
};
