import { useEffect, useState } from "react";
import { Button, Stack, Typography } from "@mui/joy";

const ACTION_ICONS = {
  heart: {
    default: "/action-heart.svg",
    active: "/action-heart-selected.svg"
  },
  comment: {
    default: "/action-comment.svg",
    active: "/action-comment-selected.svg"
  },
  share: {
    default: "/action-share.svg",
    active: "/action-share-selected.svg"
  },
  repost: {
    default: "/action-repost.svg",
    active: "/action-repost-selected.svg"
  },
  report: {
    default: "/action-report.svg",
    active: "/action-report-selected.svg"
  }
};

function ActionIcon({ action, active }) {
  const icon = active ? ACTION_ICONS[action].active : ACTION_ICONS[action].default;

  return <img src={icon} alt="" aria-hidden="true" className="post-action-icon-image" />;
}

export default function PostActionBar({
  post,
  isLoggedIn,
  isBusy,
  onUpvote,
  onRepost,
  onShare,
  onReport,
  onComment,
  onDelete,
  canDelete = false,
  onRequireLogin,
  isCommentsOpen = false,
  isReportOpen = false,
  isShareActive = false
}) {
  const [shareFlashActive, setShareFlashActive] = useState(false);
  const likeCount = post.score ?? post.likeCount ?? 0;
  const commentsCount = post.commentsCount ?? 0;
  const repostCount = post.repostCount ?? 0;
  const isLiked = post.viewerVote === "up";
  const isReposted = Boolean(post.hasReposted);
  const shareSelected = isShareActive || shareFlashActive;

  useEffect(() => {
    if (!shareFlashActive || isShareActive) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setShareFlashActive(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [isShareActive, shareFlashActive]);

  function getActionClassName(action, active) {
    return `post-action-button action-${action}${active ? " is-active" : ""}`;
  }

  function handleLike() {
    if (isLoggedIn) {
      onUpvote?.();
      return;
    }

    onRequireLogin?.();
  }

  function handleRepost() {
    if (isLoggedIn) {
      onRepost?.();
      return;
    }

    onRequireLogin?.();
  }

  function handleShare() {
    setShareFlashActive(true);
    onShare?.();
  }

  function handleReport() {
    onReport?.();
  }

  return (
    <Stack spacing={0.75} className="post-actions-shell">
      <Stack direction="row" spacing={0.85} alignItems="center" flexWrap="wrap" className="post-actions-row post-actions-row-icons">
        <Button
          size="sm"
          variant="plain"
          color="neutral"
          onClick={handleLike}
          loading={isBusy}
          className={getActionClassName("heart", isLiked)}
          aria-label="Like"
        >
          <ActionIcon action="heart" active={isLiked} />
          <Typography component="span" level="body-sm" className="post-action-count">
            {likeCount}
          </Typography>
        </Button>

        <Button
          size="sm"
          variant="plain"
          color="neutral"
          onClick={() => onComment?.()}
          className={getActionClassName("comment", isCommentsOpen)}
          aria-label="Comments"
        >
          <ActionIcon action="comment" active={isCommentsOpen} />
          <Typography component="span" level="body-sm" className="post-action-count">
            {commentsCount}
          </Typography>
        </Button>

        <Button
          size="sm"
          variant="plain"
          color="neutral"
          onClick={handleShare}
          className={getActionClassName("share", shareSelected)}
          aria-label="Share"
        >
          <ActionIcon action="share" active={shareSelected} />
        </Button>

        <Button
          size="sm"
          variant="plain"
          color="neutral"
          onClick={handleRepost}
          className={getActionClassName("repost", isReposted)}
          aria-label="Repost"
        >
          <ActionIcon action="repost" active={isReposted} />
          <Typography component="span" level="body-sm" className="post-action-count">
            {repostCount}
          </Typography>
        </Button>

        <Button
          size="sm"
          variant="plain"
          color="neutral"
          onClick={handleReport}
          className={getActionClassName("report", isReportOpen)}
          aria-label="Report"
        >
          <ActionIcon action="report" active={isReportOpen} />
        </Button>

        {canDelete ? (
          <Button
            size="sm"
            variant="plain"
            color="danger"
            onClick={() => onDelete?.()}
            className="post-action-button action-delete"
            aria-label="Delete post"
          >
            Delete
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
