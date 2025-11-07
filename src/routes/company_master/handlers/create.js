import * as CompanyMaster from "../../../controllers/company_master";

export const Create = async (params, session, fastify) => {
  try {
    console.log("CompanyMaster:", CompanyMaster); // ✅ Debug

    const {
      profile_id,
      company_name,
      company_short_name,
      company_gstin,
      company_pan,
      company_address,
      company_country,
      company_bank_ac,
      company_ifsc,
      company_currency,
      company_fin_year_start,
    } = params;

    const company_master = await CompanyMaster.Insert(profile_id, {
      company_name,
      company_short_name,
      company_gstin,
      company_pan,
      company_address,
      company_country,
      company_bank_ac,
      company_ifsc,
      company_currency,
      company_fin_year_start,
      is_active: true,
    });

    return {
      statusCode: 200,
      message: "company master data has been inserted successfully",
      data: { company_master_id: company_master?.id },
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
