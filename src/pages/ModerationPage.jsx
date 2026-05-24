import { useEffect, useState } from "react";
import { Alert, Button, Card, CircularProgress, Input, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import { applyModerationAction, getModerationReports } from "../api/yimageApi";

export default function ModerationPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [noteByTarget, setNoteByTarget] = useState({});
  const [busyKey, setBusyKey] = useState("");

  async function loadData() {
    setError("");
    try {
      const nextData = await getModerationReports();
      setData(nextData);
    } catch (loadError) {
      setError(loadError.message || "Could not load moderation data.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(report, action) {
    const key = `${report.targetType}:${report.targetId}:${action}`;
    setBusyKey(key);
    setError("");

    try {
      await applyModerationAction({
        targetType: report.targetType,
        targetId: report.targetId,
        action,
        notes: noteByTarget[`${report.targetType}:${report.targetId}`] || ""
      });
      await loadData();
    } catch (actionError) {
      setError(actionError.message || "Could not apply moderation action.");
    } finally {
      setBusyKey("");
    }
  }

  if (!data) {
    return (
      <div className="page-shell">
        <Stack spacing={2}>
          <BackButton fallbackTo="/" label="Back" />
          {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}
          <Card variant="outlined" className="content-card">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size="sm" />
              <Typography level="body-md">Loading moderation queue...</Typography>
            </Stack>
          </Card>
        </Stack>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell-wide">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}

        <Card variant="outlined" className="content-card">
          <Stack spacing={1}>
            <Typography level="h1">Moderation</Typography>
            <Typography level="body-md" textColor="neutral.400">
              Review reports, warn users, hide content, restore content, or suspend accounts.
            </Typography>
            <Typography level="body-sm" textColor="neutral.500">
              {data.totals.warnings} warnings • {data.totals.activeSuspensions} active suspensions
            </Typography>
          </Stack>
        </Card>

        <Stack spacing={2}>
          {(data.reports || []).map((report) => {
            const targetKey = `${report.targetType}:${report.targetId}`;

            return (
              <Card key={`${targetKey}:${report.reason}`} variant="outlined" className="content-card">
                <Stack spacing={1.25}>
                  <Typography level="title-md">
                    {report.targetType} {report.targetId}
                  </Typography>
                  <Typography level="body-sm" textColor="neutral.400">
                    {report.reportCount} reports • reasons: {report.reasons}
                  </Typography>
                  <Input
                    value={noteByTarget[targetKey] || ""}
                    onChange={(event) => setNoteByTarget((current) => ({ ...current, [targetKey]: event.target.value }))}
                    placeholder="Moderator note"
                    sx={{ borderRadius: "14px" }}
                  />
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                    <Button loading={busyKey === `${targetKey}:under_review`} onClick={() => handleAction(report, "under_review")} sx={{ borderRadius: "14px" }}>
                      Under review
                    </Button>
                    <Button loading={busyKey === `${targetKey}:hide`} variant="soft" color="danger" onClick={() => handleAction(report, "hide")} sx={{ borderRadius: "14px" }}>
                      Hide
                    </Button>
                    <Button loading={busyKey === `${targetKey}:restore`} variant="soft" color="neutral" onClick={() => handleAction(report, "restore")} sx={{ borderRadius: "14px" }}>
                      Restore
                    </Button>
                    <Button loading={busyKey === `${targetKey}:remove`} variant="soft" color="danger" onClick={() => handleAction(report, "remove")} sx={{ borderRadius: "14px" }}>
                      Remove
                    </Button>
                    {report.targetType === "user" ? (
                      <>
                        <Button loading={busyKey === `${targetKey}:warn`} variant="plain" color="warning" onClick={() => handleAction(report, "warn")} sx={{ borderRadius: "14px" }}>
                          Warn
                        </Button>
                        <Button loading={busyKey === `${targetKey}:suspend`} variant="soft" color="danger" onClick={() => handleAction(report, "suspend")} sx={{ borderRadius: "14px" }}>
                          Suspend
                        </Button>
                      </>
                    ) : null}
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </div>
  );
}
