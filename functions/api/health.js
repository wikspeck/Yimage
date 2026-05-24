export async function onRequest() {
  return Response.json({
    ok: true,
    message: "Yimage API is working"
  });
}
