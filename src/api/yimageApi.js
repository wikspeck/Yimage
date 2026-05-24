export async function uploadImage(file) {
  // This simulates the future upload request.
  // Later this function will call POST /api/upload from a Cloudflare Pages Function.
  await new Promise((resolve) => {
    window.setTimeout(resolve, 1200);
  });

  return {
    ok: true,
    fileName: file.name,
    message: "Upload complete. Cloudflare backend connection comes next."
  };
}
