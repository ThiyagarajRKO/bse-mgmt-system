require("dotenv").config();
const { Sequelize, QueryTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD || process.env.DB_SECRET,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

(async function main() {
  try {
    await sequelize.authenticate();
    console.log("Loading species...");
    const species = await sequelize.query(
      `SELECT id, species_name FROM species_master WHERE is_active=true ORDER BY id`,
      { type: QueryTypes.SELECT }
    );

    console.log("Loading raw products (no 4D mapping)...");
    const raws = await sequelize.query(
      `SELECT id, product_name, product_category_master_id FROM product_master WHERE is_active=true AND species_derivative_size_grade_mapping_id IS NULL`,
      { type: QueryTypes.SELECT }
    );

    console.log(`\nSpecies: ${species.length}, Raw products: ${raws.length}\n`);

    // Build lowercase names to speed checks
    const speciesIndex = species.map((s) => ({
      id: s.id,
      name: s.species_name,
      lc: s.species_name.toLowerCase(),
    }));

    const matchesBySpecies = {};

    for (const p of raws) {
      const pn = (p.product_name || "").toLowerCase();
      // Try to find first species whose name appears in product name
      let matched = null;
      for (const s of speciesIndex) {
        if (s.lc && pn.includes(s.lc)) {
          matched = s;
          break;
        }
      }
      if (matched) {
        matchesBySpecies[matched.id] = matchesBySpecies[matched.id] || {
          species_name: matched.name,
          count: 0,
          examples: [],
        };
        matchesBySpecies[matched.id].count++;
        if (matchesBySpecies[matched.id].examples.length < 5)
          matchesBySpecies[matched.id].examples.push({
            id: p.id,
            product_name: p.product_name,
          });
      } else {
        matchesBySpecies["_UNMATCHED"] = matchesBySpecies["_UNMATCHED"] || {
          species_name: "_UNMATCHED",
          count: 0,
          examples: [],
        };
        matchesBySpecies["_UNMATCHED"].count++;
        if (matchesBySpecies["_UNMATCHED"].examples.length < 5)
          matchesBySpecies["_UNMATCHED"].examples.push({
            id: p.id,
            product_name: p.product_name,
          });
      }
    }

    // Convert to array and sort by count desc
    const result = Object.entries(matchesBySpecies)
      .map(([k, v]) => ({
        species_id: k,
        species_name: v.species_name,
        count: v.count,
        examples: v.examples,
      }))
      .sort((a, b) => b.count - a.count);

    console.log("Preview of matches (species_id, species_name, count):\n");
    console.table(
      result.map((r) => ({
        species_id: r.species_id,
        species_name: r.species_name,
        count: r.count,
      }))
    );

    // Print top 10 with examples
    console.log("\nTop 10 with examples:\n");
    for (const r of result.slice(0, 10)) {
      console.log(
        `Species: ${r.species_name} (id: ${r.species_id}) — ${r.count} matches`
      );
      console.table(r.examples);
    }

    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
