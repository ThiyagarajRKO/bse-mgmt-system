import { GetAll } from "./handlers/get_all";
import { Get } from "./handlers/get";
import { GetBySpeciesHandler } from "./handlers/get_by_species";

// Schema
import { getAllSchema } from "./schema/get_all";
import { getSchema } from "./schema/get";

import fs from "fs";

export const purchaseInventoryRoute = (fastify, opts, done) => {
  fastify.get("/", getAllSchema, async (req, reply) => {
    try {
      // VERY FIRST LINE - log that route was hit
      fs.appendFileSync(
        "/tmp/purchase-test.log",
        `ROUTE HIT AT ${new Date().toISOString()}\n`
      );

      // Log raw query object
      const queryKeys = req.query ? Object.keys(req.query) : [];
      fs.appendFileSync(
        "/tmp/purchase-inventory-debug.log",
        `[Route] Query keys: ${JSON.stringify(queryKeys)}, hasProc: ${!!req
          .query?.procurement_product_id}\n`
      );

      // Explicitly extract query parameters instead of spreading
      const {
        start,
        length,
        "search[value]": search,
        procurement_product_id,
      } = req.query;
      const params = {
        profile_id: req?.token_profile_id,
        start,
        length,
        "search[value]": search,
        procurement_product_id,
      };
      fs.appendFileSync(
        "/tmp/purchase-inventory-debug.log",
        `[Route] Final params: ${JSON.stringify(params)}\n`
      );
      let result = await GetAll(params, req?.session, fastify);

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

  // Get raw materials filtered by species_id (MUST be before /:id route)
  fastify.get("/by-species/:species_id", async (req, reply) => {
    try {
      let result = await GetBySpeciesHandler(
        {
          profile_id: req?.token_profile_id,
          species_id: req.params.species_id,
          ...req.query,
        },
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
  });

  fastify.get("/:purchase_inventory_id", getSchema, async (req, reply) => {
    try {
      let result = await Get(
        { profile_id: req?.token_profile_id, ...req.params },
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
  });

  done();
};

export default purchaseInventoryRoute;
