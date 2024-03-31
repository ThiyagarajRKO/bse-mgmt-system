"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ModuleMaster extends Model {
    static associate(models) {
      ModuleMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ModuleMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      module_name: {
        type: DataTypes.STRING,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "ModuleMaster",
      tableName: "module_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      // paranoid: true,
      // deletedAt: "deleted_at",
    }
  );

  return ModuleMaster;
};
