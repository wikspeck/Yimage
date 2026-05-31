import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function ImpressumPage() {
  useSeo({
    title: "Impressum - Yimage",
    description: "Editable placeholder for Yimage legal notice information.",
    canonicalPath: "/impressum",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1">Impressum</Typography>
            <Typography level="body-md" textColor="neutral.300">
              Placeholder note: add the legally required operator details, publishing contact information, and regional disclosure language here before making this page public.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
