import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { Delete } from "./handlers/delete";
import { GetSizesByGrade } from "./handlers/get_sizes_by_grade";
import { GetSizesBySpecies } from "./handlers/get_sizes_by_species";
import { GetGradesByCategory } from "./handlers/get_grades_by_category";
import { GetDropdown } from "./handlers/get_dropdown";
import {
  createWithMapping,
  getSuggestions,
  validateCombination,
} from "./handlers/create-with-mapping";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get_all";
import { deleteSchema } from "./schema/delete";
import { getDropdownSchema } from "./schema/get_dropdown";

// Validation Middleware
import {
  validateProductInput,
  getProductRules,
} from "../../middlewares/productValidation";

// UOM Validation Middleware
import {
  validateProductUOM,
  getUOMRequirements,
} from "../../middleware/uom_validation";

// DB Function for category validation
async function getProductCategoriesBySpecies(species_master_id) {
  try {
    const categories = await ProductCategoryMaster.findAll({
      where: {
        species_master_id,
        is_active: true,
      },
      attributes: ["id", "product_category", "parent_category_type"],
      raw: true,
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export const productMasterRoute = (fastify, opts, done) => {
  // GET product rules (allowed forms and sizes based on species/grade)
  fastify.get("/rules/get-product-rules", async (req, reply) => {
    return getProductRules(req, reply);
  });

  fastify.post(
    "/",
    {
      schema: createSchema.schema,
      preHandler: validateProductInput,
    },
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await Create(params, req?.session, fastify);

        return reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  fastify.put(
    "/",
    {
      schema: updateSchema.schema,
      preHandler: validateProductInput,
    },
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await Update(params, req?.session, fastify);

        return reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  fastify.get("/grades-by-category/:category_id", async (req, reply) => {
    try {
      const params = { ...req.params };

      const result = await GetGradesByCategory(params);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/sizes-by-grade/:grade_id", async (req, reply) => {
    try {
      const params = { ...req.params };

      const result = await GetSizesByGrade(params);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/sizes-by-species/:species_master_id", async (req, reply) => {
    try {
      const sequelize = fastify?.models?.sequelize;
      const params = { ...req.params, sequelize };

      const result = await GetSizesBySpecies(params);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // DROPDOWN ROUTE - intercept before parametric route
  // Add preHandler to skip the "get specific product" logic
  fastify.get(
    "/dropdown",
    {
      preHandler: async (req, reply) => {
        console.log(
          "DROPDOWN ROUTE MATCHED - skipping product_master_id validation",
        );
        // This route is for dropdown data, not for getting a specific product
        // The params here are query params for filtering, not product_master_id
      },
      schema: getDropdownSchema,
    },
    async (req, reply) => {
      console.log("DROPDOWN HANDLER CALLED with params:", req.query);
      try {
        const params = { ...req.query };

        const result = await GetDropdown(params, req?.session, fastify);

        return reply.code(result.statusCode || 200).send({
          success: true,
          data: result.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  fastify.get("/:product_master_id", getSchema, async (req, reply) => {
    console.log(
      "GET product by ID HANDLER CALLED with product_master_id:",
      req.params.product_master_id,
    );

    // GUARD: If someone requests /:dropdown, redirect to /dropdown handler
    if (req.params.product_master_id === "dropdown") {
      console.log(
        "GUARD: Detected /dropdown as parametric route - redirecting to dropdown handler",
      );
      try {
        const params = { ...req.query };
        const result = await GetDropdown(params, req?.session, fastify);
        return reply.code(result.statusCode || 200).send({
          success: true,
          data: result.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }

    try {
      const params = { profile_id: req?.token_profile_id, ...req.params };

      const result = await Get(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/", getAllSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetAll(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.delete("/", deleteSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await Delete(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // ========== 4D MAPPING ENDPOINTS ==========

  // Create product with 4D mapping validation
  fastify.post(
    "/create-with-mapping",
    {
      preHandler: validateProductUOM,
    },
    async (req, reply) => {
      try {
        req.user = { id: req?.token_profile_id };
        req.profile_id = req?.token_profile_id;
        await createWithMapping(req, reply);
      } catch (err) {
        console.error("Error in create-with-mapping:", err.message);
        return reply.code(err?.statusCode || 500).send({
          success: false,
          message: err?.message || "Failed to create product with mapping",
        });
      }
    },
  );

  // Get product suggestions by species and derivative
  fastify.get("/suggestions", async (req, reply) => {
    try {
      await getSuggestions(req, reply);
    } catch (err) {
      console.error("Error in suggestions:", err.message);
      return reply.code(err?.statusCode || 500).send({
        success: false,
        message: err?.message || "Failed to get suggestions",
      });
    }
  });

  // Validate product combination
  fastify.post("/validate-combination", async (req, reply) => {
    try {
      await validateCombination(req, reply);
    } catch (err) {
      console.error("Error in validate-combination:", err.message);
      return reply.code(err?.statusCode || 500).send({
        success: false,
        message: err?.message || "Failed to validate combination",
      });
    }
  });

  // Get UOM requirements for species/derivative combination
  fastify.get("/uom-requirements", getUOMRequirements);

  done();
};

export default productMasterRoute;
