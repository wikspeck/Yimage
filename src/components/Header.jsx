import { Box, Button, Modal, ModalClose, Sheet, Stack, Typography } from "@mui/joy";
import { useState } from "react";
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
      </span>
    </button>
  );
}

function MenuButton({ onClick }) {
  return (
    <button type="button" className="nav-menu-button" onClick={onClick} aria-label="Open menu">
      <span />
      <span />
      <span />
    </button>
  );
}

function MenuRow({ label, onClick }) {
  return (
    <button type="button" className="nav-menu-row" onClick={onClick}>
      <span>{label}</span>
      <span className="nav-menu-arrow" aria-hidden="true">
        {">"}
      </span>
    </button>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({
  onOpenLogin,
  onOpenSignup,
  onCreate,
  onHome,
  onDiscover,
  onProfile,
  onSearch,
  onSettings,
  onGuidelines,
  onDmca,
  onCookies
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDiscover = location.pathname === "/discover";
  const isSearch = location.pathname === "/search";
  const isHome = location.pathname === "/";
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
                <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>
                  @{user.username}
                </Typography>
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
            <span className="nav-compose-plus" aria-hidden="true">
              <PlusIcon />
            </span>
          </button>

          <MenuButton onClick={() => setMenuOpen(true)} />
        </div>
      </aside>

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        className="nav-menu-modal"
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "none",
              backgroundColor: "rgba(0, 0, 0, 0.08)"
            }
          }
        }}
      >
        <Sheet variant="outlined" className="nav-menu-sheet">
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="flex-end">
              <ModalClose sx={{ position: "static", transform: "none", m: 0, p: 0.5 }} />
            </Stack>
            <MenuRow label="Settings" onClick={() => { setMenuOpen(false); onSettings?.(); }} />
            <MenuRow label="Community Guidelines" onClick={() => { setMenuOpen(false); onGuidelines?.(); }} />
            <MenuRow label="DMCA" onClick={() => { setMenuOpen(false); onDmca?.(); }} />
            <MenuRow label="Cookie Policy" onClick={() => { setMenuOpen(false); onCookies?.(); }} />
          </Stack>
        </Sheet>
      </Modal>
    </>
  );
}
