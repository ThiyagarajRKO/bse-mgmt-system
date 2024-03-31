"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "module_master",
      [
        {
          id: "25193e27-b7c4-4848-bc07-b25b3286d626",
          module_name: "Procurement",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "9e5b76d7-2a92-4871-a703-f626900e2f11",
          module_name: "Precurement Dispatch",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "955ca7ad-c4c0-4f72-bc8f-7371f98184da",
          module_name: "Preprocessing",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "6155cc97-be1b-4e5c-8deb-30998da461bd",
          module_name: "Preprocessing Dispatch",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "b20e2784-2ce7-4668-89f5-f4dcd00beb13",
          module_name: "Packing",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "62cd6e85-fd5a-49f9-ba00-beae0e5ca218",
          module_name: "Sales",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "a377a6f3-613e-4540-b2eb-15d0544cbc88",
          module_name: "Accounting",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "c43e9a34-6bdd-4e54-90d8-83088e9fb152",
          module_name: "Report",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
        {
          id: "41617cce-58dc-4a07-890e-1c24324f25ed",
          module_name: "Master Data",
          is_active: true,
          created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("module_master", null, {});
  },
};
