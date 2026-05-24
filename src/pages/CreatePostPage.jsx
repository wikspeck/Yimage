import { Card, Stack, Typography } from "@mui/joy";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import UploadBox from "../components/UploadBox";

export default function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <Stack spacing={3}>
        <BackButton fallbackTo="/" label="Back" />
        <Card variant="outlined" className="content-card">
          <Stack spacing={1}>
            <Typography level="h1" sx={{ letterSpacing: "-0.05em" }}>
              Create a post
            </Typography>
            <Typography level="body-md" textColor="neutral.400">
              Upload one image to R2 and save the post record in D1.
            </Typography>
          </Stack>
        </Card>

        <UploadBox
          onPostCreated={(result) => {
            if (result?.post?.moderationStatus === "active") {
              navigate(`/${result.post.id}`);
            }
          }}
        />
      </Stack>
    </div>
  );
}
