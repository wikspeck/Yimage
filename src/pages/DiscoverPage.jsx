import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Stack, Typography } from "@mui/joy";
import { useNavigate } from "react-router-dom";
import { getPosts, likePost } from "../api/yimageApi";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [busyPostId, setBusyPostId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      setIsLoadingPosts(true);
      setPostsError("");

      try {
        const nextPosts = await getPosts("new");
        if (isMounted) {
          setPosts(nextPosts);
        }
      } catch (error) {
        if (isMounted) {
          setPostsError(error.message || "Could not load posts.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      }
    }

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLike(postId) {
    setBusyPostId(postId);

    try {
      const updatedPost = await likePost(postId);
      setPosts((current) => current.map((post) => (post.id === postId ? updatedPost : post)));
    } catch (error) {
      setPostsError(error.message || "Could not update vote.");
    } finally {
      setBusyPostId("");
    }
  }

  function handleDownvotePlaceholder() {
    setPostsError("Downvotes are coming soon.");
  }

  function handleRepostPlaceholder() {
    setPostsError("Repost is coming soon.");
  }

  function handleUsePlaceholder() {
    setPostsError("Use is coming soon.");
  }

  return (
    <Box className="page-shell">
      <Stack spacing={3}>
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.5}>
            <Typography level="h1" sx={{ letterSpacing: "-0.06em", fontSize: { xs: "2rem", md: "2.8rem" } }}>
              Discover
            </Typography>
            <Typography level="body-md" textColor="neutral.400" sx={{ maxWidth: 640 }}>
              A simple image feed backed by D1 metadata and R2 image storage.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="solid" color="primary" onClick={() => navigate(user ? "/create" : "/login?next=/create")} sx={{ borderRadius: "999px" }}>
                Create post
              </Button>
              {!user ? (
                <Button variant="soft" color="neutral" onClick={() => navigate("/signup")} sx={{ borderRadius: "999px" }}>
                  Create account
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Card>

        {postsError ? <Alert color="danger" variant="soft">{postsError}</Alert> : null}

        {isLoadingPosts ? (
          <Card variant="outlined" className="content-card">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size="sm" />
              <Typography level="body-md">Loading posts...</Typography>
            </Stack>
          </Card>
        ) : null}

        {!isLoadingPosts && !posts.length ? (
          <Card variant="outlined" className="content-card">
            <Typography level="body-md" textColor="neutral.400">
              No posts yet. The first published image will appear here.
            </Typography>
          </Card>
        ) : null}

        <Stack spacing={2}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={Boolean(user)}
              isBusy={busyPostId === post.id}
              onUpvote={() => handleLike(post.id)}
              onDownvote={handleDownvotePlaceholder}
              onRepost={handleRepostPlaceholder}
              onUse={handleUsePlaceholder}
              onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
