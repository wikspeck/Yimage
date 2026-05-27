import { Button, Card, Stack, Typography } from "@mui/joy";
import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App render error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "",
      componentStack: errorInfo?.componentStack || ""
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-shell">
          <Card variant="outlined" className="content-card">
            <Stack spacing={2} alignItems="flex-start">
              <Typography level="h2">Something went wrong loading this page.</Typography>
              <Button sx={{ borderRadius: "999px" }} onClick={() => { window.location.assign("/"); }}>
                Go Home
              </Button>
            </Stack>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
