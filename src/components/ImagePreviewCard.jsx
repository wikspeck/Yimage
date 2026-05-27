import { Button, Card, Sheet, Stack, Typography } from "@mui/joy";
import { formatFileSize } from "../utils/formatFileSize";

export default function ImagePreviewCard({ files, previewUrls, onRemove, onChooseDifferent }) {
  return (
    <Card
      variant="soft"
      sx={{
        p: 2,
        gap: 2,
        borderRadius: "24px",
        bgcolor: "rgba(255,255,255,0.03)"
      }}
    >
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {files.map((file, index) => (
          <Sheet
            key={`${file.name}-${index}`}
            sx={{
              overflow: "hidden",
              borderRadius: "20px",
              bgcolor: "#05070b",
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.06)",
              width: files.length > 1 ? { xs: "calc(50% - 4px)", sm: 132 } : "100%",
              maxWidth: "100%"
            }}
          >
            <img
              src={previewUrls[index]}
              alt={file.name}
              style={{
                width: "100%",
                height: files.length > 1 ? 108 : 260,
                objectFit: "cover"
              }}
            />
          </Sheet>
        ))}
      </Stack>

      <Stack spacing={0.5}>
        <Typography level="title-sm">
          {files.length > 1 ? `${files.length} images selected` : files[0]?.name}
        </Typography>
        <Typography level="body-sm" textColor="neutral.400">
          {files.map((file) => formatFileSize(file.size)).join(" • ")}
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
        <Button variant="soft" color="neutral" onClick={onChooseDifferent} sx={{ borderRadius: "999px" }}>
          Choose different image
        </Button>
        <Button variant="plain" color="danger" onClick={onRemove} sx={{ borderRadius: "999px" }}>
          Remove
        </Button>
      </Stack>
    </Card>
  );
}
