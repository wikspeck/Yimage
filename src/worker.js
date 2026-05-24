const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_COMMENT_LENGTH = 400;
const SESSION_COOKIE = "yimage_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const POST_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Cloudflare Workers currently reject PBKDF2 iteration counts above 100000.
// We store the iteration count inside each hash string so future verification
// stays in sync with whatever limit/version created that password.
const PBKDF2_ITERATIONS = 100000;

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

function success(data, init = {}) {
  return json(
    {
      ok: true,
      ...data
    },
    init
  );
}

function fail(message, status = 400, details) {
  return json(
    {
      ok: false,
      message,
      ...(details ? { details } : {})
    },
    { status }
  );
}

function getCookie(request, name) {
  const rawCookie = request.headers.get("Cookie") || "";
  const parts = rawCookie.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function buildSessionCookie(token, maxAgeSeconds = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeUsername(value) {
  return normalizeText(value);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(username);
}

function toIsoDate(value = Date.now()) {
  return new Date(value).toISOString();
}

function createId(prefix = "") {
  return `${prefix}${crypto.randomUUID().replace(/-/g, "")}`;
}

function createPostId() {
  const values = new Uint8Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (item) => POST_ID_CHARS[item % POST_ID_CHARS.length]).join("");
}

function getImageKey(id, extension) {
  return `uploads/${id}.${extension}`;
}

function getImageFilename(post) {
  const extension = ALLOWED_IMAGE_TYPES[post.imageMimeType] || "jpg";
  const safeTitle = normalizeText(post.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "yimage";

  return `${safeTitle}-${post.id}.${extension}`;
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt
  };
}

function toPostResponse(post, viewerHasLiked = false) {
  return {
    id: post.id,
    userId: post.userId,
    authorUsername: post.authorUsername,
    title: post.title,
    description: post.description || "",
    imageKey: post.imageKey,
    imageUrl: `/api/image/${post.id}`,
    createdAt: post.createdAt,
    likeCount: Number(post.likeCount || 0),
    commentsCount: Number(post.commentsCount || 0),
    views: Number(post.views || 0),
    hasLiked: Boolean(viewerHasLiked)
  };
}

async function sha256Hex(input) {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let output = "";
  bytes.forEach((item) => {
    output += String.fromCharCode(item);
  });
  return btoa(output);
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return `${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(derivedBits))}`;
}

async function verifyPassword(password, storedHash) {
  const [iterationsText, saltBase64, expectedHash] = String(storedHash || "").split("$");
  const iterations = Number(iterationsText);

  if (!iterations || !saltBase64 || !expectedHash) {
    return false;
  }

  if (iterations > PBKDF2_ITERATIONS) {
    console.error("Stored password hash uses unsupported PBKDF2 iterations in Cloudflare Workers.", {
      iterations
    });
    return false;
  }

  try {
    const salt = Uint8Array.from(atob(saltBase64), (character) => character.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    return bytesToBase64(new Uint8Array(derivedBits)) === expectedHash;
  } catch (error) {
    console.error("Password verification failed.", error);
    return false;
  }
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

async function getCurrentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `
      SELECT
        sessions.id AS sessionId,
        sessions.expires_at AS expiresAt,
        users.id,
        users.username,
        users.email,
        users.created_at AS createdAt
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
      LIMIT 1
    `
  )
    .bind(tokenHash)
    .first();

  if (!row) {
    return null;
  }

  if (new Date(row.expiresAt).getTime() <= Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(row.sessionId).run();
    return null;
  }

  return row;
}

async function requireUser(request, env) {
  const user = await getCurrentUser(request, env);

  if (!user) {
    throw fail("You must be logged in to do that.", 401);
  }

  return user;
}

async function getPostRecord(env, postId) {
  const row = await env.DB.prepare(
    `
      SELECT
        posts.id,
        posts.author_id AS userId,
        users.username AS authorUsername,
        posts.title,
        COALESCE(posts.description, '') AS description,
        posts.image_key AS imageKey,
        COALESCE(posts.image_mime_type, 'application/octet-stream') AS imageMimeType,
        posts.created_at AS createdAt,
        COALESCE(posts.like_count, 0) AS likeCount,
        COALESCE(posts.comments_count, 0) AS commentsCount,
        COALESCE(posts.views, 0) AS views
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
      WHERE posts.id = ?
      LIMIT 1
    `
  )
    .bind(postId)
    .first();

  return row || null;
}

async function getViewerLikeMap(env, userId, postIds) {
  if (!userId || !postIds.length) {
    return {};
  }

  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `SELECT post_id AS postId FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`
  )
    .bind(userId, ...postIds)
    .all();

  const result = {};
  (rows.results || []).forEach((row) => {
    result[row.postId] = true;
  });
  return result;
}

