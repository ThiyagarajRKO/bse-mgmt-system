const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

export const validateAppleOAuthToken = async (token) => {
  return new Promise(async (resolve, reject) => {
    // Verify the token's signature and validate claims
    try {
      // Fetch the Apple public keys
      const client = jwksClient({
        jwksUri: "https://appleid.apple.com/auth/keys",
      });

      // Retrieve the Apple public key associated with the token
      const kid = jwt.decode(token, { complete: true }).header.kid;
      //   const getKey = (header, callback) => {
      //     client.getSigningKey(header.kid, (err, key) => {
      //       const signingKey = key.publicKey || key.rsaPublicKey;
      //       callback(null, signingKey);
      //     });
      //   };

      let key = await client.getSigningKey(kid);

      jwt.verify(
        token,
        key?.publicKey || key?.rsaPublicKey,
        {
          algorithms: ["RS256"],
          //   audience: "https://piechips.com",
          issuer: "https://appleid.apple.com",
        },
        (err, decoded) => {
          if (err) {
            return reject(err?.message || err);
          }

          resolve({ userId: decoded?.sub });
        }
      );
    } catch (error) {
      // console.log(error);
      reject(error?.message || error);
    }
  });
};
