import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function CookiePolicyPage() {
  useSeo({
    title: "Cookie Policy - Yimage",
    description: "Information about cookies and session usage on Yimage.",
    canonicalPath: "/cookies",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.5}>
            <Typography level="h1">Cookie Policy</Typography>
            <Typography level="body-md" textColor="neutral.300">
              Yimage uses a small number of necessary cookies to keep the platform secure and working correctly.
            </Typography>

            <Stack spacing={0.75}>
              <Typography level="title-md">What cookies are used</Typography>
              <Typography level="body-md" textColor="neutral.400">
                Yimage uses secure session cookies for account login, authentication checks, and basic protection against unauthorized access.
              </Typography>
            </Stack>

            <Stack spacing={0.75}>
              <Typography level="title-md">Why they are needed</Typography>
              <Typography level="body-md" textColor="neutral.400">
                These cookies help the Worker recognize signed-in users, keep secure sessions active across page loads, and protect actions such as posting, commenting, reporting, and profile changes.
              </Typography>
            </Stack>

            <Stack spacing={0.75}>
              <Typography level="title-md">What Yimage does not use</Typography>
              <Typography level="body-md" textColor="neutral.400">
                Yimage currently does not use invasive tracking cookies or advertising cookies. The focus is necessary platform functionality and account safety.
              </Typography>
            </Stack>

            <Stack spacing={0.75}>
              <Typography level="title-md">How secure session cookies help</Typography>
              <Typography level="body-md" textColor="neutral.400">
                Secure session cookies help keep accounts safer by storing only a session token in an HttpOnly cookie, so sensitive session data is not exposed to normal frontend JavaScript.
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
