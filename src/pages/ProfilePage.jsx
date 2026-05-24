import { Card, Stack, Typography } from "@mui/joy";
import { useAuth } from "../context/AuthContext";
import { formatFullDate } from "../utils/formatters";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <Card variant="outlined" className="content-card">
          <Stack spacing={1}>
            <Typography level="h1" sx={{ letterSpacing: "-0.05em" }}>
              @{user.username}
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              {user.email}
            </Typography>
            <Typography level="body-sm" textColor="neutral.500">
              Joined {formatFullDate(user.createdAt)}
            </Typography>
          </Stack>
        </Card>

        <Card variant="outlined" className="content-card">
          <Stack spacing={1}>
            <Typography level="title-lg">Profile placeholder</Typography>
            <Typography level="body-md" textColor="neutral.400">
              Public profiles can come next. For now this page confirms that your account is stored in D1 and your session stays active.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
