import { CustomerMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    customer_name,
    customer_address,
    customer_country,
    customer_phone,
    customer_email,
    customer_paymentterms,
    customer_credit,
    customer_type,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const customer_master = await CustomerMaster.Insert(profile_id, {
        customer_name,
        customer_address,
        customer_country,
        customer_phone,
        customer_email,
        customer_paymentterms,
        customer_credit,
        customer_type,
        is_active: true,
      });

      resolve({
        message: "Customer master data has been inserted successfully",
        data: {
          customer_master_id: customer_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
