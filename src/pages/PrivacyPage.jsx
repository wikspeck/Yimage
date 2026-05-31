import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function PrivacyPage() {
  useSeo({
    title: "Privacy - Yimage",
    description: "Privacy information placeholder for Yimage.",
    canonicalPath: "/privacy",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1">Privacy</Typography>
            <Typography level="body-md" textColor="neutral.300">
              This is a placeholder privacy page. Replace it with the final privacy policy text for Yimage.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
