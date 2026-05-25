import { Box, Button, Sheet, Stack, Typography } from "@mui/joy";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavIcon({ active, children }) {
  return (
    <span className={`nav-icon-shell${active ? " is-active" : ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </span>
  );
}

function HomeIcon({ active }) {
  return active ? (
    <NavIcon active>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-5.5h-3V21H5a1 1 0 0 1-1-1z" />
    </NavIcon>
  ) : (
    <NavIcon active={false}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 21v-5.5h4V21" />
    </NavIcon>
  );
}

function ExploreIcon({ active }) {
  return active ? (
    <NavIcon active>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" fill="none" />
    </NavIcon>
  ) : (
    <NavIcon active={false}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </NavIcon>
  );
}

function CreateIcon({ active }) {
  return active ? (
    <NavIcon active>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M12 8v8" fill="none" />
      <path d="M8 12h8" fill="none" />
    </NavIcon>
  ) : (
    <NavIcon active={false}>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </NavIcon>
  );
}

function ProfileIcon({ active }) {
  return active ? (
    <NavIcon active>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19.5c1.8-3 4.2-4.5 7-4.5s5.2 1.5 7 4.5" fill="none" />
    </NavIcon>
  ) : (
    <NavIcon active={false}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19.5c1.8-3 4.2-4.5 7-4.5s5.2 1.5 7 4.5" />
    </NavIcon>
  );
}

function BellIcon({ active }) {
  return active ? (
    <NavIcon active>
      <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5V12l-1.5 3h12L16.5 12V9A4.5 4.5 0 0 0 12 4.5Z" />
      <path d="M10 18a2.2 2.2 0 0 0 4 0" fill="none" />
    </NavIcon>
  ) : (
    <NavIcon active={false}>
      <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5V12l-1.5 3h12L16.5 12V9A4.5 4.5 0 0 0 12 4.5Z" />
      <path d="M10 18a2.2 2.2 0 0 0 4 0" />
    </NavIcon>
  );
}

function NavItem({ active, label, icon, onClick, badge, prominent = false }) {
  return (
    <button
      type="button"
      className={`nav-item${active ? " is-active" : ""}${prominent ? " is-prominent" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={label}
    >
      <span className="nav-item-inner">
        {icon}
        <span className="nav-item-label">{label}</span>
        {badge ? <span className="nav-item-badge">{badge}</span> : null}
      </span>
    </button>
  );
}

export default function Header({ onOpenLogin, onOpenSignup, onCreate, onDiscover, onProfile }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const isCreate = location.pathname.startsWith("/create");
  const isProfile = location.pathname === "/profile" || location.pathname.startsWith("/u/");
  const isDiscover = isHome && Boolean(location.search);

  return (
    <>
      <Sheet variant="plain" className="top-brand-bar">
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <button type="button" className="brand-lockup" onClick={onDiscover} aria-label="Go to home feed">
            <Box
              component="img"
              src="/yimage-logo-platform.svg"
              alt="Yimage"
              sx={{
                width: { xs: 56, sm: 68 },
                height: { xs: 56, sm: 68 },
                objectFit: "contain",
                objectPosition: "center",
                flexShrink: 0
              }}
            />
            <Box className="brand-copy">
              <Typography level="title-lg" className="brand-title">
                Yimage
              </Typography>
              <Typography level="body-sm" className="brand-subtitle">
                Social image network
              </Typography>
            </Box>
          </button>

          <Stack direction="row" spacing={1} alignItems="center">
            {user ? (
              <>
                <Button variant="soft" color="neutral" onClick={onProfile} sx={{ borderRadius: "999px" }}>
                  @{user.username}
                </Button>
                <Button variant="plain" color="neutral" onClick={logout} sx={{ borderRadius: "999px" }}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="plain" color="neutral" onClick={onOpenLogin} sx={{ borderRadius: "999px" }}>
                  Log in
                </Button>
                <Button variant="solid" color="primary" onClick={onOpenSignup} sx={{ borderRadius: "999px" }}>
                  Join
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Sheet>

      <aside className="app-nav-shell" aria-label="Primary navigation">
        <div className="app-nav-panel">
          <NavItem active={isHome} label="Home" icon={<HomeIcon active={isHome} />} onClick={onDiscover} />
          <NavItem active={isDiscover} label="Explore" icon={<ExploreIcon active={isDiscover} />} onClick={onDiscover} />
          <NavItem active={false} label="Alerts" icon={<BellIcon active={false} />} onClick={user ? onProfile : onOpenLogin} badge={user ? "New" : undefined} />
          <NavItem active={isProfile} label="Profile" icon={<ProfileIcon active={isProfile} />} onClick={onProfile} />
          <NavItem active={isCreate} label="Create" icon={<CreateIcon active={isCreate} />} onClick={onCreate} prominent />
        </div>
      </aside>
    </>
  );
}
