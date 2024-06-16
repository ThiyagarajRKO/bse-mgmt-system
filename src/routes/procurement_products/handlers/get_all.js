import { ProcurementProducts } from "../../../controllers";

export const GetAll = (
  {
    procurement_lot,
    procurement_product_type,
    procurement_quantity,
    procurement_price,
    procurement_totalamount,
    procurement_purchaser,
    product_master_name,
    species_master_name,
    supplier_master_name,
    unit_master_name,
    supplier_id,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementProducts.GetAll({
        procurement_lot,
        procurement_product_type,
        procurement_quantity,
        procurement_price,
        procurement_totalamount,
        procurement_purchaser,
        product_master_name,
        species_master_name,
        supplier_master_name,
        unit_master_name,
        supplier_id,
        search,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: procurement,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
