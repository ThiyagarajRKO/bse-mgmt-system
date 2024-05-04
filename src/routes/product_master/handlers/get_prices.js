import { ProductMaster } from "../../../controllers";

export const GetPrices = (
  { start, length, product_name, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductMaster.GetPrices({
        start,
        length,
        product_name,
        search,
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
