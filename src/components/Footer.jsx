import { Link, Sheet, Stack, Typography } from "@mui/joy";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  return (
    <Sheet variant="plain" className="app-footer">
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} useFlexGap justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" justifyContent="center">
          <Link component={RouterLink} to="/guidelines" underline="hover">Community Guidelines</Link>
          <Link component={RouterLink} to="/dmca" underline="hover">DMCA</Link>
          <Link component={RouterLink} to="/cookies" underline="hover">Cookie Policy</Link>
          {user?.isAdmin ? <Link component={RouterLink} to="/moderation" underline="hover">Moderation</Link> : null}
        </Stack>
        <Typography level="body-sm" textColor="neutral.500">
          Yimage, built for the scroll.
        </Typography>
      </Stack>
    </Sheet>
  );
}
