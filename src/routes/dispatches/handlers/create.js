import { Dispatches, LocationMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    procurement_id,
    source_unit_master_id,
    destination_unit_master_id,
    dispatch_quantity,
    temperature,
    delivery_notes,
    vehicle_master_id,
    driver_master_id,
  },
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

      const unit_master = await Dispatches.Insert(profile_id, {
        procurement_id,
        source_unit_master_id,
        destination_unit_master_id,
        dispatch_quantity,
        temperature,
        delivery_notes,
        vehicle_master_id,
        driver_master_id,
        is_active: true,
      });

      resolve({
        message: "Dispatch data has been inserted successfully",
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
