import { CssBaseline, CssVarsProvider } from "@mui/joy";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CreatePostPage from "./pages/CreatePostPage";
import DiscoverPage from "./pages/DiscoverPage";
import LoginPage from "./pages/LoginPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import SignupPage from "./pages/SignupPage";

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

function AppLayout() {
  const navigate = useNavigate();

  return (
    <Header
      onOpenLogin={() => navigate("/login")}
      onOpenSignup={() => navigate("/signup")}
      onCreate={() => navigate("/create")}
      onDiscover={() => navigate("/")}
      onProfile={() => navigate("/profile")}
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
            <Routes>
              <Route path="/" element={<DiscoverPage />} />
              <Route path="/discover" element={<Navigate to="/" replace />} />
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
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route path="/:postId" element={<PostPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <CssVarsProvider defaultMode="dark">
      <CssBaseline />
      <AppRoutes />
    </CssVarsProvider>
  );
}
