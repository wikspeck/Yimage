async function readJson(response) {
  const data = await response.json().catch(() => ({
    ok: false,
    message: "Unexpected server response"
  }));

  if (!response.ok || data.ok === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function createPost({ title, description, imageFile }) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("image", imageFile);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  return readJson(response);
}

export async function getPosts() {
  const response = await fetch("/api/posts");
  const data = await readJson(response);
  return data.posts;
}

export async function getPost(id) {
  const response = await fetch(`/api/posts/${id}`);
  const data = await readJson(response);
  return data.post;
}
