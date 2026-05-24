import { Button, Modal, ModalClose, ModalDialog, Stack, Typography } from "@mui/joy";

export default function ShareDialog({ open, onClose, url, title = "Share", onCopied }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    onCopied?.("Copied link to clipboard.");
    onClose?.();
  }

  function handleWhatsApp() {
    const nextUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(nextUrl, "_blank", "noopener,noreferrer");
    onClose?.();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ minWidth: { xs: "90vw", sm: 360 }, borderRadius: "20px", bgcolor: "#050505" }}>
        <ModalClose />
        <Stack spacing={1.5}>
          <Typography level="title-lg">{title}</Typography>
          <Typography level="body-sm" textColor="neutral.400">
            Share this post
          </Typography>
          <Stack spacing={1}>
            <Button onClick={handleCopy} sx={{ borderRadius: "14px" }}>
              Copy Link
            </Button>
            <Button variant="soft" color="neutral" onClick={handleWhatsApp} sx={{ borderRadius: "14px" }}>
              WhatsApp
            </Button>
          </Stack>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
