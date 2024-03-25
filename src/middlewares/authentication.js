import { UserProfiles } from "../controllers";

export const ValidateUser = async (req, reply) => {
  try {
    const user_id = req?.session?.pid;
    const role_id = req?.session?.role_id;

    if (!user_id) {
      return reply.code(403).send({ message: "Unauthorized User!" });
    }

    // let user_data = new Promise(async (resolve, reject) => {
    let user_data = await UserProfiles.Get({
      id: user_id,
      role_id,
    });

    if (!user_data) {
      return reply
        .code(403)
        .send({ success: false, message: "Profile doesn't exist!" });
    }

    if (user_data?.creator?.user_status != 1) {
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
