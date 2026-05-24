import { Sheet, Typography } from "@mui/joy";

export default function Footer() {
  return (
    <Sheet
      variant="plain"
      sx={{
        py: 3,
        textAlign: "center"
      }}
    >
      <Typography level="body-sm" textColor="neutral.500">
        Yimage frontend prototype for Cloudflare Pages. Upload simulation only for now.
      </Typography>
    </Sheet>
  );
}
