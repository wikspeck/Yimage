import { useState } from "react";
import { Alert, Button, Card, Input, Stack, Typography } from "@mui/joy";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import TurnstileWidget from "../components/TurnstileWidget";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password, turnstileToken });
      navigate(searchParams.get("next") || "/");
    } catch (submitError) {
      setError(submitError.message || "Could not log in.");
    } finally {
      setIsSubmitting(false);
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <div className="auth-shell">
      <Stack spacing={2}>
        <BackButton fallbackTo="/" label="Back" />
        <Card variant="outlined" className="auth-card">
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <div>
              <Typography level="h1" sx={{ letterSpacing: "-0.05em", mb: 0.5 }}>
                Log in
              </Typography>
              <Typography level="body-md" textColor="neutral.400">
                Jump back into posting, liking, and commenting.
              </Typography>
            </div>

            {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}

            <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} sx={{ borderRadius: "18px" }} />
            <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} sx={{ borderRadius: "18px" }} />
            <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />

            <Button type="submit" loading={isSubmitting} disabled={!turnstileToken} className="app-primary-button" sx={{ borderRadius: "999px" }}>
              Log in
            </Button>

            <Typography level="body-sm" textColor="neutral.400">
              Need an account? <Link to="/signup">Sign up</Link>
            </Typography>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
