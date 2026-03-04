import { LocationMaster } from "../../../controllers";

export const Create = (
  { profile_id, location_name, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const location_master = await LocationMaster.Insert(profile_id, {
        location_name,
        description,
        is_active: true,
      });

      resolve({
        message: "Location master has been inserted successfully",
        data: {
          location_master_id: location_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
