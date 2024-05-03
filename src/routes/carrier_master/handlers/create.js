import { CarrierMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    carrier_name,
    carrier_address,
    carrier_country,
    carrier_phone,
    carrier_email,
    carrier_paymentterms,
    carrier_credit,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const carrier_master = await CarrierMaster.Insert(profile_id, {
        carrier_name,
        carrier_address,
        carrier_country,
        carrier_phone,
        carrier_email,
        carrier_paymentterms,
        carrier_credit,
        is_active: true,
      });

      resolve({
        message: "Carrier master data has been inserted successfully",
        data: {
          carrier_master_id: carrier_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
