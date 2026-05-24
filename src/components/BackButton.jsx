import { Button } from "@mui/joy";
import { useNavigate } from "react-router-dom";

export default function BackButton({ fallbackTo = "/", label = "Back" }) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo);
  }

  return (
    <Button
      variant="soft"
      color="neutral"
      onClick={handleBack}
      sx={{
        alignSelf: "flex-start",
        borderRadius: "999px",
        minHeight: 42,
        px: 1.75
      }}
    >
      ← {label}
    </Button>
  );
}
