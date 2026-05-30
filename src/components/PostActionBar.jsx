import { Button, Stack, Typography } from "@mui/joy";
import { getDownloadUrl } from "../api/yimageApi";

function Icon({ children, size = 18, boxed = false }) {
  return (
    <span
      className={boxed ? "action-icon-boxed" : "action-icon-wrap"}
      style={{
        width: size + 8,
        height: size + 8
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <Icon size={17}>
      <path
        d="M12 19.2 5.85 13.2a4.28 4.28 0 0 1 0-6.08 4.48 4.48 0 0 1 6.15 0L12 7.12l.01-.01a4.48 4.48 0 0 1 6.14 0 4.28 4.28 0 0 1 0 6.08Z"
        fill={filled ? "currentColor" : "none"}
      />
    </Icon>
  );
}

function DownIcon() {
  return (
    <Icon>
      <path d="M12 5v14" />
      <path d="M6.5 13.5 12 19l5.5-5.5" />
    </Icon>
  );
}

function RepostIcon() {
  return (
    <Icon>
      <path d="M8 7.25h7.2c1.85 0 3.3 1.45 3.3 3.3v.15" />
      <path d="M15.8 4.9 19 8.1l-3.2 3.2" />
      <path d="M16 16.75H8.8a3.3 3.3 0 0 1-3.3-3.3v-.15" />
      <path d="M8.2 19.1 5 15.9l3.2-3.2" />
    </Icon>
  );
}

function CommentIcon() {
  return (
    <Icon size={16}>
      <path d="M5 7.5c0-1.4 1.1-2.5 2.5-2.5h9c1.4 0 2.5 1.1 2.5 2.5v6c0 1.4-1.1 2.5-2.5 2.5H11l-4 3v-3H7.5C6.1 16 5 14.9 5 13.5z" />
    </Icon>
  );
}

function SaveIcon() {
  return (
    <Icon>
      <path d="M12 4v10" />
      <path d="M8.5 10.5 12 14l3.5-3.5" />
      <path d="M5 18h14" />
    </Icon>
  );
}

function ShareIcon() {
  return (
    <Icon>
      <circle cx="18" cy="5" r="2.25" />
      <circle cx="6" cy="12" r="2.25" />
      <circle cx="18" cy="19" r="2.25" />
      <path d="M8 11l7.5-4.2" />
      <path d="M8 13l7.5 4.2" />
    </Icon>
  );
}

function ReportIcon() {
  return (
    <Icon size={16}>
      <path d="M6 4v16" />
      <path d="M7.5 5h8l-1.8 3 1.8 3h-8z" />
    </Icon>
  );
}

function TrashIcon() {
  return (
    <Icon size={16}>
      <path d="M9 4.75h6" />
      <path d="M5.5 7.25h13" />
      <path d="M8 7.25v10.25c0 .7.55 1.25 1.25 1.25h5.5c.7 0 1.25-.55 1.25-1.25V7.25" />
      <path d="M10.5 10.25v5.5" />
      <path d="M13.5 10.25v5.5" />
    </Icon>
  );
}

export default function PostActionBar({
  post,
  isLoggedIn,
  isBusy,
  onUpvote,
  onDownvote,
  onRepost,
  onShare,
  onReport,
  onComment,
  onDelete,
  canDelete = false,
  onRequireLogin
}) {
  const score = post.score ?? post.likeCount ?? 0;
  const isUpvoted = post.viewerVote === "up";
  const isDownvoted = post.viewerVote === "down";
  const isReposted = Boolean(post.hasReposted);
  const commentsCount = post.commentsCount ?? 0;
  const repostCount = post.repostCount ?? 0;
  const viewsCount = post.views ?? 0;

  function getButtonClassName(isActive, extraClassName = "") {
    return `${extraClassName} icon-button${isActive ? " icon-button-active" : ""}`.trim();
  }

  return (
    <Stack spacing={0.75} className="post-actions-shell">
      <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between" flexWrap="wrap" className="post-actions-row">
        <Stack direction="row" spacing={0.6} alignItems="center" className="vote-cluster">
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onUpvote?.() : onRequireLogin?.())}
            loading={isBusy}
            className={getButtonClassName(isUpvoted, "social-action-button vote-icon-button")}
            aria-label="Like"
          >
            <HeartIcon filled={isUpvoted} />
          </Button>
          <Typography level="title-sm" className={`vote-count${isUpvoted ? " is-active" : ""}`}>
            {score}
          </Typography>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onDownvote?.() : onRequireLogin?.())}
            className={getButtonClassName(isDownvoted, "social-action-button vote-icon-button")}
            aria-label="Unlike"
          >
            <DownIcon />
            <span className="sr-only">Unlike</span>
          </Button>
        </Stack>

        <Stack direction="row" spacing={0.35} alignItems="center" flexWrap="wrap" className="action-cluster">
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => onComment?.()}
            className="icon-button social-action-button comment-button"
            aria-label="Comments"
          >
            <CommentIcon />
            <span>{commentsCount}</span>
          </Button>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => onShare?.()}
            className="icon-button social-action-button share-button"
            aria-label="Share"
          >
            <ShareIcon />
          </Button>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onRepost?.() : onRequireLogin?.())}
            className={getButtonClassName(isReposted, "social-action-button repost-button")}
            aria-label="Repost"
          >
            <RepostIcon />
            <span>{repostCount}</span>
          </Button>
          <Button
            size="sm"
            component="a"
            href={getDownloadUrl(post.id)}
            variant="plain"
            color="neutral"
            className="download-button social-action-button"
            aria-label="Save image"
          >
            <SaveIcon />
            <span>Save</span>
          </Button>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => onReport?.()}
            className="icon-button social-action-button report-button"
            aria-label="Report"
          >
            <ReportIcon />
          </Button>
          {canDelete ? (
            <Button
              size="sm"
              variant="plain"
              color="danger"
              onClick={() => onDelete?.()}
              className="icon-button icon-button-danger social-action-button"
              aria-label="Delete post"
            >
              <TrashIcon />
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" className="post-stats-row">
        <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.56)" }}>
          {repostCount} reposts
        </Typography>
        <Typography level="body-xs" sx={{ color: "rgba(255,255,255,0.56)" }}>
          {viewsCount} views
        </Typography>
      </Stack>
    </Stack>
  );
}
