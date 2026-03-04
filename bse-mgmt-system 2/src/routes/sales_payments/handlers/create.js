import { SalesPayments } from "../../../controllers";

export const Create = (
  {
    profile_id,
    transaction_id,
    payment_date,
    customer_master_id,
    order_id,
    payment_method,
    discount,
    total_paid,
    net_amount,
    penalty,
    tax_percentage,
    tax_amount,
    due_amount,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const sales_payment = await SalesPayments.Insert(profile_id, {
        transaction_id,
        payment_date,
        customer_master_id,
        order_id,
        payment_method,
        discount,
        total_paid,
        net_amount,
        penalty,
        tax_percentage,
        tax_amount,
        due_amount,
        is_active: true,
      });

      resolve({
        message: "Sales Payment has been inserted successfully",
        data: {
          id: sales_payment?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
