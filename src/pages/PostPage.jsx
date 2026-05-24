import { useEffect, useState } from "react";
import { Alert, AspectRatio, Button, Card, CircularProgress, Link, Stack, Textarea, Typography } from "@mui/joy";
import { useNavigate, useParams } from "react-router-dom";
import { createComment, getPost, getPostComments, replyToComment, repostPost, toggleFollow, voteOnComment, voteOnPost } from "../api/yimageApi";
import AuthPromptCard from "../components/AuthPromptCard";
import BackButton from "../components/BackButton";
import CommentThread from "../components/CommentThread";
import PostActionBar from "../components/PostActionBar";
import { useAuth } from "../context/AuthContext";
import { formatFullDate, formatRelativeTime } from "../utils/formatters";

function replaceComment(comments, updatedComment) {
  return comments.map((comment) => {
    if (comment.id === updatedComment.id) {
      return { ...updatedComment, replies: comment.replies || [] };
    }

    if (comment.replies?.length) {
      return { ...comment, replies: replaceComment(comment.replies, updatedComment) };
    }

    return comment;
  });
}

function appendReply(comments, reply) {
  return comments.map((comment) => {
    if (comment.id === reply.parentId) {
      return { ...comment, replies: [...(comment.replies || []), reply] };
    }

    if (comment.replies?.length) {
      return { ...comment, replies: appendReply(comment.replies, reply) };
    }

    return comment;
  });
}

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
  const [actionNotice, setActionNotice] = useState("");

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

  async function handleVote(vote) {
    setIsBusy(true);
    setError("");
    setActionNotice("");

    try {
      const result = await voteOnPost(postId, vote);
      setPost(result.post);
    } catch (actionError) {
      setError(actionError.message || "Could not update vote.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRepost() {
    setIsBusy(true);
    setError("");
    setActionNotice("");

    try {
      const result = await repostPost(postId);
      setPost(result.post);
      setActionNotice(result.message || "Repost updated.");
    } catch (actionError) {
      setError(actionError.message || "Could not repost this post.");
    } finally {
      setIsBusy(false);
    }
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

  async function handleReply(parentId, text) {
    const reply = await replyToComment(postId, text, parentId);
    setComments((current) => appendReply(current, reply));
    setPost((current) => ({ ...current, commentsCount: current.commentsCount + 1 }));
  }

  async function handleCommentVote(commentId, vote) {
    try {
      const updated = await voteOnComment(commentId, vote);
      setComments((current) => replaceComment(current, updated));
    } catch (voteError) {
      setError(voteError.message || "Could not vote on this comment.");
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleFollowToggle() {
    try {
      const profile = await toggleFollow(post.authorUsername);
      setPost((current) => ({
        ...current,
        authorProfile: profile
      }));
    } catch (followError) {
      setError(followError.message || "Could not update follow status.");
    }
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
    <div className="page-shell page-shell-wide">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}
        {actionNotice ? <Alert color="neutral" variant="soft">{actionNotice}</Alert> : null}

        <div className="post-detail-layout">
          <Card variant="outlined" className="content-card post-detail-media-card">
            <Stack spacing={2}>
              <AspectRatio ratio="4/5" className="viewer-frame" sx={{ borderRadius: "20px", overflow: "hidden", bgcolor: "#050505" }}>
                <img src={post.imageUrl} alt={post.title} style={{ objectFit: "contain" }} />
              </AspectRatio>

              <Stack spacing={1}>
                <Typography level="h1" sx={{ letterSpacing: "-0.05em", fontSize: { xs: "1.8rem", md: "2.4rem" } }}>
                  {post.title}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Typography level="body-sm" textColor="neutral.400">
                    by
                  </Typography>
                  <Link underline="hover" color="neutral" onClick={() => navigate(`/u/${post.authorUsername}`)} sx={{ cursor: "pointer" }}>
                    @{post.authorUsername}
                  </Link>
                  <Typography level="body-sm" textColor="neutral.500">
                    • {formatRelativeTime(post.createdAt)} • {formatFullDate(post.createdAt)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  {post.category ? <Typography level="body-sm" className="post-tag-chip">{post.category.label}</Typography> : null}
                  {(post.hashtags || []).map((tag) => (
                    <Typography
                      key={tag}
                      level="body-sm"
                      className="post-tag-chip post-tag-chip-clickable"
                      onClick={() => navigate(`/?hashtag=${encodeURIComponent(tag)}`)}
                    >
                      #{tag}
                    </Typography>
                  ))}
                </Stack>
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
                onUpvote={() => handleVote("up")}
                onDownvote={() => handleVote("down")}
                onRepost={handleRepost}
                onComment={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                <Button variant="soft" color="neutral" component="a" href={`https://yimage.org/${post.id}`} sx={{ borderRadius: "999px" }}>
                  Share page
                </Button>
                <Button variant="soft" color="neutral" onClick={handleCopyLink} sx={{ borderRadius: "999px" }}>
                  {copied ? "Copied" : "Copy link"}
                </Button>
                {user && user.username !== post.authorUsername ? (
                  <Button variant="plain" color="neutral" onClick={handleFollowToggle} sx={{ borderRadius: "999px" }}>
                    {post.authorProfile?.isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Card>

          <Stack spacing={2} id="comments" className="post-detail-comments">
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
                message="Log in to vote, reply, and join the comment thread."
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
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  isLoggedIn={Boolean(user)}
                  onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
                  onReply={handleReply}
                  onVote={handleCommentVote}
                />
              ))
            )}
          </Stack>
        </div>
      </Stack>
    </div>
  );
}
