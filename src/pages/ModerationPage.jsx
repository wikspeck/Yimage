import { useEffect, useState } from "react";
import { Avatar, Button, Card, CircularProgress, Stack, Typography } from "@mui/joy";
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

function DetailRow({ label, value }) {
  if (!value && value !== 0) {
    return null;
  }

  return (
    <Typography level="body-sm" textColor="neutral.500">
      {label}: {value}
    </Typography>
  );
}

export default function ModerationPage() {
  const [data, setData] = useState(null);
  const [activeSection, setActiveSection] = useState("posts");
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
      setData({ reports: [], accounts: [], aiFindings: [], appeals: [], totals: { warnings: 0, activeSuspensions: 0 } });
      showToast(error.message || "Could not load moderation queue.", "danger");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAction(target, action) {
    const key = `${target.targetType}:${target.targetId}:${action}`;
    setBusyKey(key);

    try {
      await applyModerationAction({
        targetType: target.targetType,
        targetId: target.targetId,
        action
      });
      await loadData();
      showToast(action === "restore" ? "Kept." : "Updated.", action === "restore" ? "success" : "danger");
    } catch (error) {
      showToast(error.message || "Could not apply moderation action.", "danger");
    } finally {
      setBusyKey("");
    }
  }

  const postReports = (data?.reports || []).filter((report) => report.targetType === "post");
  const accountReports = data?.accounts || [];

  if (isLoading && !data) {
    return (
      <div className="page-shell">
        <Stack spacing={2}>
          <BackButton fallbackTo="/" label="Back" />
          <Card variant="outlined" className="content-card">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size="sm" />
              <Typography level="body-md">Loading manage queue...</Typography>
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
          <Stack spacing={1.4}>
            <Stack spacing={0.4}>
              <Typography level="h1">Manage</Typography>
              <Typography level="body-md" textColor="neutral.400">
                Review posts and accounts that need moderator attention.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button
                variant={activeSection === "posts" ? "solid" : "soft"}
                color="neutral"
                onClick={() => setActiveSection("posts")}
                sx={{ borderRadius: "14px" }}
              >
                Posts
              </Button>
              <Button
                variant={activeSection === "accounts" ? "solid" : "soft"}
                color="neutral"
                onClick={() => setActiveSection("accounts")}
                sx={{ borderRadius: "14px" }}
              >
                Accounts
              </Button>
            </Stack>
          </Stack>
        </Card>

        {activeSection === "posts" ? (
          postReports.length ? (
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
                      <DetailRow label="Owner" value={report.authorUsername ? `@${report.authorUsername}` : report.targetOwnerUsername ? `@${report.targetOwnerUsername}` : "Unknown"} />
                      <DetailRow label="Reports" value={`${report.reportCount}/${report.reviewThreshold}`} />
                      <DetailRow label="AI reported" value={report.aiReported ? "Yes" : "No"} />
                      {report.aiReported ? (
                        <>
                          <DetailRow label="AI reason" value={report.aiReportReason || "Automatic moderation flagged this post."} />
                          <DetailRow label="AI categories" value={report.aiReportCategories?.length ? report.aiReportCategories.join(", ") : "Not available"} />
                        </>
                      ) : null}
                      <DetailRow label="Reporters" value={report.reporterUsernames?.length ? report.reporterUsernames.map((name) => `@${name}`).join(", ") : "Not available"} />
                      <DetailRow label="Reason" value={report.reasons || report.reason || "report"} />
                      <DetailRow label="Status" value={report.moderationStatus} />
                      <DetailRow label="Latest report" value={formatTimestamp(report.latestReportAt)} />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <Button
                        size="lg"
                        loading={busyKey === `${report.targetType}:${report.targetId}:restore`}
                        onClick={() => handleAction(report, "restore")}
                        sx={{ borderRadius: "16px", minWidth: 140 }}
                      >
                        Keep
                      </Button>
                      <Button
                        size="lg"
                        color="danger"
                        variant="soft"
                        loading={busyKey === `${report.targetType}:${report.targetId}:remove`}
                        onClick={() => handleAction(report, "remove")}
                        sx={{ borderRadius: "16px", minWidth: 140 }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          ) : (
            <Card variant="outlined" className="content-card">
              <Typography level="body-md" textColor="neutral.400">
                No posts to review.
              </Typography>
            </Card>
          )
        ) : accountReports.length ? (
          <Stack spacing={2}>
            {accountReports.map((account) => {
              const target = { targetType: "user", targetId: account.id };
              return (
                <Card key={account.id} variant="outlined" className="content-card">
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar src={account.avatarUrl || ""} alt={account.username} sx={{ width: 48, height: 48, bgcolor: "#111111" }}>
                        {(account.displayName || account.username || "Y").slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                        <Typography level="title-lg">{account.displayName || account.username}</Typography>
                        <Typography level="body-sm" textColor="neutral.500">@{account.username}</Typography>
                      </Stack>
                    </Stack>
                    <Stack spacing={0.45}>
                      <DetailRow label="Ban status" value={account.moderationStatus === "suspended" ? "Banned" : account.moderationStatus} />
                      <DetailRow label="Reports" value={account.reportCount} />
                      <DetailRow label="Warnings" value={account.warningCount} />
                      <DetailRow label="Active suspensions" value={account.suspensionCount} />
                      <DetailRow label="Reasons" value={account.reasons || "Not available"} />
                      <DetailRow label="Latest report" value={formatTimestamp(account.latestReportAt)} />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <Button
                        size="lg"
                        loading={busyKey === `user:${account.id}:restore`}
                        onClick={() => handleAction(target, "restore")}
                        sx={{ borderRadius: "16px", minWidth: 140 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="lg"
                        color="danger"
                        variant="soft"
                        loading={busyKey === `user:${account.id}:suspend`}
                        onClick={() => handleAction(target, "suspend")}
                        sx={{ borderRadius: "16px", minWidth: 140 }}
                      >
                        Ban
                      </Button>
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        ) : (
          <Card variant="outlined" className="content-card">
            <Typography level="body-md" textColor="neutral.400">
              No accounts to review.
            </Typography>
          </Card>
        )}

        <ToastNotice open={toast.open} message={toast.message} color={toast.color} onClose={() => setToast((current) => ({ ...current, open: false }))} />
      </Stack>
    </div>
  );
}
