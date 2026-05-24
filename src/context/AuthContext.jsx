import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, signupUser, updateProfile as updateProfileRequest, uploadProfileAvatar as uploadProfileAvatarRequest } from "../api/yimageApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      async login(credentials) {
        const nextUser = await loginUser(credentials);
        setUser(nextUser);
        return nextUser;
      },
      async signup(payload) {
        const nextUser = await signupUser(payload);
        setUser(nextUser);
        return nextUser;
      },
      async logout() {
        await logoutUser();
        setUser(null);
      },
      async updateProfile(payload) {
        const nextUser = await updateProfileRequest(payload);
        setUser(nextUser);
        return nextUser;
      },
      async uploadProfileAvatar(file) {
        const nextUser = await uploadProfileAvatarRequest(file);
        setUser(nextUser);
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
