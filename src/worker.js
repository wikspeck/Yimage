const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};
const ALLOWED_IMAGE_EXTENSIONS = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"]
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_COMMENT_LENGTH = 400;
const MAX_BIO_LENGTH = 280;
const SESSION_COOKIE = "yimage_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const POST_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PBKDF2_ITERATIONS = 100000;
const REPORT_REASONS = new Set([
  "spam",
  "harassment",
  "illegal content",
  "sexual content",
  "violence",
  "hate speech",
  "copyright violation",
  "other"
]);
const MODERATION_STATES = {
  ACTIVE: "active",
  UNDER_REVIEW: "under_review",
  HIDDEN: "hidden",
  REMOVED: "removed",
  SUSPENDED: "suspended"
};
const OFFENSIVE_TERMS = ["nazi", "hitler", "kkk", "slur", "terrorist"];
const HARASSMENT_TERMS = ["kill yourself", "die", "stupid bitch"];
const SEXUAL_TERMS = ["porn", "nude", "nsfw", "explicit"];
const VIOLENCE_TERMS = ["gore", "beheading", "murder"];
const SPAM_TERMS = ["free money", "buy now", "click here"];
const AI_MODERATION_MODEL = "@cf/meta/llama-guard-3-8b";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com"
].join("; ");
const ALLOWED_CORS_ORIGINS = new Set([
  "https://yimage.org",
  "http://localhost:5173"
]);

function applySecurityHeaders(response) {
  const headers = new Headers(response.headers);

  // Restrict what the browser can load while keeping React, API calls, images, and Turnstile working.
  headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  // Prevent embedding Yimage inside iframes to reduce clickjacking risk.
  headers.set("X-Frame-Options", "DENY");
  // Limit how much referrer information is sent when users follow external links.
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Tell browsers not to guess content types beyond what the server declares.
  headers.set("X-Content-Type-Options", "nosniff");
  // Disable browser/device capabilities Yimage does not need.
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function getAllowedCorsOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_CORS_ORIGINS.has(origin) ? origin : "";
}

function applyCorsHeaders(request, response) {
  const allowedOrigin = getAllowedCorsOrigin(request);
  const headers = new Headers(response.headers);
  headers.append("Vary", "Origin");

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      request.headers.get("Access-Control-Request-Headers") || "Content-Type"
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function buildPreflightResponse(request) {
  const allowedOrigin = getAllowedCorsOrigin(request);
  if (!allowedOrigin) {
    return fail("Origin not allowed.", 403);
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    }
  });
}

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

