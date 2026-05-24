import { useEffect, useState } from "react";
import { Alert, AspectRatio, Button, Card, CircularProgress, Stack, Textarea, Typography } from "@mui/joy";
import { useNavigate, useParams } from "react-router-dom";
import { createComment, getPost, getPostComments, likePost } from "../api/yimageApi";
import AuthPromptCard from "../components/AuthPromptCard";
import BackButton from "../components/BackButton";
import PostActionBar from "../components/PostActionBar";
import { useAuth } from "../context/AuthContext";
import { formatFullDate, formatRelativeTime } from "../utils/formatters";

export default function PostPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      setIsLoading(true);
      setError("");

      try {
        const [nextPost, nextComments] = await Promise.all([getPost(postId), getPostComments(postId)]);
        if (isMounted) {
          setPost(nextPost);
          setComments(nextComments);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Could not load this post.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  async function handleLike() {
    setIsBusy(true);

    try {
      const updatedPost = await likePost(postId);
      setPost(updatedPost);
    } catch (actionError) {
      setError(actionError.message || "Could not update vote.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleDownvotePlaceholder() {
    setError("Downvotes are coming soon.");
  }

  function handleRepostPlaceholder() {
    setError("Repost is coming soon.");
  }

  function handleUsePlaceholder() {
    setError("Use is coming soon.");
  }

  async function handleCreateComment(event) {
    event.preventDefault();
    setIsSubmittingComment(true);
    setError("");

    try {
      const comment = await createComment(postId, commentText);
      setComments((current) => [...current, comment]);
      setCommentText("");
      setPost((current) => ({ ...current, commentsCount: current.commentsCount + 1 }));
    } catch (actionError) {
      setError(actionError.message || "Could not add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <Card variant="outlined" className="content-card">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size="sm" />
            <Typography level="body-md">Loading post...</Typography>
          </Stack>
        </Card>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="page-shell">
        <Alert color="danger" variant="soft">{error}</Alert>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}

        <Card variant="outlined" className="content-card">
          <Stack spacing={2.5}>
            <AspectRatio ratio="4/3" className="viewer-frame" sx={{ borderRadius: "20px", overflow: "hidden", bgcolor: "#05070b" }}>
              <img src={post.imageUrl} alt={post.title} style={{ objectFit: "contain" }} />
            </AspectRatio>

            <Stack spacing={1}>
              <Typography level="h1" sx={{ letterSpacing: "-0.05em", fontSize: { xs: "2rem", md: "3rem" } }}>
                {post.title}
              </Typography>
              <Typography level="body-sm" textColor="neutral.400">
                by @{post.authorUsername} • {formatRelativeTime(post.createdAt)} • {formatFullDate(post.createdAt)}
              </Typography>
              {post.description ? (
                <Typography level="body-lg" textColor="neutral.300">
                  {post.description}
                </Typography>
              ) : null}
            </Stack>

            <PostActionBar
              post={post}
              isLoggedIn={Boolean(user)}
              isBusy={isBusy}
              onUpvote={handleLike}
              onDownvote={handleDownvotePlaceholder}
              onRepost={handleRepostPlaceholder}
              onUse={handleUsePlaceholder}
              onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              <Button variant="soft" color="neutral" component="a" href={`https://yimage.org/${post.id}`} sx={{ borderRadius: "999px" }}>
                Share page
              </Button>
              <Button variant="soft" color="neutral" onClick={handleCopyLink} sx={{ borderRadius: "999px" }}>
                {copied ? "Copied" : "Copy link"}
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Stack spacing={2}>
          <Typography level="title-lg">Comments</Typography>

          {user ? (
            <Card variant="outlined" className="content-card">
              <Stack component="form" spacing={1.5} onSubmit={handleCreateComment}>
                <Textarea
                  minRows={3}
                  maxRows={6}
                  maxLength={400}
                  placeholder="Write a comment"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  sx={{ borderRadius: "18px" }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Typography level="body-sm" textColor="neutral.500">
                    Commenting as @{user.username}
                  </Typography>
                  <Button type="submit" loading={isSubmittingComment} disabled={!commentText.trim()} sx={{ borderRadius: "999px" }}>
                    Post comment
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ) : (
            <AuthPromptCard
              onLogin={() => navigate(`/login?next=/${post.id}`)}
              onSignup={() => navigate(`/signup?next=/${post.id}`)}
              message="Log in to vote, repost, and join the comment thread."
            />
          )}

          {!comments.length ? (
            <Card variant="outlined" className="content-card">
              <Typography level="body-md" textColor="neutral.400">
                No comments yet.
              </Typography>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id} variant="outlined" className="content-card">
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography level="title-sm">@{comment.authorUsername}</Typography>
                    <Typography level="body-sm" textColor="neutral.500">
                      {formatRelativeTime(comment.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography level="body-md" textColor="neutral.300">
                    {comment.text}
                  </Typography>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Stack>
    </div>
  );
}
