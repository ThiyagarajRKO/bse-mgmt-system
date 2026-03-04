import { Orders } from "../../../controllers";

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
    OrderProducts,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Orders.Insert(
        profile_id,
        {
          customer_master_id,
          payment_terms,
          payment_type,
          shipping_date,
          shipping_master_id,
          shipping_method,
          shipping_address,
          expected_delivery_date,
          OrderProducts,
          is_active: true,
        },
        Array.isArray(OrderProducts) && OrderProducts.length > 0 ? true : false
      );

      resolve({
        message: "Order data has been inserted successfully",
        data: {
          order_id: order?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
