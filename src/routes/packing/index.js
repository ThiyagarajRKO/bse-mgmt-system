import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { GetPackingNames } from "./handlers/get_packing_names";
import { Delete } from "./handlers/delete";
import { Calculate } from "./handlers/calculate";
import { ResolveCartonHandler } from "./handlers/resolve_carton";
import { CalculateMetrics } from "./handlers/calculate_metrics";
import { LockCalculations } from "./handlers/lock_calculations";
import { CalculateCartonCostHandler } from "./handlers/calculate_carton_cost";
import { CalculatePalletCostHandler } from "./handlers/calculate_pallet_cost";
import { CalculateCompletePackagingCostHandler } from "./handlers/calculate_complete_cost";
import aiContainersHandler from "./handlers/ai_containers";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get_all";
import { getPackingNamesSchema } from "./schema/get_packing_names";
import { deleteSchema } from "./schema/delete";
import { calculateSchema } from "./schema/calculate";
import { resolveCartonSchema } from "./schema/resolve_carton";
import { calculateMetricsSchema } from "./schema/calculate_metrics";
import { lockCalculationsSchema } from "./schema/lock_calculations";
import { calculateCartonCostSchema } from "./schema/calculate_carton_cost";
import { calculatePalletCostSchema } from "./schema/calculate_pallet_cost";
import { calculateCompleteCostSchema } from "./schema/calculate_complete_cost";

export const packingRoute = (fastify, opts, done) => {
  fastify.post("/", createSchema, async (req, reply) => {
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
  });

  fastify.put("/", updateSchema, async (req, reply) => {
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
  });

  fastify.get("/:packing_id", getSchema, async (req, reply) => {
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

  fastify.get("/names", getPackingNamesSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetPackingNames(params, req?.session, fastify);

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

  fastify.post("/calculate", calculateSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Calculate(params, req?.session, fastify);

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

  fastify.post("/resolve-carton", resolveCartonSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await ResolveCartonHandler(params, req?.session, fastify);

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

  fastify.post(
    "/calculate-metrics",
    calculateMetricsSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await CalculateMetrics(params, req?.session, fastify);

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

  fastify.post(
    "/lock-calculations",
    lockCalculationsSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await LockCalculations(params, req?.session, fastify);

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

  fastify.post(
    "/calculate-carton-cost",
    calculateCartonCostSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await CalculateCartonCostHandler(
          params,
          req?.session,
          fastify
        );

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

  fastify.post(
    "/calculate-pallet-cost",
    calculatePalletCostSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await CalculatePalletCostHandler(
          params,
          req?.session,
          fastify
        );

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

  fastify.post(
    "/calculate-complete-cost",
    calculateCompleteCostSchema,
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.body };

        const result = await CalculateCompletePackagingCostHandler(
          params,
          req?.session,
          fastify
        );

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

  // Register AI containers handler
  fastify.register(aiContainersHandler);

  done();
};

export default packingRoute;
