import { useState } from "react";
import { Button, Card, Stack, Textarea, Typography } from "@mui/joy";
import { formatRelativeTime } from "../utils/formatters";
import ReportDialog from "./ReportDialog";
import TurnstileWidget from "./TurnstileWidget";

function MiniArrow({ direction = "up" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 14,
        height: 14,
        transform: direction === "down" ? "rotate(180deg)" : "none"
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 18V6" />
        <path d="M7 11l5-5 5 5" />
      </svg>
    </span>
  );
}

function VotePill({ active = false, children, onClick, label }) {
  return (
    <Button
      size="sm"
      variant="plain"
      color="neutral"
      onClick={onClick}
      aria-label={label}
      className={`comment-vote-pill${active ? " comment-vote-pill-active" : ""}`}
    >
      {children}
    </Button>
  );
}

function CommentNode({ comment, isLoggedIn, onRequireLogin, onReply, onVote, depth = 0 }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReplySubmit(event) {
    event.preventDefault();
    if (!replyText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim(), turnstileToken);
      setReplyText("");
      setReplyOpen(false);
    } finally {
      setIsSubmitting(false);
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <Stack spacing={1.2} sx={{ ml: depth ? { xs: 1.25, sm: 2.25 } : 0 }}>
      <Card variant="outlined" className="comment-card">
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography level="title-sm">@{comment.authorUsername}</Typography>
            <Typography level="body-sm" textColor="neutral.500">
              {formatRelativeTime(comment.createdAt)}
            </Typography>
          </Stack>

          <Typography level="body-md" textColor="neutral.200">
            {comment.text}
          </Typography>

          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
            <VotePill
              active={comment.viewerVote === "up"}
              onClick={() => (isLoggedIn ? onVote(comment.id, "up") : onRequireLogin?.())}
              label="Upvote comment"
            >
              <MiniArrow direction="up" />
            </VotePill>
            <Typography level="body-sm" sx={{ minWidth: 18, textAlign: "center" }}>
              {comment.score}
            </Typography>
            <VotePill
              active={comment.viewerVote === "down"}
              onClick={() => (isLoggedIn ? onVote(comment.id, "down") : onRequireLogin?.())}
              label="Downvote comment"
            >
              <MiniArrow direction="down" />
            </VotePill>
            <Button
              size="sm"
              variant="plain"
              color="neutral"
              onClick={() => (isLoggedIn ? setReplyOpen((current) => !current) : onRequireLogin?.())}
              sx={{ borderRadius: "999px" }}
            >
              Reply
            </Button>
            <Button size="sm" variant="plain" color="neutral" onClick={() => setReportOpen(true)} sx={{ borderRadius: "999px" }}>
              Report
            </Button>
          </Stack>

          {replyOpen ? (
            <Stack component="form" spacing={1} onSubmit={handleReplySubmit}>
              <Textarea
                minRows={2}
                maxRows={5}
                maxLength={400}
                placeholder="Write a reply"
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                sx={{ borderRadius: "14px" }}
              />
              <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="sm" variant="plain" color="neutral" onClick={() => setReplyOpen(false)} sx={{ borderRadius: "999px" }}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={isSubmitting} disabled={!replyText.trim() || !turnstileToken} sx={{ borderRadius: "999px" }}>
                  Reply
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </Card>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="comment" targetId={comment.id} title="Report comment" />

      {comment.replies?.length
        ? comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              isLoggedIn={isLoggedIn}
              onRequireLogin={onRequireLogin}
              onReply={onReply}
              onVote={onVote}
            />
          ))
        : null}
    </Stack>
  );
}

export default function CommentThread(props) {
  return <CommentNode {...props} />;
}
