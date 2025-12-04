import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { Delete } from "./handlers/delete";
import { GetSizesByGrade } from "./handlers/get_sizes_by_grade";
import { GetSizesBySpecies } from "./handlers/get_sizes_by_species";
import { GetGradesByCategory } from "./handlers/get_grades_by_category";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get _all";
import { deleteSchema } from "./schema/delete";

// Validation Middleware
import {
  validateProductInput,
  getProductRules,
} from "../../middlewares/productValidation";

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

        console.log("📝 Product creation params:", params);

        // Log validated data if present
        if (req.validatedProduct) {
          console.log("✅ Product validation passed:", req.validatedProduct);
        }

        const result = await Create(params, req?.session, fastify);

        console.log("✅ Product creation result:", result);

        return reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        console.error("❌ Product creation error:", err?.message || err);
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
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
    }
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

  fastify.get("/:product_master_id", getSchema, async (req, reply) => {
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

  done();
};

export default productMasterRoute;
