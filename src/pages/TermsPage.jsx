import { Card, Divider, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function TermsPage() {
  useSeo({
    title: "Terms of Service - Yimage",
    description: "Terms of Service placeholder for Yimage with editable launch-ready structure.",
    canonicalPath: "/terms",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/settings" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={2}>
            <Typography level="h1">Terms of Service</Typography>
            <Typography level="body-md" textColor="neutral.300">
              These Terms of Service are a working legal placeholder for Yimage. They are written to be edited and reviewed before launch. Replace any placeholder notes with final legal language approved for your jurisdiction.
            </Typography>
            <Typography level="body-sm" textColor="warning.300">
              Placeholder note: insert the legal entity name, governing law, and contact details here before publishing the final version.
            </Typography>
            <Divider />

            <Stack spacing={1}>
              <Typography level="title-lg">1. Using Yimage</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage is a platform for sharing user-generated images, posts, comments, and profile content. By creating an account or using the service, users agree to follow these terms, the Community Guidelines, and any applicable laws.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">2. User accounts</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Users are responsible for the activity that happens through their accounts and for keeping login credentials secure. Users must provide accurate information when registering and must not create accounts for deceptive, abusive, or unlawful purposes.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">3. User-generated content</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Users keep responsibility for the content they upload, publish, or send through Yimage. By posting content, users confirm that they have the rights needed to share it and grant Yimage a limited license to host, display, process, and moderate that content for platform operation.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">4. Prohibited content and behavior</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Users may not post illegal content, exploitative sexual material, spam, impersonation, copyright-infringing material, hateful content, graphic violence, or other harmful material described in the Community Guidelines. Attempts to evade moderation or misuse reporting tools are also prohibited.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">5. Moderation and enforcement</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may review content using a combination of user reports, automated systems, and moderator decisions. Content may be limited, reviewed, removed, or escalated when it appears to violate platform rules or create safety, legal, or operational risk.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">6. Copyright complaints</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Copyright owners or authorized agents may submit notices through the Yimage copyright reporting process. Yimage may remove or restrict access to challenged content while reviewing a complaint, and may provide a counter-notice process where required by law.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">7. Account suspension and termination</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may suspend or terminate accounts that repeatedly violate the rules, create legal risk, or threaten other users or the service. Users may also stop using the service at any time, subject to any necessary retention required for security, compliance, or dispute resolution.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">8. Platform availability</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may change, pause, limit, or discontinue features at any time. The platform is provided on an as-available basis and may be interrupted by maintenance, moderation workflows, technical failures, or third-party service issues.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">9. Liability limitations</Typography>
              <Typography level="body-md" textColor="neutral.300">
                To the fullest extent permitted by law, Yimage is not responsible for indirect, incidental, or consequential losses arising from use of the platform, user-generated content, moderation decisions, or service interruptions. Final legal language and jurisdiction-specific carveouts should be inserted here before launch.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">10. Contact and legal notices</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Placeholder note: add the official legal contact email, service operator details, and any required regional disclosures here. This section should also identify where users can send formal notices, copyright complaints, and support requests.
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
