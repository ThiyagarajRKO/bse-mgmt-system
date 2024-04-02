import { Procurement, ProductMaster, VendorMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    procurement_date,
    unit_master_id,
    procurement_lot,
    procurement_product_name,
    procurement_product_type,
    procurement_quantity,
    procurement_price,
    procurement_totalamount,
    procurement_purchaser,
    vendor_master_id,
    product_master_id,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vendor_count = await VendorMaster.Count({
        id: vendor_master_id,
      });

      if (vendor_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid vendor master id!",
        });
      }

      const product_count = await ProductMaster.Count({
        id: product_master_id,
      });

      if (product_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid product master id!",
        });
      }

      const purchase = await Procurement.Insert(profile_id, {
        procurement_date,
        procurement_lot,
        unit_master_id,
        procurement_product_name,
        procurement_product_type,
        procurement_quantity,
        procurement_price,
        procurement_totalamount,
        procurement_purchaser,
        product_master_id,
        vendor_master_id,
        is_active: true,
      });

      resolve({
        message: "Procurement has been inserted successfully",
        data: {
          procurement_id: purchase?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
