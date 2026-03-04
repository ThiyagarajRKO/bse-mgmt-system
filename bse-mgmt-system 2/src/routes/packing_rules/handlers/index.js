import { PackingRules } from "../../../controllers";

/**
 * GET suggestions - Auto-suggest packaging
 */
export const GetSuggestions = async (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await PackingRules.GetPackagingSuggestions(params);

      resolve({
        data: result,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};

/**
 * POST validate - Validate packing selection
 */
export const Validate = async (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await PackingRules.ValidatePackingSelection(params);

      resolve({
        data: result,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};

/**
 * GET mappings - Get all mappings
 */
export const GetMappings = async (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await PackingRules.GetAllMappings(params);

      resolve(result);
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
