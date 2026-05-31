import { Card, Divider, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function CommunityGuidelinesPage() {
  useSeo({
    title: "Community Guidelines - Yimage",
    description: "Read the community rules and platform safety guidelines for posting on Yimage.",
    canonicalPath: "/community-guidelines",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={2}>
            <Typography level="h1">Community Guidelines</Typography>
            <Typography level="body-md" textColor="neutral.300">
              These guidelines explain the kind of community Yimage is trying to build. They are written in plain language so users can understand what belongs here and what does not.
            </Typography>
            <Divider />

            <Stack spacing={1}>
              <Typography level="title-lg">No illegal content</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Do not post unlawful material, stolen material, criminal services, or content that violates applicable law.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No spam</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Do not flood the platform with repetitive promotions, engagement bait, scams, misleading links, or low-quality uploads meant to manipulate visibility.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Respect other users</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Treat other people like real people. Debate and disagreement are fine, but targeted cruelty, intimidation, and repeated hostile behavior are not.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No harassment</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Do not threaten, stalk, bully, or encourage abuse toward others. That includes dogpiling, repeated slurs, sexual harassment, and attempts to shame or frighten people off the platform.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No impersonation</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Do not pretend to be another person, company, or organization in a misleading way. Parody and commentary should be clearly recognizable as such.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No copyright infringement</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Only upload material you have the right to share. If you use someone else’s work without permission, attribution alone may not be enough.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No violent or harmful content</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Graphic violence, glorification of serious harm, and dangerous content that encourages real-world injury may be removed or restricted.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No hateful content</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Content that attacks people based on protected characteristics, promotes dehumanization, or glorifies hateful ideology is not allowed.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No malicious content</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Do not upload malware, phishing material, harmful scripts, or content designed to damage devices, trick users, or interfere with platform security.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">No unsafe or abusive uploads</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Do not upload material that is exploitative, graphically abusive, or clearly unsafe for the platform. Automated systems and moderators may review uploads that create safety concerns.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Moderation process</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may use reports, moderator review, and automated systems to flag or review content. Some posts may stay public while reports accumulate, while other posts may move into review immediately if they trigger safety systems.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Reporting system</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Use reports honestly and only for real concerns. False, abusive, or retaliatory reporting can itself become a moderation issue.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Follow moderator decisions</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Users are expected to respect moderation outcomes. Repeated attempts to evade enforcement, repost removed content, or misuse the platform after warnings can lead to stronger action.
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
