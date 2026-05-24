import { Button, Card, Stack, Typography } from "@mui/joy";

export default function AuthPromptCard({ onLogin, onSignup, message = "Log in to interact with posts." }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: "24px",
        bgcolor: "rgba(18, 20, 28, 0.92)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <Stack spacing={1.5}>
        <Typography level="title-md">Join the conversation</Typography>
        <Typography level="body-md" textColor="neutral.400">
          {message}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="solid" color="primary" onClick={onLogin} sx={{ borderRadius: "999px" }}>
            Log in
          </Button>
          <Button variant="soft" color="neutral" onClick={onSignup} sx={{ borderRadius: "999px" }}>
            Sign up
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
