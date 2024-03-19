import { UserProfiles } from "../controllers";

export const ValidateUser = async (req, reply) => {
  try {
    let user_id = req?.session?.pid;

    if (!user_id) {
      return reply.code(403).send({ message: "Unauthorized User!" });
    }

    // let user_data = new Promise(async (resolve, reject) => {
    let user_data = await UserProfiles.Get({
      id: user_id,
    });

    if (!user_data) {
      return reply
        .code(403)
        .send({ success: false, message: "Unauthorized User!" });
    }

    if (user_data?.dataValues?.User?.dataValues?.user_status != 1) {
      return reply
        .code(403)
        .send({ success: false, message: "User isn't in the Active state" });
    }

    req.token_profile_id = req?.session?.pid;
    req.token_profile_name = user_data?.full_name;

    // done();
  } catch (err) {
    console.error(new Date().toISOString() + " : " + err?.message || err);
    reply.code(403).send({
      success: false,
      message: err?.message || err,
    });
  }
};

// Admin
export const ValidateAdmin = async (req, reply) => {
  try {
    let user_id = req?.session?.pid;

    if (!user_id) {
      return reply.code(403).send({ message: "Unauthorized User!" });
    }

    if (!req.session?.is_otp_verified) {
      return reply.code(403).send({
        success: false,
        message: "Unauthorized User!",
        details: "OTP must be validated",
      });
    }

    if (!req.session?.is_mfa_verified) {
      return reply.code(403).send({
        success: false,
        message: "Unauthorized User!",
        details: "MFA isn't verified!",
      });
    }

    // let user_data = new Promise(async (resolve, reject) => {
    let user_data = await UserProfiles.GetAdminUserByProfileId({
      id: user_id,
    });

    // resolve(user_data);
    // });

    if (!user_data) {
      return reply.code(403).send({ success: false, message: "Invalid User!" });
    }

    req.token_profile_id = req?.session?.pid;
    req.token_chip_id = req?.session?.cid;
    req.token_chip_profile_id = req?.session?.cpid;
    req.token_chip_name = req?.session?.cname;

    // delete req?.body?.user_id;

    // done();
  } catch (err) {
    console.error(new Date().toISOString() + " : " + err?.message || err);
    reply.code(403).send({
      success: false,
      message: err?.message || err,
    });
  }
};
