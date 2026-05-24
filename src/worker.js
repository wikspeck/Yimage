function json(data, init = {}) {
  return Response.json(data, init);
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

    // Any unknown API route returns a JSON 404 response.
    // This keeps API behavior predictable while we add more routes later.
    if (url.pathname.startsWith("/api/")) {
      return json(
        {
          ok: false,
          message: "API route not found"
        },
        {
          status: 404
        }
      );
    }

    // For now the frontend stays separate from this Worker foundation.
    // We only handle API routes here until upload support is added later.
    return json(
      {
        ok: false,
        message: "Not found"
      },
      {
        status: 404
      }
    );
  }
};
