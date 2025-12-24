"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PackingRuleConfig extends Model {}

  PackingRuleConfig.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      rule_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      rule_config: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.fn("now"),
      },
      updated_by: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: "PackingRuleConfig",
      tableName: "packing_rule_config",
      underscored: true,
      timestamps: false,
    }
  );

  return PackingRuleConfig;
};
