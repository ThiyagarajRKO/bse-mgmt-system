"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "role_master",
      [
        {
          id: "c4be6a50-1bda-4237-bbf5-b607c37cd9b0",
          role_name: "Admin",
          is_active: true,
        },
        {
          id: "e7daa45c-627d-455a-ac57-ec32aa57d009",
          role_name: "User",
          is_active: true,
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("role_master", null, {});
  },
};
