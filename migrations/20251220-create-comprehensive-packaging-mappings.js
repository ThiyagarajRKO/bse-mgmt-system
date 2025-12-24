"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all active products with their grade and size information
    // Limit to recently created products to avoid overwhelming the database
    const products = await queryInterface.sequelize.query(
      `
      SELECT
        pm.id as product_id,
        pm.product_name,
        gm.grade_name,
        sm.size,
        sm.unit_of_measure,
        pcm.product_category,
        spcm.species_name
      FROM product_master pm
      LEFT JOIN grade_master gm ON pm.grade_master_id = gm.id
      LEFT JOIN size_master sm ON pm.size_master_id = sm.id
      LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
      LEFT JOIN species_master spcm ON pcm.species_master_id = spcm.id
      WHERE pm.is_active = true
      AND gm.is_active = true
      AND sm.is_active = true
      AND pm.created_at >= today() - interval '3 months'
      ORDER BY pm.created_at DESC
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get all available packaging
    const packaging = await queryInterface.sequelize.query(
      `
      SELECT id, packaging_code, packaging_type, packaging_weight, packaging_material_composition
      FROM packaging_master
      WHERE is_active = true
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(
      `Found ${products.length} products and ${packaging.length} packaging options`
    );

    if (products.length === 0 || packaging.length === 0) {
      console.log("No products or packaging found, skipping mapping creation");
      return;
    }

    // Create mappings for each product-market combination
    const mappings = [];
    const markets = ["RETAIL", "EXPORT"];

    // Group packaging by type for easier mapping
    const packagingByType = {};
    packaging.forEach((pkg) => {
      if (!packagingByType[pkg.packaging_type]) {
        packagingByType[pkg.packaging_type] = [];
      }
      packagingByType[pkg.packaging_type].push(pkg);
    });

    products.forEach((product) => {
      markets.forEach((market) => {
        // Determine suitable packaging based on product characteristics
        const suitablePackaging = getSuitablePackaging(
          product,
          packagingByType,
          market
        );

        suitablePackaging.forEach((pkg) => {
          mappings.push({
            id: uuidv4(),
            product_id: product.product_id,
            packaging_id: pkg.id,
            market: market,
            is_active: true,
            created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
            updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
            created_at: new Date(),
            updated_at: new Date(),
          });
        });
      });
    });

    console.log(`Creating ${mappings.length} product-packaging mappings`);

    if (mappings.length > 0) {
      await queryInterface.bulkInsert(
        "product_packaging_mapping",
        mappings,
        {}
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all mappings except the sample ones we created earlier
    await queryInterface.bulkDelete(
      "product_packaging_mapping",
      {
        id: {
          [Sequelize.Op.notIn]: [
            "550e8400-e29b-41d4-a716-446655440300",
            "550e8400-e29b-41d4-a716-446655440301",
            "550e8400-e29b-41d4-a716-446655440302",
          ],
        },
      },
      {}
    );
  },
};

// Helper function to determine suitable packaging for a product
function getSuitablePackaging(product, packagingByType, market) {
  const suitable = [];
  const { grade_name, size, product_category, species_name } = product;

  // Base packaging selection logic
  if (market === "RETAIL") {
    // RETAIL market preferences
    if (grade_name === "WHOLE") {
      // Whole products typically need larger packaging
      if (packagingByType["Duplex Carton"]) {
        suitable.push(
          ...packagingByType["Duplex Carton"].filter(
            (pkg) => pkg.packaging_weight >= 1
          )
        );
      }
    } else if (grade_name === "FILLET" || grade_name === "SLICE") {
      // Fillets and slices work well with pouches and trays
      if (packagingByType["Pouch"]) {
        suitable.push(...packagingByType["Pouch"]);
      }
      if (packagingByType["Duplex Carton"]) {
        suitable.push(
          ...packagingByType["Duplex Carton"].filter(
            (pkg) => pkg.packaging_weight <= 2
          )
        );
      }
    } else if (grade_name === "CHUNK") {
      // Chunks work with trays and cartons
      if (packagingByType["Duplex Carton"]) {
        suitable.push(...packagingByType["Duplex Carton"]);
      }
    }

    // Wing Cut products (like our test product)
    if (grade_name === "Wing Cut") {
      if (packagingByType["Pouch"]) {
        suitable.push(...packagingByType["Pouch"]);
      }
      if (packagingByType["Duplex Carton"]) {
        suitable.push(
          ...packagingByType["Duplex Carton"].filter(
            (pkg) => pkg.packaging_weight <= 2
          )
        );
      }
    }
  } else if (market === "EXPORT") {
    // EXPORT market preferences - typically larger bulk packaging
    if (packagingByType["Duplex Carton"]) {
      suitable.push(...packagingByType["Duplex Carton"]);
    }
    // Master cartons for export
    if (packagingByType["Master Carton"]) {
      suitable.push(...packagingByType["Master Carton"]);
    }
  }

  // If no specific packaging found, add some defaults
  if (suitable.length === 0) {
    // Add all available pouch and carton options as fallback
    if (packagingByType["Pouch"]) {
      suitable.push(...packagingByType["Pouch"].slice(0, 2)); // Limit to 2 options
    }
    if (packagingByType["Duplex Carton"]) {
      suitable.push(...packagingByType["Duplex Carton"].slice(0, 1)); // Limit to 1 option
    }
  }

  // Remove duplicates based on packaging ID
  const uniqueSuitable = suitable.filter(
    (pkg, index, self) => index === self.findIndex((p) => p.id === pkg.id)
  );

  return uniqueSuitable.slice(0, 3); // Limit to 3 options per product-market combination
}
