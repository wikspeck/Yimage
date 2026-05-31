import { Card, Link, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function ContactPage() {
  useSeo({
    title: "Contact - Yimage",
    description: "Contact Yimage for support, moderation, copyright, and account questions.",
    canonicalPath: "/contact",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.5}>
            <Typography level="h1">Contact</Typography>
            <Typography level="body-md" textColor="neutral.300">
              For support, copyright reports, moderation questions, account questions, or general inquiries, contact:
            </Typography>
            <Typography level="body-lg">
              <Link href="mailto:contact@yimage.org" underline="hover">
                contact@yimage.org
              </Link>
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
