import { useEffect, useMemo, useState } from "react";
import { Avatar, Card, Link, Stack, Typography } from "@mui/joy";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import PostActionBar from "./PostActionBar";
import PostCommentsSheet from "./PostCommentsSheet";
import PostFocusDialog from "./PostFocusDialog";
import ReportDialog from "./ReportDialog";
import { useAuth } from "../context/AuthContext";
import usePersistentPostActionState from "../hooks/usePersistentPostActionState";
import { formatRelativeTime } from "../utils/formatters";

function getPostImages(post) {
  if (Array.isArray(post.images) && post.images.length) {
    return post.images;
  }

  return post.imageUrl
    ? [
        {
          url: post.imageUrl,
          key: post.imageKey || post.id
        }
      ]
    : [];
}

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
  onToggleFollow,
  canDelete,
  onDelete,
  onRequireLogin,
  isShareActive = false
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [commentCount, setCommentCount] = useState(post.commentsCount ?? 0);
  const images = useMemo(() => getPostImages(post), [post]);
  const [hasCommented, setHasCommented] = usePersistentPostActionState("comment", post.id, user);
  const [hasDownloaded, setHasDownloaded] = usePersistentPostActionState("download", post.id, user);
  const [hasReported, setHasReported] = usePersistentPostActionState("report", post.id, user);
  const hasMedia = images.length > 0;
  const isImageOnly = post.postType === "image-only";
  const activeImage = hasMedia ? images[Math.min(activeImageIndex, images.length - 1)] : null;
  const title = post.title?.trim();
  const description = post.description?.trim();
  const displayPost = useMemo(() => ({ ...post, commentsCount: commentCount }), [commentCount, post]);

  useEffect(() => {
    setCommentCount(post.commentsCount ?? 0);
  }, [post.commentsCount, post.id]);

  function showPreviousImage(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setActiveImageIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNextImage(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setActiveImageIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${post.id}`);
    } catch {
      // no-op; focus mode should stay usable even if clipboard fails
    }
  }

  return (
    <>
      <Card variant="outlined" className={`post-card ${isImageOnly ? "post-card-image-only" : "post-card-normal"}`}>
        <Stack spacing={1.05}>
          <Stack direction="row" justifyContent="space-between" spacing={1.25} alignItems="flex-start">
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
              <Avatar
                src={post.authorProfile?.avatarUrl || ""}
                alt={post.authorUsername}
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  color: "#f4f7ff",
                  fontWeight: 700
                }}
              >
                {(post.authorUsername || "Y").slice(0, 1).toUpperCase()}
              </Avatar>
              <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Typography level="title-sm" sx={{ cursor: onAuthorClick ? "pointer" : "default" }} onClick={onAuthorClick}>
                    {post.authorProfile?.displayName || post.authorUsername}
                  </Typography>
                  <Typography level="body-xs" textColor="neutral.500">
                    @{post.authorUsername}
                  </Typography>
                  <Typography level="body-xs" textColor="neutral.500">
                    {formatRelativeTime(post.createdAt)}
                  </Typography>
                </Stack>
                {onToggleFollow && isLoggedIn ? (
                  <button
                    type="button"
                    className="inline-follow-button inline-follow-button-compact"
                    onClick={onToggleFollow}
                  >
                    {post.authorProfile?.isFollowing ? "Following" : "Follow"}
                  </button>
                ) : null}
              </Stack>
            </Stack>
            <Typography level="body-sm" textColor="neutral.500">
              ...
            </Typography>
          </Stack>

          {title ? (
            <Link component={RouterLink} to={`/${post.id}`} underline="none" color="neutral" className="post-title-link">
              <Typography level={isImageOnly ? "title-md" : "title-lg"} className="post-title">
                {title}
              </Typography>
            </Link>
          ) : null}

          {hasMedia ? (
            <div
              className={`post-media-frame ${isImageOnly ? "is-image-only" : "is-normal"}`}
              role="button"
              tabIndex={0}
              onClick={() => setFocusOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setFocusOpen(true);
                }
              }}
            >
              <div className={`post-preview-media ${isImageOnly ? "is-image-only" : "is-normal"}`}>
                <div className={`post-preview-canvas ${isImageOnly ? "is-image-only" : "is-normal"}`}>
                  <img
                    key={activeImage?.url}
                    src={activeImage?.url}
                    alt={title || `${post.authorUsername} post`}
                    className="post-preview-image"
                  />
                </div>
              </div>
              {images.length > 1 ? (
                <>
                  <button type="button" className="post-carousel-arrow is-left" onClick={showPreviousImage} aria-label="Previous image">
                    {"<"}
                  </button>
                  <button type="button" className="post-carousel-arrow is-right" onClick={showNextImage} aria-label="Next image">
                    {">"}
                  </button>
                  <div className="post-carousel-dots" aria-hidden="true">
                    {images.map((image, index) => (
                      <span key={image.key || image.url || index} className={`post-carousel-dot${index === activeImageIndex ? " is-active" : ""}`} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {description ? (
            <Typography level="body-sm" textColor="neutral.300" className="post-description">
              {description.length > 180 ? `${description.slice(0, 180)}...` : description}
            </Typography>
          ) : null}

          {(post.category || (post.hashtags || []).length) ? (
            <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
              {post.category ? (
                <Typography level="body-xs" className="post-tag-chip">
                  {post.category.label}
                </Typography>
              ) : null}
              {(post.hashtags || []).map((tag) => (
                <Typography
                  key={tag}
                  level="body-xs"
                  className="post-tag-chip post-tag-chip-clickable"
                  onClick={() => onHashtagClick?.(tag)}
                >
                  #{tag}
                </Typography>
              ))}
            </Stack>
          ) : null}

          <PostActionBar
            post={displayPost}
            isLoggedIn={isLoggedIn}
            isBusy={isBusy}
            onUpvote={onUpvote}
            onRepost={onRepost}
            onShare={onShare}
            onReport={() => setReportOpen(true)}
            onDownload={() => setHasDownloaded(true)}
            onDelete={onDelete}
            canDelete={canDelete}
            onComment={() => setCommentsOpen(true)}
            onRequireLogin={onRequireLogin}
            isCommentsOpen={commentsOpen}
            hasCommented={hasCommented}
            isReportOpen={reportOpen}
            hasReported={hasReported}
            isShareActive={isShareActive}
            hasDownloaded={hasDownloaded}
          />
        </Stack>
      </Card>

      <PostFocusDialog
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        post={post}
        images={images}
        activeImageIndex={activeImageIndex}
        onPrevious={showPreviousImage}
        onNext={showNextImage}
        onShare={() => onShare?.()}
        onCopyLink={handleCopyLink}
        onOpenPost={() => navigate(`/${post.id}`)}
      />

      <PostCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={post}
        user={user}
        onRequireLogin={onRequireLogin}
        onCommentCountChange={(value) => {
          setCommentCount((current) => typeof value === "number" ? current + value : current);
        }}
        onCommentCreated={() => setHasCommented(true)}
        onCommentsLoaded={(total) => setCommentCount(total)}
      />

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => setHasReported(true)}
        targetType="post"
        targetId={post.id}
        title="Report post"
      />
    </>
  );
}
