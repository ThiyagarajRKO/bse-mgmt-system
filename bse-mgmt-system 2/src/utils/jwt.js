import jwt from "jsonwebtoken";

export const GetToken = ({ user_id, expires_in }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let token = jwt.sign(
        {
          uid: user_id,
        },
        process.env.JWT_SECRET,
        {
          issuer: "Cario Growth Services",
          expiresIn: expires_in || "72h",
        }
      );
      resolve(token);
    } catch (err) {
      reject(err);
    }
  });
};

export const DecodeToken = (token) => {
  return jwt.decode(token, process.env.JWT_SECRET);
};

export const VerifyToken = (token) => {
  return new Promise((resolve, reject) => {
    try {
      let payload = jwt.verify(token, process.env.JWT_SECRET);
      resolve(payload);
    } catch (error) {
      reject(error);
    }
  });
};

export const VerifyTokenStatus = (token) => {
  return new Promise((resolve, reject) => {
    try {
      let payload = jwt.verify(token, process.env.JWT_SECRET);
      resolve(payload);
    } catch (error) {
      resolve(error);
    }
  });
};
