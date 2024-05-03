import { CarrierMaster } from "../../../controllers";

export const Delete = ({ profile_id, carrier_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const carrier_master = await CarrierMaster.Delete({
        profile_id,
        id: carrier_master_id,
      });

      if (carrier_master > 0) {
        return resolve({
          message: "Carrier master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Carrier master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
