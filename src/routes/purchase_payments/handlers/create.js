import purchase_payments from "../../../../models/purchase_payments";
import { SupplierMaster, ProcurementLots, PurchasePayment } from "../../../controllers";

export const Create = (
  {
    profile_id,
    id,
    supplier_master_id,
    procurement_lots,
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
      const vehicle_master = await PurchasePayment.Insert(profile_id, {
        id,
        supplier_master_id,
        procurement_lots,
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
          id: purchase_payments?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
