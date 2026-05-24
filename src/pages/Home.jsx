import { useEffect, useState } from "react";
import { Alert, Box, Card, CircularProgress, Sheet, Stack, Typography } from "@mui/joy";
import { getPosts } from "../api/yimageApi";
import Footer from "../components/Footer";
import Header from "../components/Header";
import UploadBox from "../components/UploadBox";

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function PostCard({ post }) {
  return (
    <Card
      variant="outlined"
      sx={{
        mt: 2,
        p: { xs: 2, md: 3 },
        borderRadius: "28px",
        bgcolor: "rgba(18, 20, 28, 0.92)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="center">
          <Typography level="title-lg">{post.title}</Typography>
          <Typography level="body-sm" textColor="neutral.500">
            {formatDate(post.createdAt)}
          </Typography>
        </Stack>
        {post.description ? (
          <Typography level="body-md" textColor="neutral.300">
            {post.description}
          </Typography>
        ) : null}
        <Sheet
          sx={{
            overflow: "hidden",
            borderRadius: "22px",
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid",
            borderColor: "rgba(255,255,255,0.06)"
          }}
        >
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{
              width: "100%",
              maxHeight: 460,
              objectFit: "cover"
            }}
          />
        </Sheet>
      </Stack>
    </Card>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");

  async function loadPosts() {
    setIsLoadingPosts(true);
    setPostsError("");

    try {
      const nextPosts = await getPosts();
      setPosts(nextPosts);
    } catch (error) {
      setPostsError(error.message || "Could not load posts.");
    } finally {
      setIsLoadingPosts(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function handlePostCreated(post) {
    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)].slice(0, 30));
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        backgroundColor: "#0b0d12"
      }}
    >
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Stack spacing={2.5}>
          <Header />

          <Box sx={{ px: { xs: 0.5, md: 1 }, pt: { xs: 1, md: 2 } }}>
            <Stack spacing={1}>
              <Typography level="body-sm" textColor="primary.300" sx={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Calm image sharing
              </Typography>
              <Typography level="h1" sx={{ letterSpacing: "-0.06em", fontSize: { xs: "2.4rem", md: "4rem" }, maxWidth: 760 }}>
                A cleaner upload experience for Yimage.
              </Typography>
              <Typography level="body-lg" textColor="neutral.400" sx={{ maxWidth: 680 }}>
                Threads-inspired composition, Imgur-like usefulness, and a real backend flow that stores posts in R2.
              </Typography>
            </Stack>
          </Box>

          <UploadBox onPostCreated={handlePostCreated} />

          <Stack spacing={1.5}>
            <Typography level="title-lg" sx={{ px: { xs: 0.5, md: 1 } }}>
              Recent posts
            </Typography>
            {isLoadingPosts ? (
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "24px",
                  bgcolor: "rgba(18, 20, 28, 0.92)",
                  borderColor: "rgba(255,255,255,0.08)"
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size="sm" />
                  <Typography level="body-md">Loading posts...</Typography>
                </Stack>
              </Card>
            ) : null}
            {postsError ? <Alert color="danger" variant="soft">{postsError}</Alert> : null}
            {!isLoadingPosts && !posts.length && !postsError ? (
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "24px",
                  bgcolor: "rgba(18, 20, 28, 0.92)",
                  borderColor: "rgba(255,255,255,0.08)"
                }}
              >
                <Typography level="body-md" textColor="neutral.400">
                  No posts yet. Upload the first one to start the feed.
                </Typography>
              </Card>
            ) : null}
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Stack>
          <Footer />
        </Stack>
      </Box>
    </Box>
  );
}
