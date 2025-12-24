"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create price_recommendation table
    await queryInterface.createTable("price_recommendation", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      sku_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "SKU identifier for the recommendation",
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
        comment: "Reference to product master",
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        comment: "Reference to species master",
      },
      current_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Current selling price per kg",
      },
      recommended_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Recommended new price per kg",
      },
      price_change_pct: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: "Percentage change from current price",
      },
      recommendation_type: {
        type: Sequelize.ENUM(
          "PRICE_INCREASE",
          "DISCOUNT_WARNING",
          "STOP_SELL",
          "YIELD_ALERT"
        ),
        allowNull: false,
        comment: "Type of recommendation",
      },
      reason_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "Specific reason code for the recommendation",
      },
      reason_details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Detailed breakdown of factors contributing to recommendation",
      },
      confidence_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        comment: "AI confidence score (0.0 to 1.0)",
      },
      expected_margin_impact: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "Expected monthly margin impact in rupees",
      },
      expected_volume_impact: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        comment: "Expected volume change percentage",
      },
      risk_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        comment: "Risk score for implementing recommendation (0.0 to 1.0)",
      },
      market: {
        type: Sequelize.ENUM("DOMESTIC", "EXPORT"),
        allowNull: false,
        comment: "Market segment affected",
      },
      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "APPROVED",
          "REJECTED",
          "IMPLEMENTED",
          "EXPIRED"
        ),
        allowNull: false,
        defaultValue: "PENDING",
        comment: "Current status of recommendation",
      },
      priority: {
        type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
        defaultValue: "MEDIUM",
        comment: "Business priority level",
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "User who approved the recommendation",
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Timestamp of approval",
      },
      implemented_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Timestamp when price was updated",
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Recommendation expiry date",
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "User who created the recommendation",
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "User who last updated the recommendation",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex("price_recommendation", ["sku_code"]);
    await queryInterface.addIndex("price_recommendation", ["product_id"]);
    await queryInterface.addIndex("price_recommendation", ["species_id"]);
    await queryInterface.addIndex("price_recommendation", ["status"]);
    await queryInterface.addIndex("price_recommendation", [
      "recommendation_type",
    ]);
    await queryInterface.addIndex("price_recommendation", ["priority"]);
    await queryInterface.addIndex("price_recommendation", ["market"]);
    await queryInterface.addIndex("price_recommendation", ["expires_at"]);

    // Create recommendation_feedback table
    await queryInterface.createTable("recommendation_feedback", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      recommendation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "price_recommendation",
          key: "id",
        },
        onDelete: "CASCADE",
        comment: "Reference to the recommendation",
      },
      decision: {
        type: Sequelize.ENUM("ACCEPTED", "REJECTED", "MODIFIED"),
        allowNull: false,
        comment: "Decision on the recommendation",
      },
      actual_price_change: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment:
          "Actual price change implemented (if different from recommended)",
      },
      volume_impact_actual: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
        comment: "Actual volume impact observed",
      },
      margin_impact_actual: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: "Actual margin impact observed",
      },
      feedback_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Reason for decision or observations",
      },
      market_feedback: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment:
          "Market response data (competitor actions, demand changes, etc.)",
      },
      lessons_learned: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Lessons learned for future recommendations",
      },
      feedback_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "User providing feedback",
      },
      feedback_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: "Timestamp of feedback",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes for feedback table
    await queryInterface.addIndex("recommendation_feedback", [
      "recommendation_id",
    ]);
    await queryInterface.addIndex("recommendation_feedback", ["decision"]);
    await queryInterface.addIndex("recommendation_feedback", ["feedback_by"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("recommendation_feedback");
    await queryInterface.dropTable("price_recommendation");
  },
};
