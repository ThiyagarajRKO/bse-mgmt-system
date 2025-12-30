const { ProductPackagingMapping } = require("../dist/models");

async function createMappings() {
  try {
    // Get some packaging IDs - let's assume some exist
    const mappings = [
      {
        product_id: "97e9b38d-6ee3-4d2b-8269-5912a67d0f57",
        packaging_id: "some-packaging-id-1", // Need to get real ID
        market: "RETAIL",
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
      },
    ];

    console.log("Creating mappings...");
    // This won't work without real packaging IDs
  } catch (err) {
    console.error(err);
  }
}

createMappings();
