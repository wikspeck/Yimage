import { Card, Divider, Stack, Typography } from "@mui/joy";
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
          <Stack spacing={2}>
            <Typography level="h1">Copyright and DMCA</Typography>
            <Typography level="body-md" textColor="neutral.300">
              This page is a working template for copyright reporting on Yimage. It should be reviewed and finalized before launch. Do not add fake legal addresses or fake designated-agent details here.
            </Typography>
            <Divider />

            <Stack spacing={1}>
              <Typography level="title-lg">How to submit a copyright report</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Copyright owners or authorized agents can use the reporting tools on Yimage and select `copyright violation`. Placeholder note: add the official email address or webform location for formal notices here.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">What to include</Typography>
              <Typography level="body-md" textColor="neutral.300">
                A report should include enough detail for review, such as the copyrighted work involved, the location of the allegedly infringing content, the name and contact information of the reporting party, and a statement that the complaint is made in good faith.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Review process</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Yimage may review the report, request additional information, restrict or remove content, and keep internal records for compliance and dispute handling. Content may be limited during review where appropriate.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography level="title-lg">Counter-notice placeholder</Typography>
              <Typography level="body-md" textColor="neutral.300">
                Placeholder note: add the final counter-notice requirements, including the information a user must provide if they believe content was removed by mistake and the conditions under which Yimage may restore content.
              </Typography>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