async function listPosts(env, userId) {
  const rows = await env.DB.prepare(
    `
      SELECT
        posts.id,
        posts.author_id AS userId,
        users.username AS authorUsername,
        posts.title,
        COALESCE(posts.description, '') AS description,
        posts.image_key AS imageKey,
        COALESCE(posts.image_mime_type, 'application/octet-stream') AS imageMimeType,
        posts.created_at AS createdAt,
        COALESCE(posts.like_count, 0) AS likeCount,
        COALESCE(posts.comments_count, 0) AS commentsCount,
        COALESCE(posts.views, 0) AS views
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
      ORDER BY posts.created_at DESC, posts.id DESC
      LIMIT 50
    `
  ).all();

  const posts = rows.results || [];
  const likesByPost = await getViewerLikeMap(env, userId, posts.map((post) => post.id));

  return posts.map((post) => toPostResponse(post, likesByPost[post.id]));
}

async function createSession(env, userId) {
  const token = createId("sess_");
  const tokenHash = await sha256Hex(token);
  const sessionId = createId("session_");
  const createdAt = toIsoDate();
  const expiresAt = toIsoDate(Date.now() + SESSION_TTL_SECONDS * 1000);

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(sessionId, userId, tokenHash, createdAt, expiresAt)
    .run();

  return token;
}

async function handleSignup(request, env) {
  const body = await parseJsonBody(request);
  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!isValidUsername(username)) {
    return fail("Username must be 3 to 24 characters and use only letters, numbers, or underscores.");
  }

  if (!isValidEmail(email)) {
    return fail("Please enter a valid email address.");
  }

  if (password.length < 8) {
    return fail("Password must be at least 8 characters.");
  }

  const existingUser = await env.DB.prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1")
    .bind(username, email)
    .first();

  if (existingUser) {
    return fail("That username or email is already in use.", 409);
  }

  const userId = createId("user_");
  const createdAt = toIsoDate();
  const passwordHash = await hashPassword(password);

  await env.DB.prepare(
    "INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, username, email, passwordHash, createdAt)
    .run();

  const token = await createSession(env, userId);

  return success(
    {
      user: toPublicUser({
        id: userId,
        username,
        email,
        createdAt
      })
    },
    {
      status: 201,
      headers: {
        "Set-Cookie": buildSessionCookie(token)
      }
    }
  );
}

async function handleLogin(request, env) {
  const body = await parseJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return fail("Email and password are required.");
  }

  const user = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        email,
        password_hash AS passwordHash,
        created_at AS createdAt
      FROM users
      WHERE email = ?
      LIMIT 1
    `
  )
    .bind(email)
    .first();

  if (!user) {
    return fail("Invalid email or password.", 401);
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return fail("Invalid email or password.", 401);
  }

  const token = await createSession(env, user.id);

  return success(
    {
      user: toPublicUser(user)
    },
    {
      headers: {
        "Set-Cookie": buildSessionCookie(token)
      }
    }
  );
}

async function handleLogout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);

  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }

  return success(
    {},
    {
      headers: {
        "Set-Cookie": clearSessionCookie()
      }
    }
  );
}

async function handleMe(request, env) {
  const user = await getCurrentUser(request, env);
  return success({
    user: user ? toPublicUser(user) : null
  });
}

async function handleCreatePost(request, env) {
  const user = await requireUser(request, env);
  const formData = await request.formData();
  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const image = formData.get("image");

  if (!title) {
    return fail("Title is required.");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return fail(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return fail(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
  }

  if (!(image instanceof File)) {
    return fail("Image file is required.");
  }

  if (!ALLOWED_IMAGE_TYPES[image.type]) {
    return fail("Only JPG, PNG, WEBP, and GIF images are allowed.");
  }

  if (image.size > MAX_FILE_SIZE) {
    return fail("Image must be 10 MB or smaller.");
  }

  let postId = "";
  let foundAvailableId = false;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    postId = createPostId();
    const existingPost = await env.DB.prepare("SELECT id FROM posts WHERE id = ? LIMIT 1").bind(postId).first();
    if (!existingPost) {
      foundAvailableId = true;
      break;
    }
  }

  if (!foundAvailableId) {
    return fail("Could not create post id.", 500);
  }

  const extension = ALLOWED_IMAGE_TYPES[image.type];
  const imageKey = getImageKey(postId, extension);
  const createdAt = toIsoDate();

  await env.YIMAGE_BUCKET.put(imageKey, image.stream(), {
    httpMetadata: {
      contentType: image.type
    }
  });

  await env.DB.prepare(
    `
      INSERT INTO posts (
        id,
        author_id,
        title,
        description,
        image_key,
        image_mime_type,
        created_at,
        like_count,
        comments_count,
        views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
    `
  )
    .bind(postId, user.id, title, description, imageKey, image.type, createdAt)
    .run();

  const post = await getPostRecord(env, postId);
  return success(
    {
      post: toPostResponse(post, false)
    },
    { status: 201 }
  );
}

async function handleListPosts(request, env) {
  const user = await getCurrentUser(request, env);
  const posts = await listPosts(env, user?.id);
  return success({ posts });
}

async function handleGetPost(request, env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return fail("Post not found.", 404);
  }

  await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").bind(postId).run();
  post.views = Number(post.views || 0) + 1;

  const user = await getCurrentUser(request, env);
  const likes = await getViewerLikeMap(env, user?.id, [postId]);

  return success({
    post: toPostResponse(post, likes[postId])
  });
}

async function handleLike(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);

  if (!post) {
    return fail("Post not found.", 404);
  }

  const existingLike = await env.DB.prepare("SELECT user_id FROM likes WHERE user_id = ? AND post_id = ? LIMIT 1")
    .bind(user.id, postId)
    .first();

  let hasLiked = false;

  if (existingLike) {
    await env.DB.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").bind(user.id, postId).run();
    await env.DB.prepare("UPDATE posts SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?")
      .bind(postId)
      .run();
  } else {
    await env.DB.prepare("INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)")
      .bind(user.id, postId, toIsoDate())
      .run();
    await env.DB.prepare("UPDATE posts SET like_count = like_count + 1 WHERE id = ?").bind(postId).run();
    hasLiked = true;
  }

  const updatedPost = await getPostRecord(env, postId);
  return success({
    post: toPostResponse(updatedPost, hasLiked)
  });
}

async function handleCommentsList(env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return fail("Post not found.", 404);
  }

  const rows = await env.DB.prepare(
    `
      SELECT
        comments.id,
        comments.post_id AS postId,
        comments.author_id AS authorId,
        users.username AS authorUsername,
        comments.text,
        comments.created_at AS createdAt
      FROM comments
      INNER JOIN users ON users.id = comments.author_id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at ASC, comments.id ASC
    `
  )
    .bind(postId)
    .all();

  return success({
    comments: rows.results || []
  });
}

async function handleCommentCreate(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);

  if (!post) {
    return fail("Post not found.", 404);
  }

  const body = await parseJsonBody(request);
  const text = normalizeText(body.text);

  if (!text) {
    return fail("Comment cannot be empty.");
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    return fail(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`);
  }

  const comment = {
    id: createId("comment_"),
    postId,
    authorId: user.id,
    authorUsername: user.username,
    text,
    createdAt: toIsoDate()
  };

  await env.DB.prepare("INSERT INTO comments (id, post_id, author_id, text, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(comment.id, comment.postId, comment.authorId, comment.text, comment.createdAt)
    .run();

  await env.DB.prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?").bind(postId).run();

  return success(
    {
      comment
    },
    { status: 201 }
  );
}

