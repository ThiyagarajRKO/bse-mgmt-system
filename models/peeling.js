"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Peeling extends Model {
    static associate(models) {
      Peeling.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Peeling.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Peeling.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Peeling.belongsTo(models.Dispatches, {
        foreignKey: "dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Peeling.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Peeling.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Peeling.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      peeling_quantity: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      peeling_method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      peeling_status: {
        type: DataTypes.STRING,
        defaultValue: "In Progress",
      },
      peeling_notes: {
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
      modelName: "Peeling",
      tableName: "peeling",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  Peeling.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending an peeling data", err?.message || err);
    }
  });

  // Update Hook
  Peeling.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating an peeling data", err?.message || err);
    }
  });

  // Delete Hook
  Peeling.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an peeling data", err?.message || err);
    }
  });

  return Peeling;
};
