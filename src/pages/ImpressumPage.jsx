import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function ImpressumPage() {
  useSeo({
    title: "Impressum - Yimage",
    description: "Legal notice placeholder for Yimage.",
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
              This is a placeholder Impressum page for Yimage. Replace this text with the final legal notice and company details.
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              Suggested fields:
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              Name or company, address, email, phone, authorized representative, VAT information, and any required jurisdiction-specific disclosures.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
