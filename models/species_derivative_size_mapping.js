"use strict";

const { Model, DataTypes } = require("sequelize");

/**
 * SpeciesDerivativeSizeMapping Model
 *
 * Comprehensive mapping matrix connecting:
 * Species → Derivatives → Sizes
 *
 * Used for:
 * - Product creation recommendations
 * - Yield calculations with size-aware outputs
 * - Pricing by species-derivative-size combination
 * - Inventory tracking across all dimensions
 * - Production planning and capacity analysis
 */

module.exports = (sequelize) => {
  class SpeciesDerivativeSizeMapping extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Associations with master tables
      this.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        as: "species",
      });

      this.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_id",
        as: "derivative",
      });

      this.belongsTo(models.SizeMaster, {
        foreignKey: "size_id",
        as: "size",
      });

      // Audit trail associations
      this.belongsTo(models.UserProfiles, {
        foreignKey: "created_by",
        as: "createdByUser",
      });

      this.belongsTo(models.UserProfiles, {
        foreignKey: "updated_by",
        as: "updatedByUser",
      });

      this.belongsTo(models.UserProfiles, {
        foreignKey: "deleted_by",
        as: "deletedByUser",
      });
    }

    /**
     * Get applicable derivatives for a species
     * @param {string} speciesId - Species master ID
     * @returns {Promise<Array>} Derivatives ordered by priority
     */
    static async getDerivativesForSpecies(speciesId) {
      return this.findAll({
        where: { species_id: speciesId, is_applicable: true, is_active: true },
        include: [
          { model: sequelize.models.DerivativeMaster, as: "derivative" },
        ],
        order: [["priority_order", "ASC"]],
      });
    }

    /**
     * Get applicable sizes for a derivative within a species
     * @param {string} speciesId - Species master ID
     * @param {string} derivativeId - Derivative master ID
     * @returns {Promise<Array>} Sizes ordered by priority
     */
    static async getSizesForDerivative(speciesId, derivativeId) {
      return this.findAll({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          is_applicable: true,
          is_active: true,
        },
        include: [{ model: sequelize.models.SizeMaster, as: "size" }],
        order: [["priority_order", "ASC"]],
      });
    }

    /**
     * Get complete matrix for a species
     * @param {string} speciesId - Species master ID
     * @returns {Promise<Array>} Complete species-derivative-size mapping
     */
    static async getMatrixForSpecies(speciesId) {
      return this.findAll({
        where: { species_id: speciesId, is_applicable: true, is_active: true },
        include: [
          { model: sequelize.models.DerivativeMaster, as: "derivative" },
          { model: sequelize.models.SizeMaster, as: "size" },
        ],
        order: [
          ["derivative_id", "ASC"],
          ["priority_order", "ASC"],
        ],
      });
    }

    /**
     * Check if a specific species-derivative-size combination exists and is applicable
     * @param {string} speciesId - Species master ID
     * @param {string} derivativeId - Derivative master ID
     * @param {string} sizeId - Size master ID
     * @returns {Promise<Object|null>} Mapping record if exists, null otherwise
     */
    static async checkCombination(speciesId, derivativeId, sizeId) {
      return this.findOne({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          size_id: sizeId,
          is_applicable: true,
          is_active: true,
        },
      });
    }

    /**
     * Get all mappings for a derivative
     * @param {string} derivativeId - Derivative master ID
     * @returns {Promise<Array>} All applicable species-size combinations for this derivative
     */
    static async getSpeciesSizesByDerivative(derivativeId) {
      return this.findAll({
        where: {
          derivative_id: derivativeId,
          is_applicable: true,
          is_active: true,
        },
        include: [
          { model: sequelize.models.SpeciesMaster, as: "species" },
          { model: sequelize.models.SizeMaster, as: "size" },
        ],
        order: [
          ["species_id", "ASC"],
          ["priority_order", "ASC"],
        ],
      });
    }

    /**
     * Get prioritized recommendations for a species-derivative pair
     * @param {string} speciesId - Species master ID
     * @param {string} derivativeId - Derivative master ID
     * @param {number} limit - Maximum number of recommendations
     * @returns {Promise<Array>} Top priority size recommendations
     */
    static async getRecommendations(speciesId, derivativeId, limit = 5) {
      return this.findAll({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          is_applicable: true,
          is_active: true,
        },
        include: [{ model: sequelize.models.SizeMaster, as: "size" }],
        order: [["priority_order", "ASC"]],
        limit,
      });
    }
  }

  SpeciesDerivativeSizeMapping.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      size_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      priority_order: {
        type: DataTypes.INTEGER,
        defaultValue: 99,
      },
      is_applicable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "SpeciesDerivativeSizeMapping",
      tableName: "species_derivative_size_mapping",
      paranoid: true,
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
  );

  return SpeciesDerivativeSizeMapping;
};
