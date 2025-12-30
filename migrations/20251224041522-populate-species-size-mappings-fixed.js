"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Clear existing data first
    await queryInterface.bulkDelete("species_size_mapping", null, {});

    // Comprehensive species-size mappings including unprocessed/raw product sizes
    const speciesSizeMappings = [
      // Fish - typically by weight or count, including unprocessed (whole fish by size/length)
      {
        id: "0492e566-5ee6-4dca-be9f-a9d4a634c16c",
        parent_category_type: "Fish",
        size_id: "75261af7-8da9-4eb4-9441-2342c9ee45bd", // S (200–400 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "8a79989c-da59-486f-be11-f9eed460a5be",
        parent_category_type: "Fish",
        size_id: "7c8f88c9-6dc3-4798-9c60-bcefe83b42f6", // M (400–700 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "4483c1f4-adfe-4396-b949-867579951ba9",
        parent_category_type: "Fish",
        size_id: "ce728802-9308-4838-851f-8d7721af8ac2", // L (700–1000 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "e088d2f9-43e6-47ec-a7af-55eea84ff108",
        parent_category_type: "Fish",
        size_id: "a4d7040c-4e20-4261-9e59-f80368c55a01", // XL (1–2 kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "25c1b3f5-a43e-4668-b858-3973b55debf7",
        parent_category_type: "Fish",
        size_id: "421a0c61-bd21-4910-b06b-b9f4378566d7", // 4L (1.0–1.2 kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "dd92d76a-a250-4783-b5d5-ebaf9f9d7b67",
        parent_category_type: "Fish",
        size_id: "5149e5e8-e24e-4684-bbb4-7b79b05bf69e", // 5L (1.2–1.4 kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "3635c20a-c848-4bb1-85a0-6c6bea685e03",
        parent_category_type: "Fish",
        size_id: "927002aa-a322-4a0e-ada7-2ab65f020133", // 6L (>1.4 kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Fish by length (unprocessed/whole)
      {
        id: "b99a1224-3073-410b-972d-1ba8fc1e1c3e",
        parent_category_type: "Fish",
        size_id: "50d4f0c8-3915-4c5c-909e-da2776ac2a09", // Medium (5–7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "f29178bc-c57a-4415-8f88-f3c143fde5c8",
        parent_category_type: "Fish",
        size_id: "dc1aef37-3bc0-43cb-8f3c-195871b10d04", // Large (>7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "8e50ec8b-d1dd-40a2-a3c9-e848b3f3b77f",
        parent_category_type: "Fish",
        size_id: "000209db-0423-4f80-9868-3482584ff206", // Large (70–100 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Bivalve - by shell size (unprocessed/live)
      {
        id: "a0ce2b94-2d73-464d-9876-a184f318d4f3",
        parent_category_type: "Bivalve",
        size_id: "f8f1d600-dc8d-4063-b714-84243210cbdd", // Small (3–5 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "1a7d597a-cfa5-446a-a150-1048dce31998",
        parent_category_type: "Bivalve",
        size_id: "50d4f0c8-3915-4c5c-909e-da2776ac2a09", // Medium (5–7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "0a02ed0e-80f3-4a08-8f09-8d73fbbad3d5",
        parent_category_type: "Bivalve",
        size_id: "dc1aef37-3bc0-43cb-8f3c-195871b10d04", // Large (>7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "05d48294-bc4e-45c8-98bf-0bc900c230b4",
        parent_category_type: "Bivalve",
        size_id: "4839aed6-6df5-454e-9902-e018d6615a74", // Baby (<5 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Crustacean - by count or size (live/unprocessed)
      {
        id: "ddac36ca-1283-4224-aecb-a1cba8a72358",
        parent_category_type: "Crustacean",
        size_id: "9c2984e7-76be-4871-a73e-ae3d0cf55caa", // 1H (5–7 pcs/kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "edbfcaad-bcd9-4489-a092-6b36c527ceb8",
        parent_category_type: "Crustacean",
        size_id: "23d60e28-1340-46a8-bdf7-5e1154eac878", // Prime (4–5 pcs/kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "6179be18-c3f5-4ea6-9a61-cb2aad21e900",
        parent_category_type: "Crustacean",
        size_id: "802f7d45-3a92-4152-b135-ff9115309d39", // Hotel (5–6 pcs/kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "e000a4fe-2014-45e6-8525-af652e8aa1b8",
        parent_category_type: "Crustacean",
        size_id: "489865d6-a4d8-4c61-b8bb-550854e3313d", // Jumbo (3–4 pcs/kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "480fd8fe-4452-497c-9b65-98b6b8380c80",
        parent_category_type: "Crustacean",
        size_id: "8a743de6-309b-407f-bd95-5e3c77dc1697", // Whale (2–3 pcs/kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Crustacean by size
      {
        id: "14eb1b06-066e-4843-b199-9dc93d06b8fa",
        parent_category_type: "Crustacean",
        size_id: "f8f1d600-dc8d-4063-b714-84243210cbdd", // Small (3–5 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "cbe9a54e-dc90-499b-aa10-cb6294184adb",
        parent_category_type: "Crustacean",
        size_id: "50d4f0c8-3915-4c5c-909e-da2776ac2a09", // Medium (5–7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "5085b1c8-9e7f-44db-9ada-b22c664580f1",
        parent_category_type: "Crustacean",
        size_id: "dc1aef37-3bc0-43cb-8f3c-195871b10d04", // Large (>7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Cephalopod - by weight or size (whole/unprocessed)
      {
        id: "879dcd36-6065-42bc-baaf-50d14c34b06e",
        parent_category_type: "Cephalopod",
        size_id: "75261af7-8da9-4eb4-9441-2342c9ee45bd", // S (200–400 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "98960e3a-f95a-4b44-b233-6d2f02375486",
        parent_category_type: "Cephalopod",
        size_id: "7c8f88c9-6dc3-4798-9c60-bcefe83b42f6", // M (400–700 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "85da0170-2332-4e64-85a2-2b29f39433e4",
        parent_category_type: "Cephalopod",
        size_id: "ce728802-9308-4838-851f-8d7721af8ac2", // L (700–1000 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "72f2b347-757a-4c8b-8cbe-54484a13b03f",
        parent_category_type: "Cephalopod",
        size_id: "a4d7040c-4e20-4261-9e59-f80368c55a01", // XL (1–2 kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Cephalopod by size
      {
        id: "3fd9fed5-a8e5-4043-98ef-70dfb94d6777",
        parent_category_type: "Cephalopod",
        size_id: "f8f1d600-dc8d-4063-b714-84243210cbdd", // Small (3–5 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "24878fb4-739a-485d-80fb-996056563cfe",
        parent_category_type: "Cephalopod",
        size_id: "50d4f0c8-3915-4c5c-909e-da2776ac2a09", // Medium (5–7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "e5c739e7-faba-49eb-93d1-3663d2d4467a",
        parent_category_type: "Cephalopod",
        size_id: "dc1aef37-3bc0-43cb-8f3c-195871b10d04", // Large (>7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Gastropod - by shell size (live/unprocessed)
      {
        id: "f5f385eb-b601-4de8-952c-98adf1edf8ab",
        parent_category_type: "Gastropod",
        size_id: "4839aed6-6df5-454e-9902-e018d6615a74", // Baby (<5 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "4021c703-4f83-484a-aff0-673f96b16a30",
        parent_category_type: "Gastropod",
        size_id: "f8f1d600-dc8d-4063-b714-84243210cbdd", // Small (3–5 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "c3375b67-c11c-46bf-b767-1bd3af18cc29",
        parent_category_type: "Gastropod",
        size_id: "50d4f0c8-3915-4c5c-909e-da2776ac2a09", // Medium (5–7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "b2166c4a-cfea-4608-b3e8-4c9ddf6d022c",
        parent_category_type: "Gastropod",
        size_id: "dc1aef37-3bc0-43cb-8f3c-195871b10d04", // Large (>7 cm)
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Other - flexible sizing
      {
        id: "d2149e4d-5a80-403f-8e2d-4d58aad84134",
        parent_category_type: "Other",
        size_id: "75261af7-8da9-4eb4-9441-2342c9ee45bd", // S (200–400 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "00abc33b-6640-4076-ac94-721b3f4443aa",
        parent_category_type: "Other",
        size_id: "7c8f88c9-6dc3-4798-9c60-bcefe83b42f6", // M (400–700 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "ba207827-506e-4070-b50a-cbc1b3a19c01",
        parent_category_type: "Other",
        size_id: "ce728802-9308-4838-851f-8d7721af8ac2", // L (700–1000 g)
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "5e2377e7-d60d-48ac-a5fe-1538a50bc6c8",
        parent_category_type: "Other",
        size_id: "a4d7040c-4e20-4261-9e59-f80368c55a01", // XL (1–2 kg)
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Insert the mappings
    await queryInterface.bulkInsert(
      "species_size_mapping",
      speciesSizeMappings
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove all inserted mappings
    await queryInterface.bulkDelete("species_size_mapping", null, {});
  },
};
