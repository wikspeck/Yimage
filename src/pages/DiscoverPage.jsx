import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Input, Option, Select, Stack, Typography } from "@mui/joy";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deletePost, getCategories, getPosts, repostPost, toggleFollow, voteOnPost } from "../api/yimageApi";
import PostCard from "../components/PostCard";
import ShareDialog from "../components/ShareDialog";
import ToastNotice from "../components/ToastNotice";
import { useAuth } from "../context/AuthContext";

const DISCOVER_MODES = [
  { key: "trending", title: "Trending" },
  { key: "hot", title: "Hot and New" },
  { key: "fresh", title: "Random" }
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [notice, setNotice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [busyPostId, setBusyPostId] = useState("");
  const [sharePostId, setSharePostId] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("query") || searchParams.get("hashtag") || "");
  const selectedCategory = searchParams.get("category") || "";
  const selectedView = searchParams.get("view") || "home";
  const selectedMode = searchParams.get("mode") || (selectedView === "discover" ? "trending" : "home");

  const activeFilters = useMemo(
    () => ({
      query: searchParams.get("query") || "",
      category: searchParams.get("category") || "",
      hashtag: searchParams.get("hashtag") || "",
      view: searchParams.get("view") || "home",
      mode: searchParams.get("mode") || (searchParams.get("view") === "discover" ? "trending" : "home")
    }),
    [searchParams]
  );

  useEffect(() => {
    setSearchText(searchParams.get("query") || searchParams.get("hashtag") || "");
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const nextCategories = await getCategories();
        if (isMounted) {
          setCategories(nextCategories);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    }

    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      setIsLoadingPosts(true);
      setPostsError("");

      try {
        const nextPosts = await getPosts(activeFilters);
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
  }, [activeFilters]);

  function updateFilters(next) {
    const params = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  }

  function activateDiscoverMode(mode) {
    updateFilters({ view: "discover", mode, query: "", hashtag: "" });
  }

  function resetToHomeFeed() {
    setSearchText("");
    setSearchParams(new URLSearchParams());
  }

  async function handleVote(postId, vote) {
    setBusyPostId(postId);
    setPostsError("");
    setNotice("");

    try {
      const result = await voteOnPost(postId, vote);
      setPosts((current) => current.map((post) => (post.id === postId ? result.post : post)));
    } catch (error) {
      setPostsError(error.message || "Could not update vote.");
    } finally {
      setBusyPostId("");
    }
  }

  async function handleRepost(postId) {
    setBusyPostId(postId);
    setPostsError("");
    setNotice("");

    try {
      const result = await repostPost(postId);
      setPosts((current) => current.map((post) => (post.id === postId ? result.post : post)));
      setNotice(result.message || "Repost updated.");
    } catch (error) {
      setPostsError(error.message || "Could not repost this post.");
    } finally {
      setBusyPostId("");
    }
  }

  async function handleShare(postId) {
    const link = `${window.location.origin}/${postId}`;

    try {
      if (navigator.share && window.matchMedia("(max-width: 820px)").matches) {
        await navigator.share({
          title: "Yimage post",
          url: link
        });
        return;
      }

      setSharePostId(postId);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setPostsError("Could not share this post.");
      }
    }
  }

  async function handleToggleFollow(post) {
    try {
      const profile = await toggleFollow(post.authorUsername);
      setPosts((current) =>
        current.map((item) =>
          item.authorUsername === post.authorUsername
            ? {
                ...item,
                authorProfile: profile
              }
            : item
        )
      );
    } catch (error) {
      setPostsError(error.message || "Could not update follow status.");
    }
  }

  async function handleDelete(post) {
    const isAllowed = Boolean(user && (user.id === post.userId || user.isAdmin));
    if (!isAllowed) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) {
      return;
    }

    setBusyPostId(post.id);
    setPostsError("");
    setNotice("");

    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice("Post deleted.");
    } catch (error) {
      setPostsError(error.message || "Could not delete this post.");
    } finally {
      setBusyPostId("");
    }
  }

  const heroTitle = selectedView === "discover" ? "Discover" : "Home";
  const visibleModes = selectedView === "discover" ? DISCOVER_MODES : [DISCOVER_MODES[2]];

  return (
    <Box className="page-shell">
      <Stack spacing={3}>
        <Card variant="outlined" className="content-card feed-hero-card">
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} flexWrap="wrap">
              <Typography level="h1" sx={{ letterSpacing: "-0.07em", fontSize: { xs: "2.2rem", md: "3.1rem" }, lineHeight: 0.95 }}>
                {heroTitle}
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="solid" color="neutral" onClick={() => navigate(user ? "/create" : "/login?next=/create")} sx={{ borderRadius: "999px" }}>
                  Create post
                </Button>
                {selectedView === "discover" ? (
                  <Button variant="plain" color="neutral" onClick={resetToHomeFeed} sx={{ borderRadius: "999px" }}>
                    Home
                  </Button>
                ) : null}
                {!user && selectedView !== "discover" ? (
                  <Button variant="soft" color="neutral" onClick={() => navigate("/signup")} sx={{ borderRadius: "999px" }}>
                    Create account
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            <div className="feed-divider" />

            {selectedView === "discover" ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} className="discover-mode-row">
                {visibleModes.map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    className={`discover-mode-pill${selectedMode === mode.key ? " is-active" : ""}`}
                    onClick={() => activateDiscoverMode(mode.key)}
                  >
                    <span className="discover-mode-title">{mode.title}</span>
                  </button>
                ))}
                <Select
                  value={selectedCategory}
                  onChange={(_, value) => updateFilters({ category: value || "" })}
                  placeholder="Topics"
                  className="feed-filter-select discover-category-select"
                  sx={{ minWidth: { xs: "100%", md: 180 }, borderRadius: "16px" }}
                >
                  <Option value="">Topics</Option>
                  {categories.map((category) => (
                    <Option key={category.id} value={category.slug}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Stack>
            ) : null}
          </Stack>
        </Card>

        {postsError ? <Alert color="danger" variant="soft">{postsError}</Alert> : null}
        {notice ? <Alert color="neutral" variant="soft">{notice}</Alert> : null}

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
              {selectedView === "home" && user?.followingCount === 0 ? "Start following someone to build your feed." : "No posts."}
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
              onUpvote={() => handleVote(post.id, "up")}
              onDownvote={() => handleVote(post.id, "down")}
              onRepost={() => handleRepost(post.id)}
              onShare={() => handleShare(post.id)}
              onToggleFollow={() => handleToggleFollow(post)}
              canDelete={Boolean(user && (user.id === post.userId || user.isAdmin))}
              onDelete={() => handleDelete(post)}
              onHashtagClick={(tag) => {
                setSearchText(`#${tag}`);
                updateFilters({ hashtag: tag, query: "" });
              }}
              onAuthorClick={() => navigate(`/u/${post.authorUsername}`)}
              onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
            />
          ))}
        </Stack>
      </Stack>
      <ShareDialog
        open={Boolean(sharePostId)}
        onClose={() => setSharePostId("")}
        url={sharePostId ? `${window.location.origin}/${sharePostId}` : window.location.origin}
        title="Share post"
        onCopied={setToastMessage}
      />
      <ToastNotice open={Boolean(toastMessage)} message={toastMessage} onClose={() => setToastMessage("")} />
    </Box>
  );
}
