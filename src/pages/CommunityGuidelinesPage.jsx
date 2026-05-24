import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";

export default function CommunityGuidelinesPage() {
  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1">Community Guidelines</Typography>
            <Typography level="body-md" textColor="neutral.300">
              Yimage does not allow spam, harassment, illegal content, sexual exploitation, graphic violence, hate speech, copyright abuse, impersonation, or offensive profile identities.
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              Report reasons map directly to these categories so moderators can review content in a consistent way.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
