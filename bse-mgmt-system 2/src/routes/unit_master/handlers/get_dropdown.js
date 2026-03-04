import { UnitMaster } from "../../../controllers";

/**
 * Get units as dropdown data
 * No authentication required - public endpoint for dropdowns
 */
export const GetDropdown = ({ unit_type }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let unit_master = await UnitMaster.GetAll({
        unit_type: unit_type || "Collection Center",
        start: 0,
        length: 10000, // Get all units for dropdown
        search: "",
      });

      if (!unit_master || !unit_master.rows) {
        return reject({
          statusCode: 420,
          message: "No units found!",
        });
      }

      // Return in format expected by Select2
      resolve({
        data: {
          rows: unit_master.rows || [],
          count: unit_master.count || 0,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
