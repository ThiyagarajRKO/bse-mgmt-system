import { PurchaseInventory } from "../../../../controllers";

export const GetBySpeciesHandler = (
  { species_id, start, length, search, profile_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await PurchaseInventory.GetBySpecies({
        species_id,
        start: parseInt(start) || 0,
        length: parseInt(length) || 10,
        search,
        profile_id,
      });

      resolve({
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (err) {
      reject(err);
    }
  });
};
