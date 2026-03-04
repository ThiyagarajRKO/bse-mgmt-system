import { DivisionMaster } from "../../../controllers";

export const Create = async (
  { profile_id, division_name, description, company_id },
  session,
  fastify
) => {
  try {
    // ✔ Prefer session company_id, fallback to payload company_id (Edit uses payload)
    const finalCompanyId = session?.company_id || company_id;

    if (!finalCompanyId) {
      throw {
        statusCode: 420,
        message: "Company ID is required!",
      };
    }

    const division_master = await DivisionMaster.Insert(profile_id, {
      division_name,
      description,
      company_id: finalCompanyId,
      is_active: true,
    });

    return {
      success: true,
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
