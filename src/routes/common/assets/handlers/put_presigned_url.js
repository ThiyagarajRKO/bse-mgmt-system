import { GetUploadSignedURL } from "../../../../utils/s3";

const Directories = {
  circle: "Circles",
  topic: "Topics",
  post: "Posts",
  assets: "Assets",
  profile: "Profile",
  chip: "Chips",
  comment: "Comment",
  others: "Others",
};

export const GetUploadS3URL = ({ file_names, type }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (file_names?.length == 0) {
        return reject({ message: "File names should not be empty" });
      }

      if (!type) {
        return reject({ message: "Type should not be empty" });
      }

      if (!Object.keys(Directories).includes(type)) {
        return reject({ message: "Invalid type!" });
      }

      let signed_url_array = [];

      await Promise.all(
        file_names?.map(async (file_name) => {
          if (file_name && file_name?.split(".")?.length >= 2) {
            let masked_file_name =
              file_name.substring(0, file_name.lastIndexOf("."))+"-"+Date.now()+file_name.substring(file_name.lastIndexOf(".") , file_name.length);
            let { secured_url, file_url } = await GetUploadSignedURL({
              file_name: Directories[type] + "/" + masked_file_name,
            });

            signed_url_array.push({ file_name, secured_url, file_url });
          }
        })
      );

      resolve({
        data: { count: signed_url_array?.length, rows: signed_url_array },
      });
    } catch (err) {
      reject(err);
    }
  });
};
