import { Button, Stack, Typography } from "@mui/joy";
import { getDownloadUrl } from "../api/yimageApi";

function ActionIcon({ src, alt, size = 18, preserveBackground = false }) {
  return (
    <span
      className={preserveBackground ? "action-icon-wrap use-icon-wrap" : "action-icon-wrap"}
      style={{
        width: preserveBackground ? size + 10 : size + 6,
        height: preserveBackground ? size + 10 : size + 6
      }}
    >
      <img
        src={src}
        alt={alt}
        className={preserveBackground ? "action-icon use-icon" : "action-icon"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center"
        }}
      />
    </span>
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
            <ActionIcon src="/icon-upvote.png" alt="Upvote" />
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
            <ActionIcon src="/icon-downvote.png" alt="Downvote" />
          </Button>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" className="action-cluster">
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => (isLoggedIn ? onRepost?.() : onRequireLogin?.())}
            className="icon-button"
            aria-label="Repost"
          >
            <ActionIcon src="/icon-repost.png" alt="Repost" />
          </Button>
          <Button
            size="sm"
            variant="plain"
            color="neutral"
            onClick={() => onUse?.()}
            className="use-button"
            aria-label="Use"
          >
            <ActionIcon src="/icon-use.png" alt="Use" preserveBackground />
          </Button>
          <Button
            size="sm"
            component="a"
            href={getDownloadUrl(post.id)}
            variant="plain"
            color="neutral"
            className="download-button"
            aria-label="Download"
          >
            <ActionIcon src="/icon-download.png" alt="Download" />
            <span>Save</span>
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" alignItems="center" className="post-stats-row">
        <Stack direction="row" spacing={0.55} alignItems="center">
          <ActionIcon src="/icon-comment.png" alt="Comments" size={16} />
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