function success(data, init = {}) {
  return json({ ok: true, ...data }, init);
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

function normalizeHashtag(value) {
  return normalizeText(value).replace(/^#+/, "").toLowerCase();
}

function normalizeOptionalUrl(value) {
  const nextValue = normalizeText(value);
  if (!nextValue) {
    return "";
  }

  if (nextValue.startsWith("/") || /^https?:\/\//i.test(nextValue)) {
    return nextValue;
  }

  return "";
}

function getFileExtension(filename) {
  const normalized = String(filename || "").trim().toLowerCase();
  const parts = normalized.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

async function detectImageSignature(file) {
  const headerBuffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  return "";
}

async function validateUploadedImageFile(file, label = "Image") {
  if (!(file instanceof File)) {
    return "Invalid upload.";
  }

  const extension = getFileExtension(file.name);
  const allowedExtensions = ALLOWED_IMAGE_EXTENSIONS[file.type];

  if (!ALLOWED_IMAGE_TYPES[file.type] || !allowedExtensions) {
    return "Unsupported file type.";
  }

  if (!extension || !allowedExtensions.includes(extension)) {
    return "Unsupported file type.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File too large.";
  }

  const detectedMimeType = await detectImageSignature(file);
  if (!detectedMimeType || detectedMimeType !== file.type) {
    return "Invalid upload.";
  }

  return "";
}

function parseHashtags(value) {
  const matches = String(value || "")
    .split(/[,\s]+/)
    .map((item) => normalizeHashtag(item))
    .filter(Boolean);

  return [...new Set(matches)].slice(0, 12);
}

function textContainsAny(value, terms) {
  const normalized = normalizeText(value).toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function assessSafetyRisk({ username = "", displayName = "", title = "", description = "", text = "", bio = "" }) {
  const combined = [username, displayName, title, description, text, bio].filter(Boolean).join(" \n ");
  let riskScore = 0;
  const categories = [];

  if (textContainsAny(combined, OFFENSIVE_TERMS)) {
    riskScore += 6;
    categories.push("hate_speech");
  }
  if (textContainsAny(combined, HARASSMENT_TERMS)) {
    riskScore += 4;
    categories.push("harassment");
  }
  if (textContainsAny(combined, SEXUAL_TERMS)) {
    riskScore += 4;
    categories.push("sexual_content");
  }
  if (textContainsAny(combined, VIOLENCE_TERMS)) {
    riskScore += 4;
    categories.push("violence");
  }
  if (textContainsAny(combined, SPAM_TERMS)) {
    riskScore += 3;
    categories.push("spam");
  }

  return {
    riskScore,
    categories: [...new Set(categories)]
  };
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

function getAvatarKey(userId, extension) {
  return `avatars/${userId}.${extension}`;
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
  const avatarUrl = user.avatarUrl && user.avatarUrl.startsWith("avatars/")
    ? `/api/users/${user.username}/avatar`
    : user.avatarUrl || "";

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    displayName: user.displayName || "",
    bio: user.bio || "",
    avatarUrl,
    isAdmin: Boolean(user.isAdmin),
    moderationStatus: user.moderationStatus || MODERATION_STATES.ACTIVE
  };
}

function toPostResponse(post, viewerVote = null, viewerHasReposted = false, repostsRemainingToday = 3) {
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
    score: Number(post.score ?? (post.likeCount || 0)),
    commentsCount: Number(post.commentsCount || 0),
    views: Number(post.views || 0),
    repostCount: Number(post.repostCount || 0),
    moderationStatus: post.moderationStatus || MODERATION_STATES.ACTIVE,
    category: post.categorySlug
      ? {
          id: post.categoryId,
          slug: post.categorySlug,
          label: post.categoryLabel
        }
      : null,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    hasLiked: viewerVote === "up",
    viewerVote,
    hasReposted: Boolean(viewerHasReposted),
    repostsRemainingToday: Number(repostsRemainingToday)
  };
}

function toCommentResponse(comment, viewerVote = null) {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId || null,
    authorId: comment.authorId,
    authorUsername: comment.authorUsername,
    text: comment.text,
    createdAt: comment.createdAt,
    score: Number(comment.score || 0),
    viewerVote,
    replies: []
  };
}

function nestComments(flatComments) {
  const byId = new Map(flatComments.map((comment) => [comment.id, { ...comment, replies: [] }]));
  const roots = [];

  for (const comment of byId.values()) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId).replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
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
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
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

  if (!iterations || !saltBase64 || !expectedHash || iterations > PBKDF2_ITERATIONS) {
    return false;
  }

  try {
    const salt = Uint8Array.from(atob(saltBase64), (character) => character.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
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

async function verifyTurnstileToken(env, request, token) {
  const responseToken = normalizeText(token);

  if (!responseToken) {
    return fail("Please complete the Turnstile check.");
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    console.error("TURNSTILE_SECRET_KEY is missing.");
    return fail("Turnstile is not configured correctly.", 500);
  }

  try {
    const formData = new URLSearchParams();
    formData.set("secret", env.TURNSTILE_SECRET_KEY);
    formData.set("response", responseToken);

    const remoteIp = request.headers.get("CF-Connecting-IP");
    if (remoteIp) {
      formData.set("remoteip", remoteIp);
    }

    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData
    });

    const data = await verification.json().catch(() => null);
    if (!verification.ok || !data?.success) {
      return fail("Turnstile verification failed.", 403);
    }

    return null;
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    return fail("Could not verify Turnstile right now.", 500);
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
        users.created_at AS createdAt,
        COALESCE(users.display_name, '') AS displayName,
        COALESCE(users.bio, '') AS bio,
        COALESCE(users.avatar_url, '') AS avatarUrl,
        COALESCE(users.is_admin, 0) AS isAdmin,
        COALESCE(users.moderation_status, 'active') AS moderationStatus
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
  if (user.moderationStatus === MODERATION_STATES.SUSPENDED) {
    throw fail("Your account is suspended.", 403);
  }
  return user;
}

async function requireModerator(request, env) {
  const user = await requireUser(request, env);
  if (!user.isAdmin) {
    throw fail("Moderator access required.", 403);
  }
  return user;
}

async function getPostHashtagsMap(env, postIds) {
  if (!postIds.length) {
    return {};
  }

  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(
    `
      SELECT
        post_hashtags.post_id AS postId,
        hashtags.tag
      FROM post_hashtags
      INNER JOIN hashtags ON hashtags.id = post_hashtags.hashtag_id
      WHERE post_hashtags.post_id IN (${placeholders})
      ORDER BY hashtags.tag ASC
    `
  )
    .bind(...postIds)
    .all();

  const result = {};
  for (const row of rows.results || []) {
    if (!result[row.postId]) {
      result[row.postId] = [];
    }
    result[row.postId].push(row.tag);
  }
  return result;
}

async function createSafetyFlag(env, { userId = null, targetType, targetId, source, category, riskScore, details = "" }) {
  await env.DB.prepare(
    "INSERT INTO user_safety_flags (id, user_id, target_type, target_id, source, category, risk_score, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(createId("flag_"), userId, targetType, targetId, source, category, riskScore, details, toIsoDate())
    .run();
}

function getAiModerationText(result) {
  if (!result) {
    return "";
  }

  if (typeof result === "string") {
    return result;
  }

  if (typeof result.response === "string") {
    return result.response;
  }

  if (typeof result.result === "string") {
    return result.result;
  }

  if (result.result && typeof result.result.response === "string") {
    return result.result.response;
  }

  if (Array.isArray(result.response)) {
    return result.response
      .map((item) => (typeof item === "string" ? item : item?.text || ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function parseAiModerationPayload(rawText) {
  const trimmed = normalizeText(rawText);
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    const parsedUnsafe = typeof parsed.safe === "boolean" ? !parsed.safe : Boolean(parsed.unsafe ?? parsed.isUnsafe);
    return {
      isUnsafe: parsedUnsafe,
      labels: Array.isArray(parsed.labels) ? parsed.labels.map((item) => normalizeText(item)).filter(Boolean) : [],
      reason: normalizeText(parsed.reason || parsed.ai_reason || ""),
      riskScore: Number(parsed.risk_score || parsed.riskScore || 0)
    };
  } catch {
    const normalized = trimmed.toLowerCase();
    const isUnsafe = normalized.includes("\"unsafe\": true") || normalized.includes("unsafe");
    const labels = [];

    for (const label of ["explicit_content", "violence", "hate_speech", "harassment", "spam", "illegal_content", "impersonation", "copyright_risk"]) {
      if (normalized.includes(label)) {
        labels.push(label);
      }
    }

    return {
      isUnsafe,
      labels,
      reason: trimmed,
      riskScore: isUnsafe ? Math.max(3, labels.length * 2 || 4) : 0
    };
  }
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function storeAiModerationResult(env, { contentId, contentType, riskScore, labels, aiReason, moderationStatus, source = "text" }) {
  await env.DB.prepare(
    "INSERT INTO ai_moderation_results (id, content_id, content_type, risk_score, labels, ai_reason, moderation_status, model, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      createId("ai_"),
      contentId,
      contentType,
      riskScore,
      JSON.stringify(labels || []),
      aiReason || "",
      moderationStatus,
      AI_MODERATION_MODEL,
      source,
      toIsoDate()
    )
    .run();
}

async function markContentUnderReview(env, targetType, targetId) {
  if (targetType === "post") {
    await env.DB.prepare(
      "UPDATE posts SET moderation_status = CASE WHEN COALESCE(moderation_status, 'active') = 'active' THEN 'under_review' ELSE moderation_status END WHERE id = ?"
    )
      .bind(targetId)
      .run();
  }

  if (targetType === "comment") {
    await env.DB.prepare(
      "UPDATE comments SET moderation_status = CASE WHEN COALESCE(moderation_status, 'active') = 'active' THEN 'under_review' ELSE moderation_status END WHERE id = ?"
    )
      .bind(targetId)
      .run();
  }

  if (targetType === "user") {
    await env.DB.prepare(
      "UPDATE users SET moderation_status = CASE WHEN COALESCE(moderation_status, 'active') = 'active' THEN 'under_review' ELSE moderation_status END WHERE id = ?"
    )
      .bind(targetId)
      .run();
  }
}

async function applyModerationRisk(env, targetType, targetId, riskScore) {
  if (!riskScore) {
    return;
  }

  if (targetType === "post") {
    await env.DB.prepare(
      `UPDATE posts
       SET moderation_risk_score = COALESCE(moderation_risk_score, 0) + ?,
           moderation_status = CASE
             WHEN COALESCE(moderation_risk_score, 0) + ? >= 8 THEN 'hidden'
             WHEN COALESCE(moderation_risk_score, 0) + ? >= 3 AND moderation_status = 'active' THEN 'under_review'
             ELSE moderation_status
           END
       WHERE id = ?`
    )
      .bind(riskScore, riskScore, riskScore, targetId)
      .run();
  }

  if (targetType === "comment") {
    await env.DB.prepare(
      `UPDATE comments
       SET moderation_risk_score = COALESCE(moderation_risk_score, 0) + ?,
           moderation_status = CASE
             WHEN COALESCE(moderation_risk_score, 0) + ? >= 8 THEN 'hidden'
             WHEN COALESCE(moderation_risk_score, 0) + ? >= 3 AND moderation_status = 'active' THEN 'under_review'
             ELSE moderation_status
           END
       WHERE id = ?`
    )
      .bind(riskScore, riskScore, riskScore, targetId)
      .run();
  }

  if (targetType === "user") {
    await env.DB.prepare(
      `UPDATE users
       SET moderation_risk_score = COALESCE(moderation_risk_score, 0) + ?,
           moderation_status = CASE
             WHEN COALESCE(moderation_risk_score, 0) + ? >= 8 THEN 'under_review'
             ELSE moderation_status
           END
       WHERE id = ?`
    )
      .bind(riskScore, riskScore, targetId)
      .run();
  }
}

async function runSafetyAssessment(env, input) {
  const assessment = assessSafetyRisk(input);
  for (const category of assessment.categories) {
    await createSafetyFlag(env, {
      userId: input.userId || null,
      targetType: input.targetType,
      targetId: input.targetId,
      source: "heuristic_v1",
      category,
      riskScore: assessment.riskScore,
      details: "Automatic text screening match"
    });
  }
  await applyModerationRisk(env, input.targetType, input.targetId, assessment.riskScore);
  return assessment;
}

async function runAiTextModeration(env, input) {
  if (!env.AI || typeof env.AI.run !== "function") {
    return null;
  }

  const fields = Object.entries(input.fields || {})
    .map(([key, value]) => [key, normalizeText(value)])
    .filter(([, value]) => value);

  if (!fields.length) {
    return null;
  }

  const formattedFields = fields.map(([key, value]) => `${key}: ${value}`).join("\n");

  try {
    const result = await env.AI.run(AI_MODERATION_MODEL, {
      messages: [
        {
          role: "system",
          content:
            "You are a content safety classifier for Yimage. Review the provided text and return strict JSON only with keys: unsafe (boolean), risk_score (0-10 integer), labels (array of strings), reason (string). Flag categories such as explicit_content, violence, hate_speech, harassment, spam, illegal_content, impersonation, copyright_risk."
        },
        {
          role: "user",
          content: `Content type: ${input.targetType}\n${formattedFields}`
        }
      ]
    });

    const moderation = parseAiModerationPayload(getAiModerationText(result));
    if (!moderation?.isUnsafe) {
      return moderation;
    }

    await storeAiModerationResult(env, {
      contentId: input.targetId,
      contentType: input.targetType,
      riskScore: Math.max(3, Number(moderation.riskScore || 0)),
      labels: moderation.labels,
      aiReason: moderation.reason,
      moderationStatus: MODERATION_STATES.UNDER_REVIEW,
      source: "text"
    });

    await markContentUnderReview(env, input.targetType, input.targetId);
    return moderation;
  } catch (error) {
    console.error("Workers AI moderation failed.", error);
    return null;
  }
}

function bytesToDataUrl(bytes, mimeType) {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}

async function runAiImageModeration(env, { postId, imageBytes, mimeType, title = "", description = "" }) {
  if (!env.AI || typeof env.AI.run !== "function") {
    return null;
  }

  try {
    const result = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages: [
        {
          role: "system",
          content:
            "You are a safety classifier for Yimage uploads. Review the image and any visible text. Return strict JSON only with keys: safe (boolean), risk_score (0-100 integer), labels (array of strings), reason (string). Flag categories such as sexual_content, nudity, graphic_violence, hate_symbols, extremist_symbols, harassment, illegal_content, gore, spam_scam, offensive_text."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Title: ${title || "(none)"}\nDescription: ${description || "(none)"}\nClassify this uploaded image for safety risk.`
            },
            {
              type: "image",
              image: bytesToDataUrl(imageBytes, mimeType)
            }
          ]
        }
      ]
    });

    const moderation = parseAiModerationPayload(getAiModerationText(result));
    if (!moderation) {
      return null;
    }

    if (!moderation.isUnsafe || Number(moderation.riskScore || 0) < 20) {
      return {
        ...moderation,
        moderationStatus: MODERATION_STATES.ACTIVE
      };
    }

    const nextStatus = Number(moderation.riskScore || 0) >= 70
      ? MODERATION_STATES.HIDDEN
      : MODERATION_STATES.UNDER_REVIEW;

    await storeAiModerationResult(env, {
      contentId: postId,
      contentType: "post",
      riskScore: Number(moderation.riskScore || 0),
      labels: moderation.labels,
      aiReason: moderation.reason,
      moderationStatus: nextStatus,
      source: "image"
    });

    return {
      ...moderation,
      moderationStatus: nextStatus
    };
  } catch (error) {
    console.error("Workers AI image moderation failed.", error);
    return null;
  }
}

async function getPostRecord(env, postId, includeModerated = false) {
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
        COALESCE(posts.score, COALESCE(posts.like_count, 0)) AS score,
        COALESCE(posts.comments_count, 0) AS commentsCount,
        COALESCE(posts.views, 0) AS views,
        COALESCE(posts.repost_count, 0) AS repostCount,
        COALESCE(posts.moderation_status, 'active') AS moderationStatus,
        posts.category_id AS categoryId,
        categories.slug AS categorySlug,
        categories.label AS categoryLabel
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
      LEFT JOIN categories ON categories.id = posts.category_id
      WHERE posts.id = ?
      ${includeModerated ? "" : "AND COALESCE(posts.moderation_status, 'active') NOT IN ('under_review', 'hidden', 'removed')"}
      LIMIT 1
    `
  )
    .bind(postId)
    .first();

  if (!row) {
    return null;
  }

  const hashtagsByPost = await getPostHashtagsMap(env, [postId]);
  row.hashtags = hashtagsByPost[postId] || [];
  return row;
}

async function getViewerVoteMap(env, userId, postIds) {
  if (!userId || !postIds.length) {
    return {};
  }

  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(`SELECT post_id AS postId, value FROM votes WHERE user_id = ? AND post_id IN (${placeholders})`)
    .bind(userId, ...postIds)
    .all();

  const result = {};
  for (const row of rows.results || []) {
    result[row.postId] = Number(row.value) === 1 ? "up" : "down";
  }
  return result;
}

async function getViewerRepostMap(env, userId, postIds) {
  if (!userId || !postIds.length) {
    return {};
  }

  const placeholders = postIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(`SELECT post_id AS postId FROM reposts WHERE user_id = ? AND post_id IN (${placeholders})`)
    .bind(userId, ...postIds)
    .all();

  const result = {};
  for (const row of rows.results || []) {
    result[row.postId] = true;
  }
  return result;
}

async function getViewerCommentVoteMap(env, userId, commentIds) {
  if (!userId || !commentIds.length) {
    return {};
  }

  const placeholders = commentIds.map(() => "?").join(", ");
  const rows = await env.DB.prepare(`SELECT comment_id AS commentId, value FROM comment_votes WHERE user_id = ? AND comment_id IN (${placeholders})`)
    .bind(userId, ...commentIds)
    .all();

  const result = {};
  for (const row of rows.results || []) {
    result[row.commentId] = Number(row.value) === 1 ? "up" : "down";
  }
  return result;
}

async function getRepostsRemainingToday(env, userId) {
  if (!userId) {
    return 3;
  }

  const dayStart = toIsoDate(Date.now() - 24 * 60 * 60 * 1000);
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM reposts WHERE user_id = ? AND created_at >= ?")
    .bind(userId, dayStart)
    .first();

  return Math.max(0, 3 - Number(row?.count || 0));
}

async function getCategoryById(env, categoryId) {
  if (!categoryId) {
    return null;
  }

  return env.DB.prepare("SELECT id, slug, label FROM categories WHERE id = ? LIMIT 1").bind(categoryId).first();
}

async function listCategories(env) {
  const rows = await env.DB.prepare("SELECT id, slug, label FROM categories ORDER BY label ASC").all();
  return rows.results || [];
}

async function syncPostHashtags(env, postId, hashtags) {
  await env.DB.prepare("DELETE FROM post_hashtags WHERE post_id = ?").bind(postId).run();

  for (const tag of hashtags) {
    const existing = await env.DB.prepare("SELECT id FROM hashtags WHERE tag = ? LIMIT 1").bind(tag).first();
    const hashtagId = existing?.id || createId("hashtag_");

    if (!existing) {
      await env.DB.prepare("INSERT INTO hashtags (id, tag, created_at) VALUES (?, ?, ?)")
        .bind(hashtagId, tag, toIsoDate())
        .run();
    }

    await env.DB.prepare("INSERT OR IGNORE INTO post_hashtags (post_id, hashtag_id, created_at) VALUES (?, ?, ?)")
      .bind(postId, hashtagId, toIsoDate())
      .run();
  }
}

async function listPosts(env, userId, options = {}) {
  const searchQuery = normalizeText(options.query).toLowerCase();
  const creatorQuery = searchQuery.replace(/^@+/, "");
  const category = normalizeText(options.category).toLowerCase();
  const hashtag = normalizeHashtag(options.hashtag);
  const view = normalizeText(options.view).toLowerCase();
  const mode = normalizeText(options.mode).toLowerCase();
  const includeModerated = Boolean(options.includeModerated);
  const conditions = [];
  const bindings = [];
  let orderClause = "ORDER BY COALESCE(posts.repost_count, 0) DESC, COALESCE(posts.score, COALESCE(posts.like_count, 0)) DESC, posts.created_at DESC, posts.id DESC";

  if (!includeModerated) {
    conditions.push("COALESCE(posts.moderation_status, 'active') NOT IN ('under_review', 'hidden', 'removed')");
  }

  if (view === "discover") {
    if (mode === "following") {
      if (!userId) {
        throw new Error("Log in to use the followers-only feed.");
      }
      conditions.push(
        `EXISTS (
          SELECT 1
          FROM follows
          WHERE follows.follower_id = ?
            AND follows.following_id = posts.author_id
        )`
      );
      bindings.push(userId);
      orderClause = "ORDER BY posts.created_at DESC, posts.id DESC";
    } else if (mode === "hot") {
      conditions.push("posts.created_at >= datetime('now', '-14 days')");
      orderClause = `
        ORDER BY
          (
            COALESCE(posts.repost_count, 0) * 4
            + COALESCE(posts.comments_count, 0) * 3
            + COALESCE(posts.score, COALESCE(posts.like_count, 0)) * 2
          ) DESC,
          posts.created_at DESC,
          posts.id DESC
      `;
    } else {
      if (userId) {
        conditions.push(
          `posts.author_id NOT IN (
            SELECT follows.following_id
            FROM follows
            WHERE follows.follower_id = ?
          )`
        );
        bindings.push(userId);
      }
      orderClause = "ORDER BY posts.created_at DESC, RANDOM()";
    }
  }

  if (searchQuery) {
    const likeValue = `%${searchQuery}%`;
    conditions.push(
      `(
        LOWER(posts.title) LIKE ?
        OR LOWER(posts.description) LIKE ?
        OR LOWER(users.username) LIKE ?
        OR EXISTS (
          SELECT 1
          FROM post_hashtags
          INNER JOIN hashtags ON hashtags.id = post_hashtags.hashtag_id
          WHERE post_hashtags.post_id = posts.id
            AND LOWER(hashtags.tag) LIKE ?
        )
        OR EXISTS (
          SELECT 1
          FROM categories AS search_categories
          WHERE search_categories.id = posts.category_id
            AND (
              LOWER(search_categories.slug) LIKE ?
              OR LOWER(search_categories.label) LIKE ?
            )
        )
      )`
    );
    bindings.push(likeValue, likeValue, `%${creatorQuery}%`, likeValue, likeValue, likeValue);
  }

  if (category) {
    conditions.push("(LOWER(categories.slug) = ? OR LOWER(categories.label) = ?)");
    bindings.push(category, category);
  }

  if (hashtag) {
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM post_hashtags
        INNER JOIN hashtags ON hashtags.id = post_hashtags.hashtag_id
        WHERE post_hashtags.post_id = posts.id
          AND hashtags.tag = ?
      )`
    );
    bindings.push(hashtag);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
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
        COALESCE(posts.score, COALESCE(posts.like_count, 0)) AS score,
        COALESCE(posts.comments_count, 0) AS commentsCount,
        COALESCE(posts.views, 0) AS views,
        COALESCE(posts.repost_count, 0) AS repostCount,
        COALESCE(posts.moderation_status, 'active') AS moderationStatus,
        posts.category_id AS categoryId,
        categories.slug AS categorySlug,
        categories.label AS categoryLabel
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
      LEFT JOIN categories ON categories.id = posts.category_id
      ${whereClause}
      ${orderClause}
      LIMIT 50
    `
  )
    .bind(...bindings)
    .all();

  const posts = rows.results || [];
  const postIds = posts.map((post) => post.id);
  const votesByPost = await getViewerVoteMap(env, userId, postIds);
  const repostsByPost = await getViewerRepostMap(env, userId, postIds);
  const hashtagsByPost = await getPostHashtagsMap(env, postIds);
  const repostsRemainingToday = await getRepostsRemainingToday(env, userId);

  return posts.map((post) => {
    post.hashtags = hashtagsByPost[post.id] || [];
    return toPostResponse(post, votesByPost[post.id] || null, repostsByPost[post.id], repostsRemainingToday);
  });
}

async function createSession(env, userId) {
  const token = createId("sess_");
  const tokenHash = await sha256Hex(token);
  const sessionId = createId("session_");
  const createdAt = toIsoDate();
  const expiresAt = toIsoDate(Date.now() + SESSION_TTL_SECONDS * 1000);

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
    .bind(sessionId, userId, tokenHash, createdAt, expiresAt)
    .run();

  return token;
}

async function handleSignup(request, env) {
  const body = await parseJsonBody(request);
  const turnstileFailure = await verifyTurnstileToken(env, request, body.turnstileToken);
  if (turnstileFailure) {
    return turnstileFailure;
  }
  const username = normalizeUsername(body.username);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const usernameSafety = assessSafetyRisk({ username });

  if (!isValidUsername(username)) {
    return fail("Username must be 3 to 24 characters and use only letters, numbers, or underscores.");
  }
  if (usernameSafety.riskScore >= 6) {
    return fail("That username is not allowed.");
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

  await env.DB.prepare("INSERT INTO users (id, username, email, password_hash, created_at, display_name, bio, avatar_url) VALUES (?, ?, ?, ?, ?, ?, '', '')")
    .bind(userId, username, email, passwordHash, createdAt, username)
    .run();
  await runAiTextModeration(env, {
    userId,
    targetType: "user",
    targetId: userId,
    fields: {
      username,
      display_name: username
    }
  });

  const token = await createSession(env, userId);

  const createdUser = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        email,
        created_at AS createdAt,
        COALESCE(display_name, '') AS displayName,
        COALESCE(bio, '') AS bio,
        COALESCE(avatar_url, '') AS avatarUrl,
        COALESCE(is_admin, 0) AS isAdmin,
        COALESCE(moderation_status, 'active') AS moderationStatus
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(userId)
    .first();

  return success(
    {
      user: toPublicUser(createdUser || { id: userId, username, email, createdAt, displayName: username, bio: "", avatarUrl: "", isAdmin: 0, moderationStatus: "active" })
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
  const turnstileFailure = await verifyTurnstileToken(env, request, body.turnstileToken);
  if (turnstileFailure) {
    return turnstileFailure;
  }
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
        created_at AS createdAt,
        COALESCE(display_name, '') AS displayName,
        COALESCE(bio, '') AS bio,
        COALESCE(avatar_url, '') AS avatarUrl,
        COALESCE(is_admin, 0) AS isAdmin,
        COALESCE(moderation_status, 'active') AS moderationStatus
      FROM users
      WHERE email = ?
      LIMIT 1
    `
  )
    .bind(email)
    .first();

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("Invalid email or password.", 401);
  }

  const token = await createSession(env, user.id);
  return success(
    { user: toPublicUser(user) },
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
  return success({ user: user ? toPublicUser(user) : null });
}

async function handleUpdateProfile(request, env) {
  const user = await requireUser(request, env);
  const body = await parseJsonBody(request);
  const displayName = normalizeText(body.displayName).slice(0, 60);
  const bio = normalizeText(body.bio).slice(0, MAX_BIO_LENGTH);
  const avatarUrl = normalizeOptionalUrl(body.avatarUrl);
  const profileSafety = assessSafetyRisk({ displayName, bio });

  if (body.avatarUrl && !avatarUrl) {
    return fail("Avatar URL must be empty, root-relative, or start with http/https.");
  }
  if (profileSafety.riskScore >= 6) {
    return fail("That profile information is not allowed.");
  }

  await env.DB.prepare("UPDATE users SET display_name = ?, bio = ?, avatar_url = ? WHERE id = ?")
    .bind(displayName, bio, avatarUrl, user.id)
    .run();
  await runSafetyAssessment(env, {
    userId: user.id,
    targetType: "user",
    targetId: user.id,
    displayName,
    bio
  });
  await runAiTextModeration(env, {
    userId: user.id,
    targetType: "user",
    targetId: user.id,
    fields: {
      username: user.username,
      display_name: displayName,
      bio
    }
  });

  const updatedUser = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        email,
        created_at AS createdAt,
        COALESCE(display_name, '') AS displayName,
        COALESCE(bio, '') AS bio,
        COALESCE(avatar_url, '') AS avatarUrl
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(user.id)
    .first();

  return success({ user: toPublicUser(updatedUser) });
}

async function handleAvatarUpload(request, env) {
  const user = await requireUser(request, env);
  const formData = await request.formData();
  const avatar = formData.get("avatar");

  const avatarValidationMessage = await validateUploadedImageFile(avatar, "Avatar image");
  if (avatarValidationMessage) {
    return fail(avatarValidationMessage);
  }

  const avatarKey = getAvatarKey(user.id, ALLOWED_IMAGE_TYPES[avatar.type]);
  await env.YIMAGE_BUCKET.put(avatarKey, avatar.stream(), {
    httpMetadata: { contentType: avatar.type }
  });

  await env.DB.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(avatarKey, user.id).run();

  const updatedUser = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        email,
        created_at AS createdAt,
        COALESCE(display_name, '') AS displayName,
        COALESCE(bio, '') AS bio,
        COALESCE(avatar_url, '') AS avatarUrl,
        COALESCE(is_admin, 0) AS isAdmin,
        COALESCE(moderation_status, 'active') AS moderationStatus
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(user.id)
    .first();

  return success({ user: toPublicUser(updatedUser) });
}

async function handleCreatePost(request, env) {
  const user = await requireUser(request, env);
  const formData = await request.formData();
  const turnstileFailure = await verifyTurnstileToken(env, request, formData.get("turnstileToken"));
  if (turnstileFailure) {
    return turnstileFailure;
  }
  const title = normalizeText(formData.get("title"));
  const description = normalizeText(formData.get("description"));
  const categoryId = normalizeText(formData.get("categoryId"));
  const hashtags = parseHashtags(formData.get("hashtags"));
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
  const imageValidationMessage = await validateUploadedImageFile(image, "Image");
  if (imageValidationMessage) {
    return fail(imageValidationMessage);
  }
  const imageBytes = new Uint8Array(await image.arrayBuffer());

  let resolvedCategoryId = null;
  if (categoryId) {
    const category = await getCategoryById(env, categoryId);
    if (!category) {
      return fail("Selected category is invalid.");
    }
    resolvedCategoryId = category.id;
  }

  let postId = "";
  let foundAvailableId = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    postId = createPostId();
    const existing = await env.DB.prepare("SELECT id FROM posts WHERE id = ? LIMIT 1").bind(postId).first();
    if (!existing) {
      foundAvailableId = true;
      break;
    }
  }
  if (!foundAvailableId) {
    return fail("Could not create post id.", 500);
  }

  const imageKey = getImageKey(postId, ALLOWED_IMAGE_TYPES[image.type]);
  const createdAt = toIsoDate();

  await env.YIMAGE_BUCKET.put(imageKey, imageBytes, {
    httpMetadata: {
      contentType: image.type
    }
  });

  const imageModeration = await runAiImageModeration(env, {
    postId,
    imageBytes,
    mimeType: image.type,
    title,
    description
  });
  const moderationStatus = imageModeration?.moderationStatus || MODERATION_STATES.ACTIVE;

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
        views,
        category_id,
        moderation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `
  )
    .bind(postId, user.id, title, description, imageKey, image.type, createdAt, resolvedCategoryId, moderationStatus)
    .run();

  await syncPostHashtags(env, postId, hashtags);
  await runSafetyAssessment(env, {
    userId: user.id,
    targetType: "post",
    targetId: postId,
    title,
    description
  });
  const textModeration = await runAiTextModeration(env, {
    userId: user.id,
    targetType: "post",
    targetId: postId,
    fields: {
      title,
      description
    }
  });
  const post = await getPostRecord(env, postId, true);

  const moderationNotice = imageModeration && imageModeration.moderationStatus !== MODERATION_STATES.ACTIVE
    ? "Your post was hidden by automatic safety moderation. You can appeal this decision."
    : textModeration?.isUnsafe
      ? "Your post is being reviewed by automatic safety moderation."
      : "";

  return success(
    {
      post: toPostResponse(post),
      moderationNotice,
      canAppeal: Boolean(imageModeration && imageModeration.moderationStatus !== MODERATION_STATES.ACTIVE),
      aiFinding: imageModeration
        ? {
            riskScore: Number(imageModeration.riskScore || 0),
            labels: imageModeration.labels || [],
            reason: imageModeration.reason || "",
            moderationStatus: imageModeration.moderationStatus
          }
        : null
    },
    { status: 201 }
  );
}

async function handleListPosts(request, env) {
  const user = await getCurrentUser(request, env);
  const url = new URL(request.url);
  const posts = await listPosts(env, user?.id, {
    query: url.searchParams.get("query") || "",
    category: url.searchParams.get("category") || "",
    hashtag: url.searchParams.get("hashtag") || "",
    view: url.searchParams.get("view") || "",
    mode: url.searchParams.get("mode") || ""
  });
  return success({ posts });
}

async function handleGetPost(request, env, postId) {
  const user = await getCurrentUser(request, env);
  let post = await getPostRecord(env, postId);

  if (!post && user) {
    const moderatedPost = await getPostRecord(env, postId, true);
    if (moderatedPost && (moderatedPost.userId === user.id || user.isAdmin)) {
      post = moderatedPost;
    }
  }

  if (!post) {
    return fail("Post not found.", 404);
  }

  await env.DB.prepare("UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE id = ?").bind(postId).run();
  post.views = Number(post.views || 0) + 1;

  const votes = await getViewerVoteMap(env, user?.id, [postId]);
  const reposts = await getViewerRepostMap(env, user?.id, [postId]);
  const repostsRemainingToday = await getRepostsRemainingToday(env, user?.id);
  let moderationReview = null;

  if (user && (user.id === post.userId || user.isAdmin) && post.moderationStatus !== MODERATION_STATES.ACTIVE) {
    const latestAiFinding = await env.DB.prepare(
      `
        SELECT
          risk_score AS riskScore,
          labels,
          ai_reason AS aiReason,
          moderation_status AS moderationStatus,
          source,
          created_at AS createdAt
        FROM ai_moderation_results
        WHERE content_type = 'post' AND content_id = ? AND source = 'image'
        ORDER BY created_at DESC
        LIMIT 1
      `
    )
      .bind(postId)
      .first();

    const appeal = await env.DB.prepare(
      `
        SELECT
          id,
          message,
          status,
          created_at AS createdAt
        FROM moderation_appeals
        WHERE content_type = 'post' AND content_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `
    )
      .bind(postId, user.id)
      .first();

    moderationReview = {
      message: "Your post was hidden by automatic safety moderation. You can appeal this decision.",
      aiFinding: latestAiFinding
        ? {
            ...latestAiFinding,
            labels: parseJsonArray(latestAiFinding.labels)
          }
        : null,
      appeal: appeal || null
    };
  }

  return success({
    post: toPostResponse(post, votes[postId] || null, reposts[postId], repostsRemainingToday),
    moderationReview
  });
}

async function handleVote(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);
  if (!post) {
    return fail("Post not found.", 404);
  }

  const body = await parseJsonBody(request);
  const nextVote = body.vote === "up" || body.vote === "down" ? body.vote : null;
  if (!nextVote) {
    return fail("Vote must be up or down.");
  }

  const existingVote = await env.DB.prepare("SELECT id, value FROM votes WHERE user_id = ? AND post_id = ? LIMIT 1")
    .bind(user.id, postId)
    .first();

  const nextVoteValue = nextVote === "up" ? 1 : -1;
  let finalVote = nextVote;
  let scoreDelta = 0;

  if (!existingVote) {
    await env.DB.prepare("INSERT INTO votes (id, post_id, user_id, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(createId("vote_"), postId, user.id, nextVoteValue, toIsoDate(), toIsoDate())
      .run();
    scoreDelta = nextVoteValue;
  } else if (Number(existingVote.value) === nextVoteValue) {
    await env.DB.prepare("DELETE FROM votes WHERE id = ?").bind(existingVote.id).run();
    scoreDelta = nextVote === "up" ? -1 : 1;
    finalVote = null;
  } else {
    await env.DB.prepare("UPDATE votes SET value = ?, updated_at = ? WHERE id = ?")
      .bind(nextVoteValue, toIsoDate(), existingVote.id)
      .run();
    scoreDelta = nextVote === "up" ? 2 : -2;
  }

  await env.DB.prepare(
    "UPDATE posts SET score = COALESCE(score, COALESCE(like_count, 0)) + ?, like_count = COALESCE(score, COALESCE(like_count, 0)) + ? WHERE id = ?"
  )
    .bind(scoreDelta, scoreDelta, postId)
    .run();

  const updatedPost = await getPostRecord(env, postId);
  const viewerReposts = await getViewerRepostMap(env, user.id, [postId]);
  const repostsRemainingToday = await getRepostsRemainingToday(env, user.id);
  return success({
    post: toPostResponse(updatedPost, finalVote, viewerReposts[postId], repostsRemainingToday)
  });
}

async function handleLike(request, env, postId) {
  const cloned = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ vote: "up" })
  });
  return handleVote(cloned, env, postId);
}

async function handleRepost(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);
  if (!post) {
    return fail("Post not found.", 404);
  }

  const existing = await env.DB.prepare("SELECT id FROM reposts WHERE user_id = ? AND post_id = ? LIMIT 1")
    .bind(user.id, postId)
    .first();

  if (!existing) {
    const remaining = await getRepostsRemainingToday(env, user.id);
    if (remaining <= 0) {
      return fail("You have no reposts left today.", 429);
    }
  }

  let active = false;
  if (existing) {
    await env.DB.prepare("DELETE FROM reposts WHERE id = ?").bind(existing.id).run();
    await env.DB.prepare("UPDATE posts SET repost_count = CASE WHEN COALESCE(repost_count, 0) > 0 THEN repost_count - 1 ELSE 0 END WHERE id = ?")
      .bind(postId)
      .run();
  } else {
    await env.DB.prepare("INSERT INTO reposts (id, post_id, user_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(createId("repost_"), postId, user.id, toIsoDate())
      .run();
    await env.DB.prepare("UPDATE posts SET repost_count = COALESCE(repost_count, 0) + 1 WHERE id = ?").bind(postId).run();
    active = true;
  }

  const updatedPost = await getPostRecord(env, postId);
  const votes = await getViewerVoteMap(env, user.id, [postId]);
  const repostsRemainingToday = await getRepostsRemainingToday(env, user.id);
  return success({
    message: active
      ? `You reposted. ${repostsRemainingToday} reposts left today.`
      : `Repost removed. ${repostsRemainingToday} reposts left today.`,
    post: toPostResponse(updatedPost, votes[postId] || null, active, repostsRemainingToday)
  });
}

async function handleDeletePost(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId, true);

  if (!post) {
    return fail("Post not found.", 404);
  }

  const canDelete = user.id === post.userId || Boolean(user.isAdmin);
  if (!canDelete) {
    return fail("Forbidden.", 403);
  }

  await env.DB.prepare("UPDATE posts SET moderation_status = ? WHERE id = ?")
    .bind(MODERATION_STATES.REMOVED, postId)
    .run();

  if (user.isAdmin) {
    await env.DB.prepare(
      "INSERT INTO moderation_actions (id, moderator_id, target_type, target_id, action, notes, created_at) VALUES (?, ?, 'post', ?, 'remove', ?, ?)"
    )
      .bind(createId("mod_"), user.id, postId, "Post deleted by moderator.", toIsoDate())
      .run();
  }

  return success({ message: "Post deleted." });
}

async function handleCommentsList(request, env, postId) {
  const viewer = await getCurrentUser(request, env);
  let post = await getPostRecord(env, postId);

  if (!post && viewer) {
    const moderatedPost = await getPostRecord(env, postId, true);
    if (moderatedPost && (moderatedPost.userId === viewer.id || viewer.isAdmin)) {
      post = moderatedPost;
    }
  }

  if (!post) {
    return fail("Post not found.", 404);
  }

  const rows = await env.DB.prepare(
    `
      SELECT
        comments.id,
        comments.post_id AS postId,
        comments.parent_id AS parentId,
        comments.author_id AS authorId,
        users.username AS authorUsername,
        comments.text,
        comments.created_at AS createdAt,
        COALESCE(comments.score, 0) AS score
      FROM comments
      INNER JOIN users ON users.id = comments.author_id
      WHERE comments.post_id = ?
        AND COALESCE(comments.moderation_status, 'active') NOT IN ('under_review', 'hidden', 'removed')
      ORDER BY comments.created_at ASC, comments.id ASC
    `
  )
    .bind(postId)
    .all();

  const commentIds = (rows.results || []).map((row) => row.id);
  const viewerVotes = await getViewerCommentVoteMap(env, viewer?.id, commentIds);
  const comments = (rows.results || []).map((row) => toCommentResponse(row, viewerVotes[row.id] || null));

  return success({ comments: nestComments(comments) });
}

async function handleCommentCreate(request, env, postId) {
  const user = await requireUser(request, env);
  const post = await getPostRecord(env, postId);
  if (!post) {
    return fail("Post not found.", 404);
  }

  const body = await parseJsonBody(request);
  const turnstileFailure = await verifyTurnstileToken(env, request, body.turnstileToken);
  if (turnstileFailure) {
    return turnstileFailure;
  }
  const text = normalizeText(body.text);
  const parentId = normalizeText(body.parentId);

  if (!text) {
    return fail("Comment cannot be empty.");
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return fail(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`);
  }

  let resolvedParentId = null;
  if (parentId) {
    const parentComment = await env.DB.prepare("SELECT id FROM comments WHERE id = ? AND post_id = ? LIMIT 1").bind(parentId, postId).first();
    if (!parentComment) {
      return fail("Reply target was not found.", 404);
    }
    resolvedParentId = parentId;
  }

  const comment = {
    id: createId("comment_"),
    postId,
    parentId: resolvedParentId,
    authorId: user.id,
    authorUsername: user.username,
    text,
    createdAt: toIsoDate(),
    score: 0
  };

  await env.DB.prepare("INSERT INTO comments (id, post_id, parent_id, author_id, text, created_at, score) VALUES (?, ?, ?, ?, ?, ?, 0)")
    .bind(comment.id, comment.postId, comment.parentId, comment.authorId, comment.text, comment.createdAt)
    .run();
  await runSafetyAssessment(env, {
    userId: user.id,
    targetType: "comment",
    targetId: comment.id,
    text
  });
  await runAiTextModeration(env, {
    userId: user.id,
    targetType: "comment",
    targetId: comment.id,
    fields: {
      text
    }
  });

  await env.DB.prepare("UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = ?").bind(postId).run();
  return success({ comment: toCommentResponse(comment) }, { status: 201 });
}

async function handleCommentVote(request, env, commentId) {
  const user = await requireUser(request, env);
  const body = await parseJsonBody(request);
  const nextVote = body.vote === "up" || body.vote === "down" ? body.vote : null;
  if (!nextVote) {
    return fail("Vote must be up or down.");
  }

  const comment = await env.DB.prepare("SELECT id, post_id AS postId, author_id AS authorId, parent_id AS parentId, text, created_at AS createdAt, COALESCE(score, 0) AS score FROM comments WHERE id = ? LIMIT 1")
    .bind(commentId)
    .first();
  if (!comment) {
    return fail("Comment not found.", 404);
  }

  const author = await env.DB.prepare("SELECT username AS authorUsername FROM users WHERE id = ? LIMIT 1").bind(comment.authorId).first();
  const existingVote = await env.DB.prepare("SELECT id, value FROM comment_votes WHERE user_id = ? AND comment_id = ? LIMIT 1")
    .bind(user.id, commentId)
    .first();

  const nextVoteValue = nextVote === "up" ? 1 : -1;
  let finalVote = nextVote;
  let scoreDelta = 0;

  if (!existingVote) {
    await env.DB.prepare("INSERT INTO comment_votes (id, comment_id, user_id, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(createId("comment_vote_"), commentId, user.id, nextVoteValue, toIsoDate(), toIsoDate())
      .run();
    scoreDelta = nextVoteValue;
  } else if (Number(existingVote.value) === nextVoteValue) {
    await env.DB.prepare("DELETE FROM comment_votes WHERE id = ?").bind(existingVote.id).run();
    scoreDelta = nextVote === "up" ? -1 : 1;
    finalVote = null;
  } else {
    await env.DB.prepare("UPDATE comment_votes SET value = ?, updated_at = ? WHERE id = ?")
      .bind(nextVoteValue, toIsoDate(), existingVote.id)
      .run();
    scoreDelta = nextVote === "up" ? 2 : -2;
  }

  await env.DB.prepare("UPDATE comments SET score = COALESCE(score, 0) + ? WHERE id = ?").bind(scoreDelta, commentId).run();
  comment.score = Number(comment.score || 0) + scoreDelta;
  comment.authorUsername = author?.authorUsername || "unknown";

  return success({ comment: toCommentResponse(comment, finalVote) });
}

async function handleCategoriesList(env) {
  const categories = await listCategories(env);
  return success({ categories });
}

async function handleCreateReport(request, env) {
  const reporter = await getCurrentUser(request, env);
  const body = await parseJsonBody(request);
  const turnstileFailure = await verifyTurnstileToken(env, request, body.turnstileToken);
  if (turnstileFailure) {
    return turnstileFailure;
  }
  const targetType = normalizeText(body.targetType);
  const targetId = normalizeText(body.targetId);
  const reason = normalizeText(body.reason).toLowerCase();
  const details = normalizeText(body.details).slice(0, 1000);

  if (!["post", "comment", "user"].includes(targetType)) {
    return fail("Invalid report target.");
  }
  if (!targetId) {
    return fail("Report target is required.");
  }
  if (!REPORT_REASONS.has(reason)) {
    return fail("Invalid report reason.");
  }

  if (targetType === "post") {
    const post = await env.DB.prepare("SELECT id FROM posts WHERE id = ? LIMIT 1").bind(targetId).first();
    if (!post) {
      return fail("Post not found.", 404);
    }
  }
  if (targetType === "comment") {
    const comment = await env.DB.prepare("SELECT id FROM comments WHERE id = ? LIMIT 1").bind(targetId).first();
    if (!comment) {
      return fail("Comment not found.", 404);
    }
  }
  if (targetType === "user") {
    const reportedUser = await env.DB.prepare("SELECT id FROM users WHERE id = ? OR username = ? LIMIT 1").bind(targetId, targetId).first();
    if (!reportedUser) {
      return fail("User not found.", 404);
    }
  }

  const reportId = createId("report_");
  await env.DB.prepare(
    "INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'open')"
  )
    .bind(reportId, reporter?.id || null, targetType, targetId, reason, details, toIsoDate())
    .run();

  if (reason === "copyright violation") {
    await env.DB.prepare(
      "INSERT INTO copyright_reports (id, report_id, claimant_name, claimant_email, copyright_description, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        createId("dmca_"),
        reportId,
        normalizeText(body.claimantName).slice(0, 120),
        normalizeEmail(body.claimantEmail).slice(0, 160),
        normalizeText(body.copyrightDescription).slice(0, 1000),
        toIsoDate()
      )
      .run();
  }

  const reportRisk = reason === "copyright violation" ? 2 : reason === "illegal content" ? 5 : reason === "hate speech" ? 5 : 3;
  await createSafetyFlag(env, {
    userId: reporter?.id || null,
    targetType,
    targetId,
    source: "user_report",
    category: reason.replace(/\s+/g, "_"),
    riskScore: reportRisk,
    details: details || "User report"
  });
  await applyModerationRisk(env, targetType, targetId, reportRisk);

  return success({ message: "Report submitted." }, { status: 201 });
}

async function handleCreateAppeal(request, env) {
  const user = await requireUser(request, env);
  const body = await parseJsonBody(request);
  const contentId = normalizeText(body.contentId);
  const contentType = normalizeText(body.contentType);
  const message = normalizeText(body.message).slice(0, 1000);

  if (contentType !== "post") {
    return fail("Only post appeals are supported right now.");
  }
  if (!contentId) {
    return fail("Appeal target is required.");
  }
  if (!message) {
    return fail("Please add a short explanation for your appeal.");
  }

  const post = await getPostRecord(env, contentId, true);
  if (!post || post.userId !== user.id) {
    return fail("Post not found.", 404);
  }
  if (![MODERATION_STATES.HIDDEN, MODERATION_STATES.UNDER_REVIEW].includes(post.moderationStatus)) {
    return fail("This post is not currently eligible for appeal.");
  }

  const existingAppeal = await env.DB.prepare(
    "SELECT id FROM moderation_appeals WHERE user_id = ? AND content_id = ? AND content_type = ? AND status = 'pending' LIMIT 1"
  )
    .bind(user.id, contentId, contentType)
    .first();

  if (existingAppeal) {
    return fail("You already have a pending appeal for this post.", 409);
  }

  await env.DB.prepare(
    "INSERT INTO moderation_appeals (id, user_id, content_id, content_type, message, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)"
  )
    .bind(createId("appeal_"), user.id, contentId, contentType, message, toIsoDate())
    .run();

  return success({ message: "Appeal submitted." }, { status: 201 });
}

async function handleModerationOverview(request, env) {
  await requireModerator(request, env);
  const rows = await env.DB.prepare(
    `
      SELECT
        reports.target_type AS targetType,
        reports.target_id AS targetId,
        reports.reason,
        COUNT(*) AS reportCount,
        MAX(reports.created_at) AS latestReportAt,
        GROUP_CONCAT(DISTINCT reports.reason) AS reasons
      FROM reports
      WHERE reports.status = 'open'
      GROUP BY reports.target_type, reports.target_id, reports.reason
      ORDER BY latestReportAt DESC
      LIMIT 200
    `
  ).all();

  const aiRows = await env.DB.prepare(
    `
      SELECT
        content_type AS contentType,
        content_id AS contentId,
        risk_score AS riskScore,
        labels,
        ai_reason AS aiReason,
        moderation_status AS moderationStatus,
        model,
        source,
        created_at AS createdAt
      FROM ai_moderation_results
      ORDER BY created_at DESC
      LIMIT 200
    `
  ).all();

  const appealRows = await env.DB.prepare(
    `
      SELECT
        moderation_appeals.id,
        moderation_appeals.user_id AS userId,
        users.username,
        moderation_appeals.content_id AS contentId,
        moderation_appeals.content_type AS contentType,
        moderation_appeals.message,
        moderation_appeals.status,
        moderation_appeals.created_at AS createdAt,
        moderation_appeals.reviewed_at AS reviewedAt,
        moderation_appeals.reviewed_by AS reviewedBy
      FROM moderation_appeals
      LEFT JOIN users ON users.id = moderation_appeals.user_id
      ORDER BY moderation_appeals.status = 'pending' DESC, moderation_appeals.created_at DESC
      LIMIT 200
    `
  ).all();

  const warningsRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM user_warnings").first();
  const suspensionsRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM user_suspensions WHERE lifted_at IS NULL").first();

  return success({
    reports: rows.results || [],
    aiFindings: (aiRows.results || []).map((row) => ({
      ...row,
      labels: parseJsonArray(row.labels)
    })),
    appeals: appealRows.results || [],
    totals: {
      warnings: Number(warningsRow?.count || 0),
      activeSuspensions: Number(suspensionsRow?.count || 0)
    }
  });
}

async function handleAppealReview(request, env, appealId) {
  const moderator = await requireModerator(request, env);
  const body = await parseJsonBody(request);
  const decision = normalizeText(body.decision);

  if (!["approve", "reject"].includes(decision)) {
    return fail("Invalid appeal decision.");
  }

  const appeal = await env.DB.prepare(
    "SELECT id, content_id AS contentId, content_type AS contentType, status FROM moderation_appeals WHERE id = ? LIMIT 1"
  )
    .bind(appealId)
    .first();

  if (!appeal) {
    return fail("Appeal not found.", 404);
  }
  if (appeal.status !== "pending") {
    return fail("This appeal has already been reviewed.", 409);
  }

  await env.DB.prepare("UPDATE moderation_appeals SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?")
    .bind(decision === "approve" ? "approved" : "rejected", toIsoDate(), moderator.id, appealId)
    .run();

  if (appeal.contentType === "post") {
    await env.DB.prepare("UPDATE posts SET moderation_status = ? WHERE id = ?")
      .bind(decision === "approve" ? MODERATION_STATES.ACTIVE : MODERATION_STATES.HIDDEN, appeal.contentId)
      .run();
  }

  await env.DB.prepare(
    "INSERT INTO moderation_actions (id, moderator_id, target_type, target_id, action, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      createId("mod_"),
      moderator.id,
      appeal.contentType,
      appeal.contentId,
      decision === "approve" ? "restore" : "hide",
      decision === "approve" ? "Appeal approved." : "Appeal rejected.",
      toIsoDate()
    )
    .run();

  return success({ message: decision === "approve" ? "Appeal approved." : "Appeal rejected." });
}

async function handleModerationAction(request, env) {
  const moderator = await requireModerator(request, env);
  const body = await parseJsonBody(request);
  const targetType = normalizeText(body.targetType);
  const targetId = normalizeText(body.targetId);
  const action = normalizeText(body.action);
  const notes = normalizeText(body.notes).slice(0, 1000);

  if (!["post", "comment", "user"].includes(targetType)) {
    return fail("Invalid moderation target.");
  }
  if (!["under_review", "hide", "restore", "remove", "warn", "suspend"].includes(action)) {
    return fail("Invalid moderation action.");
  }

  await env.DB.prepare(
    "INSERT INTO moderation_actions (id, moderator_id, target_type, target_id, action, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(createId("mod_"), moderator.id, targetType, targetId, action, notes, toIsoDate())
    .run();

  if (targetType === "post") {
    const nextStatus = action === "hide" ? MODERATION_STATES.HIDDEN : action === "restore" ? MODERATION_STATES.ACTIVE : action === "remove" ? MODERATION_STATES.REMOVED : action === "under_review" ? MODERATION_STATES.UNDER_REVIEW : null;
    if (nextStatus) {
      await env.DB.prepare("UPDATE posts SET moderation_status = ? WHERE id = ?").bind(nextStatus, targetId).run();
    }
  }

  if (targetType === "comment") {
    const nextStatus = action === "hide" ? MODERATION_STATES.HIDDEN : action === "restore" ? MODERATION_STATES.ACTIVE : action === "remove" ? MODERATION_STATES.REMOVED : action === "under_review" ? MODERATION_STATES.UNDER_REVIEW : null;
    if (nextStatus) {
      await env.DB.prepare("UPDATE comments SET moderation_status = ? WHERE id = ?").bind(nextStatus, targetId).run();
    }
  }

  if (targetType === "user") {
    if (action === "warn") {
      await env.DB.prepare("INSERT INTO user_warnings (id, user_id, moderator_id, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(createId("warn_"), targetId, moderator.id, notes || "Moderator warning", notes, toIsoDate())
        .run();
    }
    if (action === "suspend") {
      await env.DB.prepare("INSERT INTO user_suspensions (id, user_id, moderator_id, reason, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(createId("susp_"), targetId, moderator.id, notes || "Moderator suspension", notes, toIsoDate())
        .run();
      await env.DB.prepare("UPDATE users SET moderation_status = ? WHERE id = ?").bind(MODERATION_STATES.SUSPENDED, targetId).run();
    }
    if (action === "restore") {
      await env.DB.prepare("UPDATE users SET moderation_status = ? WHERE id = ?").bind(MODERATION_STATES.ACTIVE, targetId).run();
      await env.DB.prepare("UPDATE user_suspensions SET lifted_at = ? WHERE user_id = ? AND lifted_at IS NULL").bind(toIsoDate(), targetId).run();
    }
    if (action === "under_review") {
      await env.DB.prepare("UPDATE users SET moderation_status = ? WHERE id = ?").bind(MODERATION_STATES.UNDER_REVIEW, targetId).run();
    }
  }

  await env.DB.prepare("UPDATE reports SET status = 'reviewed' WHERE target_type = ? AND target_id = ? AND status = 'open'")
    .bind(targetType, targetId)
    .run();

  return success({ message: "Moderation action applied." });
}

async function handleGetProfile(request, env, username) {
  const normalizedUsername = normalizeUsername(username);
  const viewer = await getCurrentUser(request, env);
  const profileUser = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        email,
        created_at AS createdAt,
        COALESCE(display_name, '') AS displayName,
        COALESCE(bio, '') AS bio,
        COALESCE(avatar_url, '') AS avatarUrl
      FROM users
      WHERE username = ?
      LIMIT 1
    `
  )
    .bind(normalizedUsername)
    .first();

  if (!profileUser) {
    return fail("User not found.", 404);
  }

  const counts = await env.DB.prepare(
    `
      SELECT
        (SELECT COUNT(*) FROM posts WHERE author_id = ?) AS postsCount,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followersCount,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS followingCount
    `
  )
    .bind(profileUser.id, profileUser.id, profileUser.id)
    .first();

  let isFollowing = false;
  if (viewer?.id && viewer.id !== profileUser.id) {
    const followRow = await env.DB.prepare("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1")
      .bind(viewer.id, profileUser.id)
      .first();
    isFollowing = Boolean(followRow);
  }

  const canViewModeratedPosts = Boolean(viewer && (viewer.id === profileUser.id || viewer.isAdmin));

  const postRows = await env.DB.prepare(
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
        COALESCE(posts.score, COALESCE(posts.like_count, 0)) AS score,
        COALESCE(posts.comments_count, 0) AS commentsCount,
        COALESCE(posts.views, 0) AS views,
        COALESCE(posts.repost_count, 0) AS repostCount,
        posts.category_id AS categoryId,
        categories.slug AS categorySlug,
        categories.label AS categoryLabel
      FROM posts
      INNER JOIN users ON users.id = posts.author_id
      LEFT JOIN categories ON categories.id = posts.category_id
      WHERE posts.author_id = ?
        ${canViewModeratedPosts
          ? "AND COALESCE(posts.moderation_status, 'active') NOT IN ('removed')"
          : "AND COALESCE(posts.moderation_status, 'active') NOT IN ('under_review', 'hidden', 'removed')"}
      ORDER BY posts.created_at DESC, posts.id DESC
      LIMIT 50
    `
  )
    .bind(profileUser.id)
    .all();

  const postIds = (postRows.results || []).map((post) => post.id);
  const votesByPost = await getViewerVoteMap(env, viewer?.id, postIds);
  const repostsByPost = await getViewerRepostMap(env, viewer?.id, postIds);
  const hashtagsByPost = await getPostHashtagsMap(env, postIds);
  const repostsRemainingToday = await getRepostsRemainingToday(env, viewer?.id);
  const profilePosts = (postRows.results || []).map((post) => {
    post.hashtags = hashtagsByPost[post.id] || [];
    return toPostResponse(post, votesByPost[post.id] || null, repostsByPost[post.id], repostsRemainingToday);
  });

  return success({
      profile: {
        id: profileUser.id,
        username: profileUser.username,
        createdAt: profileUser.createdAt,
        displayName: profileUser.displayName || profileUser.username,
        bio: profileUser.bio || "",
        avatarUrl: profileUser.avatarUrl || "",
        postsCount: Number(counts?.postsCount || 0),
        followersCount: Number(counts?.followersCount || 0),
        followingCount: Number(counts?.followingCount || 0),
      isFollowing
    },
    posts: profilePosts
  });
}

async function handleToggleFollow(request, env, username) {
  const viewer = await requireUser(request, env);
  const normalizedUsername = normalizeUsername(username);
  const targetUser = await env.DB.prepare("SELECT id, username, created_at AS createdAt FROM users WHERE username = ? LIMIT 1")
    .bind(normalizedUsername)
    .first();
  
  if (!targetUser) {
    return fail("User not found.", 404);
  }

  const targetProfile = await env.DB.prepare(
    `
      SELECT
        id,
        username,
        created_at AS createdAt,
        COALESCE(display_name, '') AS displayName,
        COALESCE(bio, '') AS bio,
        COALESCE(avatar_url, '') AS avatarUrl
      FROM users
      WHERE id = ?
      LIMIT 1
    `
  )
    .bind(targetUser.id)
    .first();
  if (targetUser.id === viewer.id) {
    return fail("You cannot follow yourself.");
  }

  const existingFollow = await env.DB.prepare("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1")
    .bind(viewer.id, targetUser.id)
    .first();

  let isFollowing = false;
  if (existingFollow) {
    await env.DB.prepare("DELETE FROM follows WHERE id = ?").bind(existingFollow.id).run();
  } else {
    await env.DB.prepare("INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, ?)")
      .bind(createId("follow_"), viewer.id, targetUser.id, toIsoDate())
      .run();
    isFollowing = true;
  }

  const counts = await env.DB.prepare(
    `
      SELECT
        (SELECT COUNT(*) FROM posts WHERE author_id = ?) AS postsCount,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) AS followersCount,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS followingCount
    `
  )
    .bind(targetUser.id, targetUser.id, targetUser.id)
    .first();

  return success({
    profile: {
      id: targetUser.id,
      username: targetUser.username,
      createdAt: targetUser.createdAt,
      displayName: targetProfile?.displayName || targetUser.username,
      bio: targetProfile?.bio || "",
      avatarUrl: targetProfile?.avatarUrl || "",
      postsCount: Number(counts?.postsCount || 0),
      followersCount: Number(counts?.followersCount || 0),
      followingCount: Number(counts?.followingCount || 0),
      isFollowing
    }
  });
}

async function handleImage(request, env, postId) {
  const viewer = await getCurrentUser(request, env);
  let post = await getPostRecord(env, postId);

  if (!post && viewer) {
    const moderatedPost = await getPostRecord(env, postId, true);
    if (moderatedPost && (moderatedPost.userId === viewer.id || viewer.isAdmin)) {
      post = moderatedPost;
    }
  }

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

async function handleDownload(request, env, postId) {
  const viewer = await getCurrentUser(request, env);
  let post = await getPostRecord(env, postId);

  if (!post && viewer) {
    const moderatedPost = await getPostRecord(env, postId, true);
    if (moderatedPost && (moderatedPost.userId === viewer.id || viewer.isAdmin)) {
      post = moderatedPost;
    }
  }

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

async function handleAvatar(env, username) {
  const user = await env.DB.prepare(
    `
      SELECT
        username,
        COALESCE(avatar_url, '') AS avatarUrl
      FROM users
      WHERE username = ?
      LIMIT 1
    `
  )
    .bind(username)
    .first();

  if (!user?.avatarUrl || !user.avatarUrl.startsWith("avatars/")) {
    return fail("Avatar not found.", 404);
  }

  const object = await env.YIMAGE_BUCKET.get(user.avatarUrl);
  if (!object) {
    return fail("Avatar not found.", 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isApiRequest = url.pathname.startsWith("/api/");

    if (isApiRequest && request.method === "OPTIONS") {
      return applySecurityHeaders(buildPreflightResponse(request));
    }

    const response = await (async () => {
      try {
        if (url.pathname === "/api/health" && request.method === "GET") {
          return success({ message: "Yimage Worker API is working" });
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
        if (url.pathname === "/api/me/profile" && request.method === "PATCH") {
          return await handleUpdateProfile(request, env);
        }
        if (url.pathname === "/api/me/avatar" && request.method === "POST") {
          return await handleAvatarUpload(request, env);
        }
        if (url.pathname === "/api/categories" && request.method === "GET") {
          return await handleCategoriesList(env);
        }
        if (url.pathname === "/api/reports" && request.method === "POST") {
          return await handleCreateReport(request, env);
        }
        if (url.pathname === "/api/appeals" && request.method === "POST") {
          return await handleCreateAppeal(request, env);
        }
        if (url.pathname === "/api/mod/reports" && request.method === "GET") {
          return await handleModerationOverview(request, env);
        }
        if (url.pathname === "/api/mod/action" && request.method === "POST") {
          return await handleModerationAction(request, env);
        }
        if (url.pathname.startsWith("/api/mod/appeals/") && url.pathname.endsWith("/review") && request.method === "POST") {
          return await handleAppealReview(request, env, url.pathname.split("/")[4]);
        }
        if ((url.pathname === "/api/upload" || url.pathname === "/api/posts") && request.method === "POST") {
          return await handleCreatePost(request, env);
        }
        if (url.pathname === "/api/posts" && request.method === "GET") {
          return await handleListPosts(request, env);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/vote") && request.method === "POST") {
          return await handleVote(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/repost") && request.method === "POST") {
          return await handleRepost(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/delete") && request.method === "POST") {
          return await handleDeletePost(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/like") && request.method === "POST") {
          return await handleLike(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/comments") && request.method === "GET") {
          return await handleCommentsList(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/comments") && request.method === "POST") {
          return await handleCommentCreate(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && url.pathname.endsWith("/download") && request.method === "GET") {
          return await handleDownload(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/posts/") && request.method === "GET") {
          return await handleGetPost(request, env, url.pathname.replace("/api/posts/", "").trim());
        }
        if (url.pathname.startsWith("/api/comments/") && url.pathname.endsWith("/vote") && request.method === "POST") {
          return await handleCommentVote(request, env, url.pathname.split("/")[3]);
        }
        if (url.pathname.startsWith("/api/users/") && url.pathname.endsWith("/follow") && request.method === "POST") {
          return await handleToggleFollow(request, env, decodeURIComponent(url.pathname.split("/")[3]));
        }
        if (url.pathname.startsWith("/api/users/") && url.pathname.endsWith("/avatar") && request.method === "GET") {
          return await handleAvatar(env, decodeURIComponent(url.pathname.split("/")[3]));
        }
        if (url.pathname.startsWith("/api/users/") && request.method === "GET") {
          return await handleGetProfile(request, env, decodeURIComponent(url.pathname.split("/")[3]));
        }
        if (url.pathname.startsWith("/api/image/") && request.method === "GET") {
          return await handleImage(request, env, url.pathname.replace("/api/image/", "").trim());
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
    })();

    const withCors = isApiRequest ? applyCorsHeaders(request, response) : response;
    return applySecurityHeaders(withCors);
  }
};
