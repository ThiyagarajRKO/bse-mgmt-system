import { DivisionMaster } from "../../../controllers";

export const GetAll = (
  { division_name, start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let division_master = await DivisionMaster.GetAll({
        division_name,
        start,
        length,
        search,
      });

      if (!division_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: division_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
