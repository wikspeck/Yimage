import { Avatar, Box, Button, Sheet, Stack, Typography } from "@mui/joy";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header({ onOpenLogin, onOpenSignup, onCreate, onDiscover, onProfile }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const onDiscoverPage = location.pathname === "/" || location.pathname === "/discover";

  return (
    <Sheet
      variant="outlined"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        mx: { xs: 2, md: 3 },
        mt: { xs: 2, md: 3 },
        px: { xs: 2, md: 3 },
        py: 1.5,
        borderRadius: "18px",
        bgcolor: "rgba(14, 16, 24, 0.92)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)"
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: "pointer" }} onClick={onDiscover}>
          <Avatar
            variant="soft"
            sx={{
              borderRadius: "16px",
              bgcolor: "rgba(255,255,255,0.08)",
              color: "#f3f5ff",
              fontWeight: 700
            }}
          >
            Y
          </Avatar>
          <Box>
            <Typography level="title-lg" sx={{ letterSpacing: "-0.04em" }}>
              Yimage
            </Typography>
            <Typography level="body-sm" textColor="neutral.400">
              Social image sharing
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Button variant={onDiscoverPage ? "solid" : "soft"} color="neutral" onClick={onDiscover} sx={{ borderRadius: "999px" }}>
            Discover
          </Button>
          <Button variant="soft" color="primary" onClick={onCreate} sx={{ borderRadius: "999px" }}>
            Create
          </Button>

          {user ? (
            <>
              <Button variant="soft" color="neutral" onClick={onProfile} sx={{ borderRadius: "999px" }}>
                @{user.username}
              </Button>
              <Button
                variant="plain"
                color="neutral"
                onClick={logout}
                sx={{ borderRadius: "999px" }}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="plain" color="neutral" onClick={onOpenLogin} sx={{ borderRadius: "999px" }}>
                Log in
              </Button>
              <Button variant="soft" color="neutral" onClick={onOpenSignup} sx={{ borderRadius: "999px" }}>
                Sign up
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Sheet>
  );
}
