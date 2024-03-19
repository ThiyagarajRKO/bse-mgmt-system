import { GetResponse } from "../utils/node-fetch";

export const SendOtp = async ({ phone, otp_template }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const url =
        "https://2factor.in/API/V1/" +
        process.env.API_KEY_2FACTOR +
        "/SMS/" +
        phone +
        `/AUTOGEN/${otp_template}`;

      let { data } = await GetResponse(url, "GET");
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const VerifyOtp = async ({ session_id, otp }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!session_id) {
        return reject({ message: "Invalid OTP!" });
      }

      const url =
        "https://2factor.in/API/V1/" +
        process.env.API_KEY_2FACTOR +
        "/SMS/VERIFY/" +
        session_id +
        "/" +
        otp;

      let { data } = await GetResponse(url, "GET");

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};
