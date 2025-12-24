"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class RecommendationFeedback extends Model {
    static associate(models) {
      // Define associations
      RecommendationFeedback.belongsTo(models.PriceRecommendation, {
        foreignKey: "recommendation_id",
        as: "recommendation",
      });
      RecommendationFeedback.belongsTo(models.Users, {
        foreignKey: "feedback_by",
        as: "feedbackUser",
      });
    }
  }

  RecommendationFeedback.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      recommendation_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      decision: {
        type: DataTypes.ENUM("ACCEPTED", "REJECTED", "MODIFIED"),
        allowNull: false,
      },
      actual_price_change: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      volume_impact_actual: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      margin_impact_actual: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      feedback_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      market_feedback: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      lessons_learned: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      feedback_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      feedback_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "RecommendationFeedback",
      tableName: "recommendation_feedback",
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  return RecommendationFeedback;
};
