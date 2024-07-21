import { ProductMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    product_category_master_id,
    is_product_size_empty,
    species_id,
    product_name,
    species_master_name,
    product_category_name,
    product_size,
    "search[value]": search,
    dropdownSearch,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductMaster.GetAll({
        start,
        length,
        product_category_master_id,
        is_product_size_empty,
        species_id,
        product_name,
        species_master_name,
        product_category_name,
        product_size,
        search,
        dropdownSearch,
      });

      if (!product_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: product_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
