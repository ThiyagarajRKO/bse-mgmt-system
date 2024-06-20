import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { Delete } from "./handlers/delete";
import { GetStats } from "./handlers/get_lot_stats";
import { CountStats } from "./handlers/count_stats";
import { GetLots } from "./handlers/get_lots";
import { GetDispatchStats } from "./handlers/get_dispatch_stats";
import { GetPeelingStats } from "./handlers/get_peeling_stats";
import { GetPeeledDispatchStats } from "./handlers/get_peeling_dispatch_stats";
import { GetDispatchLots } from "./handlers/get_dispatch_lots";
import { GetPeeledLots } from "./handlers/get_peeled_lots";
import { GetPackingLots } from "./handlers/get_packing_lots";
import { GetPackingStats } from "./handlers/get_packing_stats";
import { GetPaymentLots } from "./handlers/get_payment_lots";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get_all";
import { deleteSchema } from "./schema/delete";
import { getStatsSchema } from "./schema/get_lot_stats";
import { countStatsSchema } from "./schema/count_stats";
import { getDispatchStatsSchema } from "./schema/get_dispatch_stats";
import { getPeelingStatsSchema } from "./schema/get_peeling_stats";
import { getPeeledDispatchStatsSchema } from "./schema/get_peeling_dispatch_stats";
import { getDispatchLotsSchema } from "./schema/get_dispatch_lots";
import { getPeeledLotsSchema } from "./schema/get_peeled_lots";
import { getPackingLotsSchema } from "./schema/get_packing_lots";
import { getPackingStatsSchema } from "./schema/get_packing_stats";
import { getLotsSchema } from "./schema/get_lots";
import { getPaymentLotsSchema } from "./schema/get_payment_lots";

export const procurementLotsRoute = (fastify, opts, done) => {
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

  fastify.get("/:procurement_lot_id", getSchema, async (req, reply) => {
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

  fastify.get("/count/stats", countStatsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await CountStats(params, req?.session, fastify);

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

  // ----------------------------------------------------------------------
  // ------------------------------ Lots ----------------------------------
  // ----------------------------------------------------------------------

  fastify.get("/lots", getLotsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetLots(params, req?.session, fastify);

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

  fastify.get("/lots/dispatch", getDispatchLotsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetDispatchLots(params, req?.session, fastify);

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

  fastify.get("/lots/peeled", getPeeledLotsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPeeledLots(params, req?.session, fastify);

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

  fastify.get("/lots/packing", getPackingLotsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPackingLots(params, req?.session, fastify);

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

  fastify.get("/lots/payment", getPaymentLotsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPaymentLots(params, req?.session, fastify);

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
  // ------------------------------- Stats --------------------------------
  // ----------------------------------------------------------------------

  fastify.get("/stats", getStatsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetStats(params, req?.session, fastify);

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

  fastify.get("/stats/dispatch", getDispatchStatsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetDispatchStats(params, req?.session, fastify);

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

  fastify.get("/stats/peeling", getPeelingStatsSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPeelingStats(params, req?.session, fastify);

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

  fastify.get(
    "/stats/peeled/dispatch",
    { schema: getPeeledDispatchStatsSchema },
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetPeeledDispatchStats(
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
    "/stats/packing",
    { schema: getPackingStatsSchema },
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.query };

        const result = await GetPackingStats(params, req?.session, fastify);

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
export default procurementLotsRoute;
