import { useEffect, useRef, useState } from "react";
import { Alert, Avatar, Button, Card, CircularProgress, Input, Stack, Textarea, Typography } from "@mui/joy";
import { useNavigate, useParams } from "react-router-dom";
import { deletePost, getUserProfile, toggleFollow } from "../api/yimageApi";
import BackButton from "../components/BackButton";
import PostCard from "../components/PostCard";
import ReportDialog from "../components/ReportDialog";
import ToastNotice from "../components/ToastNotice";
import { useAuth } from "../context/AuthContext";
import { formatFullDate } from "../utils/formatters";

export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const { user, updateProfile, uploadProfileAvatar } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const username = routeUsername || user?.username;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const isOwnProfile = Boolean(user && profile && user.username === profile.username);

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

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        {error ? <Alert color="danger" variant="soft">{error}</Alert> : null}
        {notice ? <Alert color="neutral" variant="soft">{notice}</Alert> : null}

        <Card variant="outlined" className="content-card">
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Avatar
                src={profile.avatarUrl || undefined}
                alt={profile.displayName || profile.username}
                sx={{ width: 84, height: 84, fontSize: "1.5rem", bgcolor: "#111111" }}
              >
                {(profile.displayName || profile.username || "Y").slice(0, 1).toUpperCase()}
              </Avatar>

              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography level="h1" sx={{ letterSpacing: "-0.05em" }}>
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

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <Typography level="body-md">{profile.postsCount} posts</Typography>
              <Typography level="body-md">{profile.followersCount} followers</Typography>
              <Typography level="body-md">{profile.followingCount} following</Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {!isOwnProfile ? (
                <Button variant="soft" color="neutral" onClick={handleFollow} sx={{ borderRadius: "14px", alignSelf: "flex-start" }}>
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
          <Card variant="outlined" className="content-card">
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
              <Button type="submit" sx={{ borderRadius: "14px", alignSelf: "flex-start" }}>
                Save profile
              </Button>
            </Stack>
          </Card>
        ) : null}

        <Stack spacing={2}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={Boolean(user)}
              isBusy={false}
              onUpvote={() => navigate(`/${post.id}`)}
              onDownvote={() => navigate(`/${post.id}`)}
              onRepost={() => navigate(`/${post.id}`)}
              onShare={() => handleSharePost(post.id)}
              canDelete={Boolean(user && (user.id === post.userId || user.isAdmin))}
              onDelete={() => handleDeletePost(post)}
              onHashtagClick={(tag) => navigate(`/?hashtag=${encodeURIComponent(tag)}`)}
              onAuthorClick={() => navigate(`/u/${post.authorUsername}`)}
              onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
            />
          ))}
        </Stack>
        <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={profile.id} title="Report profile" />
        <ToastNotice open={Boolean(toastMessage)} message={toastMessage} onClose={() => setToastMessage("")} />
      </Stack>
    </div>
  );
}
