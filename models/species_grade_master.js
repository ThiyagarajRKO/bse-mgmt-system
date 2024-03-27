"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SpeciesGradeMaster extends Model {
    static associate(models) {
      SpeciesGradeMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SpeciesGradeMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SpeciesGradeMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  SpeciesGradeMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      grade_name: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
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
      modelName: "SpeciesGradeMaster",
      tableName: "species_grade_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  SpeciesGradeMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending an unit name", err?.message || err);
    }
  });

  // Update Hook
  SpeciesGradeMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
    } catch (err) {
      console.log("Error while updating an unit name", err?.message || err);
    }
  });

  // Delete Hook
  SpeciesGradeMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an unit", err?.message || err);
    }
  });

  return SpeciesGradeMaster;
};
