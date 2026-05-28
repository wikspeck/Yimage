import { createContext, useContext, useMemo, useState } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    mode: "login",
    nextPath: "/"
  });

  const value = useMemo(
    () => ({
      isOpen: state.open,
      mode: state.mode,
      nextPath: state.nextPath,
      openLogin(nextPath = "/") {
        setState({ open: true, mode: "login", nextPath });
      },
      openSignup(nextPath = "/") {
        setState({ open: true, mode: "signup", nextPath });
      },
      setMode(mode) {
        setState((current) => ({ ...current, mode }));
      },
      close() {
        setState((current) => ({ ...current, open: false }));
      }
    }),
    [state.mode, state.nextPath, state.open]
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used inside AuthModalProvider");
  }

  return context;
}
