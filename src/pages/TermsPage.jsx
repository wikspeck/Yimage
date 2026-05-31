import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function TermsPage() {
  useSeo({
    title: "Terms of Service - Yimage",
    description: "Terms of service placeholder for Yimage.",
    canonicalPath: "/terms",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1">Terms of Service</Typography>
            <Typography level="body-md" textColor="neutral.300">
              This is a placeholder terms page. Replace it with the final Yimage terms of service.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
