const STORAGE_PREFIX = "yimage.postAction";

function getViewerKey(user) {
  return user?.id || user?.username || "guest";
}

function buildStorageKey(action, postId, user) {
  return `${STORAGE_PREFIX}.${action}.${getViewerKey(user)}.${postId}`;
}

export function readPostActionState(action, postId, user) {
  if (!postId || typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(buildStorageKey(action, postId, user)) === "1";
  } catch {
    return false;
  }
}

export function writePostActionState(action, postId, user, active = true) {
  if (!postId || typeof window === "undefined") {
    return;
  }

  try {
    const key = buildStorageKey(action, postId, user);
    if (active) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // no-op if storage is unavailable
  }
}
