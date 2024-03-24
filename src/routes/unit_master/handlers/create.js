import { UnitMaster, LocationMaster } from "../../../controllers";

export const Create = (
  { profile_id, unit_code, unit_name, unit_type, location_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const location_count = await LocationMaster.Count({
        id: location_master_id,
      });

      if (location_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid location master id!",
        });
      }

      const unit_master = await UnitMaster.Insert({
        unit_code,
        unit_name,
        unit_type,
        location_master_id,
        is_active: true,
        created_by: profile_id,
      });

      resolve({
        message: "Unit master has been inserted successfully",
        data: {
          unit_master_id: unit_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
