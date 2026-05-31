import { Card, Link, Stack, Typography } from "@mui/joy";
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
          <Stack spacing={1.5}>
            <Typography level="h1">Impressum</Typography>
            <Typography level="body-md" textColor="neutral.300">
              Operator information is currently being prepared.
            </Typography>
            <Typography level="body-md" textColor="neutral.300">
              For legal inquiries, please contact:
            </Typography>
            <Typography level="body-lg">
              <Link href="mailto:contact@yimage.org" underline="hover">
                contact@yimage.org
              </Link>
            </Typography>
            <Typography level="body-sm" textColor="neutral.400">
              This is a temporary placeholder and must be easy to edit later.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
