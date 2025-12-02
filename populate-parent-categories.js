const db = require("./models");

// Comprehensive mapping of species to parent categories
const speciesCategoryMap = {
  // Cephalopods (Squid, Octopus, Cuttlefish)
  "Big Blue Octopus": "Cephalopod",
  "Old Woman Octopus": "Cephalopod",
  "Starry Night Octopus": "Cephalopod",
  "Little Squid": "Cephalopod",
  "Needle Cuttlefish": "Cephalopod",
  "Oval-Bone Cuttlefish": "Cephalopod",
  "Loliolus (Small Squid)": "Cephalopod",
  "Little Indian Squid": "Cephalopod",
  "Kobi Squid": "Cephalopod",
  "Pharaoh Cuttlefish": "Cephalopod",
  "Hooded Cuttlefish": "Cephalopod",
  "Trident Cuttlefish": "Cephalopod",
  "Short Club Cuttlefish": "Cephalopod",
  "Arabian Cuttlefish": "Cephalopod",
  "Kobi Cuttlefish": "Cephalopod",
  "Small Striped Cuttlefish": "Cephalopod",
  "Large Striped Cuttlefish": "Cephalopod",
  "Oman Cuttlefish": "Cephalopod",
  "Spineless Cuttlefish": "Cephalopod",
  "Indian Squid": "Cephalopod",
  "Bigfin Squid": "Cephalopod",
  "Purpleback Flying Squid": "Cephalopod",
  "Long Barrel Squid": "Cephalopod",
  "Swordtip Squid": "Cephalopod",
  "Mitre Squid": "Cephalopod",
  "Bengal Squid": "Cephalopod",
  "Siboga Squid": "Cephalopod",
  "Diamondback Squid": "Cephalopod",
  "Common Octopus": "Cephalopod",
  "Indian Octopus": "Cephalopod",
  "Coconut Octopus": "Cephalopod",
  "Pacific Squid": "Cephalopod",
  "Argentine Squid": "Cephalopod",
  "European Squid": "Cephalopod",

  // Crustaceans (Crab, Lobster, Shrimp)
  "Three-Spot Swimming Crab": "Crustacean",
  "Indian Rock Lobster": "Crustacean",
  "Blue Crab": "Crustacean",
  "Mud Crab": "Crustacean",
  "Green Mud Crab": "Crustacean",
  "Red Mud Crab": "Crustacean",
  "King Crab": "Crustacean",
  "Snow Crab": "Crustacean",
  "Dungeness Crab": "Crustacean",
  "Jonah Crab": "Crustacean",
  "Brown Crab": "Crustacean",
  "Blue Swimming Crab": "Crustacean",
  "Golden King Crab": "Crustacean",
  "Blue King Crab": "Crustacean",
  "Soft-Shell Crab": "Crustacean",
  "Stone Crab": "Crustacean",
  "Red Swimming Crab": "Crustacean",
  "Flower Crab": "Crustacean",
  "Tiger Shrimp": "Crustacean",
  "White Shrimp": "Crustacean",
  "Indian White Prawn": "Crustacean",
  "American Lobster": "Crustacean",
  "European Lobster": "Crustacean",
  "Spiny Lobster": "Crustacean",
  "Japanese Lobster": "Crustacean",
  "Red King Crab": "Crustacean",

  // Fish (Tuna, Salmon, Cod, etc.)
  "Mahi-mahi": "Fish",
  Kingfish: "Fish",
  Pompano: "Fish",
  Snapper: "Fish",
  "Atlantic Salmon": "Fish",
  "Pacific Salmon": "Fish",
  "Sockeye Salmon": "Fish",
  "Atlantic Cod": "Fish",
  "Pacific Cod": "Fish",
  "Black Cod": "Fish",
  "Yellowfin Tuna": "Fish",
  "Skipjack Tuna": "Fish",
  "Bigeye Tuna": "Fish",
  Mackerel: "Fish",
  "Albacore Tuna": "Fish",
  "Bluefin Tuna": "Fish",
  "Blackfin Tuna": "Fish",
  Halibut: "Fish",
  Turbot: "Fish",
  "Sea Bass": "Fish",
  "Sea Bream": "Fish",
  Haddock: "Fish",
  Grouper: "Fish",

  // Bivalves (Scallop, Oyster, Clam, Mussel)
  "Giant Scallop": "Bivalve",
  "Bay Scallop": "Bivalve",
  "Japanese Scallop": "Bivalve",
  "Queen Scallop": "Bivalve",
  "Pacific Oyster": "Bivalve",
  "Eastern Oyster": "Bivalve",
  "Flat Oyster": "Bivalve",
  "Hard Clam": "Bivalve",
  "Manila Clam": "Bivalve",
  "Littleneck Clam": "Bivalve",
  "Blue Mussel": "Bivalve",
  "Green Mussel": "Bivalve",
  "Mediterranean Mussel": "Bivalve",
  "New Zealand Mussel": "Bivalve",

  // Gastropods (Snail, Shell)
  "Red Abalone": "Gastropod",
  "Variable Abalone": "Gastropod",
  "Diversicolor Abalone": "Gastropod",
  "Radiate Top Shell": "Gastropod",
  "Commercial Top Shell": "Gastropod",
  "Great Green Turban": "Gastropod",
  "Silver-Mouth Turban": "Gastropod",
  "Mud Creeper": "Gastropod",
  "Spiral Babylon": "Gastropod",
  "Indian Babylon": "Gastropod",
  "Bengal Fig Shell": "Gastropod",
  "Mud-Flat Snail": "Gastropod",
};

(async () => {
  try {
    const species = await db.SpeciesMaster.findAll({
      where: { is_active: true },
      order: [["species_name", "asc"]],
    });

    console.log(`\n✓ Found ${species.length} active species\n`);

    let updated = 0;
    let notMapped = [];

    for (const sp of species) {
      const category = speciesCategoryMap[sp.species_name];

      if (category) {
        await sp.update({ parent_category_type: category });
        console.log(`  ✓ ${sp.species_name.padEnd(30)} -> ${category}`);
        updated++;
      } else {
        notMapped.push(sp.species_name);
      }
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log(`✓ Updated: ${updated} species`);
    console.log(`✗ Not mapped: ${notMapped.length} species`);

    if (notMapped.length > 0) {
      console.log(`\nSpecies not mapped:`);
      notMapped.forEach((name) => console.log(`  - ${name}`));
      console.log(`\nPlease add these to the mapping above.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
