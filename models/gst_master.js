"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GstMaster extends Model {
    static associate(models) {
      GstMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      GstMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      GstMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  GstMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      hsn_code: {
        type: DataTypes.STRING,
      },
      hsn_description: {
        type: DataTypes.STRING,
      },
      cgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
      },
      sgst_rate: {
        type: DataTypes.DECIMAL(5, 2),
      },
      igst_rate: {
        type: DataTypes.DECIMAL(5, 2),
      },
      cess_rate: {
        type: DataTypes.DECIMAL(5, 2),
      },
      effective_from: {
        type: DataTypes.DATE,
      },
      effective_to: {
        type: DataTypes.DATE,
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
      modelName: "GstMaster",
      tableName: "gst_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Hooks
  GstMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
      data.effective_from = data.effective_from || new Date();
    } catch (err) {
      throw err;
    }
  });

  GstMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  GstMaster.beforeDestroy(async (data, options) => {
    try {
      data.deleted_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  return GstMaster;
};
