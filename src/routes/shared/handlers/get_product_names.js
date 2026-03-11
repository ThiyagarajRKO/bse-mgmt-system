/**
 * Consolidated GetProductNames Handler
 * Used by: peeled_dispatches, peeling_products, dispatches
 * Replaces three separate handlers with one unified implementation
 */

import { getProductNamesQuery } from "../../../utils/queryBuilders";
import models from "../../../../models";

export const GetProductNames = async (
  {
    modelType = "peeledDispatches", // Route specifies which model to query
    procurement_lot_id,
    packing_id,
    peeling_id,
    unit_master_id,
    start = 0,
    length = 10,
    "search[value]": search,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const queryOptions = await getProductNamesQuery(models, modelType, {
        procurement_lot_id,
        packing_id,
        peeling_id,
        unit_master_id,
        start,
        length,
        search,
      });

      const result = await queryOptions.model.findAll(queryOptions);

      if (!result || result.length === 0) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
        });
      }

      resolve({
        data: result,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
