import { Button, Chip, Stack, Typography } from "@mui/joy";
import { getDownloadUrl } from "../api/yimageApi";

export default function PostActionBar({
  post,
  isLoggedIn,
  isBusy,
  onUpvote,
  onDownvote,
  onRepost,
  onRequireLogin,
  showCounts = true
}) {
  return (
    <Stack spacing={1.25} className="post-actions-shell">
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" className="post-actions-row">
        <Stack direction="row" spacing={0.75} alignItems="center" className="vote-cluster">
          <Button
            size="sm"
            variant={post.hasLiked ? "solid" : "soft"}
            color={post.hasLiked ? "primary" : "neutral"}
            onClick={() => (isLoggedIn ? onUpvote?.() : onRequireLogin?.())}
            loading={isBusy}
            sx={{ borderRadius: "999px", minWidth: 44, px: 1.25 }}
            aria-label="Upvote"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="soft"
            color="neutral"
            onClick={() => (isLoggedIn ? onDownvote?.() : onRequireLogin?.())}
            sx={{ borderRadius: "999px", minWidth: 44, px: 1.25 }}
            aria-label="Downvote"
          >
            ↓
          </Button>
          <Typography level="title-sm" sx={{ minWidth: 24, textAlign: "center" }}>
            {post.likeCount}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" className="action-cluster">
          <Button
            size="sm"
            variant="soft"
            color="neutral"
            onClick={() => (isLoggedIn ? onRepost?.() : onRequireLogin?.())}
            sx={{ borderRadius: "999px", minWidth: 44, px: 1.25 }}
            aria-label="Repost"
          >
            ↻
          </Button>
          <Button
            size="sm"
            component="a"
            href={getDownloadUrl(post.id)}
            variant="soft"
            color="neutral"
            sx={{ borderRadius: "999px" }}
          >
            ↓ Download
          </Button>
        </Stack>
      </Stack>

      {showCounts ? (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center" className="post-stats-row">
          <Chip size="sm" variant="soft">Comments {post.commentsCount}</Chip>
          <Chip size="sm" variant="soft">Views {post.views}</Chip>
        </Stack>
      ) : (
        <Typography level="body-sm">Score {post.likeCount}</Typography>
      )}
    </Stack>
  );
}