async function handleImage(env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return fail("Image not found.", 404);
  }

  const object = await env.YIMAGE_BUCKET.get(post.imageKey);

  if (!object) {
    return fail("Image not found.", 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": post.imageMimeType || object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

async function handleDownload(env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return fail("Post not found.", 404);
  }

  const object = await env.YIMAGE_BUCKET.get(post.imageKey);

  if (!object) {
    return fail("Image not found.", 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": post.imageMimeType || object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${getImageFilename(post)}"`,
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return success({
          message: "Yimage Worker API is working"
        });
      }

      if (url.pathname === "/api/auth/signup" && request.method === "POST") {
        return await handleSignup(request, env);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        return await handleLogin(request, env);
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        return await handleLogout(request, env);
      }

      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        return await handleMe(request, env);
      }

      if ((url.pathname === "/api/upload" || url.pathname === "/api/posts") && request.method === "POST") {
        return await handleCreatePost(request, env);
      }

      if (url.pathname === "/api/posts" && request.method === "GET") {
        return await handleListPosts(request, env);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/like") && request.method === "POST") {
        return await handleLike(request, env, url.pathname.split("/")[3]);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/comments") && request.method === "GET") {
        return await handleCommentsList(env, url.pathname.split("/")[3]);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/comments") && request.method === "POST") {
        return await handleCommentCreate(request, env, url.pathname.split("/")[3]);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/download") && request.method === "GET") {
        return await handleDownload(env, url.pathname.split("/")[3]);
      }

      if (url.pathname.startsWith("/api/posts/") && request.method === "GET") {
        return await handleGetPost(request, env, url.pathname.replace("/api/posts/", "").trim());
      }

      if (url.pathname.startsWith("/api/image/") && request.method === "GET") {
        return await handleImage(env, url.pathname.replace("/api/image/", "").trim());
      }

      if (url.pathname.startsWith("/api/")) {
        return fail("API route not found.", 404);
      }

      return fail("Not found.", 404);
    } catch (thrown) {
      if (thrown instanceof Response) {
        return thrown;
      }

      console.error("Unhandled Worker error", {
        method: request.method,
        pathname: url.pathname,
        error: thrown instanceof Error ? thrown.message : String(thrown)
      });
      return fail(thrown?.message || "Unexpected server error.", 500);
    }
  }
};
