"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add status column
      await queryInterface.addColumn(
        "procurement_products",
        "status",
        {
          type: Sequelize.STRING,
          defaultValue: "Pending",
          comment:
            "Status of the purchase request: Pending, Approved, Rejected",
        },
        { transaction },
      );

      // Add approver_name column
      await queryInterface.addColumn(
        "procurement_products",
        "approver_name",
        {
          type: Sequelize.STRING,
          allowNull: true,
          comment: "Name of the person who approved/rejected the request",
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("procurement_products", "status", {
        transaction,
      });
      await queryInterface.removeColumn(
        "procurement_products",
        "approver_name",
        {
          transaction,
        },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
