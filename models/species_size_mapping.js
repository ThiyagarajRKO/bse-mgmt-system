"use strict";
const { Model } = require("sequelize");

/**
 * SpeciesSizeMapping Model
 *
 * Establishes relationships between species types (parent_category_type)
 * and available sizes (unit_of_measure) from size_master.
 *
 * This enables:
 * - Type-aware size recommendations
 * - Business rule enforcement (e.g., Fish can use pcs/kg, Bivalves use cm)
 * - Automatic size filtering based on species characteristics
 *
 * Structure:
 * - parent_category_type: ENUM (Bivalve, Cephalopod, Fish, Crustacean, Gastropod, Other)
 * - unit_of_measure: String (g, kg, cm, pcs/kg, pcs/lb, etc.)
 * - priority: Integer (lower = higher priority for recommendations)
 * - is_active: Boolean (for soft delete compatibility)
 */

module.exports = (sequelize, DataTypes) => {
  class SpeciesSizeMapping extends Model {
    static associate(models) {
      SpeciesSizeMapping.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SpeciesSizeMapping.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SpeciesSizeMapping.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  SpeciesSizeMapping.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      parent_category_type: {
        type: DataTypes.ENUM(
          "Bivalve",
          "Cephalopod",
          "Fish",
          "Crustacean",
          "Gastropod",
          "Other"
        ),
        allowNull: false,
        comment: "Species category type from species_master",
      },
      unit_of_measure: {
        type: DataTypes.STRING,
        allowNull: false,
        comment:
          "Unit of measure from size_master (e.g., g, kg, cm, pcs/kg, pcs/lb)",
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment:
          "Priority order for size recommendations (lower = higher priority)",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment:
          "Explanation of why this size is suitable for this species type",
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
      modelName: "SpeciesSizeMapping",
      tableName: "species_size_mapping",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  SpeciesSizeMapping.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while creating species size mapping:",
        err?.message || err
      );
    }
  });

  // Update Hook
  SpeciesSizeMapping.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error while updating species size mapping:",
        err?.message || err
      );
    }
  });

  // Delete Hook
  SpeciesSizeMapping.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting species size mapping:",
        err?.message || err
      );
    }
  });

  return SpeciesSizeMapping;
};
