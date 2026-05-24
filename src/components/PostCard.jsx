import { Card, Link, Sheet, Stack, Typography } from "@mui/joy";
import { Link as RouterLink } from "react-router-dom";
import PostActionBar from "./PostActionBar";
import { formatRelativeTime } from "../utils/formatters";

export default function PostCard({
  post,
  isLoggedIn,
  isBusy,
  onUpvote,
  onDownvote,
  onRepost,
  onShare,
  onHashtagClick,
  onAuthorClick,
  onRequireLogin
}) {
  return (
    <Card
      variant="outlined"
      className="post-card"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: "22px",
        bgcolor: "#000000",
        borderColor: "rgba(255,255,255,0.12)"
      }}
    >
      <Stack spacing={2}>
        <Sheet
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            bgcolor: "#050505",
            border: "1px solid rgba(255,255,255,0.12)"
          }}
        >
          <Link component={RouterLink} to={`/${post.id}`} underline="none" color="neutral">
            <div className="post-preview-media">
              <div className="post-preview-canvas">
                <img src={post.imageUrl} alt={post.title} className="post-preview-image" />
              </div>
            </div>
          </Link>
        </Sheet>

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" spacing={1.5}>
            <Link component={RouterLink} to={`/${post.id}`} underline="none" color="neutral">
              <Typography level="title-lg">{post.title}</Typography>
            </Link>
            <Typography level="body-sm" textColor="neutral.500">
              {formatRelativeTime(post.createdAt)}
            </Typography>
          </Stack>
          <Typography
            level="body-sm"
            textColor="neutral.400"
            sx={{ cursor: onAuthorClick ? "pointer" : "default" }}
            onClick={onAuthorClick}
          >
            by @{post.authorUsername}
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {post.category ? (
              <Typography level="body-sm" className="post-tag-chip">
                {post.category.label}
              </Typography>
            ) : null}
            {(post.hashtags || []).map((tag) => (
              <Typography
                key={tag}
                level="body-sm"
                className="post-tag-chip post-tag-chip-clickable"
                onClick={() => onHashtagClick?.(tag)}
              >
                #{tag}
              </Typography>
            ))}
          </Stack>
          {post.description ? (
            <Typography level="body-md" textColor="neutral.300">
              {post.description.length > 140 ? `${post.description.slice(0, 140)}...` : post.description}
            </Typography>
          ) : null}
        </Stack>

        <PostActionBar
          post={post}
          isLoggedIn={isLoggedIn}
          isBusy={isBusy}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          onRepost={onRepost}
          onShare={onShare}
          onComment={() => window.location.assign(`/${post.id}#comments`)}
          onRequireLogin={onRequireLogin}
        />
      </Stack>
    </Card>
  );
}
