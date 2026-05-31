import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function ContactPage() {
  useSeo({
    title: "Contact - Yimage",
    description: "Contact and support placeholder for Yimage.",
    canonicalPath: "/contact",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1">Contact / Support</Typography>
            <Typography level="body-md" textColor="neutral.300">
              This is a placeholder support page. Add the preferred support email, contact form details, or business contact info here.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
