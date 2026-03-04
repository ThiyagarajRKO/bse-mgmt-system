import { UserProfiles } from "../../../controllers";

export const Ping = async (params, session, fastify) => {
  try {
    const user_id = session.pid;
    const user_data = await UserProfiles.Get({
      id: user_id,
      role_id: session.role_id,
    });

    return {
      success: true,
      message: "Authenticated",
      data: {
        user_id: user_data.id,
        full_name: user_data.full_name,
        username: user_data.username,
        role_name: session.role_name,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: "Not authenticated",
    };
  }
};
