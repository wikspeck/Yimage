import { useEffect, useState } from "react";
import { Alert, Button, Card, Modal, ModalClose, Sheet, Stack, Textarea, Typography } from "@mui/joy";
import { createComment, deleteComment, getPostComments, replyToComment, voteOnComment } from "../api/yimageApi";
import CommentThread from "./CommentThread";
import AuthPromptCard from "./AuthPromptCard";
import TurnstileWidget from "./TurnstileWidget";

function countComments(items) {
  return items.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);
}

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

function removeComment(comments, commentId) {
  let removedCount = 0;

  function walk(items) {
    const nextItems = [];
    for (const item of items) {
      if (item.id === commentId) {
        removedCount += 1 + countComments(item.replies || []);
        continue;
      }

      const nextReplies = walk(item.replies || []);
      nextItems.push({ ...item, replies: nextReplies });
    }
    return nextItems;
  }

  return {
    comments: walk(comments),
    removedCount
  };
}

export default function PostCommentsSheet({ open, onClose, post, user, onRequireLogin, onCommentCountChange, onCommentCreated, onCommentsLoaded }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentTurnstileToken, setCommentTurnstileToken] = useState("");
  const [commentTurnstileResetKey, setCommentTurnstileResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadComments() {
      if (!open || !post?.id) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const nextComments = await getPostComments(post.id);
        if (isMounted) {
          setComments(nextComments);
          onCommentsLoaded?.(countComments(nextComments));
        }
      } catch (loadError) {
        if (isMounted) {
          setComments([]);
          setError(loadError.message || "Something went wrong loading this section.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadComments();
    return () => {
      isMounted = false;
    };
  }, [open, post?.id]);

  useEffect(() => {
    if (!open) {
      setCommentText("");
      setError("");
    }
  }, [open]);

  async function handleCreateComment(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const comment = await createComment(post.id, commentText, commentTurnstileToken);
      setComments((current) => [...current, comment]);
      setCommentText("");
      onCommentCountChange?.(1);
      onCommentCreated?.(comment);
    } catch (actionError) {
      setError(actionError.message || "Something went wrong loading this section.");
    } finally {
      setIsSubmitting(false);
      setCommentTurnstileResetKey((current) => current + 1);
    }
  }

  async function handleReply(parentId, text, turnstileToken) {
    const reply = await replyToComment(post.id, text, parentId, turnstileToken);
    setComments((current) => appendReply(current, reply));
    onCommentCountChange?.(1);
  }

  async function handleLike(commentId) {
    try {
      const updated = await voteOnComment(commentId, "like");
      setComments((current) => replaceComment(current, updated));
    } catch (voteError) {
      setError(voteError.message || "Something went wrong loading this section.");
    }
  }

  async function handleDelete(commentId) {
    try {
      const result = await deleteComment(commentId);
      setComments((current) => {
        const next = removeComment(current, commentId);
        if (next.removedCount) {
          onCommentCountChange?.(-next.removedCount);
        }
        return next.comments;
      });
    } catch (deleteError) {
      setError(deleteError.message || "Something went wrong loading this section.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="comments-sheet-modal">
      <Sheet className="comments-sheet" variant="outlined">
        <Stack spacing={1.25} sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <div className="comments-sheet-head">
              <ModalClose className="comments-sheet-close" />
            </div>
            <Typography level="title-lg">Comments</Typography>
            <div className="comments-sheet-spacer" />
          </Stack>

          {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}

          <div className="comments-sheet-list">
            {isLoading ? (
              <Card variant="outlined" className="content-card">
                <Typography level="body-md" textColor="neutral.400">Loading comments...</Typography>
              </Card>
            ) : comments.length ? (
              <Stack spacing={1.25}>
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    isLoggedIn={Boolean(user)}
                    currentUser={user}
                    onRequireLogin={onRequireLogin}
                    onReply={handleReply}
                    onLike={handleLike}
                    onDelete={handleDelete}
                  />
                ))}
              </Stack>
            ) : (
              <Card variant="outlined" className="content-card">
                <Typography level="body-md" textColor="neutral.400">No comments yet.</Typography>
              </Card>
            )}
          </div>

          {user ? (
            <Card variant="outlined" className="comment-composer-card comments-sheet-composer">
              <Stack component="form" spacing={1.25} onSubmit={handleCreateComment}>
                <Textarea
                  minRows={3}
                  maxRows={6}
                  maxLength={400}
                  placeholder="Write a comment"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  sx={{ borderRadius: "18px" }}
                />
                <TurnstileWidget onTokenChange={setCommentTurnstileToken} resetKey={commentTurnstileResetKey} />
                <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                  <Typography level="body-sm" textColor="neutral.500">
                    @{user.username}
                  </Typography>
                  <Button type="submit" loading={isSubmitting} disabled={!commentText.trim() || !commentTurnstileToken} className="app-primary-button" sx={{ borderRadius: "999px" }}>
                    Send
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ) : (
            <AuthPromptCard
              onLogin={onRequireLogin}
              onSignup={() => onRequireLogin?.("signup")}
              message="Log in to join the comments."
            />
          )}
        </Stack>
      </Sheet>
    </Modal>
  );
}
