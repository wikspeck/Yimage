import { Card, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { useSeo } from "../hooks/useSeo";

export default function DmcaPage() {
  useSeo({
    title: "DMCA - Yimage",
    description: "Copyright and DMCA reporting information for content posted on Yimage.",
    canonicalPath: "/dmca",
    type: "article"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1">Copyright and DMCA</Typography>
            <Typography level="body-md" textColor="neutral.300">
              If you believe content on Yimage infringes your copyright, use the report flow and choose `copyright violation`.
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              Include your name, contact email, and a short description of the work you believe is being infringed. Reported content is reviewed by moderators rather than automatically deleted.
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
