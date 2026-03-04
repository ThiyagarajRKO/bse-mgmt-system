import { ProductGstMapping } from "../../../controllers";

export const Get = ({ id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ProductGstMapping.Get(id);

      resolve({
        message: "Product GST mapping retrieved successfully",
        data: result.data,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
