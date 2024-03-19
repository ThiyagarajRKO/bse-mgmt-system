"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "user_profiles",
      [
        {
          id: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
          full_name: "BSE Admin",
          first_name: "BSE",
          last_name: "Admin",
          is_active: true,
          is_admin: false,
          role_id: "c4be6a50-1bda-4237-bbf5-b607c37cd9b0",
          created_by: "0a6495f7-7c0f-442c-aad0-a13d8c2d4ce5",
          updated_by: "0a6495f7-7c0f-442c-aad0-a13d8c2d4ce5",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("user_profiles", null, {});
  },
};
