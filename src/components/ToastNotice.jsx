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
      sx={{ mb: 1.5, borderRadius: "14px", boxShadow: "0 14px 36px rgba(0, 0, 0, 0.28)" }}
    >
      {message}
    </Snackbar>
  );
}
