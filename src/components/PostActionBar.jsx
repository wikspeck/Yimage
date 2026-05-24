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

function UpIcon() {
  return (
    <Icon>
      <path d="M12 19V5" />
      <path d="M6.5 10.5 12 5l5.5 5.5" />
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
      <path d="M7 7h10l-2.5-2.5" />
      <path d="M17 7l-2.5 2.5" />
      <path d="M17 17H7l2.5 2.5" />
      <path d="M7 17l2.5-2.5" />
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

function UseIcon() {
  return (
    <Icon boxed>
      <path d="M12 3.8 13.8 8.2 18.2 10 13.8 11.8 12 16.2 10.2 11.8 5.8 10 10.2 8.2z" />
      <path d="M18 14.5 18.8 16.2 20.5 17 18.8 17.8 18 19.5 17.2 17.8 15.5 17 17.2 16.2z" />
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

export default function PostActionBar({
  post,
  isLoggedIn,
  isBusy,
  onUpvote,
  onDownvote,
  onRepost,
  onUse,
  onComment,
  onRequireLogin
}) {
  return (
    <Stack spacing={1.1} className="post-actions-shell">
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" className="post-actions-row">
        <Stack direction="row" spacing={0.75} alignItems="center" className="vote-cluster">
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onUpvote?.() : onRequireLogin?.())}
            loading={isBusy}
            className="icon-button"
            aria-label="Upvote"
          >
            <UpIcon />
          </Button>
          <Typography level="title-sm" sx={{ minWidth: 24, textAlign: "center", color: "#ffffff" }}>
            {post.likeCount}
          </Typography>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onDownvote?.() : onRequireLogin?.())}
            className="icon-button"
            aria-label="Downvote"
          >
            <DownIcon />
          </Button>
        </Stack>

        <Stack direction="row" spacing={0.4} alignItems="center" flexWrap="wrap" className="action-cluster">
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => onComment?.()}
            className="icon-button"
            aria-label="Comments"
          >
            <CommentIcon />
          </Button>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onRepost?.() : onRequireLogin?.())}
            className="icon-button"
            aria-label="Repost"
          >
            <RepostIcon />
          </Button>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => onUse?.()}
            className="use-button"
            aria-label="Use"
          >
            <UseIcon />
          </Button>
          <Button
            size="sm"
            component="a"
            href={getDownloadUrl(post.id)}
            variant="plain"
            color="neutral"
            className="download-button"
            aria-label="Save image"
          >
            <SaveIcon />
            <span>Save</span>
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" alignItems="center" className="post-stats-row">
        <Stack direction="row" spacing={0.45} alignItems="center">
          <CommentIcon />
          <Typography level="body-sm" sx={{ color: "#ffffff" }}>
            {post.commentsCount}
          </Typography>
        </Stack>
        <Typography level="body-sm" sx={{ color: "rgba(255,255,255,0.72)" }}>
          {post.views} views
        </Typography>
      </Stack>
    </Stack>
  );
}
