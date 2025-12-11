import { ProcurementProducts } from "../../../controllers";

export const GetPaidStatus = (
  { procurement_product_id, supplier_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("GetPaidStatus handler called with:", {
        procurement_product_id,
        supplier_master_id,
      });
      const result = await ProcurementProducts.GetPaidStatus({
        procurement_product_id,
        supplier_master_id,
      });

      console.log("Payment status result:", result);

      resolve({
        statusCode: result?.data?.is_paid ? 200 : 404,
        message: result?.data?.is_paid
          ? "Payment found for this procurement product"
          : "No payment found for this procurement product",
        data: result?.data,
      });
    } catch (err) {
      console.error("Error in GetPaidStatus handler:", err);
      fastify.log.error(err);
      reject(err);
    }
  });
};
