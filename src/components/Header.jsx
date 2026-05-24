import { Box, Button, Sheet, Stack, Typography } from "@mui/joy";

export default function Header() {
  return (
    <Sheet
      variant="outlined"
      sx={{
        px: { xs: 2, md: 3 },
        py: 2,
        borderRadius: "24px",
        bgcolor: "rgba(18, 20, 28, 0.88)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)"
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography level="title-lg" sx={{ letterSpacing: "-0.04em" }}>
            Yimage
          </Typography>
          <Typography level="body-sm" textColor="neutral.400">
            Minimal image sharing, ready for a future Cloudflare backend.
          </Typography>
        </Box>
        <Button
          component="a"
          href="#upload-box"
          variant="soft"
          color="neutral"
          sx={{ borderRadius: "999px", px: 2 }}
        >
          Upload
        </Button>
      </Stack>
    </Sheet>
  );
}
