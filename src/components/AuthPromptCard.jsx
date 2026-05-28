import { Button, Card, Stack, Typography } from "@mui/joy";

export default function AuthPromptCard({ onLogin, onSignup, message = "Log in to interact with posts." }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: "24px",
        bgcolor: "#050505",
        borderColor: "rgba(255,255,255,0.12)"
      }}
    >
      <Stack spacing={1.5}>
        <Typography level="title-md">Join the conversation</Typography>
        <Typography level="body-md" textColor="neutral.400">
          {message}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="solid" color="neutral" onClick={onLogin} className="app-primary-button" sx={{ borderRadius: "999px" }}>
            Log in
          </Button>
          <Button variant="soft" color="neutral" onClick={onSignup} sx={{ borderRadius: "999px" }}>
            Join
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
