import {
  ProductCategoryMaster,
  ProductMaster,
  SpeciesMaster,
} from "../../../controllers";

export const Create = (
  {
    profile_id,
    division_master_id,
    species_code,
    species_name,
    scientific_name,
    description,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_master = await SpeciesMaster.Insert(profile_id, {
        division_master_id,
        species_name,
        species_code,
        scientific_name,
        description,
        is_active: true,
      });

      if (!species_master?.id) {
        return reject({
          message:
            "Species master data hasn't been inserted. Please try after sometime.",
        });
      }

      const product_category_data = await ProductCategoryMaster.Insert(
        profile_id,
        {
          product_category: "Whole",
          species_master_id: species_master?.id,
          is_active: true,
        }
      );

      await ProductMaster.Insert(profile_id, {
        product_category_master_id: product_category_data?.id,
        is_active: true,
      }).catch(console.log);

      resolve({
        message: "Species master has been inserted successfully",
        data: {
          species_master_id: species_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
