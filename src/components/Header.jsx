import { Box, Button, Sheet, Stack, Typography } from "@mui/joy";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ active, label, iconSrc, selectedIconSrc, onClick }) {
  return (
    <button
      type="button"
      className={`nav-item${active ? " is-active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
    >
      <span className="nav-item-inner">
        <span className="nav-icon-shell">
          <img
            src={active ? selectedIconSrc : iconSrc}
            alt=""
            className="nav-icon-image"
            aria-hidden="true"
          />
        </span>
        <span className="nav-item-label">{label}</span>
      </span>
    </button>
  );
}

export default function Header({ onOpenLogin, onOpenSignup, onCreate, onHome, onDiscover, onProfile, onSearch, onSettings }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const isDiscover = location.pathname === "/" && params.get("view") === "discover";
  const isSearch = location.pathname === "/search";
  const isHome = location.pathname === "/" && !isDiscover && !isSearch;
  const isProfile = location.pathname === "/profile" || location.pathname.startsWith("/u/");
  const isCreate = location.pathname.startsWith("/create");

  return (
    <>
      <Sheet variant="plain" className="top-brand-bar">
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <button type="button" className="brand-lockup" onClick={onHome} aria-label="Go to Yimage home">
            <Box
              component="img"
              src="/yimage-logo-platform.svg"
              alt="Yimage"
              sx={{
                width: { xs: 50, sm: 56 },
                height: { xs: 50, sm: 56 },
                objectFit: "contain",
                objectPosition: "center",
                flexShrink: 0
              }}
            />
            <Box className="brand-copy">
              <Stack direction="row" spacing={0.9} alignItems="center">
                <Typography level="title-lg" className="brand-title">
                  Yimage
                </Typography>
                <Typography level="body-xs" className="brand-version">
                  0.1.0
                </Typography>
              </Stack>
            </Box>
          </button>

          <Stack direction="row" spacing={1} alignItems="center">
            {user ? (
              <>
                <Button variant="plain" color="neutral" onClick={onSettings} sx={{ borderRadius: "999px", color: "#ffffff" }}>
                  Settings
                </Button>
                <Button variant="plain" color="neutral" onClick={logout} sx={{ borderRadius: "999px", color: "#ffffff" }}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="plain" color="neutral" onClick={onOpenLogin} sx={{ borderRadius: "999px", color: "#ffffff" }}>
                  Log in
                </Button>
                <Button
                  variant="solid"
                  color="neutral"
                  onClick={onOpenSignup}
                  className="app-primary-button"
                  sx={{ borderRadius: "999px" }}
                >
                  Join
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Sheet>

      <aside className="app-nav-shell" aria-label="Primary navigation">
        <div className="app-nav-panel">
          <NavItem
            active={isHome}
            label="Home"
            iconSrc="/nav-home.svg"
            selectedIconSrc="/nav-home-selected.svg"
            onClick={onHome}
          />
          <NavItem
            active={isDiscover}
            label="Discover"
            iconSrc="/nav-discover.svg"
            selectedIconSrc="/nav-discover-selected.svg"
            onClick={onDiscover}
          />
          <NavItem
            active={isSearch}
            label="Search"
            iconSrc="/nav-search.svg"
            selectedIconSrc="/nav-search-selected.svg"
            onClick={onSearch}
          />
          <NavItem
            active={isProfile}
            label="Profile"
            iconSrc="/nav-profile.svg"
            selectedIconSrc="/nav-profile-selected.svg"
            onClick={onProfile}
          />

          <div className="nav-divider" />

          <button type="button" className={`nav-compose-button${isCreate ? " is-active" : ""}`} onClick={onCreate} aria-label="Create post">
            <span>Create</span>
          </button>
        </div>
      </aside>
    </>
  );
}
