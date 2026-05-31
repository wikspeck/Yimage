import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, signupUser, updateProfile as updateProfileRequest, uploadProfileAvatar as uploadProfileAvatarRequest } from "../api/yimageApi";

const AuthContext = createContext(null);
const AUTH_SNAPSHOT_KEY = "yimage_user_snapshot";

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  try {
    if (user) {
      window.localStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_SNAPSHOT_KEY);
    }
  } catch {
    // Ignore storage failures so auth still works with the cookie-backed session.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (typeof window === "undefined" ? null : readStoredUser()));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          writeStoredUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          writeStoredUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    function revalidateSession() {
      bootstrap();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        revalidateSession();
      }
    }

    window.addEventListener("pageshow", revalidateSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("pageshow", revalidateSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      async login(credentials) {
        const nextUser = await loginUser(credentials);
        setUser(nextUser);
        writeStoredUser(nextUser);
        return nextUser;
      },
      async signup(payload) {
        const nextUser = await signupUser(payload);
        setUser(nextUser);
        writeStoredUser(nextUser);
        return nextUser;
      },
      async logout() {
        await logoutUser();
        setUser(null);
        writeStoredUser(null);
      },
      async updateProfile(payload) {
        const nextUser = await updateProfileRequest(payload);
        setUser(nextUser);
        writeStoredUser(nextUser);
        return nextUser;
      },
      async uploadProfileAvatar(file) {
        const nextUser = await uploadProfileAvatarRequest(file);
        setUser(nextUser);
        writeStoredUser(nextUser);
        return nextUser;
      },
      setUser
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
