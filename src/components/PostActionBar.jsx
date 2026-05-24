import { Button, Chip, Stack, Typography } from "@mui/joy";
import { getDownloadUrl } from "../api/yimageApi";

export default function PostActionBar({
  post,
  isLoggedIn,
  isBusy,
  onLike,
  onRequireLogin,
  showCounts = true
}) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
      <Button
        size="sm"
        variant={post.hasLiked ? "solid" : "soft"}
        color={post.hasLiked ? "primary" : "neutral"}
        onClick={() => (isLoggedIn ? onLike() : onRequireLogin?.())}
        loading={isBusy}
        sx={{ borderRadius: "999px" }}
      >
        {post.hasLiked ? "Liked" : "Like"}
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
          <Chip size="sm" variant="soft">Likes {post.likeCount}</Chip>
          <Chip size="sm" variant="soft">Comments {post.commentsCount}</Chip>
          <Chip size="sm" variant="soft">Views {post.views}</Chip>
        </>
      ) : null}
      {!showCounts ? <Typography level="body-sm">Likes {post.likeCount}</Typography> : null}
    </Stack>
  );
}
