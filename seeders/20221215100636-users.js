"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      { tableName: "users", schema: "auth" },
      [
        {
          id: "0a6495f7-7c0f-442c-aad0-a13d8c2d4ce5",
          email: "hello@brittoseafoods.com",
          phone: "6379248545",
          country_code: "+91",
          password:
            "$2a$10$CmZqc5z.BxkX7svyP51wZubqLMoRCPPhiC5LRuEozGfJwPPGtY/Ym",
          is_active: true,
          user_status: "1",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
