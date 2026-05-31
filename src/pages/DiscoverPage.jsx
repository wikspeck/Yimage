import { useEffect, useMemo, useState } from "react";
import { Box, Card, CircularProgress, Option, Select, Stack, Typography } from "@mui/joy";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { deletePost, getCategories, getPosts, repostPost, toggleFollow, voteOnPost } from "../api/yimageApi";
import PostCard from "../components/PostCard";
import ShareDialog from "../components/ShareDialog";
import ToastNotice from "../components/ToastNotice";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { usePreferences } from "../context/PreferencesContext";
import { useSeo } from "../hooks/useSeo";

const DISCOVER_MODES = [
  { key: "trending", title: "Trending" },
  { key: "hot", title: "Hot and New" },
  { key: "fresh", title: "Random" }
];

const POST_TYPE_FILTERS = [
  { key: "all", title: "All Posts" },
  { key: "normal", title: "Normal Posts" },
  { key: "image-only", title: "Image-Only Posts" }
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [notice, setNotice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState("neutral");
  const [busyPostId, setBusyPostId] = useState("");
  const [sharePostId, setSharePostId] = useState("");
  const selectedCategory = searchParams.get("category") || "";
  const selectedView = location.pathname === "/discover" ? "discover" : "home";
  const selectedMode = searchParams.get("mode") || (selectedView === "discover" ? preferences.defaultDiscoverMode || "trending" : "home");
  const selectedPostType = searchParams.get("postType") || preferences.defaultFeedPostType || "all";

  function showToast(message, color = "neutral") {
    setToastMessage(message);
    setToastColor(color);
  }

  const activeFilters = useMemo(
    () => ({
        category: searchParams.get("category") || "",
        view: location.pathname === "/discover" ? "discover" : "home",
        mode: searchParams.get("mode") || (location.pathname === "/discover" ? preferences.defaultDiscoverMode || "trending" : "home"),
        postType: searchParams.get("postType") || preferences.defaultFeedPostType || "all"
      }),
    [location.pathname, preferences.defaultDiscoverMode, preferences.defaultFeedPostType, searchParams]
  );

  useEffect(() => {
    if (!searchParams.get("postType") && preferences.defaultFeedPostType && preferences.defaultFeedPostType !== "all") {
      const next = new URLSearchParams(searchParams);
      next.set("postType", preferences.defaultFeedPostType);
      setSearchParams(next);
    }
  }, [preferences.defaultFeedPostType, searchParams, setSearchParams]);

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
          setPosts(
            preferences.showImageOnlyPostsFirst
              ? [...nextPosts].sort((a, b) => (a.postType === "image-only" ? -1 : 0) - (b.postType === "image-only" ? -1 : 0))
              : nextPosts
          );
        }
      } catch (error) {
        if (isMounted) {
          showToast(error.message || "Could not load posts.", "danger");
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
  }, [activeFilters, preferences.showImageOnlyPostsFirst]);

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
    updateFilters({ mode });
  }

  function resetToHomeFeed() {
    const next = new URLSearchParams();
    if (preferences.defaultFeedPostType && preferences.defaultFeedPostType !== "all") {
      next.set("postType", preferences.defaultFeedPostType);
    }
    setSearchParams(next);
  }

  async function handleVote(postId, vote) {
    setBusyPostId(postId);
    setPostsError("");
    setNotice("");

    try {
      const result = await voteOnPost(postId, vote);
      setPosts((current) => current.map((post) => (post.id === postId ? result.post : post)));
    } catch (error) {
      showToast(error.message || "Could not update vote.", "danger");
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
      showToast(result.message || "Repost updated.", "success");
    } catch (error) {
      showToast(error.message || "Could not repost this post.", "danger");
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
        showToast("Could not share this post.", "danger");
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
      showToast(error.message || "Could not update follow status.", "danger");
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
      showToast("Post deleted.", "success");
    } catch (error) {
      showToast(error.message || "Could not delete this post.", "danger");
    } finally {
      setBusyPostId("");
    }
  }

  const heroTitle = selectedView === "discover" ? "Discover" : "Home";
  const visibleModes = selectedView === "discover" ? DISCOVER_MODES : [DISCOVER_MODES[2]];
  const isDiscoverView = selectedView === "discover";

  useSeo(
    isDiscoverView
      ? {
          title: "Discover - Yimage",
          description: "Discover trending images, creators, and posts on Yimage.",
          canonicalPath: "/discover",
          type: "website"
        }
      : {
          title: "Yimage - Social Image Sharing Platform",
          description: "Fast and modern social image sharing platform for discovering, uploading, and sharing images.",
          canonicalPath: "/",
          type: "website",
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Yimage",
            alternateName: "Yimage Social Image Sharing Platform",
            url: "https://yimage.org/",
            description: "Fast and modern social image sharing platform for discovering, uploading, and sharing images.",
            publisher: {
              "@type": "Organization",
              name: "Yimage",
              url: "https://yimage.org/",
              logo: "https://yimage.org/yimage-logo-app.png"
            }
          }
        }
  );

  return (
    <Box className="page-shell">
      <Stack spacing={3}>
        <Card variant="outlined" className="content-card feed-hero-card">
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} flexWrap="wrap">
              <Stack spacing={0.5}>
                <Typography level="h1" sx={{ letterSpacing: "-0.07em", fontSize: { xs: "2.2rem", md: "3.1rem" }, lineHeight: 0.95 }}>
                  {heroTitle}
                </Typography>
                {!isDiscoverView ? (
                  <Typography level="body-sm" textColor="neutral.400">
                    Yimage Social Image Sharing Platform
                  </Typography>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {selectedView === "discover" ? (
                  <button type="button" className="discover-mode-pill search-filter-pill" onClick={resetToHomeFeed}>
                    <span className="discover-mode-title">Home</span>
                  </button>
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

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {POST_TYPE_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`discover-mode-pill search-filter-pill${selectedPostType === item.key ? " is-active" : ""}`}
                  onClick={() => updateFilters({ postType: item.key === "all" ? "" : item.key })}
                >
                  <span className="discover-mode-title">{item.title}</span>
                </button>
              ))}
            </Stack>
          </Stack>
        </Card>

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

        <Stack spacing={2} className="feed-post-list">
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
              onHashtagClick={(tag) => updateFilters({ hashtag: tag, query: "" })}
              onAuthorClick={() => navigate(`/u/${post.authorUsername}`)}
              onRequireLogin={(mode = "login") => (mode === "signup" ? openSignup(`/${post.id}`) : openLogin(`/${post.id}`))}
              isShareActive={sharePostId === post.id}
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
      <ToastNotice open={Boolean(toastMessage)} message={toastMessage} color={toastColor} onClose={() => setToastMessage("")} />
    </Box>
  );
}
