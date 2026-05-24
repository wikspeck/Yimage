import { Sheet, Typography } from "@mui/joy";

export default function Footer() {
  return (
    <Sheet
      variant="plain"
      sx={{
        py: 4,
        textAlign: "center"
      }}
    >
      <Typography level="body-sm" textColor="neutral.500">
        Yimage on Cloudflare Pages, Workers, R2, and D1
      </Typography>
    </Sheet>
  );
}
