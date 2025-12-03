"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GradeSizeMapping extends Model {
    static associate(models) {
      GradeSizeMapping.belongsTo(models.GradeMaster, {
        foreignKey: "grade_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      GradeSizeMapping.belongsTo(models.SizeMaster, {
        foreignKey: "size_id",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  GradeSizeMapping.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      grade_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      size_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "GradeSizeMapping",
      tableName: "grade_size_mapping",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      timestamps: false,
    }
  );

  return GradeSizeMapping;
};
