import { useEffect, useState } from "react";
import { Alert, Button, Card, CircularProgress, Link, Stack, Textarea, Typography } from "@mui/joy";
import { useNavigate, useParams } from "react-router-dom";
import { createAppeal, deletePost, getPost, repostPost, toggleFollow, voteOnPost } from "../api/yimageApi";
import BackButton from "../components/BackButton";
import PostActionBar from "../components/PostActionBar";
import PostCommentsSheet from "../components/PostCommentsSheet";
import ReportDialog from "../components/ReportDialog";
import ShareDialog from "../components/ShareDialog";
import ToastNotice from "../components/ToastNotice";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { formatFullDate, formatRelativeTime } from "../utils/formatters";

export default function PostPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [moderationReview, setModerationReview] = useState(null);
  const [appealMessage, setAppealMessage] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
      setIsLoading(true);
      setError("");

      try {
        const postResult = await getPost(postId);
        if (isMounted) {
          setPost(postResult.post);
          setModerationReview(postResult.moderationReview || null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Something went wrong loading this section.");
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

  useEffect(() => {
    setActiveImageIndex(0);
  }, [postId]);

  async function handleVote(vote) {
    setIsBusy(true);
    setError("");
    setActionNotice("");

    try {
      const result = await voteOnPost(postId, vote);
      setPost(result.post);
    } catch (actionError) {
      setError(actionError.message || "Something went wrong loading this section.");
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
      setError(actionError.message || "Something went wrong loading this section.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage("Copied link to clipboard.");
    } catch {
      setError("Something went wrong loading this section.");
    }
  }

  async function handleShare() {
    const link = window.location.href;

    try {
      if (navigator.share && window.matchMedia("(max-width: 820px)").matches) {
        await navigator.share({ title: post.title || "Yimage post", url: link });
        return;
      }

      setShareOpen(true);
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        setError("Something went wrong loading this section.");
      }
    }
  }

  async function handleFollowToggle() {
    try {
      const profile = await toggleFollow(post.authorUsername);
      setPost((current) => ({ ...current, authorProfile: profile }));
    } catch (followError) {
      setError(followError.message || "Something went wrong loading this section.");
    }
  }

  async function handleAppealSubmit() {
    if (!appealMessage.trim()) {
      setError("Add a short explanation before sending your appeal.");
      return;
    }

    setIsSubmittingAppeal(true);
    setError("");

    try {
      await createAppeal({
        contentId: post.id,
        contentType: "post",
        message: appealMessage.trim()
      });
      setModerationReview((current) => ({
        ...(current || {}),
        appeal: {
          id: "pending",
          message: appealMessage.trim(),
          status: "pending"
        }
      }));
      setToastMessage("Appeal submitted.");
      setAppealMessage("");
    } catch (appealError) {
      setError(appealError.message || "Something went wrong loading this section.");
    } finally {
      setIsSubmittingAppeal(false);
    }
  }

  async function handleDeletePost() {
    const isAllowed = Boolean(user && (user.id === post.userId || user.isAdmin));
    if (!isAllowed) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) {
      return;
    }

    setIsBusy(true);
    setError("");
    setActionNotice("");

    try {
      await deletePost(post.id);
      navigate("/", { replace: true });
    } catch (deleteError) {
      setError(deleteError.message || "Something went wrong loading this section.");
    } finally {
      setIsBusy(false);
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

  const images = Array.isArray(post.images) && post.images.length
    ? post.images
    : post.imageUrl
      ? [{ url: post.imageUrl, key: post.imageKey || post.id }]
      : [];
  const activeImage = images[Math.min(activeImageIndex, Math.max(images.length - 1, 0))];

  return (
    <div className="page-shell post-view-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}
        {actionNotice ? <Alert color="neutral" variant="soft">{actionNotice}</Alert> : null}

        <Card variant="outlined" className="content-card post-detail-media-card post-detail-single-card">
          <Stack spacing={2}>
            {activeImage ? (
              <Stack spacing={1} sx={{ position: "relative" }}>
                <div className="viewer-frame viewer-frame-adaptive">
                  <img src={activeImage.url} alt={post.title || `${post.authorUsername} post`} className="viewer-image" />
                </div>
                {images.length > 1 ? (
                  <div className="post-detail-carousel-controls">
                    <button type="button" className="post-carousel-arrow is-left" onClick={() => setActiveImageIndex((current) => (current === 0 ? images.length - 1 : current - 1))} aria-label="Previous image">
                      {"<"}
                    </button>
                    <button type="button" className="post-carousel-arrow is-right" onClick={() => setActiveImageIndex((current) => (current === images.length - 1 ? 0 : current + 1))} aria-label="Next image">
                      {">"}
                    </button>
                    <div className="post-carousel-dots" aria-hidden="true">
                      {images.map((image, index) => (
                        <span key={image.key || image.url || index} className={`post-carousel-dot${index === activeImageIndex ? " is-active" : ""}`} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </Stack>
            ) : null}

            <Stack spacing={1}>
              {moderationReview ? (
                <Alert color="warning" variant="soft">
                  {moderationReview.message}
                </Alert>
              ) : null}
              {post.title ? (
                <Typography level="h1" sx={{ letterSpacing: "-0.05em", fontSize: { xs: "1.7rem", md: "2.2rem" } }}>
                  {post.title}
                </Typography>
              ) : null}
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" className="post-author-row">
                <Typography level="body-sm" textColor="neutral.400">by</Typography>
                <Link
                  underline="hover"
                  color="neutral"
                  onClick={() => navigate(`/u/${post.authorUsername}`)}
                  sx={{ cursor: "pointer", fontWeight: 600 }}
                >
                  @{post.authorUsername}
                </Link>
                {user && user.username !== post.authorUsername ? (
                  <Button
                    size="sm"
                    variant={post.authorProfile?.isFollowing ? "soft" : "plain"}
                    color="neutral"
                    onClick={handleFollowToggle}
                    className="inline-follow-button"
                  >
                    {post.authorProfile?.isFollowing ? "Following" : "Follow"}
                  </Button>
                ) : null}
                <Typography level="body-sm" textColor="neutral.500">
                  {formatRelativeTime(post.createdAt)} / {formatFullDate(post.createdAt)}
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
              {post.description ? <Typography level="body-md" textColor="neutral.300">{post.description}</Typography> : null}
            </Stack>

            <div className="post-detail-action-panel">
              <PostActionBar
                post={post}
                isLoggedIn={Boolean(user)}
                isBusy={isBusy}
                onUpvote={() => handleVote("up")}
                onDownvote={() => handleVote("down")}
                onRepost={handleRepost}
                onShare={handleShare}
                onReport={() => setReportOpen(true)}
                onDelete={handleDeletePost}
                canDelete={Boolean(user && (user.id === post.userId || user.isAdmin))}
                onComment={() => setCommentsOpen(true)}
                onRequireLogin={(mode = "login") => (mode === "signup" ? openSignup(`/${post.id}`) : openLogin(`/${post.id}`))}
              />
            </div>

            {moderationReview ? (
              <Card variant="outlined" className="content-card">
                <Stack spacing={1.25}>
                  <Typography level="title-md">Appeal moderation</Typography>
                  {moderationReview.aiFinding ? (
                    <Typography level="body-sm" textColor="neutral.400">
                      Risk {moderationReview.aiFinding.riskScore} • {(moderationReview.aiFinding.labels || []).join(", ") || "image safety review"} • {moderationReview.aiFinding.aiReason}
                    </Typography>
                  ) : null}
                  {moderationReview.appeal?.status === "pending" ? (
                    <Alert color="neutral" variant="soft">
                      You already have a pending appeal for this post.
                    </Alert>
                  ) : (
                    <>
                      <Textarea
                        minRows={3}
                        maxRows={6}
                        value={appealMessage}
                        onChange={(event) => setAppealMessage(event.target.value)}
                        placeholder="Explain why you think this post should be restored."
                        sx={{ borderRadius: "18px" }}
                      />
                      <Button loading={isSubmittingAppeal} onClick={handleAppealSubmit} className="app-primary-button" sx={{ borderRadius: "999px", alignSelf: "flex-start" }}>
                        Appeal
                      </Button>
                    </>
                  )}
                </Stack>
              </Card>
            ) : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" className="post-detail-secondary-actions">
              <Button variant="soft" color="neutral" component="a" href={`https://yimage.org/${post.id}`} sx={{ borderRadius: "999px" }}>
                Share page
              </Button>
              <Button variant="plain" color="neutral" onClick={handleCopyLink} sx={{ borderRadius: "999px" }}>
                Copy link
              </Button>
            </Stack>
          </Stack>
        </Card>

        <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="post" targetId={post.id} title="Report post" />
        <PostCommentsSheet
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          post={post}
          user={user}
          onRequireLogin={(mode = "login") => (mode === "signup" ? openSignup(`/${post.id}`) : openLogin(`/${post.id}`))}
          onCommentCountChange={(delta) => setPost((current) => ({ ...current, commentsCount: current.commentsCount + delta }))}
        />
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={window.location.href}
          title="Share post"
          onCopied={setToastMessage}
        />
        <ToastNotice open={Boolean(toastMessage)} message={toastMessage} onClose={() => setToastMessage("")} />
      </Stack>
    </div>
  );
}
