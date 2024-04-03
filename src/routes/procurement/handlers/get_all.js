import { Procurement } from "../../../controllers";

export const GetAll = (
  {
    procurement_date,
    procurement_lot,
    procurement_product_type,
    procurement_quantity,
    procurement_price,
    procurement_totalamount,
    procurement_purchaser,
    product_master_name,
    species_master_name,
    vendor_master_name,
    unit_master_name,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await Procurement.GetAll({
        procurement_date,
        procurement_lot,
        procurement_product_type,
        procurement_quantity,
        procurement_price,
        procurement_totalamount,
        procurement_purchaser,
        product_master_name,
        species_master_name,
        vendor_master_name,
        unit_master_name,
        search,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
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
