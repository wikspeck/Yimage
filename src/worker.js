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

function json(data, init = {}) {
  return Response.json(data, init);
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return String(value || "").trim();
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
  const buffer = new Uint8Array(4);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (item) => POST_ID_CHARS[item % POST_ID_CHARS.length]).join("");
}

function getImageKey(id, extension) {
  return `uploads/${id}.${extension}`;
}

function getImageFilename(post) {
  const extension = ALLOWED_IMAGE_TYPES[post.imageMimeType] || "jpg";
  const safeTitle = (post.title || "yimage")
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
    createdAt: user.createdAt,
    stats: {
      posts: user.posts,
      upvotesReceived: user.upvotesReceived,
      downloadsReceived: user.downloadsReceived
    }
  };
}

function toPostResponse(post, viewerVote = null) {
  return {
    id: post.id,
    authorId: post.authorId,
    authorUsername: post.authorUsername,
    title: post.title,
    description: post.description,
    imageKey: post.imageKey,
    imageUrl: `/api/image/${post.id}`,
    createdAt: post.createdAt,
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    score: post.score,
    downloads: post.downloads,
    views: post.views,
    repostCount: post.repostCount,
    commentsCount: post.commentsCount,
    viewerVote
  };
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (item) => item.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let text = "";
  bytes.forEach((item) => {
    text += String.fromCharCode(item);
  });
  return btoa(text);
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const iterations = 120000;
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

  const hash = bytesToBase64(new Uint8Array(derivedBits));
  return `${iterations}$${bytesToBase64(salt)}$${hash}`;
}

