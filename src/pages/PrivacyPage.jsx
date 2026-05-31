import { Card, Divider, Link, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function PrivacyPage() {
  useSeo({
    title: "Privacy Policy - Yimage",
    description: "Privacy Policy placeholder for Yimage explaining account, content, moderation, and infrastructure data processing.",
    canonicalPath: "/privacy",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={2}>
            <Typography level="h1">Privacy Policy</Typography>
            <Typography level="body-md" textColor="neutral.300">
              This Privacy Policy is a launch-ready placeholder for Yimage. It explains the kinds of information the platform may process and should be reviewed, finalized, and adapted for your legal requirements before public release.
            </Typography>
            <Divider />

            <Stack spacing={1}>
              <Typography level="title-lg">Information Yimage may process</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may process account and platform data including username, email address, password hash (never plain password), uploaded posts and images, comments, likes, reposts, reports, moderation data, session and cookie data, and technical security data used to protect the service.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Why this information is used</Typography>
              <Typography level="body-md" textColor="neutral.300">
                This information may be used to operate accounts, publish and display user content, enforce moderation rules, investigate abuse, maintain security, provide support, and improve service reliability.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Moderation and safety processing</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may process reports, moderation metadata, automated safety findings, and account enforcement records in order to review harmful content, respond to complaints, and protect users and the platform.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Cloudflare infrastructure</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage uses Cloudflare infrastructure, including Workers, D1, R2, Pages, and related security and edge services. Depending on configuration, some technical and security-related data may be processed through Cloudflare systems to serve the platform and protect it from abuse.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Contact</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Privacy questions, data requests, and related inquiries can be sent to{" "}
                <Link href="mailto:contact@yimage.org" underline="hover">contact@yimage.org</Link>.
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
