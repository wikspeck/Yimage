import { useState } from "react";
import { Alert, Button, Card, Input, Stack, Typography } from "@mui/joy";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup({ username, email, password });
      navigate(searchParams.get("next") || "/");
    } catch (submitError) {
      setError(submitError.message || "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <Card variant="outlined" className="auth-card">
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <div>
            <Typography level="h1" sx={{ letterSpacing: "-0.05em", mb: 0.5 }}>
              Sign up
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              Create a Yimage account to publish posts and join the feed.
            </Typography>
          </div>

          {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}

          <Input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} sx={{ borderRadius: "18px" }} />
          <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} sx={{ borderRadius: "18px" }} />
          <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} sx={{ borderRadius: "18px" }} />

          <Button type="submit" loading={isSubmitting} sx={{ borderRadius: "999px" }}>
            Create account
          </Button>

          <Typography level="body-sm" textColor="neutral.400">
            Already have an account? <Link to="/login">Log in</Link>
          </Typography>
        </Stack>
      </Card>
    </div>
  );
}
