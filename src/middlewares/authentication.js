import { UserProfiles } from "../controllers";

export const ValidateUser = async (req, reply) => {
  try {
    const user_id = req?.session?.pid;
    const role_id = req?.session?.role_id;

    console.log("ValidateUser session:", req.session);

    if (!user_id) {
      req.authError = { statusCode: 403, message: "Unauthorized User!" };
      return;
    }

    // let user_data = new Promise(async (resolve, reject) => {
    let user_data = await UserProfiles.Get({
      id: user_id,
      role_id,
    });

    if (!user_data) {
      req.authError = { statusCode: 403, message: "Profile doesn't exist!" };
      return;
    }

    if (user_data?.creator?.user_status != 1) {
      req.authError = {
        statusCode: 403,
        message: "User isn't in the Active state",
      };
      return;
    }

    req.token_profile_id = req?.session?.pid;
    req.token_profile_name = user_data?.full_name;

    // done();
  } catch (err) {
    console.error(new Date().toISOString() + " : " + err?.message || err);
    req.authError = { statusCode: 403, message: err?.message || err };
  }

  if (req.authError) {
    reply
      .code(req.authError.statusCode)
      .send({ success: false, message: req.authError.message });
    return;
  }
};
