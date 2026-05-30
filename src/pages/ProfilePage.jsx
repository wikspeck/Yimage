import { useEffect, useRef, useState } from "react";
import { Alert, Avatar, Button, Card, CircularProgress, Input, Modal, ModalClose, Option, Select, Sheet, Stack, Textarea, Typography } from "@mui/joy";
import { useNavigate, useParams } from "react-router-dom";
import { deletePost, getUserProfile, toggleFollow } from "../api/yimageApi";
import BackButton from "../components/BackButton";
import PostCard from "../components/PostCard";
import ReportDialog from "../components/ReportDialog";
import ToastNotice from "../components/ToastNotice";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useSeo } from "../hooks/useSeo";
import { formatFullDate } from "../utils/formatters";

export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const { user, updateProfile, uploadProfileAvatar } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const username = routeUsername || user?.username;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeFeed, setActiveFeed] = useState("posts");
  const [socialSheet, setSocialSheet] = useState("");
  const [socialQuery, setSocialQuery] = useState("");
  const isOwnProfile = Boolean(user && profile && user.username === profile.username);
  const seoUsername = profile?.username || username || "profile";

  useSeo({
    title: `${seoUsername} - Yimage`,
    description: `View posts, reposts, and uploaded images from ${seoUsername} on Yimage.`,
    canonicalPath: username ? `/u/${encodeURIComponent(username)}` : "/profile",
    type: "profile"
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!username) {
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const result = await getUserProfile(username);
        if (isMounted) {
          setProfile(result.profile);
          setPosts(result.posts);
          setReposts(result.reposts || []);
          setFollowers(result.followers || []);
          setFollowing(result.following || []);
          setDisplayName(result.profile.displayName || "");
          setBio(result.profile.bio || "");
          setAvatarUrl(result.profile.avatarUrl || "");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Could not load this profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [username]);

  async function handleFollow() {
    setError("");
    setNotice("");

    try {
      const nextProfile = await toggleFollow(profile.username);
      setProfile((current) => ({ ...current, ...nextProfile }));
    } catch (followError) {
      setError(followError.message || "Could not update follow status.");
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const nextUser = await updateProfile({ displayName, bio, avatarUrl });
      setProfile((current) => ({
        ...current,
        displayName: nextUser.displayName,
        bio: nextUser.bio,
        avatarUrl: nextUser.avatarUrl
      }));
      setNotice("Profile updated.");
    } catch (saveError) {
      setError(saveError.message || "Could not save profile.");
    }
  }

  async function handleShareProfile() {
    const link = `${window.location.origin}/u/${profile.username}`;

    try {
      if (navigator.share && window.matchMedia("(max-width: 820px)").matches) {
        await navigator.share({
          title: `@${profile.username} on Yimage`,
          url: link
        });
        return;
      }

      await navigator.clipboard.writeText(link);
      setToastMessage("Copied link to clipboard.");
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        setError("Could not share this profile.");
      }
    }
  }

  async function handleSharePost(postId) {
    const link = `${window.location.origin}/${postId}`;

    try {
      if (navigator.share && window.matchMedia("(max-width: 820px)").matches) {
        await navigator.share({
          title: "Yimage post",
          url: link
        });
        return;
      }

      await navigator.clipboard.writeText(link);
      setToastMessage("Copied link to clipboard.");
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        setError("Could not share this post.");
      }
    }
  }

  async function handleAvatarChange(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    setError("");
    setNotice("");
    setIsUploadingAvatar(true);

    try {
      const nextUser = await uploadProfileAvatar(file);
      setProfile((current) => ({
        ...current,
        avatarUrl: nextUser.avatarUrl
      }));
      setAvatarUrl(nextUser.avatarUrl);
      setToastMessage("Profile picture updated.");
    } catch (uploadError) {
      setError(uploadError.message || "Could not update profile picture.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function handleDeletePost(post) {
    const isAllowed = Boolean(user && (user.id === post.userId || user.isAdmin));
    if (!isAllowed) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setProfile((current) =>
        current
          ? {
              ...current,
              postsCount: Math.max(0, Number(current.postsCount || 0) - 1)
            }
          : current
      );
      setNotice("Post deleted.");
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this post.");
    }
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <Card variant="outlined" className="content-card">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size="sm" />
            <Typography level="body-md">Loading profile...</Typography>
          </Stack>
        </Card>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="page-shell">
        <Alert color="danger" variant="soft">{error}</Alert>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const visiblePosts = activeFeed === "reposts" ? reposts : posts;
  const socialItems = socialSheet === "followers" ? followers : socialSheet === "following" ? following : [];

  return (
    <div className="page-shell profile-page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}
        {notice ? <Alert color="neutral" variant="soft">{notice}</Alert> : null}

        <Card variant="outlined" className="content-card profile-hero-card">
          <Stack spacing={2.2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Avatar
                src={profile.avatarUrl || undefined}
                alt={profile.displayName || profile.username}
                sx={{ width: 92, height: 92, fontSize: "1.65rem", bgcolor: "#111111" }}
              >
                {(profile.displayName || profile.username || "Y").slice(0, 1).toUpperCase()}
              </Avatar>

              <Stack spacing={0.85} sx={{ minWidth: 0, flex: 1 }}>
                <Typography level="h1" sx={{ letterSpacing: "-0.05em", lineHeight: 0.95 }}>
                  {profile.displayName || profile.username}
                </Typography>
                <Typography level="body-md" textColor="neutral.400">
                  @{profile.username}
                </Typography>
                {profile.bio ? (
                  <Typography level="body-md" textColor="neutral.300">
                    {profile.bio}
                  </Typography>
                ) : null}
                <Typography level="body-sm" textColor="neutral.500">
                  Joined {formatFullDate(profile.createdAt)}
                </Typography>
                {isOwnProfile ? (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                    <Button
                      variant="plain"
                      color="neutral"
                      loading={isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      sx={{ borderRadius: "14px", alignSelf: "flex-start" }}
                    >
                      Change profile picture
                    </Button>
                  </>
                ) : null}
              </Stack>
            </Stack>

            <div className="profile-divider" />

            <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" className="profile-stats-row">
              <div className="profile-stat-pill">
                <span className="profile-stat-value">{profile.postsCount}</span>
                <span className="profile-stat-label">Posts</span>
              </div>
              <button type="button" className="profile-stat-pill profile-stat-button" onClick={() => setSocialSheet("followers")}>
                <span className="profile-stat-value">{profile.followersCount}</span>
                <span className="profile-stat-label">Followers</span>
              </button>
              <button type="button" className="profile-stat-pill profile-stat-button" onClick={() => setSocialSheet("following")}>
                <span className="profile-stat-value">{profile.followingCount}</span>
                <span className="profile-stat-label">Following</span>
              </button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {!isOwnProfile ? (
                <Button variant="solid" color="neutral" onClick={handleFollow} className="app-primary-button" sx={{ borderRadius: "14px", alignSelf: "flex-start" }}>
                  {profile.isFollowing ? "Unfollow" : "Follow"}
                </Button>
              ) : null}
              <Button variant="plain" color="neutral" onClick={handleShareProfile} sx={{ borderRadius: "14px", alignSelf: "flex-start" }}>
                Share profile
              </Button>
              {!isOwnProfile ? (
                <Button variant="plain" color="neutral" onClick={() => setReportOpen(true)} sx={{ borderRadius: "14px", alignSelf: "flex-start" }}>
                  Report profile
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Card>

        {isOwnProfile ? (
          <Card variant="outlined" className="content-card profile-edit-card">
            <Stack component="form" spacing={1.5} onSubmit={handleProfileSave}>
              <Typography level="title-lg">Edit profile</Typography>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name"
                sx={{ borderRadius: "14px" }}
              />
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Bio"
                minRows={3}
                maxRows={6}
                maxLength={280}
                sx={{ borderRadius: "14px" }}
              />
              <Input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="Avatar URL or /path"
                sx={{ borderRadius: "14px" }}
              />
              <Button type="submit" className="app-primary-button" sx={{ borderRadius: "14px", alignSelf: "flex-start" }}>
                Save profile
              </Button>
            </Stack>
          </Card>
        ) : null}

        <Card variant="outlined" className="content-card profile-posts-card">
          <Stack spacing={1.6}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
              <Typography level="title-lg">Profile feed</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography level="body-sm" textColor="neutral.500">{visiblePosts.length}</Typography>
                <Select value={activeFeed} onChange={(_, value) => setActiveFeed(value || "posts")} size="sm" sx={{ minWidth: 118, borderRadius: "14px" }}>
                  <Option value="posts">Posts</Option>
                  <Option value="reposts">Reposts</Option>
                </Select>
              </Stack>
            </Stack>
            <div className="profile-divider" />

            {visiblePosts.length ? (
              <Stack spacing={2} className="profile-post-list">
                {visiblePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isLoggedIn={Boolean(user)}
                    isBusy={false}
                    onUpvote={() => navigate(`/${post.id}`)}
                    onRepost={() => navigate(`/${post.id}`)}
                    onShare={() => handleSharePost(post.id)}
                    canDelete={Boolean(user && (user.id === post.userId || user.isAdmin))}
                    onDelete={() => handleDeletePost(post)}
                    onHashtagClick={(tag) => navigate(`/?hashtag=${encodeURIComponent(tag)}`)}
                    onAuthorClick={() => navigate(`/u/${post.authorUsername}`)}
                    onRequireLogin={(mode = "login") => (mode === "signup" ? openSignup(`/${post.id}`) : openLogin(`/${post.id}`))}
                  />
                ))}
              </Stack>
            ) : (
              <div className="profile-empty-state">
                <Typography level="body-md" textColor="neutral.400">
                  {activeFeed === "reposts" ? "No reposts yet." : "No posts yet."}
                </Typography>
              </div>
            )}
          </Stack>
        </Card>
        <Modal open={Boolean(socialSheet)} onClose={() => { setSocialSheet(""); setSocialQuery(""); }} className="comments-sheet-modal">
          <Sheet variant="outlined" className="comments-sheet profile-social-sheet">
            <Stack spacing={1.25} sx={{ height: "100%" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <div className="comments-sheet-head">
                  <ModalClose className="comments-sheet-close" />
                </div>
                <Typography level="title-lg">{socialSheet === "followers" ? "Followers" : "Following"}</Typography>
                <div className="comments-sheet-spacer" />
              </Stack>
              <Input
                value={socialQuery}
                onChange={(event) => setSocialQuery(event.target.value)}
                placeholder={`Search ${socialSheet}`}
                sx={{ borderRadius: "16px" }}
              />
              <div className="comments-sheet-list">
                <Stack spacing={1}>
                  {socialItems
                    .filter((item) => {
                      const query = socialQuery.trim().toLowerCase();
                      if (!query) {
                        return true;
                      }
                      return item.username.toLowerCase().includes(query) || (item.displayName || "").toLowerCase().includes(query);
                    })
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((item) => (
                      <button key={item.id} type="button" className="profile-social-item" onClick={() => { setSocialSheet(""); setSocialQuery(""); navigate(`/u/${item.username}`); }}>
                        <Avatar src={item.avatarUrl || ""} alt={item.username} sx={{ width: 42, height: 42, bgcolor: "#111111" }}>
                          {(item.displayName || item.username || "Y").slice(0, 1).toUpperCase()}
                        </Avatar>
                        <span className="profile-social-copy">
                          <span className="profile-social-name">{item.displayName || item.username}</span>
                          <span className="profile-social-handle">@{item.username}</span>
                        </span>
                      </button>
                    ))}
                </Stack>
              </div>
            </Stack>
          </Sheet>
        </Modal>
        <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={profile.id} title="Report profile" />
        <ToastNotice open={Boolean(toastMessage)} message={toastMessage} onClose={() => setToastMessage("")} />
      </Stack>
    </div>
  );
}
