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
          id: "786a4a1a-5d6a-4f9c-8d31-692482dec27c",
          role_name: "Manager",
          is_active: true,
        },
        {
          id: "4c7b4363-28be-46fa-8eb6-f1712ffca103",
          role_name: "Purchase Initiator",
          is_active: true,
        },
        {
          id: "e7daa45c-627d-455a-ac57-ec32aa57d009",
          role_name: "Cold Storage Keeper",
          is_active: true,
        },
        {
          id: "193af541-6d81-4c44-b3d2-ca64928eebcb",
          role_name: "General Inventory Manager",
          is_active: true,
        },
        {
          id: "b1ebcd2e-0a34-4e55-9e2e-9401aaa097f2",
          role_name: "Report Generator",
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
