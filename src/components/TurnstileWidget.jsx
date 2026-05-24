import { useEffect, useRef } from "react";

const TURNSTILE_SITE_KEY = "0x4AAAAAADVlOLv5r6YZSkyT";
const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";

function loadTurnstileScript() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Turnstile.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("Could not load Turnstile."));
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({ onTokenChange, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!isMounted || !containerRef.current || !turnstile) {
          return;
        }

        if (widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          callback: (token) => onTokenChange?.(token || ""),
          "expired-callback": () => onTokenChange?.(""),
          "error-callback": () => onTokenChange?.("")
        });
      })
      .catch(() => {
        onTokenChange?.("");
      });

    return () => {
      isMounted = false;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onTokenChange]);

  useEffect(() => {
    if (window.turnstile && widgetIdRef.current !== null) {
      onTokenChange?.("");
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onTokenChange, resetKey]);

  return (
    <div className="turnstile-shell">
      <div ref={containerRef} />
    </div>
  );
}
