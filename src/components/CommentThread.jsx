import { useState } from "react";
import { Avatar, Button, Card, Stack, Textarea, Typography } from "@mui/joy";
import { formatRelativeTime } from "../utils/formatters";
import ReportDialog from "./ReportDialog";
import TurnstileWidget from "./TurnstileWidget";

function CommentLikeIcon({ active = false }) {
  return <img src={active ? "/action-heart-selected.svg" : "/action-heart.svg"} alt="" aria-hidden="true" className="comment-like-icon-image" />;
}

function CommentNode({ comment, isLoggedIn, currentUser, onRequireLogin, onReply, onLike, onDelete, depth = 0 }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canDelete = Boolean(currentUser && (currentUser.id === comment.authorId || currentUser.isAdmin));

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
          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar src={comment.authorAvatarUrl || ""} alt={comment.authorUsername} sx={{ width: 30, height: 30, bgcolor: "#111111", fontSize: "0.8rem" }}>
                {(comment.authorDisplayName || comment.authorUsername || "Y").slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack spacing={0} sx={{ minWidth: 0 }}>
                <Typography level="title-sm">{comment.authorDisplayName || comment.authorUsername}</Typography>
                <Typography level="body-xs" textColor="neutral.500">@{comment.authorUsername}</Typography>
              </Stack>
            </Stack>
            <Typography level="body-sm" textColor="neutral.500">
              {formatRelativeTime(comment.createdAt)}
            </Typography>
          </Stack>

          <Typography level="body-md" textColor="neutral.200">
            {comment.text}
          </Typography>

          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
            <Button
              size="sm"
              variant="plain"
              color="neutral"
              onClick={() => (isLoggedIn ? onLike(comment.id) : onRequireLogin?.())}
              aria-label="Like comment"
              className={`comment-like-pill${comment.viewerVote === "up" ? " comment-like-pill-active" : ""}`}
            >
              <CommentLikeIcon active={comment.viewerVote === "up"} />
            </Button>
            <Typography level="body-sm" sx={{ minWidth: 18, textAlign: "center" }}>
              {comment.score}
            </Typography>
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
            {canDelete ? (
              <Button size="sm" variant="plain" color="danger" onClick={() => onDelete?.(comment.id)} sx={{ borderRadius: "999px" }}>
                Delete
              </Button>
            ) : null}
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
                <Button type="submit" size="sm" loading={isSubmitting} disabled={!replyText.trim() || !turnstileToken} className="app-primary-button" sx={{ borderRadius: "999px" }}>
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
              currentUser={currentUser}
              onRequireLogin={onRequireLogin}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
            />
          ))
        : null}
    </Stack>
  );
}

export default function CommentThread(props) {
  return <CommentNode {...props} />;
}
