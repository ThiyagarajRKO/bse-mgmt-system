"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Packing extends Model {
    static associate(models) {
      Packing.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.PeeledDispatches, {
        foreignKey: "peeled_dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.GradeMaster, {
        foreignKey: "grade_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.SizeMaster, {
        foreignKey: "size_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Packing.belongsTo(models.PackagingMaster, {
        foreignKey: "packaging_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Packing.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      packing_quantity: {
        type: DataTypes.FLOAT,
      },

      packing_status: {
        type: DataTypes.STRING,
      },
      packing_notes: {
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
      modelName: "Packing",
      tableName: "packing",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  Packing.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log("Error while appending a packing data", err?.message || err);
    }
  });

  // Update Hook
  Packing.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating a packing data", err?.message || err);
    }
  });

  // Delete Hook
  Packing.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a packing data", err?.message || err);
    }
  });

  return Packing;
};
