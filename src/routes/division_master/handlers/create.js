import { DivisionMaster } from "../../../controllers";

export const Create = async (
  { profile_id, division_name, description },
  session,
  fastify
) => {
  try {
    if (!session?.company_id) {
      throw {
        statusCode: 420,
        message: "Company ID missing in session!",
      };
    }

    const division_master = await DivisionMaster.Insert(profile_id, {
      division_name,
      description,
      company_id: session.company_id, // ✅ required
      is_active: true,
    });

    return {
      statusCode: 200,
      message: "Division master has been inserted successfully",
      data: {
        division_master_id: division_master?.id,
      },
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
