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

export async function createPost({ title, description, imageFile, categoryId = "", hashtags = "", turnstileToken = "" }) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("categoryId", categoryId);
  formData.append("hashtags", hashtags);
  formData.append("turnstileToken", turnstileToken);
  formData.append("image", imageFile);

  const data = await request("/api/posts", {
    method: "POST",
    body: formData
  });

  return data.post;
}

export async function getPosts(options = {}) {
  const params = new URLSearchParams();
  if (options.sort) params.set("sort", options.sort);
  if (options.query) params.set("query", options.query);
  if (options.category) params.set("category", options.category);
  if (options.hashtag) params.set("hashtag", options.hashtag);
  const query = params.toString();
  const data = await request(`/api/posts${query ? `?${query}` : ""}`);
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

export async function loginUser({ email, password, turnstileToken }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password, turnstileToken })
  });

  return data.user;
}

export async function signupUser({ username, email, password, turnstileToken }) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, password, turnstileToken })
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

export async function updateProfile({ displayName, bio, avatarUrl }) {
  const data = await request("/api/me/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ displayName, bio, avatarUrl })
  });

  return data.user;
}

export async function uploadProfileAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const data = await request("/api/me/avatar", {
    method: "POST",
    body: formData
  });

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

export async function getCategories() {
  const data = await request("/api/categories");
  return data.categories;
}

export async function createComment(id, text, turnstileToken) {
  const data = await request(`/api/posts/${id}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, turnstileToken })
  });

  return data.comment;
}

export async function replyToComment(postId, text, parentId, turnstileToken) {
  const data = await request(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, parentId, turnstileToken })
  });

  return data.comment;
}

export async function voteOnComment(id, vote) {
  const data = await request(`/api/comments/${id}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ vote })
  });
  return data.comment;
}

export async function getUserProfile(username) {
  const data = await request(`/api/users/${encodeURIComponent(username)}`);
  return data;
}

export async function toggleFollow(username) {
  const data = await request(`/api/users/${encodeURIComponent(username)}/follow`, {
    method: "POST"
  });
  return data.profile;
}

export async function createReport(payload) {
  return request("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function getModerationReports() {
  return request("/api/mod/reports");
}

export async function applyModerationAction(payload) {
  return request("/api/mod/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export function getDownloadUrl(id) {
  return `/api/posts/${id}/download`;
}
