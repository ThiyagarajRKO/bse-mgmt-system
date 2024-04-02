import { Dispatches, LocationMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    procurement_id,
    dispatch_id,
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
      const dispatch = await Dispatches.Insert(profile_id, {
        procurement_id,
        unit_master_id,
        dispatch_quantity,
        temperature,
        delivery_notes,
        delivery_status: "In Transit",
        vehicle_master_id,
        driver_master_id,
        is_active: true,
      });

      resolve({
        message: "Dispatch data has been inserted successfully",
        data: {
          dispatch_id: dispatch?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
