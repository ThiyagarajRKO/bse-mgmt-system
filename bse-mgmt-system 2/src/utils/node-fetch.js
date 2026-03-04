import fetch from "node-fetch";

export const GetResponse = (url, method, headers, body) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!headers) {
        headers = {
          "content-type": "application/json",
        };
      } else if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      let data = await response?.json();

      if (typeof data != "object") {
        data = JsonParser(data) ? JSON.parse(data) : { data };
        return resolve({ data });
      }

      resolve({ data });
    } catch (err) {
      reject(err);
    }
  });
};

export const GetStreamResponse = (url, method, headers, body, fileLoc) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!headers) {
        headers = {
          "content-type": "application/json",
        };
      } else if (!headers["content-type"]) {
        headers["content-type"] = "application/json";
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      let inStream = createWriteStream(fileLoc);

      // if (selector)
      //   bfj.match(response.body, selector).pipe(inStream).on("end", resolve);
      // else response.body.pipe(inStream);

      response.body.pipe(inStream);

      response.body.on("end", resolve);

      // resolve();
    } catch (err) {
      reject(err);
    }
  });
};

const JsonParser = (data) => {
  try {
    JSON.parse(data);
    return true;
  } catch (err) {
    return false;
  }
};
