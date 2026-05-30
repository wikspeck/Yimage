import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Button, Card, CircularProgress, Input, Stack, Typography } from "@mui/joy";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deletePost, repostPost, searchYimage, toggleFollow, voteOnPost } from "../api/yimageApi";
import PostCard from "../components/PostCard";
import ShareDialog from "../components/ShareDialog";
import ToastNotice from "../components/ToastNotice";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { usePreferences } from "../context/PreferencesContext";
import { useSeo } from "../hooks/useSeo";

const RESULT_FILTERS = ["All", "Posts", "Users", "Hashtags"];
const POST_TYPE_FILTERS = [
  { key: "all", title: "All Posts" },
  { key: "normal", title: "Normal Posts" },
  { key: "image-only", title: "Image-Only Posts" }
];

export default function SearchPage() {
  const { user } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [busyPostId, setBusyPostId] = useState("");
  const [sharePostId, setSharePostId] = useState("");
  const [searchText, setSearchText] = useState(searchParams.get("query") || "");
  const [resultType, setResultType] = useState(searchParams.get("type") || "All");
  const selectedPostType = searchParams.get("postType") || preferences.defaultFeedPostType || "all";

  const query = useMemo(() => searchParams.get("query") || "", [searchParams]);

  useEffect(() => {
    setSearchText(query);
    setResultType(searchParams.get("type") || "All");
  }, [query, searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function runSearch() {
      if (!query) {
        setPosts([]);
        setUsers([]);
        setHashtags([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const result = await searchYimage({ query, postType: selectedPostType });
        if (isMounted) {
          const nextPosts = result.posts || [];
          setPosts(
            preferences.showImageOnlyPostsFirst
              ? [...nextPosts].sort((a, b) => (a.postType === "image-only" ? -1 : 0) - (b.postType === "image-only" ? -1 : 0))
              : nextPosts
          );
          setUsers(result.users || []);
          setHashtags(result.hashtags || []);
        }
      } catch (searchError) {
        if (isMounted) {
          setError(searchError.message || "Could not search right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    runSearch();
    return () => {
      isMounted = false;
    };
  }, [preferences.showImageOnlyPostsFirst, query, selectedPostType]);

  function updateParams(next) {
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

  async function handleVote(postId, vote) {
    setBusyPostId(postId);
    setError("");
    try {
      const result = await voteOnPost(postId, vote);
      setPosts((current) => current.map((post) => (post.id === postId ? result.post : post)));
    } catch (voteError) {
      setError(voteError.message || "Could not update vote.");
    } finally {
      setBusyPostId("");
    }
  }

  async function handleRepost(postId) {
    setBusyPostId(postId);
    setError("");
    setNotice("");

    try {
      const result = await repostPost(postId);
      setPosts((current) => current.map((post) => (post.id === postId ? result.post : post)));
      setNotice(result.message || "Repost updated.");
    } catch (repostError) {
      setError(repostError.message || "Could not repost this post.");
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
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        setError("Could not share this post.");
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
    } catch (followError) {
      setError(followError.message || "Could not update follow status.");
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
    setError("");

    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setNotice("Post deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this post.");
    } finally {
      setBusyPostId("");
    }
  }

  const showPosts = resultType === "All" || resultType === "Posts";
  const showUsers = resultType === "All" || resultType === "Users";
  const showHashtags = resultType === "All" || resultType === "Hashtags";
  const canonicalQuery = query ? `/search?query=${encodeURIComponent(query)}${resultType !== "All" ? `&type=${encodeURIComponent(resultType)}` : ""}${selectedPostType !== "all" ? `&postType=${encodeURIComponent(selectedPostType)}` : ""}` : "/search";

  useSeo({
    title: "Search - Yimage",
    description: "Search posts, creators, hashtags, and images on Yimage.",
    canonicalPath: canonicalQuery,
    type: "website"
  });

  return (
    <Box className="page-shell">
      <Stack spacing={3}>
        <Card variant="outlined" className="content-card feed-hero-card">
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} flexWrap="wrap">
              <Typography level="h1" sx={{ letterSpacing: "-0.07em", fontSize: { xs: "2.1rem", md: "2.8rem" }, lineHeight: 0.95 }}>
                Search
              </Typography>
            </Stack>

            <div className="feed-divider" />

            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              <Input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search posts, users, hashtags"
                className="feed-search-input"
                sx={{ flex: 1, borderRadius: "999px" }}
              />
              <Button variant="solid" color="neutral" onClick={() => updateParams({ query: searchText })} className="app-primary-button" sx={{ borderRadius: "999px" }}>
                Search
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {RESULT_FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`discover-mode-pill search-filter-pill${resultType === item ? " is-active" : ""}`}
                  onClick={() => updateParams({ type: item === "All" ? "" : item })}
                >
                  <span className="discover-mode-title">{item}</span>
                </button>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {POST_TYPE_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`discover-mode-pill search-filter-pill${selectedPostType === item.key ? " is-active" : ""}`}
                  onClick={() => updateParams({ postType: item.key === "all" ? "" : item.key })}
                >
                  <span className="discover-mode-title">{item.title}</span>
                </button>
              ))}
            </Stack>
          </Stack>
        </Card>

        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}
        {notice ? <Alert color="neutral" variant="soft">{notice}</Alert> : null}

        {isLoading ? (
          <Card variant="outlined" className="content-card">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size="sm" />
              <Typography level="body-md">Searching...</Typography>
            </Stack>
          </Card>
        ) : null}

        {!query && !isLoading ? (
          <Card variant="outlined" className="content-card">
            <Typography level="body-md" textColor="neutral.400">
              Search posts, users, or hashtags.
            </Typography>
          </Card>
        ) : null}

        {query && !isLoading && !posts.length && !users.length && !hashtags.length ? (
          <Card variant="outlined" className="content-card">
            <Typography level="body-md" textColor="neutral.400">
              No results.
            </Typography>
          </Card>
        ) : null}

        {showUsers && users.length ? (
          <Stack spacing={2}>
            <Typography level="title-lg">Users</Typography>
            {users.map((profile) => (
              <Card
                key={profile.id}
                variant="outlined"
                className="content-card search-user-card"
                sx={{ p: { xs: 2, md: 2.5 }, cursor: "pointer" }}
                onClick={() => navigate(`/u/${profile.username}`)}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar src={profile.avatarUrl || ""} alt={profile.username} sx={{ width: 44, height: 44, bgcolor: "#151515", color: "#ffffff" }}>
                    {(profile.displayName || profile.username || "Y").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Stack spacing={0.2}>
                    <Typography level="title-md">{profile.displayName || profile.username}</Typography>
                    <Typography level="body-sm" textColor="neutral.500">@{profile.username}</Typography>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : null}

        {showHashtags && hashtags.length ? (
          <Stack spacing={1.5}>
            <Typography level="title-lg">Hashtags</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {hashtags.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  className="search-hashtag-chip"
                  onClick={() => navigate(`/search?query=%23${encodeURIComponent(item.tag)}`)}
                >
                  <span>#{item.tag}</span>
                  <span className="search-hashtag-count">{item.usageCount}</span>
                </button>
              ))}
            </Stack>
          </Stack>
        ) : null}

        {showPosts && posts.length ? (
          <Stack spacing={2}>
            <Typography level="title-lg">Posts</Typography>
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
                onHashtagClick={(tag) => updateParams({ query: `#${tag}`, type: "Hashtags" })}
                onAuthorClick={() => navigate(`/u/${post.authorUsername}`)}
                onRequireLogin={(mode = "login") => (mode === "signup" ? openSignup(`/${post.id}`) : openLogin(`/${post.id}`))}
                isShareActive={sharePostId === post.id}
              />
            ))}
          </Stack>
        ) : null}
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
