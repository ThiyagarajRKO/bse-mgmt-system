"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DerivativeGstMapping extends Model {
    static associate(models) {
      // Belongs to SpeciesMaster
      DerivativeGstMapping.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_master_id",
        as: "species",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Belongs to DerivativeMaster (nullable for raw products)
      DerivativeGstMapping.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_master_id",
        as: "derivative",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Belongs to ConsolidatedGstMaster
      DerivativeGstMapping.belongsTo(models.ConsolidatedGstMaster, {
        foreignKey: "gst_master_id",
        as: "gst_master",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Belongs to UserProfiles (creator)
      DerivativeGstMapping.belongsTo(models.UserProfiles, {
        foreignKey: "created_by",
        as: "creator",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      // Belongs to UserProfiles (updater)
      DerivativeGstMapping.belongsTo(models.UserProfiles, {
        foreignKey: "updated_by",
        as: "updater",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      // Belongs to UserProfiles (deleter)
      DerivativeGstMapping.belongsTo(models.UserProfiles, {
        foreignKey: "deleted_by",
        as: "deleter",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });
    }

    /**
     * Find active GST mapping for a species + derivative combination
     * @param {string} speciesMasterId - Species ID
     * @param {string} derivativeMasterId - Derivative ID (null for raw)
     * @param {string} processingState - 'RAW' or 'PROCESSED'
     * @returns {Promise<DerivativeGstMapping|null>}
     */
    static async findActiveMapping(
      speciesMasterId,
      derivativeMasterId,
      processingState = "PROCESSED",
    ) {
      return this.findOne({
        where: {
          species_master_id: speciesMasterId,
          derivative_master_id: derivativeMasterId,
          processing_state: processingState,
          is_active: true,
        },
        include: [
          {
            model: sequelize.models.ConsolidatedGstMaster,
            as: "gst_master",
            attributes: [
              "id",
              "hsn_code",
              "gst_name",
              "cgst_rate",
              "sgst_rate",
              "igst_rate",
            ],
          },
        ],
      });
    }

    /**
     * Find all mappings for a species
     * @param {string} speciesMasterId - Species ID
     * @returns {Promise<Array>}
     */
    static async findBySpecies(speciesMasterId) {
      return this.findAll({
        where: {
          species_master_id: speciesMasterId,
          is_active: true,
        },
        include: [
          {
            model: sequelize.models.DerivativeMaster,
            as: "derivative",
            attributes: ["id", "derivative_name"],
          },
          {
            model: sequelize.models.ConsolidatedGstMaster,
            as: "gst_master",
            attributes: [
              "id",
              "hsn_code",
              "gst_name",
              "cgst_rate",
              "sgst_rate",
              "igst_rate",
            ],
          },
        ],
        order: [["processing_state", "ASC"]],
      });
    }
  }

  DerivativeGstMapping.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      species_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        comment: "FK to species_master",
      },
      derivative_master_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "derivative_master",
          key: "id",
        },
        comment: "FK to derivative_master. NULL = raw/unprocessed",
      },
      processing_state: {
        type: DataTypes.ENUM("RAW", "PROCESSED"),
        allowNull: false,
        defaultValue: "PROCESSED",
        comment: "RAW or PROCESSED",
      },
      gst_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "consolidated_gst_master",
          key: "id",
        },
        comment: "FK to consolidated_gst_master",
      },
      hsn_code_override: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: "Optional HSN override for this derivative",
      },
      effective_from: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Mapping effective from this date",
      },
      effective_to: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Mapping effective until this date",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Active/inactive flag",
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
      created_by: {
        type: DataTypes.UUID,
      },
      updated_by: {
        type: DataTypes.UUID,
      },
      deleted_by: {
        type: DataTypes.UUID,
      },
    },
    {
      sequelize,
      modelName: "DerivativeGstMapping",
      tableName: "derivative_gst_mapping",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Hooks
  DerivativeGstMapping.beforeCreate(async (data, options) => {
    try {
      data.created_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error in DerivativeGstMapping beforeCreate:",
        err?.message || err,
      );
    }
  });

  DerivativeGstMapping.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error in DerivativeGstMapping beforeUpdate:",
        err?.message || err,
      );
    }
  });

  DerivativeGstMapping.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;
      await data.save({ profile_id: options?.profile_id });
    } catch (err) {
      console.log(
        "Error in DerivativeGstMapping afterDestroy:",
        err?.message || err,
      );
    }
  });

  return DerivativeGstMapping;
};
