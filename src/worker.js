function json(data, init = {}) {
  return Response.json(data, init);
}

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getImageKey(id, extension) {
  return `uploads/${id}.${extension}`;
}

function error(message, status = 400) {
  return json(
    {
      ok: false,
      message
    },
    { status }
  );
}

async function findImageObject(bucket, id) {
  const extensions = ["jpg", "png", "webp", "gif"];

  for (const extension of extensions) {
    const key = getImageKey(id, extension);
    const object = await bucket.get(key);

    if (object) {
      return { key, object };
    }
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // This is the first backend health endpoint for the Worker API.
    // It lets us confirm the Worker is deployed and responding correctly.
    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        message: "Yimage Worker API is working"
      });
    }

    // This temporary route confirms the Worker can write to the configured R2 bucket.
    // Later, real image uploads will use the same env.YIMAGE_BUCKET binding.
    if (url.pathname === "/api/r2-test") {
      const key = "test/hello.txt";

      await env.YIMAGE_BUCKET.put(key, "Hello from Yimage R2");

      return json({
        ok: true,
        message: "R2 write test successful",
        key
      });
    }

    // This is the first real upload endpoint.
    // It accepts multipart form data, validates the file, and stores it in R2.
    if (url.pathname === "/api/upload") {
      if (request.method !== "POST") {
        return error("Method not allowed", 405);
      }

      const formData = await request.formData();
      const image = formData.get("image");

      if (!image) {
        return error("Image file is required");
      }

      if (!(image instanceof File)) {
        return error("Uploaded image is invalid");
      }

      if (!ALLOWED_IMAGE_TYPES[image.type]) {
        return error("Only JPG, PNG, WEBP, and GIF images are allowed");
      }

      if (image.size > MAX_FILE_SIZE) {
        return error("Image must be 10 MB or smaller");
      }

      const id = crypto.randomUUID();
      const extension = ALLOWED_IMAGE_TYPES[image.type];
      const key = getImageKey(id, extension);

      await env.YIMAGE_BUCKET.put(key, image.stream(), {
        httpMetadata: {
          contentType: image.type
        }
      });

      return json({
        ok: true,
        id,
        key,
        imageUrl: `/api/image/${id}`
      });
    }

    // This route reads an uploaded image back from R2 using its generated id.
    // Since the URL does not include the extension, we try the allowed formats in order.
    if (url.pathname.startsWith("/api/image/")) {
      if (request.method !== "GET") {
        return error("Method not allowed", 405);
      }

      const id = url.pathname.replace("/api/image/", "").trim();

      if (!id) {
        return error("Image id is required");
      }

      const match = await findImageObject(env.YIMAGE_BUCKET, id);

      if (!match) {
        return error("Image not found", 404);
      }

      const headers = new Headers();
      const contentType = match.object.httpMetadata?.contentType || "application/octet-stream";
      headers.set("Content-Type", contentType);

      return new Response(match.object.body, {
        headers
      });
    }

    // Any unknown API route returns a JSON 404 response.
    // This keeps API behavior predictable while we add more routes later.
    if (url.pathname.startsWith("/api/")) {
      return error("API route not found", 404);
    }

    // For now the frontend stays separate from this Worker foundation.
    // We only handle API routes here until upload support is added later.
    return error("Not found", 404);
  }
};
