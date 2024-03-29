import { LocationMaster, Procurement, ProductMaster, VendorMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    procurement_date,
    procurement_lot,
    procurement_product_type,
    procurement_quantity,
    procurement_price,
    procurement_purchaser,
    vendor_master_id,
    location_master_id,
    product_master_id
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
      const location_count = await LocationMaster.Count({
        id: location_master_id,
      });

      if (location_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid location master id!",
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
        procurement_product_type,
        procurement_quantity,
        procurement_price,
        procurement_purchaser,
        location_master_id,
        product_master_id,
        vendor_master_id,
        is_active: true,
      });

      resolve({
        message: "Procurement has been inserted successfully",
        data: {
          procurement_id: Procurement?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
