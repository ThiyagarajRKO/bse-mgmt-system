import { Sales } from "../../../controllers";

export const Create = (
  {
    profile_id,
    customer_master_id,
    payment_terms,
    payment_type,
    shipping_date,
    shipping_master_id,
    shipping_method,
    shipping_address,
    expected_delivery_date,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const shipping_master = await Sales.Insert(profile_id, {
        customer_master_id,
        payment_terms,
        payment_type,
        shipping_date,
        shipping_master_id,
        shipping_method,
        shipping_address,
        expected_delivery_date,
        is_active: true,
      });

      resolve({
        message: "Order data has been inserted successfully",
        data: {
          shipping_master_id: shipping_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
