import { VendorMaster } from "../../../controllers";

export const Delete = ({ profile_id, vendor_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendor_master = await VendorMaster.Delete({
        profile_id,
        id: vendor_master_id,
      });

      if (vendor_master?.[0] > 0) {
        return resolve({
          message: "Vendor master has been deleted successfully",
        });
      }

      resolve({
        message: "Vendor master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
