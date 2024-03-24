import { DriverMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    driver_name,
    license_number,
    aadhar_number,
    phone,
    emergency_contact,
    address,
    blood_group,
    health_history,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const driver_master = await DriverMaster.Insert({
        driver_name,
        license_number,
        aadhar_number,
        phone,
        emergency_contact,
        address,
        blood_group,
        health_history,
        is_active: true,
        created_by: profile_id,
      });

      resolve({
        message: "Driver master has been inserted successfully",
        data: {
          driver_master_id: driver_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
