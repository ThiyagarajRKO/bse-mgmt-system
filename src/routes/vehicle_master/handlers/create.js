import { VehicleMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    vehicle_number,
    vehicle_brand,
    model_number,
    insurance_provider,
    insurance_number,
    insurance_expiring_on,
    last_fc_date,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vehicle_master = await VehicleMaster.Insert({
        vehicle_number,
        vehicle_brand,
        model_number,
        insurance_provider,
        insurance_number,
        insurance_expiring_on,
        last_fc_date,
        is_active: true,
        created_by: profile_id,
      });

      resolve({
        message: "Vehicle master has been inserted successfully",
        data: {
          vehicle_master_id: vehicle_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
