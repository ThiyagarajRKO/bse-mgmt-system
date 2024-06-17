import { PurchasePayments } from "../../../controllers";

export const Create = (
  {
    profile_id,
    transaction_id,
    payment_date,
    supplier_master_id,
    procurement_lot_id,
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
      const purchase_payment = await PurchasePayments.Insert(profile_id, {
        transaction_id,
        payment_date,
        supplier_master_id,
        procurement_lot_id,
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
        message: "Purchase Payment has been inserted successfully",
        data: {
          id: purchase_payment?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
