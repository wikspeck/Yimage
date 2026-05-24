import { useEffect, useState } from "react";
import { Alert, Button, Card, CircularProgress, Stack, Typography } from "@mui/joy";
import { useNavigate, useParams } from "react-router-dom";
import { getUserProfile, toggleFollow } from "../api/yimageApi";
import BackButton from "../components/BackButton";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { formatFullDate } from "../utils/formatters";

export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const username = routeUsername || user?.username;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyPostId, setBusyPostId] = useState("");

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
    try {
      const nextProfile = await toggleFollow(profile.username);
      setProfile((current) => ({ ...current, ...nextProfile }));
    } catch (followError) {
      setError(followError.message || "Could not update follow status.");
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

        <Card variant="outlined" className="content-card">
          <Stack spacing={1.25}>
            <Typography level="h1" sx={{ letterSpacing: "-0.05em" }}>
              @{profile.username}
            </Typography>
            <Typography level="body-sm" textColor="neutral.500">
              Joined {formatFullDate(profile.createdAt)}
            </Typography>
            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <Typography level="body-md">{profile.postsCount} posts</Typography>
              <Typography level="body-md">{profile.followersCount} followers</Typography>
              <Typography level="body-md">{profile.followingCount} following</Typography>
            </Stack>
            {user && user.username !== profile.username ? (
              <Button variant="soft" color="neutral" onClick={handleFollow} sx={{ borderRadius: "999px", alignSelf: "flex-start" }}>
                {profile.isFollowing ? "Unfollow" : "Follow"}
              </Button>
            ) : null}
          </Stack>
        </Card>

        <Stack spacing={2}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLoggedIn={Boolean(user)}
              isBusy={busyPostId === post.id}
              onUpvote={() => navigate(`/${post.id}`)}
              onDownvote={() => navigate(`/${post.id}`)}
              onRepost={() => navigate(`/${post.id}`)}
              onHashtagClick={(tag) => navigate(`/?hashtag=${encodeURIComponent(tag)}`)}
              onAuthorClick={() => navigate(`/u/${post.authorUsername}`)}
              onRequireLogin={() => navigate(`/login?next=/${post.id}`)}
            />
          ))}
        </Stack>
      </Stack>
    </div>
  );
}
