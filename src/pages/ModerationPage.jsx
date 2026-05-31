import { useEffect, useState } from "react";
import { Button, Card, CircularProgress, Stack, Typography } from "@mui/joy";
import BackButton from "../components/BackButton";
import ToastNotice from "../components/ToastNotice";
import { applyModerationAction, getModerationReports } from "../api/yimageApi";

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function ModerationPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", color: "neutral" });

  function showToast(message, color = "neutral") {
    setToast({ open: true, message, color });
  }

  async function loadData() {
    setIsLoading(true);

    try {
      const nextData = await getModerationReports();
      setData(nextData);
    } catch (error) {
      console.error("Failed to load moderation reports.", error);
      setData({ reports: [], aiFindings: [], appeals: [], totals: { warnings: 0, activeSuspensions: 0 } });
      showToast(error.message || "Could not load moderation queue.", "danger");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(report, action) {
    const key = `${report.targetType}:${report.targetId}:${action}`;
    setBusyKey(key);

    try {
      await applyModerationAction({
        targetType: report.targetType,
        targetId: report.targetId,
        action
      });
      await loadData();
      showToast(action === "restore" ? "Post kept." : "Post removed.", action === "restore" ? "success" : "danger");
    } catch (error) {
      showToast(error.message || "Could not apply moderation action.", "danger");
    } finally {
      setBusyKey("");
    }
  }

  const postReports = (data?.reports || []).filter((report) => report.targetType === "post");

  if (isLoading && !data) {
    return (
      <div className="page-shell">
        <Stack spacing={2}>
          <BackButton fallbackTo="/" label="Back" />
          <Card variant="outlined" className="content-card">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size="sm" />
              <Typography level="body-md">Loading reports...</Typography>
            </Stack>
          </Card>
          <ToastNotice open={toast.open} message={toast.message} color={toast.color} onClose={() => setToast((current) => ({ ...current, open: false }))} />
        </Stack>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />

        <Card variant="outlined" className="content-card">
          <Stack spacing={0.75}>
            <Typography level="h1">Reports</Typography>
            <Typography level="body-md" textColor="neutral.400">
              Review reported posts with image previews, counts, and current moderation status.
            </Typography>
          </Stack>
        </Card>

        {postReports.length ? (
          <Stack spacing={2}>
            {postReports.map((report) => (
              <Card key={`${report.targetType}:${report.targetId}`} variant="outlined" className="content-card">
                <Stack spacing={1.4}>
                  {report.imageKey ? (
                    <div className="post-media-frame is-normal">
                      <div className="post-preview-media is-normal">
                        <div className="post-preview-canvas is-normal">
                          <img
                            src={report.previewImageUrl}
                            alt={report.postTitle || report.targetId}
                            className="post-preview-image"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <Stack spacing={0.55}>
                    <Typography level="title-lg">{report.postTitle || "Untitled post"}</Typography>
                    {report.postDescription ? (
                      <Typography level="body-sm" textColor="neutral.300">
                        {report.postDescription.length > 220 ? `${report.postDescription.slice(0, 220)}...` : report.postDescription}
                      </Typography>
                    ) : null}
                  </Stack>

                  <Stack spacing={0.45}>
                    <Typography level="body-sm" textColor="neutral.500">
                      Author: {report.authorUsername ? `@${report.authorUsername}` : report.targetOwnerUsername ? `@${report.targetOwnerUsername}` : "Unknown"}
                    </Typography>
                    <Typography level="body-sm" textColor="neutral.500">
                      Reports: {report.reportCount}/{report.reviewThreshold}
                    </Typography>
                    <Typography level="body-sm" textColor="neutral.500">
                      Reporter{report.reportCount === 1 ? "" : "s"}: {report.reporterUsernames?.length ? report.reporterUsernames.map((name) => `@${name}`).join(", ") : "Not available"}
                    </Typography>
                    <Typography level="body-sm" textColor="neutral.500">
                      Reason: {report.reasons || report.reason || "report"}
                    </Typography>
                    <Typography level="body-sm" textColor="neutral.500">
                      Status: {report.moderationStatus}
                    </Typography>
                    {report.latestReportAt ? (
                      <Typography level="body-sm" textColor="neutral.500">
                        Latest report: {formatTimestamp(report.latestReportAt)}
                      </Typography>
                    ) : null}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                    <Button
                      size="lg"
                      loading={busyKey === `${report.targetType}:${report.targetId}:restore`}
                      onClick={() => handleAction(report, "restore")}
                      sx={{ borderRadius: "16px", minWidth: 140 }}
                    >
                      Checkmark
                    </Button>
                    <Button
                      size="lg"
                      color="danger"
                      variant="soft"
                      loading={busyKey === `${report.targetType}:${report.targetId}:remove`}
                      onClick={() => handleAction(report, "remove")}
                      sx={{ borderRadius: "16px", minWidth: 140 }}
                    >
                      X
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Card variant="outlined" className="content-card">
            <Typography level="body-md" textColor="neutral.400">
              No reports to review.
            </Typography>
          </Card>
        )}

        <ToastNotice open={toast.open} message={toast.message} color={toast.color} onClose={() => setToast((current) => ({ ...current, open: false }))} />
      </Stack>
    </div>
  );
}
