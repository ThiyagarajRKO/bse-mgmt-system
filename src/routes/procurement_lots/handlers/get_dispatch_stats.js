import { ProcurementLots } from "../../../controllers";

export const GetDispatchStats = (
  { procurement_lot_id, "search[value]": search, start, length },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetDispatchStats({
        procurement_lot_id,
        search,
        start: parseInt(start) || 0,
        length: parseInt(length) || 10,
      });

      // Handle null or empty result
      if (!procurement) {
        procurement = { rows: [], count: 0 };
      }

      // Ensure we have the right structure
      const result = {
        rows: procurement.rows || [],
        count: procurement.count || 0,
      };

      resolve({
        data: result,
      });
    } catch (err) {
      console.error("GetDispatchStats error:", err);
      fastify.log.error(err);
      reject(err);
    }
  });
};
