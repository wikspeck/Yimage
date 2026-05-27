import { CssBaseline, CssVarsProvider } from "@mui/joy";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CookieConsentBanner from "./components/CookieConsentBanner";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import CreatePostPage from "./pages/CreatePostPage";
import DiscoverPage from "./pages/DiscoverPage";
import LoginPage from "./pages/LoginPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import SignupPage from "./pages/SignupPage";
import ModerationPage from "./pages/ModerationPage";
import CommunityGuidelinesPage from "./pages/CommunityGuidelinesPage";
import DmcaPage from "./pages/DmcaPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";

function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}

function RequireModerator({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Header
      onOpenLogin={() => navigate("/login")}
      onOpenSignup={() => navigate("/signup")}
      onCreate={() => navigate("/create")}
      onHome={() => navigate("/")}
      onDiscover={() => navigate("/?view=discover")}
      onSearch={() => navigate("/search")}
      onSettings={() => navigate("/settings")}
      onProfile={() => navigate(user ? `/u/${user.username}` : "/login")}
    />
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <AppLayout />
          <main className="app-main">
            <AppErrorBoundary>
              <Routes>
                <Route path="/" element={<DiscoverPage />} />
                <Route path="/discover" element={<Navigate to="/" replace />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/create"
                  element={
                    <RequireAuth>
                      <CreatePostPage />
                    </RequireAuth>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/guidelines" element={<CommunityGuidelinesPage />} />
                <Route path="/dmca" element={<DmcaPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <NavigateToOwnProfile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/moderation"
                  element={
                    <RequireModerator>
                      <ModerationPage />
                    </RequireModerator>
                  }
                />
                <Route path="/u/:username" element={<ProfilePage />} />
                <Route path="/:postId" element={<PostPage />} />
              </Routes>
            </AppErrorBoundary>
          </main>
          <Footer />
          <CookieConsentBanner />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NavigateToOwnProfile() {
  const { user } = useAuth();
  return <Navigate to={`/u/${user.username}`} replace />;
}

export default function App() {
  return (
    <CssVarsProvider defaultMode="dark">
      <CssBaseline />
      <PreferencesProvider>
        <AppRoutes />
      </PreferencesProvider>
    </CssVarsProvider>
  );
}
