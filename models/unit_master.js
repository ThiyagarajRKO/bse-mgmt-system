"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UnitMaster extends Model {
    static associate(models) {
      UnitMaster.belongsTo(models.UserProfiles, {
        as: "creator_profile",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "updater_profile",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.UserProfiles, {
        as: "deleter_profile",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      UnitMaster.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
      unit_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      unit_code: {
        type: DataTypes.STRING,
      },
      unit_type: {
        type: DataTypes.STRING,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
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
      modelName: "UnitMaster",
      tableName: "unit_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  return UnitMaster;
};
