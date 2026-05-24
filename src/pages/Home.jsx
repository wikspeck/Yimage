import { Box, Card, Sheet, Stack, Typography } from "@mui/joy";
import Footer from "../components/Footer";
import Header from "../components/Header";
import UploadBox from "../components/UploadBox";

function PlaceholderPost() {
  return (
    <Card
      variant="outlined"
      sx={{
        mt: 2,
        p: { xs: 2, md: 3 },
        borderRadius: "28px",
        bgcolor: "rgba(18, 20, 28, 0.92)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Sheet sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
          <Box>
            <Typography level="title-sm">Future feed preview</Typography>
            <Typography level="body-sm" textColor="neutral.500">
              This is where real uploaded image posts can appear later.
            </Typography>
          </Box>
        </Stack>
        <Sheet
          sx={{
            minHeight: 220,
            borderRadius: "22px",
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid",
            borderColor: "rgba(255,255,255,0.06)"
          }}
        />
      </Stack>
    </Card>
  );
}

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        backgroundColor: "#0b0d12"
      }}
    >
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Stack spacing={2.5}>
          <Header />

          <Box sx={{ px: { xs: 0.5, md: 1 }, pt: { xs: 1, md: 2 } }}>
            <Stack spacing={1}>
              <Typography level="body-sm" textColor="primary.300" sx={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Calm image sharing
              </Typography>
              <Typography level="h1" sx={{ letterSpacing: "-0.06em", fontSize: { xs: "2.4rem", md: "4rem" }, maxWidth: 760 }}>
                A cleaner upload experience for Yimage.
              </Typography>
              <Typography level="body-lg" textColor="neutral.400" sx={{ maxWidth: 680 }}>
                Threads-inspired composition, Imgur-like usefulness, and a frontend structure that is ready for a future
                Cloudflare upload API.
              </Typography>
            </Stack>
          </Box>

          <UploadBox />
          <PlaceholderPost />
          <Footer />
        </Stack>
      </Box>
    </Box>
  );
}
