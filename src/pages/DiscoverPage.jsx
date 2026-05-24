import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Stack, Tab, TabList, Tabs, Typography } from "@mui/joy";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPosts, repostPost, voteOnPost } from "../api/yimageApi";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [busyPostId, setBusyPostId] = useState("");
  const sort = searchParams.get("sort") || "hot";

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      setIsLoadingPosts(true);
      setPostsError("");

      try {
        const nextPosts = await getPosts(sort);
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
  }, [sort]);

  async function handleVote(postId, vote) {
    setBusyPostId(postId);
    try {
      const updatedPost = await voteOnPost(postId, vote);
      setPosts((current) => current.map((post) => (post.id === postId ? updatedPost : post)));
    } catch (error) {
      setPostsError(error.message || "Could not update vote.");
    } finally {
      setBusyPostId("");
    }
  }

  async function handleRepost(postId) {
    setBusyPostId(postId);
    try {
      const updatedPost = await repostPost(postId);
      setPosts((current) => current.map((post) => (post.id === postId ? updatedPost : post)));
    } catch (error) {
      setPostsError(error.message || "Could not repost.");
    } finally {
      setBusyPostId("");
    }
  }

  return (
    <Box className="page-shell">
      <Stack spacing={3}>
        <Card variant="outlined" className="hero-card">
          <Stack spacing={1.5}>
            <Typography level="body-sm" textColor="primary.300" sx={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Image-first discovery
            </Typography>
            <Typography level="h1" sx={{ letterSpacing: "-0.06em", fontSize: { xs: "2.4rem", md: "4rem" }, maxWidth: 760 }}>
              Explore fresh posts, strong visuals, and simple social feedback.
            </Typography>
            <Typography level="body-lg" textColor="neutral.400" sx={{ maxWidth: 700 }}>
              Yimage now separates browsing from publishing, so anyone can explore while logged-in users can post, vote, comment, repost, and download.
            </Typography>
            <Stack direction="row" spacing={1}>
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

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
          <Typography level="title-lg">Discover</Typography>
          <Tabs value={sort} onChange={(_event, value) => setSearchParams(value === "hot" ? {} : { sort: value })}>
            <TabList sx={{ borderRadius: "999px", bgcolor: "rgba(255,255,255,0.04)" }}>
              <Tab value="hot">Hot</Tab>
              <Tab value="new">New</Tab>
              <Tab value="top">Top</Tab>
            </TabList>
          </Tabs>
        </Stack>

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
              onVote={(vote) => handleVote(post.id, vote)}
              onRepost={() => handleRepost(post.id)}
              onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
