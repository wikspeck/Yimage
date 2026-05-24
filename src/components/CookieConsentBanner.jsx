import { useEffect, useState } from "react";
import { Button, Card, Stack, Typography } from "@mui/joy";
import { Link as RouterLink } from "react-router-dom";

const COOKIE_CONSENT_KEY = "yimage_cookie_consent_v1";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const storedConsent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      setIsVisible(storedConsent !== "accepted");
    } catch {
      setIsVisible(true);
    }
  }, []);

  function handleAccept() {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      // Best-effort only; banner can still close for the current session.
    }
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="cookie-banner-shell">
      <Card variant="outlined" className="cookie-banner-card">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Stack spacing={0.6} sx={{ minWidth: 0 }}>
            <Typography level="title-md">Cookies for secure sessions</Typography>
            <Typography level="body-sm" textColor="neutral.400">
              Yimage uses necessary cookies for secure login sessions, security protection, and basic platform functionality. We do not currently use invasive tracking or advertising cookies.
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              component={RouterLink}
              to="/cookies"
              variant="plain"
              color="neutral"
              sx={{ borderRadius: "14px" }}
            >
              Learn More
            </Button>
            <Button onClick={handleAccept} variant="solid" color="neutral" sx={{ borderRadius: "14px" }}>
              Accept
            </Button>
          </Stack>
        </Stack>
      </Card>
    </div>
  );
}
