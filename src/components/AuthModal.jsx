import { useState } from "react";
import { Alert, Button, Checkbox, Input, Modal, ModalClose, Sheet, Stack, Typography } from "@mui/joy";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import TurnstileWidget from "./TurnstileWidget";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

function AuthForm({ mode, nextPath, onSwitchMode, onClose }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup({ username, email, password, turnstileToken, acceptedTerms });
      } else {
        await login({ email, password, turnstileToken });
      }

      onClose();
      navigate(nextPath || "/");
    } catch (submitError) {
      setError(submitError.message || (isSignup ? "Could not create account." : "Could not log in."));
    } finally {
      setIsSubmitting(false);
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit}>
      <div>
        <Typography level="h2" sx={{ letterSpacing: "-0.05em", mb: 0.5 }}>
          {isSignup ? "Join Yimage" : "Log in"}
        </Typography>
        <Typography level="body-sm" textColor="neutral.400">
          {isSignup ? "Create your account and jump in." : "Log in to keep scrolling."}
        </Typography>
      </div>

      {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}

      {isSignup ? (
        <Input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} sx={{ borderRadius: "18px" }} />
      ) : null}
      <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} sx={{ borderRadius: "18px" }} />
      <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} sx={{ borderRadius: "18px" }} />
      {isSignup ? (
        <Checkbox
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          label={(
            <span>
              I have read and agree to the{" "}
              <RouterLink to="/terms" target="_blank" rel="noreferrer" className="auth-inline-link">Terms of Service</RouterLink>
              {" "}and{" "}
              <RouterLink to="/community-guidelines" target="_blank" rel="noreferrer" className="auth-inline-link">Community Guidelines</RouterLink>.
            </span>
          )}
          sx={{ alignItems: "flex-start" }}
        />
      ) : null}
      <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />

      <Button type="submit" loading={isSubmitting} disabled={!turnstileToken || (isSignup && !acceptedTerms)} className="app-primary-button" sx={{ borderRadius: "999px" }}>
        {isSignup ? "Create account" : "Log in"}
      </Button>

      <Typography level="body-sm" textColor="neutral.400">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <button type="button" className="auth-modal-switch" onClick={() => onSwitchMode(isSignup ? "login" : "signup")}>
          {isSignup ? "Log in" : "Join"}
        </button>
      </Typography>
    </Stack>
  );
}

export default function AuthModal() {
  const { isOpen, mode, nextPath, setMode, close } = useAuthModal();

  return (
    <Modal open={isOpen} onClose={close} className="auth-modal-backdrop">
      <Sheet variant="outlined" className="auth-modal-sheet">
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="flex-end">
            <ModalClose />
          </Stack>
          <AuthForm mode={mode} nextPath={nextPath} onSwitchMode={setMode} onClose={close} />
        </Stack>
      </Sheet>
    </Modal>
  );
}
