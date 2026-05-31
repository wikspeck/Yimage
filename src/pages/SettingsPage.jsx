import { Card, Link, Option, Select, Stack, Switch, Typography } from "@mui/joy";
import { Link as RouterLink } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";
import { useSeo } from "../hooks/useSeo";

export default function SettingsPage() {
  const { preferences, updatePreference } = usePreferences();

  useSeo({
    title: "Settings - Yimage",
    description: "Manage appearance, feed, and accessibility preferences on Yimage.",
    canonicalPath: "/settings",
    type: "website"
  });

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <Typography level="h1" sx={{ letterSpacing: "-0.06em", fontSize: { xs: "2rem", md: "2.6rem" } }}>
          Settings
        </Typography>

        <Card variant="outlined" className="content-card settings-card">
          <Stack spacing={2}>
            <Typography level="title-lg">Appearance</Typography>
            <Select
              value={preferences.theme}
              onChange={(_, value) => updatePreference("theme", value || "default")}
              placeholder="Theme"
              sx={{ borderRadius: "16px" }}
            >
              <Option value="default">Default</Option>
              <Option value="dark">Dark</Option>
            </Select>
            <label className="settings-toggle-row">
              <span>Compact mode</span>
              <Switch checked={preferences.compactMode} onChange={(event) => updatePreference("compactMode", event.target.checked)} />
            </label>
            <label className="settings-toggle-row">
              <span>Reduce animations</span>
              <Switch checked={preferences.reduceMotion} onChange={(event) => updatePreference("reduceMotion", event.target.checked)} />
            </label>
          </Stack>
        </Card>

        <Card variant="outlined" className="content-card settings-card">
          <Stack spacing={2}>
            <Typography level="title-lg">Feed</Typography>
            <Select
              value={preferences.defaultFeedPostType}
              onChange={(_, value) => updatePreference("defaultFeedPostType", value || "all")}
              placeholder="Default feed filter"
              sx={{ borderRadius: "16px" }}
            >
              <Option value="all">All Posts</Option>
              <Option value="normal">Normal Posts</Option>
              <Option value="image-only">Image-Only Posts</Option>
            </Select>
            <Select
              value={preferences.defaultDiscoverMode}
              onChange={(_, value) => updatePreference("defaultDiscoverMode", value || "trending")}
              placeholder="Default discover mode"
              sx={{ borderRadius: "16px" }}
            >
              <Option value="trending">Trending</Option>
              <Option value="hot">Hot and New</Option>
              <Option value="fresh">Random</Option>
            </Select>
            <label className="settings-toggle-row">
              <span>Show image-only posts first</span>
              <Switch checked={preferences.showImageOnlyPostsFirst} onChange={(event) => updatePreference("showImageOnlyPostsFirst", event.target.checked)} />
            </label>
            <label className="settings-toggle-row">
              <span>Keep comments open</span>
              <Switch checked={preferences.autoOpenCommentsAfterPostingComment} onChange={(event) => updatePreference("autoOpenCommentsAfterPostingComment", event.target.checked)} />
            </label>
          </Stack>
        </Card>

        <Card variant="outlined" className="content-card settings-card">
          <Stack spacing={2}>
            <Typography level="title-lg">Accessibility</Typography>
            <label className="settings-toggle-row">
              <span>Reduce motion</span>
              <Switch checked={preferences.reduceMotion} onChange={(event) => updatePreference("reduceMotion", event.target.checked)} />
            </label>
            <label className="settings-toggle-row">
              <span>Larger text</span>
              <Switch checked={preferences.largerText} onChange={(event) => updatePreference("largerText", event.target.checked)} />
            </label>
            <label className="settings-toggle-row">
              <span>High contrast</span>
              <Switch checked={preferences.highContrast} onChange={(event) => updatePreference("highContrast", event.target.checked)} />
            </label>
          </Stack>
        </Card>

        <Card variant="outlined" className="content-card settings-card">
          <Stack spacing={1.25}>
            <Typography level="title-lg">Links</Typography>
            <Link component={RouterLink} to="/guidelines" underline="hover">Community Guidelines</Link>
            <Link component={RouterLink} to="/dmca" underline="hover">DMCA</Link>
            <Link component={RouterLink} to="/cookies" underline="hover">Policy</Link>
          </Stack>
        </Card>
      </Stack>
    </div>
  );
}
