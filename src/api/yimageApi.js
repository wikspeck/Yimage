async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);

    if (!data) {
      throw new Error("The server returned invalid JSON.");
    }

    if (!response.ok || data.ok === false) {
      throw new Error(data.message || `Request failed with status ${response.status}.`);
    }

    return data;
  }

  const text = await response.text().catch(() => "");
  throw new Error(text.trim() || `The server returned ${response.status} ${response.statusText || "response"}.`);
}

async function request(url, init = {}) {
  try {
    const response = await fetch(url, {
      credentials: "include",
      ...init
    });

    return readResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Could not reach the Yimage API.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Could not reach the Yimage API.");
  }
}

export async function createPost({ title, description, imageFile }) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("image", imageFile);

  const data = await request("/api/posts", {
    method: "POST",
    body: formData
  });

  return data.post;
}

export async function getPosts(sort = "hot") {
  const data = await request(`/api/posts?sort=${encodeURIComponent(sort)}`);
  return data.posts;
}

export async function getPost(id) {
  const data = await request(`/api/posts/${id}`);
  return data.post;
}

export async function getPostComments(id) {
  const data = await request(`/api/posts/${id}/comments`);
  return data.comments;
}

export async function loginUser({ email, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  return data.user;
}

export async function signupUser({ username, email, password }) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, password })
  });

  return data.user;
}

export async function logoutUser() {
  return request("/api/auth/logout", {
    method: "POST"
  });
}

export async function getCurrentUser() {
  const data = await request("/api/auth/me");
  return data.user;
}

export async function likePost(id) {
  const data = await request(`/api/posts/${id}/like`, {
    method: "POST"
  });

  return data.post;
}

export async function voteOnPost(id, vote) {
  const data = await request(`/api/posts/${id}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ vote })
  });

  return data;
}

export async function repostPost(id) {
  const data = await request(`/api/posts/${id}/repost`, {
    method: "POST"
  });

  return data;
}

export async function createComment(id, text) {
  const data = await request(`/api/posts/${id}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  return data.comment;
}

export function getDownloadUrl(id) {
  return `/api/posts/${id}/download`;
}
