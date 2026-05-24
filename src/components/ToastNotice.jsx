import { Snackbar } from "@mui/joy";

export default function ToastNotice({ open, message, color = "neutral", onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={2200}
      onClose={onClose}
      color={color}
      variant="solid"
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: 1.5, borderRadius: "14px" }}
    >
      {message}
    </Snackbar>
  );
}
