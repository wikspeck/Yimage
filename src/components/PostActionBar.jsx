import { Button, Chip, Stack, Typography } from "@mui/joy";
import { getDownloadUrl } from "../api/yimageApi";

export default function PostActionBar({
  post,
  isLoggedIn,
  isBusy,
  onVote,
  onRepost,
  onRequireLogin,
  showCounts = true
}) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
      <Button
        size="sm"
        variant={post.viewerVote === "up" ? "solid" : "soft"}
        color={post.viewerVote === "up" ? "success" : "neutral"}
        onClick={() => (isLoggedIn ? onVote("up") : onRequireLogin?.())}
        loading={isBusy}
        sx={{ borderRadius: "999px" }}
      >
        Upvote
      </Button>
      <Button
        size="sm"
        variant={post.viewerVote === "down" ? "solid" : "soft"}
        color={post.viewerVote === "down" ? "danger" : "neutral"}
        onClick={() => (isLoggedIn ? onVote("down") : onRequireLogin?.())}
        loading={isBusy}
        sx={{ borderRadius: "999px" }}
      >
        Downvote
      </Button>
      <Button
        size="sm"
        variant="soft"
        color="neutral"
        onClick={() => (isLoggedIn ? onRepost() : onRequireLogin?.())}
        loading={isBusy}
        sx={{ borderRadius: "999px" }}
      >
        Repost
      </Button>
      <Button
        size="sm"
        component="a"
        href={getDownloadUrl(post.id)}
        variant="soft"
        color="neutral"
        sx={{ borderRadius: "999px" }}
      >
        Download
      </Button>
      {showCounts ? (
        <>
          <Chip size="sm" variant="soft">Score {post.score}</Chip>
          <Chip size="sm" variant="soft">Comments {post.commentsCount}</Chip>
          <Chip size="sm" variant="soft">Reposts {post.repostCount}</Chip>
          <Chip size="sm" variant="soft">Downloads {post.downloads}</Chip>
        </>
      ) : null}
      {!showCounts ? <Typography level="body-sm">Score {post.score}</Typography> : null}
    </Stack>
  );
}