async function verifyPassword(password, storedHash) {
  const [iterationsText, saltBase64, expectedHash] = String(storedHash || "").split("$");
  const iterations = Number(iterationsText);

  if (!iterations || !saltBase64 || !expectedHash) {
    return false;
  }

  const saltBytes = Uint8Array.from(atob(saltBase64), (character) => character.charCodeAt(0));
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
      salt: saltBytes,
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  const actualHash = bytesToBase64(new Uint8Array(derivedBits));
  return actualHash === expectedHash;
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function getRecentBoost(createdAt) {
  const ageHours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  return Math.max(0, 48 - ageHours);
}

function getHotScore(post) {
  return (
    post.score * 3 +
    post.repostCount * 5 +
    post.commentsCount * 2 +
    post.downloads +
    getRecentBoost(post.createdAt)
  );
}

async function getUserBySession(request, env) {
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
        users.created_at AS createdAt,
        users.posts_count AS posts,
        users.upvotes_received AS upvotesReceived,
        users.downloads_received AS downloadsReceived
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
  const user = await getUserBySession(request, env);

  if (!user) {
    throw new Response(
      JSON.stringify({
        ok: false,
        message: "You must be logged in to do that."
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  return user;
}

async function getPostRecord(env, postId) {
  const row = await env.DB.prepare(
    `
      SELECT
        posts.id,
        posts.author_id AS authorId,
        users.username AS authorUsername,
        posts.title,
        posts.description,
        posts.image_key AS imageKey,
        posts.image_mime_type AS imageMimeType,
        posts.created_at AS createdAt,
        posts.upvotes,
        posts.downvotes,
        posts.score,
        posts.downloads,
        posts.views,
        posts.repost_count AS repostCount,
        posts.comments_count AS commentsCount
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

async function getViewerVote(env, postId, userId) {
  if (!userId) {
    return null;
  }

  const vote = await env.DB.prepare("SELECT vote FROM votes WHERE post_id = ? AND user_id = ? LIMIT 1")
    .bind(postId, userId)
    .first();

  return vote?.vote || null;
}

async function listPosts(env, userId, sort = "hot") {
  const rows = await env.DB.prepare(
    `
      SELECT
        posts.id,
        posts.author_id AS authorId,
        users.username AS authorUsername,
        posts.title,
        posts.description,
        posts.image_key AS imageKey,
        posts.image_mime_type AS imageMimeType,
        posts.created_at AS createdAt,
        posts.upvotes,
        posts.downvotes,
        posts.score,
        posts.downloads,
        posts.views,
        posts.repost_count AS repostCount,
        posts.comments_count AS commentsCount
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
    `
  ).all();

  const records = (rows.results || []).map((row) => ({
    ...row
  }));

  const votesByPost = {};

  if (userId && records.length) {
    const placeholders = records.map(() => "?").join(", ");
    const voteRows = await env.DB.prepare(
      `SELECT post_id AS postId, vote FROM votes WHERE user_id = ? AND post_id IN (${placeholders})`
    )
      .bind(userId, ...records.map((post) => post.id))
      .all();

    (voteRows.results || []).forEach((row) => {
      votesByPost[row.postId] = row.vote;
    });
  }

  const sorted = records.sort((left, right) => {
    if (sort === "new") {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (sort === "top") {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.downloads - left.downloads;
    }

    const hotDifference = getHotScore(right) - getHotScore(left);

    if (hotDifference !== 0) {
      return hotDifference;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return sorted.slice(0, 50).map((post) => toPostResponse(post, votesByPost[post.id] || null));
}

async function handleSignup(request, env) {
  const body = await parseJsonBody(request);
  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!isValidUsername(username)) {
    return error("Username must be 3 to 24 characters and use only letters, numbers, or underscores.");
  }

  if (!isValidEmail(email)) {
    return error("Please enter a valid email address.");
  }

  if (password.length < 8) {
    return error("Password must be at least 8 characters.");
  }

  const existingUser = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1"
  )
    .bind(username, email)
    .first();

  if (existingUser) {
    return error("That username or email is already in use.", 409);
  }

  const userId = createId("user_");
  const passwordHash = await hashPassword(password);
  const createdAt = toIsoDate();

  await env.DB.prepare(
    `
      INSERT INTO users (
        id,
        username,
        email,
        password_hash,
        created_at,
        posts_count,
        upvotes_received,
        downloads_received
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 0)
    `
  )
    .bind(userId, username, email, passwordHash, createdAt)
    .run();

  const token = createId("sess_");
  const tokenHash = await sha256Hex(token);
  const sessionId = createId("session_");
  const expiresAt = toIsoDate(Date.now() + SESSION_TTL_SECONDS * 1000);

  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(sessionId, userId, tokenHash, createdAt, expiresAt)
    .run();

  const user = {
    id: userId,
    username,
    email,
    createdAt,
    posts: 0,
    upvotesReceived: 0,
    downloadsReceived: 0
  };

  return json(
    {
      ok: true,
      user: toPublicUser(user)
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

  const user = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        email,
        password_hash AS passwordHash,
        created_at AS createdAt,
        posts_count AS posts,
        upvotes_received AS upvotesReceived,
        downloads_received AS downloadsReceived
      FROM users
      WHERE email = ?
      LIMIT 1
    `
  )
    .bind(email)
    .first();

  if (!user) {
    return error("Invalid email or password.", 401);
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    return error("Invalid email or password.", 401);
  }

  const token = createId("sess_");
  const tokenHash = await sha256Hex(token);
  const sessionId = createId("session_");
  const createdAt = toIsoDate();
  const expiresAt = toIsoDate(Date.now() + SESSION_TTL_SECONDS * 1000);

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(sessionId, user.id, tokenHash, createdAt, expiresAt)
    .run();

  return json(
    {
      ok: true,
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

  return json(
    {
      ok: true
    },
    {
      headers: {
        "Set-Cookie": clearSessionCookie()
      }
    }
  );
}

async function handleCurrentUser(request, env) {
  const user = await getUserBySession(request, env);

  return json({
    ok: true,
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
    return error("Title is required.");
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return error(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
  }

  if (!(image instanceof File)) {
    return error("Image file is required.");
  }

  if (!ALLOWED_IMAGE_TYPES[image.type]) {
    return error("Only JPG, PNG, WEBP, and GIF images are allowed.");
  }

  if (image.size > MAX_FILE_SIZE) {
    return error("Image must be 10 MB or smaller.");
  }

  let postId = "";
  let existingPost = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    postId = createPostId();
    existingPost = await env.DB.prepare("SELECT id FROM posts WHERE id = ? LIMIT 1").bind(postId).first();

    if (!existingPost) {
      break;
    }
  }

  if (existingPost) {
    return error("Could not generate a unique post id. Please try again.", 500);
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
        upvotes,
        downvotes,
        score,
        views,
        downloads,
        repost_count,
        comments_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0)
    `
  )
    .bind(postId, user.id, title, description, imageKey, image.type, createdAt)
    .run();

  await env.DB.prepare("UPDATE users SET posts_count = posts_count + 1 WHERE id = ?").bind(user.id).run();

  const post = await getPostRecord(env, postId);

  return json(
    {
      ok: true,
      post: toPostResponse(post, null)
    },
    {
      status: 201
    }
  );
}

async function handleListPosts(request, env) {
  const url = new URL(request.url);
  const sort = ["hot", "new", "top"].includes(url.searchParams.get("sort")) ? url.searchParams.get("sort") : "hot";
  const user = await getUserBySession(request, env);
  const posts = await listPosts(env, user?.id, sort);

  return json({
    ok: true,
    posts
  });
}

async function handleGetPost(request, env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Post not found.", 404);
  }

  await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").bind(postId).run();
  post.views += 1;

  const user = await getUserBySession(request, env);
  const viewerVote = await getViewerVote(env, postId, user?.id);

  return json({
    ok: true,
    post: toPostResponse(post, viewerVote)
  });
}

async function handleVote(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Post not found.", 404);
  }

  const body = await parseJsonBody(request);
  const nextVote = body.vote === "up" || body.vote === "down" ? body.vote : "";

  if (!nextVote) {
    return error('Vote must be "up" or "down".');
  }

  const currentVote = await env.DB.prepare("SELECT vote FROM votes WHERE post_id = ? AND user_id = ? LIMIT 1")
    .bind(postId, user.id)
    .first();

  let upvoteDelta = 0;
  let downvoteDelta = 0;
  let scoreDelta = 0;
  let userUpvoteDelta = 0;

  if (!currentVote) {
    await env.DB.prepare("INSERT INTO votes (post_id, user_id, vote, created_at) VALUES (?, ?, ?, ?)")
      .bind(postId, user.id, nextVote, toIsoDate())
      .run();

    if (nextVote === "up") {
      upvoteDelta = 1;
      scoreDelta = 1;
      userUpvoteDelta = 1;
    } else {
      downvoteDelta = 1;
      scoreDelta = -1;
    }
  } else if (currentVote.vote === nextVote) {
    await env.DB.prepare("DELETE FROM votes WHERE post_id = ? AND user_id = ?").bind(postId, user.id).run();

    if (nextVote === "up") {
      upvoteDelta = -1;
      scoreDelta = -1;
      userUpvoteDelta = -1;
    } else {
      downvoteDelta = -1;
      scoreDelta = 1;
    }
  } else {
    await env.DB.prepare("UPDATE votes SET vote = ?, created_at = ? WHERE post_id = ? AND user_id = ?")
      .bind(nextVote, toIsoDate(), postId, user.id)
      .run();

    if (nextVote === "up") {
      upvoteDelta = 1;
      downvoteDelta = -1;
      scoreDelta = 2;
      userUpvoteDelta = 1;
    } else {
      upvoteDelta = -1;
      downvoteDelta = 1;
      scoreDelta = -2;
      userUpvoteDelta = -1;
    }
  }

  await env.DB.prepare(
    `
      UPDATE posts
      SET upvotes = upvotes + ?, downvotes = downvotes + ?, score = score + ?
      WHERE id = ?
    `
  )
    .bind(upvoteDelta, downvoteDelta, scoreDelta, postId)
    .run();

  if (userUpvoteDelta !== 0) {
    await env.DB.prepare("UPDATE users SET upvotes_received = upvotes_received + ? WHERE id = ?")
      .bind(userUpvoteDelta, post.authorId)
      .run();
  }

  const updatedPost = await getPostRecord(env, postId);
  const viewerVote = await getViewerVote(env, postId, user.id);

  return json({
    ok: true,
    post: toPostResponse(updatedPost, viewerVote)
  });
}

async function handleRepost(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Post not found.", 404);
  }

  const dayAgo = toIsoDate(Date.now() - 24 * 60 * 60 * 1000);
  const recentRepost = await env.DB.prepare(
    "SELECT id FROM reposts WHERE user_id = ? AND created_at >= ? LIMIT 1"
  )
    .bind(user.id, dayAgo)
    .first();

  if (recentRepost) {
    return error("You can only repost once every 24 hours.", 429);
  }

  await env.DB.prepare("INSERT INTO reposts (id, post_id, user_id, created_at) VALUES (?, ?, ?, ?)")
    .bind(createId("repost_"), postId, user.id, toIsoDate())
    .run();

  await env.DB.prepare("UPDATE posts SET repost_count = repost_count + 1 WHERE id = ?").bind(postId).run();

  const updatedPost = await getPostRecord(env, postId);
  const viewerVote = await getViewerVote(env, postId, user.id);

  return json({
    ok: true,
    post: toPostResponse(updatedPost, viewerVote)
  });
}

async function handleListComments(env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Post not found.", 404);
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
      ORDER BY comments.created_at ASC
    `
  )
    .bind(postId)
    .all();

  return json({
    ok: true,
    comments: rows.results || []
  });
}

async function handleCreateComment(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Post not found.", 404);
  }

  const body = await parseJsonBody(request);
  const text = normalizeText(body.text);

  if (!text) {
    return error("Comment cannot be empty.");
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    return error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`);
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

  return json(
    {
      ok: true,
      comment
    },
    {
      status: 201
    }
  );
}

async function findImageObject(bucket, post) {
  if (!post?.imageKey) {
    return null;
  }

  const object = await bucket.get(post.imageKey);

  if (!object) {
    return null;
  }

  return object;
}

async function handleImage(env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Image not found.", 404);
  }

  const object = await findImageObject(env.YIMAGE_BUCKET, post);

  if (!object) {
    return error("Image not found.", 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", post.imageMimeType || object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(object.body, {
    headers
  });
}

async function handleDownload(env, postId) {
  const post = await getPostRecord(env, postId);

  if (!post) {
    return error("Post not found.", 404);
  }

  const object = await findImageObject(env.YIMAGE_BUCKET, post);

  if (!object) {
    return error("Image not found.", 404);
  }

  await env.DB.prepare("UPDATE posts SET downloads = downloads + 1 WHERE id = ?").bind(postId).run();
  await env.DB.prepare("UPDATE users SET downloads_received = downloads_received + 1 WHERE id = ?")
    .bind(post.authorId)
    .run();

  const headers = new Headers();
  headers.set("Content-Type", post.imageMimeType || object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${getImageFilename(post)}"`);
  headers.set("Cache-Control", "no-store");

  return new Response(object.body, {
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          message: "Yimage Worker API is working"
        });
      }

      if (url.pathname === "/api/auth/signup" && request.method === "POST") {
        return handleSignup(request, env);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        return handleLogin(request, env);
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        return handleLogout(request, env);
      }

      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        return handleCurrentUser(request, env);
      }

      if ((url.pathname === "/api/upload" || url.pathname === "/api/posts") && request.method === "POST") {
        return handleCreatePost(request, env);
      }

      if (url.pathname === "/api/posts" && request.method === "GET") {
        return handleListPosts(request, env);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/vote") && request.method === "POST") {
        const postId = url.pathname.split("/")[3];
        return handleVote(request, env, postId);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/repost") && request.method === "POST") {
        const postId = url.pathname.split("/")[3];
        return handleRepost(request, env, postId);
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/comments")) {
        const postId = url.pathname.split("/")[3];

        if (request.method === "GET") {
          return handleListComments(env, postId);
        }

        if (request.method === "POST") {
          return handleCreateComment(request, env, postId);
        }
      }

      if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/download") && request.method === "GET") {
        const postId = url.pathname.split("/")[3];
        return handleDownload(env, postId);
      }

      if (url.pathname.startsWith("/api/posts/") && request.method === "GET") {
        const postId = url.pathname.replace("/api/posts/", "").trim();
        return handleGetPost(request, env, postId);
      }

      if (url.pathname.startsWith("/api/image/") && request.method === "GET") {
        const postId = url.pathname.replace("/api/image/", "").trim();
        return handleImage(env, postId);
      }

      if (url.pathname.startsWith("/api/")) {
        return error("API route not found.", 404);
      }

      return error("Not found.", 404);
    } catch (thrown) {
      if (thrown instanceof Response) {
        return thrown;
      }

      return error(thrown?.message || "Unexpected server error.", 500);
    }
  }
};
