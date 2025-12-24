"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PriceRecommendation extends Model {
    static associate(models) {
      // Define associations
      PriceRecommendation.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
        as: "product",
      });
      PriceRecommendation.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        as: "species",
      });
      PriceRecommendation.hasMany(models.RecommendationFeedback, {
        foreignKey: "recommendation_id",
        as: "feedback",
      });
      PriceRecommendation.belongsTo(models.Users, {
        foreignKey: "approved_by",
        as: "approver",
      });
      PriceRecommendation.belongsTo(models.Users, {
        foreignKey: "created_by",
        as: "creator",
      });
    }
  }

  PriceRecommendation.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      sku_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      current_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      recommended_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      price_change_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      recommendation_type: {
        type: DataTypes.ENUM(
          "PRICE_INCREASE",
          "DISCOUNT_WARNING",
          "STOP_SELL",
          "YIELD_ALERT"
        ),
        allowNull: false,
      },
      reason_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      reason_details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      confidence_score: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
      },
      expected_margin_impact: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      expected_volume_impact: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false,
      },
      risk_score: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
      },
      market: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "APPROVED",
          "REJECTED",
          "IMPLEMENTED",
          "EXPIRED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM",
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      implemented_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PriceRecommendation",
      tableName: "price_recommendation",
      timestamps: true,
      paranoid: false,
      underscored: true,
    }
  );

  return PriceRecommendation;
};
