import { GetUploadS3URL } from "./handlers/put_presigned_url";

// Schema
import { getUploadURLSchema } from "./schema/put_presigned_url";

export const assetsRoutes = (fastify, opts, done) => {
  fastify.post("/upload/url/get", getUploadURLSchema, async (req, reply) => {
    try {
      let result = await GetUploadS3URL(req?.body, fastify);
      reply.code(200).send({
        success: true,
        message:
          result?.message ||
          "S3 Upload URL has been generated successfully and will be valid for 1 hour",
        data: result?.data,
      });
    } catch (err) {
      reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  done();
};

export default assetsRoutes;
