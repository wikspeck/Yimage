import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Input, Option, Select, Sheet, Stack, Textarea, Typography } from "@mui/joy";
import ImagePreviewCard from "./ImagePreviewCard";
import { createPost, getCategories } from "../api/yimageApi";
import { validateImageFile } from "../utils/validateImageFile";

export default function UploadBox({ onPostCreated }) {
  const inputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const nextCategories = await getCategories();
        if (isMounted) {
          setCategories(nextCategories);
          setCategoryId(nextCategories[0]?.id || "");
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

  function resetMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleFileSelection(file) {
    resetMessages();
    const validation = validateImageFile(file);

    if (!validation.valid) {
      setSelectedFile(null);
      setErrorMessage(validation.message);
      return;
    }

    setSelectedFile(file);
  }

  function handleInputChange(event) {
    const [file] = event.target.files || [];
    handleFileSelection(file);
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
    const [file] = event.dataTransfer.files || [];
    handleFileSelection(file);
  }

  function handleOpenPicker() {
    inputRef.current?.click();
  }

  function handleRemove() {
    setSelectedFile(null);
    resetMessages();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setHashtags("");
    handleRemove();
  }

  async function handleUpload() {
    if (!title.trim()) {
      setErrorMessage("Add a title before uploading.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Choose an image before uploading.");
      return;
    }

    setIsUploading(true);
    resetMessages();

    try {
      const post = await createPost({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        hashtags,
        imageFile: selectedFile
      });

      setSuccessMessage("Post published successfully.");
      resetForm();
      onPostCreated?.(post);
    } catch (error) {
      setErrorMessage(error.message || "Upload failed. Try again.");
    } finally {
      setIsUploading(false);
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
          <Stack spacing={1}>
            <Typography level="h2" sx={{ letterSpacing: "-0.05em", fontSize: { xs: "2rem", md: "2.6rem" } }}>
              Publish a new post
            </Typography>
            <Typography level="body-md" textColor="neutral.400" sx={{ maxWidth: 620 }}>
              Add a title, an optional caption, and one image.
            </Typography>
          </Stack>

          <Stack spacing={1.25}>
            <Input
              placeholder="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              slotProps={{
                input: {
                  maxLength: 120
                }
              }}
              sx={{ borderRadius: "18px", minHeight: 48 }}
            />
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minRows={4}
              maxRows={8}
              slotProps={{
                textarea: {
                  maxLength: 1000
                }
              }}
              sx={{ borderRadius: "18px" }}
            />
            <Select
              value={categoryId}
              onChange={(_, nextValue) => setCategoryId(nextValue || "")}
              placeholder="Category"
              sx={{ borderRadius: "18px", minHeight: 48 }}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.label}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="Hashtags (example: art sunset city)"
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
                {selectedFile ? "Image selected" : "Drop your image here"}
              </Typography>
              <Typography level="body-sm" textColor="neutral.400">
                JPG, PNG, WEBP, GIF. Up to 10 MB.
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

          {selectedFile ? (
            <ImagePreviewCard
              file={selectedFile}
              previewUrl={previewUrl}
              onRemove={handleRemove}
              onChooseDifferent={handleOpenPicker}
            />
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
            <Button
              size="lg"
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || isUploading}
              sx={{
                borderRadius: "999px",
                px: 3
              }}
            >
              {isUploading ? <CircularProgress size="sm" color="neutral" /> : "Publish post"}
            </Button>
            {selectedFile ? (
              <Button variant="plain" color="neutral" onClick={handleRemove} sx={{ borderRadius: "999px" }}>
                Remove image
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Card>

      {errorMessage ? <Alert color="danger" variant="soft">{errorMessage}</Alert> : null}
      {successMessage ? <Alert color="success" variant="soft">{successMessage}</Alert> : null}
    </Stack>
  );
}
