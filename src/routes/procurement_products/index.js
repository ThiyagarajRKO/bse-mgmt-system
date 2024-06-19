import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { Delete } from "./handlers/delete";
import { GetNames } from "./handlers/get_names";
import { GetPaymentItems } from "./handlers/get_payment_products";
import { GetPaidStatus } from "./handlers/get_paid_status";

// Chart Handler
import { GetProcurementSpendBySuppliers } from "./handlers/charts/chart_procurement_spend_by_suppliers";
import { GetProcurementSpendByProducts } from "./handlers/charts/chart_procurement_spend_by_products";
import { GetProcurementSpendByDate } from "./handlers/charts/chart_procurement_spend_by_date";
import { GetProcurementPerformanceBySuppliers } from "./handlers/charts/chart_procurement_performance_by_supplier";
import { GetProcurementAgeByProducts } from "./handlers/charts/chart_procurement_age_by_product";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get_all";
import { deleteSchema } from "./schema/delete";
import { getNamesSchema } from "./schema/get_names";
import { getPaymentItemsSchema } from "./schema/get_payment_products";
import { getPaidStatusSchema } from "./schema/get_paid_status";

// Chart Schema
import { getProcurementSpendBySuppliersSchema } from "./schema/charts/chart_procurement_spend_by_suppliers";
import { getProcurementSpendByProductsSchema } from "./schema/charts/chart_procurement_spend_by_products";
import { getProcurementSpendByDateSchema } from "./schema/charts/chart_procurement_spend_by_date";
import { getProcurementPerformanceBySuppliersSchema } from "./schema/charts/chart_procurement_performance_by_supplier";
import { getProcurementAgeByProductsSchema } from "./schema/charts/chart_procurement_age_by_products";

export const procurementProductsRoute = (fastify, opts, done) => {
  fastify.post("/", createSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Create(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.put("/", updateSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Update(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/:procurement_product_id", getSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.params };

      const result = await Get(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/", getAllSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetAll(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/names", getNamesSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetNames(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/payment/items", getPaymentItemsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPaymentItems(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/paid/status", getPaidStatusSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPaidStatus(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.delete("/", deleteSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await Delete(params, req?.session, fastify);

      reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // ----------------------------------------------------------------------
  // ------------------------------- Charts -------------------------------
  // ----------------------------------------------------------------------

  fastify.get(
    "/chart/spend/by/supplier",
    getProcurementSpendBySuppliersSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetProcurementSpendBySuppliers(
          params,
          req?.session,
          fastify
        );

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  fastify.get(
    "/chart/spend/by/product",
    getProcurementSpendByProductsSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetProcurementSpendByProducts(
          params,
          req?.session,
          fastify
        );

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  fastify.get(
    "/chart/spend/by/date",
    getProcurementSpendByDateSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetProcurementSpendByDate(
          params,
          req?.session,
          fastify
        );

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  fastify.get(
    "/chart/performance/by/supplier",
    getProcurementPerformanceBySuppliersSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetProcurementPerformanceBySuppliers(
          params,
          req?.session,
          fastify
        );

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  fastify.get(
    "/chart/age/by/product",
    getProcurementAgeByProductsSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetProcurementAgeByProducts(
          params,
          req?.session,
          fastify
        );

        reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    }
  );

  done();
};

export default procurementProductsRoute;
