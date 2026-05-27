import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Input, Option, Select, Sheet, Stack, Textarea, Typography } from "@mui/joy";
import ImagePreviewCard from "./ImagePreviewCard";
import TurnstileWidget from "./TurnstileWidget";
import { createAppeal, createPost, getCategories } from "../api/yimageApi";
import { validateImageFile } from "../utils/validateImageFile";

export default function UploadBox({ onPostCreated }) {
  const inputRef = useRef(null);
  const [postType, setPostType] = useState("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdPost, setCreatedPost] = useState(null);
  const [appealMessage, setAppealMessage] = useState("");
  const [appealNotice, setAppealNotice] = useState("");
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  useEffect(() => {
    if (!selectedFiles.length) {
      setPreviewUrls([]);
      return undefined;
    }

    const nextUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const nextCategories = await getCategories();
        if (isMounted) {
          setCategories(nextCategories);
          setCategoryId("");
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
    setSelectedFiles((current) => (postType === "image-only" ? current.slice(0, 1) : current));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [postType]);

  function resetMessages() {
    setErrorMessage("");
    setSuccessMessage("");
    setAppealNotice("");
  }

  function handleFileSelection(fileList) {
    resetMessages();
    const nextFiles = Array.from(fileList || []).filter(Boolean);

    if (!nextFiles.length) {
      return;
    }

    const limitedFiles = (postType === "image-only" ? nextFiles.slice(0, 1) : nextFiles.slice(0, 4));
    for (const file of limitedFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setSelectedFiles([]);
        setErrorMessage(validation.message);
        return;
      }
    }

    setSelectedFiles(limitedFiles);
  }

  function handleInputChange(event) {
    handleFileSelection(event.target.files || []);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files || []);
  }

  function handleOpenPicker() {
    inputRef.current?.click();
  }

  function handleRemove() {
    setSelectedFiles([]);
    resetMessages();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function resetForm() {
    setPostType("normal");
    setTitle("");
    setDescription("");
    setHashtags("");
    handleRemove();
  }

  async function handleUpload() {
    if (postType === "normal" && !title.trim()) {
      setErrorMessage("Add a title before uploading.");
      return;
    }

    if (!selectedFiles.length) {
      setErrorMessage("Choose an image before uploading.");
      return;
    }

    setIsUploading(true);
    resetMessages();

    try {
      const post = await createPost({
        title: postType === "image-only" ? "" : title.trim(),
        description: postType === "image-only" ? "" : description.trim(),
        categoryId,
        hashtags,
        turnstileToken,
        imageFiles: selectedFiles,
        imageFile: selectedFiles[0],
        postType
      });

      setCreatedPost(post);
      setSuccessMessage(post.moderationNotice || "Post published successfully.");
      resetForm();
      onPostCreated?.(post);
    } catch (error) {
      setErrorMessage(error.message || "Upload failed. Try again.");
    } finally {
      setIsUploading(false);
      setTurnstileResetKey((current) => current + 1);
    }
  }

  async function handleAppealSubmit() {
    if (!createdPost?.canAppeal || !createdPost?.post?.id) {
      return;
    }
    if (!appealMessage.trim()) {
      setAppealNotice("Add a short explanation before sending your appeal.");
      return;
    }

    setIsSubmittingAppeal(true);
    setAppealNotice("");

    try {
      await createAppeal({
        contentId: createdPost.post.id,
        contentType: "post",
        message: appealMessage.trim()
      });
      setAppealNotice("Appeal submitted.");
      setAppealMessage("");
    } catch (error) {
      setAppealNotice(error.message || "Could not submit your appeal.");
    } finally {
      setIsSubmittingAppeal(false);
    }
  }

  return (
    <Stack spacing={2} id="upload-box">
      <Card
        variant="outlined"
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: "22px",
          borderColor: isDragging ? "primary.400" : "rgba(255,255,255,0.08)",
          bgcolor: "rgba(18, 20, 28, 0.96)",
          transition: "all 0.2s ease"
        }}
      >
        <Stack spacing={2.5}>
          <Typography level="h2" sx={{ letterSpacing: "-0.05em", fontSize: { xs: "2rem", md: "2.6rem" } }}>
            New post
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <button
              type="button"
              className={`discover-mode-pill search-filter-pill${postType === "normal" ? " is-active" : ""}`}
              onClick={() => setPostType("normal")}
            >
              <span className="discover-mode-title">Normal Post</span>
            </button>
            <button
              type="button"
              className={`discover-mode-pill search-filter-pill${postType === "image-only" ? " is-active" : ""}`}
              onClick={() => setPostType("image-only")}
            >
              <span className="discover-mode-title">Image-Only</span>
            </button>
          </Stack>

          <Stack spacing={1.25}>
            {postType === "normal" ? (
              <>
                <Input
                  placeholder="Title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  slotProps={{ input: { maxLength: 120 } }}
                  sx={{ borderRadius: "18px", minHeight: 48 }}
                />
                <Textarea
                  placeholder="Description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minRows={3}
                  maxRows={7}
                  slotProps={{ textarea: { maxLength: 1000 } }}
                  sx={{ borderRadius: "18px" }}
                />
              </>
            ) : null}

            <Select
              value={categoryId}
              onChange={(_, nextValue) => setCategoryId(nextValue || "")}
              placeholder="Category"
              sx={{ borderRadius: "14px", minHeight: 48 }}
            >
              <Option value="">All Category</Option>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.label}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Hashtags"
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
              sx={{ borderRadius: "18px", minHeight: 48 }}
            />
          </Stack>

          <Sheet
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleOpenPicker}
            variant="soft"
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: "18px",
              border: "1.5px dashed",
              borderColor: isDragging ? "primary.400" : "rgba(255,255,255,0.12)",
              bgcolor: "rgba(255,255,255,0.02)",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple={postType === "normal"}
              onChange={handleInputChange}
              style={{ display: "none" }}
            />

            <Stack spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "primary.300",
                  fontSize: "1.2rem"
                }}
              >
                +
              </Box>
              <Typography level="title-md">
                {selectedFiles.length ? `${selectedFiles.length} image${selectedFiles.length > 1 ? "s" : ""} selected` : "Drop image here"}
              </Typography>
              <Typography level="body-sm" textColor="neutral.400">
                {postType === "normal" ? "Up to 4 images." : "Single image."}
              </Typography>
              <Button
                type="button"
                variant="soft"
                color="neutral"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenPicker();
                }}
                sx={{ borderRadius: "999px" }}
              >
                Choose image
              </Button>
            </Stack>
          </Sheet>

          {selectedFiles.length ? (
            <ImagePreviewCard
              files={selectedFiles}
              previewUrls={previewUrls}
              onRemove={handleRemove}
              onChooseDifferent={handleOpenPicker}
            />
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
            <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
            <Button
              size="lg"
              onClick={handleUpload}
              disabled={!selectedFiles.length || (postType === "normal" && !title.trim()) || isUploading || !turnstileToken}
              sx={{ borderRadius: "999px", px: 3 }}
            >
              {isUploading ? <CircularProgress size="sm" color="neutral" /> : "Publish post"}
            </Button>
            {selectedFiles.length ? (
              <Button variant="plain" color="neutral" onClick={handleRemove} sx={{ borderRadius: "999px" }}>
                Remove image{selectedFiles.length > 1 ? "s" : ""}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Card>

      {errorMessage ? <Alert color="danger" variant="soft">{errorMessage}</Alert> : null}
      {successMessage ? <Alert color="success" variant="soft">{successMessage}</Alert> : null}
      {createdPost?.canAppeal ? (
        <Card variant="outlined" className="content-card">
          <Stack spacing={1.5}>
            <Typography level="title-lg">Automatic safety review</Typography>
            <Typography level="body-sm" textColor="neutral.400">
              Your post was hidden by automatic safety moderation. You can appeal this decision.
            </Typography>
            {createdPost.aiFinding ? (
              <Typography level="body-sm" textColor="neutral.300">
                Risk {createdPost.aiFinding.riskScore} • {(createdPost.aiFinding.labels || []).join(", ") || "image safety review"} • {createdPost.aiFinding.reason}
              </Typography>
            ) : null}
            <Textarea
              value={appealMessage}
              onChange={(event) => setAppealMessage(event.target.value)}
              minRows={3}
              maxRows={6}
              placeholder="Explain why you believe this image should be restored."
              sx={{ borderRadius: "18px" }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <Button loading={isSubmittingAppeal} onClick={handleAppealSubmit} sx={{ borderRadius: "999px" }}>
                Appeal
              </Button>
              <Button
                variant="plain"
                color="neutral"
                onClick={() => {
                  if (createdPost?.post?.id) {
                    window.location.assign(`/${createdPost.post.id}`);
                  }
                }}
                sx={{ borderRadius: "999px" }}
              >
                Open post
              </Button>
            </Stack>
            {appealNotice ? <Alert color={appealNotice === "Appeal submitted." ? "success" : "warning"} variant="soft">{appealNotice}</Alert> : null}
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
