import { SpeciesMaster } from "../../../controllers";

export const GetAll = (
  {
    species_code,
    species_name,
    scientific_name,
    division_name,
    start,
    length,
    draw,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let species_master = await SpeciesMaster.GetAll({
        species_code,
        species_name,
        scientific_name,
        division_name,
        start,
        length,
        draw,
        search,
      });

      if (!species_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve(species_master);
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
