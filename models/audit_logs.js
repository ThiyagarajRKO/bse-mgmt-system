"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class AuditLogs extends Model {
    static associate(models) {
      AuditLogs.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      AuditLogs.belongsTo(models.ModuleMaster, {
        foreignKey: "module_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  AuditLogs.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      source_ip_address: {
        type: DataTypes.STRING,
      },
      user_agent: {
        type: DataTypes.TEXT,
      },
      platform: {
        type: DataTypes.STRING,
      },
      action_name: {
        type: DataTypes.STRING,
      },
      request_params: {
        type: DataTypes.JSONB,
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
      modelName: "AuditLogs",
      tableName: "audit_logs",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      // paranoid: true,
      // deletedAt: "deleted_at",
    }
  );

  // Create Hook
  AuditLogs.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a audit logs details",
        err?.message || err
      );
    }
  });

  return AuditLogs;
};
