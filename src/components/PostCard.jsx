import { AspectRatio, Card, Link, Stack, Typography } from "@mui/joy";
import { Link as RouterLink } from "react-router-dom";
import PostActionBar from "./PostActionBar";
import { formatRelativeTime } from "../utils/formatters";

export default function PostCard({ post, isLoggedIn, isBusy, onLike, onRequireLogin }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: "22px",
        bgcolor: "rgba(18, 20, 28, 0.96)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <Stack spacing={2}>
        <AspectRatio ratio="16/10" sx={{ borderRadius: "20px", overflow: "hidden", bgcolor: "#05070b" }}>
          <Link component={RouterLink} to={`/${post.id}`} overlay underline="none">
            <img src={post.imageUrl} alt={post.title} style={{ objectFit: "cover" }} />
          </Link>
        </AspectRatio>

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" spacing={1.5}>
            <Link component={RouterLink} to={`/${post.id}`} underline="none" color="neutral">
              <Typography level="title-lg">{post.title}</Typography>
            </Link>
            <Typography level="body-sm" textColor="neutral.500">
              {formatRelativeTime(post.createdAt)}
            </Typography>
          </Stack>
          <Typography level="body-sm" textColor="neutral.400">
            by @{post.authorUsername}
          </Typography>
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
          onLike={onLike}
          onRequireLogin={onRequireLogin}
        />
      </Stack>
    </Card>
  );
}
