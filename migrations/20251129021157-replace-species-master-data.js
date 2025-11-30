"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, delete product_category_master records that reference species_master
    await queryInterface.bulkDelete("product_category_master", null, {});

    // Delete all existing species_master records
    await queryInterface.bulkDelete("species_master", null, {});

    // Get division IDs for Frozen, Cooked, and Crab
    const divisions = await queryInterface.sequelize.query(
      "SELECT id, division_name FROM division_master WHERE division_name IN ('Frozen', 'Cooked', 'Crab')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (divisions.length === 0) {
      throw new Error(
        "Required divisions (Frozen, Cooked, Crab) not found. Please ensure the division_master seeder has been run."
      );
    }

    // Create a map of division names to IDs
    const divisionMap = {};
    divisions.forEach((div) => {
      divisionMap[div.division_name] = div.id;
    });

    // New species data
    const speciesData = [
      {
        species_code: "5005",
        division: "Frozen",
        species_name: "Loliolus (Small Squid)",
        scientific_name: "Loliolus spp.",
        hsn_code: "0307",
        description:
          "Small tender squid used for frozen rings and quick stir-fries; mild flavour and soft bite.",
      },
      {
        species_code: "5006",
        division: "Frozen",
        species_name: "Little Indian Squid",
        scientific_name: "Loliolus hardwickei",
        hsn_code: "0307",
        description:
          "Popular export squid with soft texture; ideal for calamari, frying and frozen ready meals.",
      },
      {
        species_code: "5007",
        division: "Frozen",
        species_name: "Kobi Squid",
        scientific_name: "Loliolus sumatrensis",
        hsn_code: "0307",
        description:
          "Smooth-textured squid used for frozen tubes, seafood mixes, and quick frying.",
      },
      {
        species_code: "5008",
        division: "Frozen",
        species_name: "Little Squid",
        scientific_name: "Loliolus uyii",
        hsn_code: "0307",
        description:
          "Delicate squid used for grilling, sautéing and mixed seafood packs.",
      },
      {
        species_code: "5011",
        division: "Frozen",
        species_name: "Needle Cuttlefish",
        scientific_name: "Sepia aculeata",
        hsn_code: "0307",
        description:
          "Firm, sweet cuttlefish ideal for frozen steaks, grilling, and Mediterranean dishes.",
      },
      {
        species_code: "5012",
        division: "Frozen",
        species_name: "Oval-Bone Cuttlefish",
        scientific_name: "Sepia elliptica",
        hsn_code: "0307",
        description:
          "Thick-fleshed cuttlefish great for grilling, curries, and pre-cut frozen rings.",
      },
      {
        species_code: "5013",
        division: "Frozen",
        species_name: "Pharaoh Cuttlefish",
        scientific_name: "Sepia pharaonis",
        hsn_code: "0307",
        description:
          "Premium cuttlefish with a firm bite; widely used in sushi prep and frozen steaks.",
      },
      {
        species_code: "5014",
        division: "Frozen",
        species_name: "Hooded Cuttlefish",
        scientific_name: "Sepia prashadi",
        hsn_code: "0307",
        description:
          "Mild flavour; ideal for marinated frozen products and Asian stir-fry dishes.",
      },
      {
        species_code: "5015",
        division: "Frozen",
        species_name: "Trident Cuttlefish",
        scientific_name: "Sepia trygonina",
        hsn_code: "0307",
        description:
          "Stays firm when cooked; good for grilling, frying and frozen mixes.",
      },
      {
        species_code: "5016",
        division: "Frozen",
        species_name: "Short Club Cuttlefish",
        scientific_name: "Sepia brevimana",
        hsn_code: "0307",
        description:
          "Soft-textured; used in frozen stir-fry strips and Mediterranean cuisine.",
      },
      {
        species_code: "5017",
        division: "Frozen",
        species_name: "Arabian Cuttlefish",
        scientific_name: "Sepia arabica",
        hsn_code: "0307",
        description:
          "Tender white flesh; great for grilling cuts and light seasoning.",
      },
      {
        species_code: "5018",
        division: "Frozen",
        species_name: "Kobi Cuttlefish",
        scientific_name: "Sepia kobiensis",
        hsn_code: "0307",
        description:
          "Good for frozen trays; holds texture in curries and frying.",
      },
      {
        species_code: "5019",
        division: "Frozen",
        species_name: "Small Striped Cuttlefish",
        scientific_name: "Sepia prabahari",
        hsn_code: "0307",
        description:
          "Even cooking and mild flavour; used in frozen seafood combos.",
      },
      {
        species_code: "501A",
        division: "Frozen",
        species_name: "Large Striped Cuttlefish",
        scientific_name: "Sepia ramani",
        hsn_code: "0307",
        description:
          "Large cuttlefish used for steaks and grilled frozen products.",
      },
      {
        species_code: "501B",
        division: "Frozen",
        species_name: "Oman Cuttlefish",
        scientific_name: "Sepia omani",
        hsn_code: "0307",
        description:
          "Sweet, clean flavour; ideal for frozen sashimi-grade cuts.",
      },
      {
        species_code: "5021",
        division: "Frozen",
        species_name: "Spineless Cuttlefish",
        scientific_name: "Sepiella inermis",
        hsn_code: "0307",
        description:
          "Soft, easy-to-cook cuttlefish perfect for sautéed frozen dishes.",
      },
      {
        species_code: "5026",
        division: "Frozen",
        species_name: "Indian Squid",
        scientific_name: "Uroteuthis duvaucelii",
        hsn_code: "0307",
        description:
          "India's most exported squid; excellent for calamari rings, grilling and frying.",
      },
      {
        species_code: "5031",
        division: "Frozen",
        species_name: "Bigfin Squid",
        scientific_name: "Sepioteuthis lessoniana",
        hsn_code: "0307",
        description:
          "Premium squid used in sushi, grilling, and frozen gourmet cuts.",
      },
      {
        species_code: "5036",
        division: "Frozen",
        species_name: "Purpleback Flying Squid",
        scientific_name: "Sthenoteuthis oualaniensis",
        hsn_code: "0307",
        description:
          "Firm, rich squid used for frozen rings, tentacles and whole cleaned squid.",
      },
      {
        species_code: "5041",
        division: "Frozen",
        species_name: "Long Barrel Squid",
        scientific_name: "Uroteuthis singhalensis",
        hsn_code: "0307",
        description:
          "Long tubular squid ideal for stuffing, slicing and marinated frozen products.",
      },
      {
        species_code: "5042",
        division: "Frozen",
        species_name: "Swordtip Squid",
        scientific_name: "Uroteuthis edulis",
        hsn_code: "0307",
        description:
          "Japanese-grade premium squid with sweet flavour; used for sashimi and grills.",
      },
      {
        species_code: "5043",
        division: "Frozen",
        species_name: "Mitre Squid",
        scientific_name: "Uroteuthis chinensis",
        hsn_code: "0307",
        description:
          "Used for frozen tubes, tentacles and mixed seafood packs.",
      },
      {
        species_code: "5044",
        division: "Frozen",
        species_name: "Bengal Squid",
        scientific_name: "Uroteuthis bengalensis",
        hsn_code: "0307",
        description:
          "Lean squid ideal for frying, mixed seafood and marinated cuts.",
      },
      {
        species_code: "504A",
        division: "Frozen",
        species_name: "Siboga Squid",
        scientific_name: "Uroteuthis sibogae",
        hsn_code: "0307",
        description:
          "Used across Southeast Asian cuisine for grilling and frozen prep.",
      },
      {
        species_code: "504B",
        division: "Frozen",
        species_name: "Diamondback Squid",
        scientific_name: "Thysanoteuthis rhombus",
        hsn_code: "0307",
        description:
          "Large meaty squid excellent for steaks and premium frozen dishes.",
      },
      {
        species_code: "5055",
        division: "Frozen",
        species_name: "Common Octopus",
        scientific_name: "Octopus vulgaris",
        hsn_code: "0307",
        description:
          "Popular worldwide; tender when frozen; used for sushi, grilling and salads.",
      },
      {
        species_code: "5054",
        division: "Frozen",
        species_name: "Big Blue Octopus",
        scientific_name: "Octopus cyanea",
        hsn_code: "0307",
        description:
          "Firm, flavourful octopus great for frozen tentacles and Mediterranean cooking.",
      },
      {
        species_code: "5066",
        division: "Frozen",
        species_name: "Old Woman Octopus",
        scientific_name: "Cistopus indicus",
        hsn_code: "0307",
        description:
          "Small tender octopus ideal for marinated frozen products.",
      },
      {
        species_code: "5071",
        division: "Frozen",
        species_name: "Starry Night Octopus",
        scientific_name: "Callistoctopus luteus",
        hsn_code: "0307",
        description:
          "Sweet flavour and soft flesh; excellent for grilling and sliced frozen products.",
      },

      {
        species_code: "4506",
        division: "Cooked",
        species_name: "Variable Abalone",
        scientific_name: "Haliotis varia",
        hsn_code: "1605",
        description:
          "Tender abalone used for braised dishes, canned abalone and gourmet preparations.",
      },
      {
        species_code: "4507",
        division: "Cooked",
        species_name: "Red Abalone",
        scientific_name: "Haliotis rufescens",
        hsn_code: "1605",
        description:
          "Premium abalone with buttery flavour; used in soups and luxury banquets.",
      },
      {
        species_code: "4509",
        division: "Cooked",
        species_name: "Diversicolor Abalone",
        scientific_name: "Haliotis diversicolor",
        hsn_code: "1605",
        description:
          "Popular in Asian banquets; cooked as whole abalone or braised.",
      },
      {
        species_code: "4521",
        division: "Cooked",
        species_name: "Radiate Top Shell",
        scientific_name: "Trochus radiatus",
        hsn_code: "1605",
        description: "Sweet, chewy gastropod used in stir-fries and soups.",
      },
      {
        species_code: "452B",
        division: "Cooked",
        species_name: "Commercial Top Shell",
        scientific_name: "Trochus niloticus",
        hsn_code: "1605",
        description: "Used in canned shellfish mixes and simmered dishes.",
      },
      {
        species_code: "4531",
        division: "Cooked",
        species_name: "Great Green Turban",
        scientific_name: "Turbo marmoratus",
        hsn_code: "1605",
        description:
          "Large meaty snail for grilling, boiling or garlic-butter dishes.",
      },
      {
        species_code: "4534",
        division: "Cooked",
        species_name: "Silver-Mouth Turban",
        scientific_name: "Turbo argyrostomus",
        hsn_code: "1605",
        description: "Mild-tasting shellfish ideal for steaming and sautéing.",
      },
      {
        species_code: "4551",
        division: "Cooked",
        species_name: "Mud-Flat Snail",
        scientific_name: "Telescopium telescopium",
        hsn_code: "1605",
        description:
          "Popular in Southeast Asia; cooked in coconut curry and spicy sauces.",
      },
      {
        species_code: "4558",
        division: "Cooked",
        species_name: "Mud Creeper",
        scientific_name: "Cerithidea palustris",
        hsn_code: "1605",
        description:
          "Common in Thai & Filipino cuisine; boiled or cooked in sour broths.",
      },
      {
        species_code: "4631",
        division: "Cooked",
        species_name: "Spiral Babylon",
        scientific_name: "Babylonia spirata",
        hsn_code: "1605",
        description:
          "Restaurant favourite; steamed, pepper-fried or garlic-butter sautéed.",
      },
      {
        species_code: "4632",
        division: "Cooked",
        species_name: "Indian Babylon",
        scientific_name: "Babylonia zeylanica",
        hsn_code: "1605",
        description:
          "Sweet meat ideal for cooked seafood platters and ready-to-eat packs.",
      },
      {
        species_code: "4686",
        division: "Cooked",
        species_name: "Bengal Fig Shell",
        scientific_name: "Ficus investigatoris",
        hsn_code: "1605",
        description: "Local delicacy; usually boiled or sautéed with spices.",
      },

      {
        species_code: "C001",
        division: "Crab",
        species_name: "Blue Crab",
        scientific_name: "Callinectes sapidus",
        hsn_code: "0306",
        description:
          "Sweet, flaky crab used for crab cakes, steaming and frozen claw meat.",
      },
      {
        species_code: "C002",
        division: "Crab",
        species_name: "Mud Crab",
        scientific_name: "Scylla serrata",
        hsn_code: "0306",
        description:
          "Premium Asian crab used for chilli crab, garlic butter crab and frozen half cuts.",
      },
      {
        species_code: "C003",
        division: "Crab",
        species_name: "Green Mud Crab",
        scientific_name: "Scylla paramamosain",
        hsn_code: "0306",
        description:
          "High-value meaty crab; perfect for steaming, curries and frozen premium packs.",
      },
      {
        species_code: "C004",
        division: "Crab",
        species_name: "Red Mud Crab",
        scientific_name: "Scylla olivacea",
        hsn_code: "0306",
        description:
          "Sweet crab used in curries, steaming and frozen cleaned pieces.",
      },
      {
        species_code: "C005",
        division: "Crab",
        species_name: "King Crab",
        scientific_name: "Paralithodes camtschaticus",
        hsn_code: "0306",
        description:
          "Large premium crab legs used in fine dining and frozen luxury packs.",
      },
      {
        species_code: "C006",
        division: "Crab",
        species_name: "Snow Crab",
        scientific_name: "Chionoecetes opilio",
        hsn_code: "0306",
        description:
          "Delicate sweet meat used in frozen clusters and crab meat cups.",
      },
      {
        species_code: "C007",
        division: "Crab",
        species_name: "Dungeness Crab",
        scientific_name: "Metacarcinus magister",
        hsn_code: "0306",
        description:
          "Rich, buttery crab used for steaming and frozen cracked sections.",
      },
      {
        species_code: "C008",
        division: "Crab",
        species_name: "Jonah Crab",
        scientific_name: "Cancer borealis",
        hsn_code: "0306",
        description: "Popular for frozen claws and cocktail crab products.",
      },
      {
        species_code: "C009",
        division: "Crab",
        species_name: "Brown Crab",
        scientific_name: "Cancer pagurus",
        hsn_code: "0306",
        description:
          "European crab used for dressed crab, pâté and frozen cooked meat.",
      },
      {
        species_code: "C010",
        division: "Crab",
        species_name: "Blue Swimming Crab",
        scientific_name: "Portunus pelagicus",
        hsn_code: "0306",
        description:
          "Major species for pasteurised lump crab meat and frozen sections.",
      },
      {
        species_code: "C011",
        division: "Crab",
        species_name: "Three-Spot Swimming Crab",
        scientific_name: "Portunus sanguinolentus",
        hsn_code: "0306",
        description:
          "Light, sweet meat used in frozen halves and Asian recipes.",
      },
      {
        species_code: "C012",
        division: "Crab",
        species_name: "Golden King Crab",
        scientific_name: "Lithodes aequispinus",
        hsn_code: "0306",
        description:
          "Premium cold-water crab used for frozen legs and gourmet dishes.",
      },
      {
        species_code: "C013",
        division: "Crab",
        species_name: "Blue King Crab",
        scientific_name: "Paralithodes platypus",
        hsn_code: "0306",
        description: "High-value crab used in luxury frozen clusters.",
      },
      {
        species_code: "C014",
        division: "Crab",
        species_name: "Soft-Shell Crab",
        scientific_name: "Callinectes sapidus",
        hsn_code: "0306",
        description:
          "Eaten whole; used in tempura, sandwiches and frozen pre-breaded items.",
      },
      {
        species_code: "C015",
        division: "Crab",
        species_name: "Stone Crab",
        scientific_name: "Menippe mercenaria",
        hsn_code: "0306",
        description: "Known for meaty claws; sold frozen cracked or whole.",
      },
      {
        species_code: "C020",
        division: "Crab",
        species_name: "Red Swimming Crab",
        scientific_name: "Charybdis feriatus",
        hsn_code: "0306",
        description: "Sweet, firm meat used in Asian frozen mixes and soups.",
      },
      {
        species_code: "C021",
        division: "Crab",
        species_name: "Flower Crab",
        scientific_name: "Charybdis natator",
        hsn_code: "0306",
        description:
          "Mild-flavoured crab ideal for steaming and frozen cleaned pieces.",
      },
    ];

    // Generate UUIDs and format data for insertion
    const formattedData = speciesData.map((species, index) => ({
      id: Sequelize.literal(`gen_random_uuid()`),
      species_code: species.species_code,
      species_name: species.species_name,
      scientific_name: species.scientific_name,
      hsn_code: species.hsn_code,
      description: species.description,
      division_master_id: divisionMap[species.division],
      is_active: true,
      created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // Insert new data
    await queryInterface.bulkInsert("species_master", formattedData);
  },

  async down(queryInterface, Sequelize) {
    // Remove all species_master records
    await queryInterface.bulkDelete("species_master", null, {});
  },
};
