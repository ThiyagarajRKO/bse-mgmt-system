import aws from "aws-sdk";
import { createReadStream } from "fs";

// require("dotenv").config();

aws.config.update({
  region: process.env.S3_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});
const S3_BUCKET = process.env.S3_BUCKET_NAME;

const s3 = new aws.S3({
  signatureVersion: "v4",
});

export const Upload = (fileName, fileLoc) => {
  return new Promise(async (resolve, reject) => {
    try {
      const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: createReadStream(fileLoc),
      };

      s3.putObject(s3Params)
        .promise()
        .then(() => {
          let file_url = `https://${process.env.S3_BUCKET_URL}/${fileName}`;
          resolve({ data, file_url });
        })
        .catch(reject);
    } catch (error) {
      console.log("Error while uploading file to S3 : ", error);
      reject({ message: error.message });
    }
  });
};

export const GetUploadSignedURL = ({ file_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const s3Params = {
        Bucket: S3_BUCKET,
        Key: file_name,
        Expires: 60 * 60,
      };

      let secured_url = await s3.getSignedUrlPromise("putObject", s3Params);

      let file_url = `${process.env.S3_BUCKET_URL}/${file_name}`;
      resolve({ secured_url, file_url });
    } catch (error) {
      console.log("Error while generating presigned s3 url : ", error);
      reject({ message: error.message });
    }
  });
};
