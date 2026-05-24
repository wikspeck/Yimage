import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CircularProgress, Sheet, Stack, Typography } from "@mui/joy";
import ImagePreviewCard from "./ImagePreviewCard";
import { uploadImage } from "../api/yimageApi";
import { validateImageFile } from "../utils/validateImageFile";

export default function UploadBox() {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
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

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Choose an image before uploading.");
      return;
    }

    setIsUploading(true);
    resetMessages();

    try {
      const response = await uploadImage(selectedFile);
      setSuccessMessage(response.message);
    } catch {
      setErrorMessage("The upload simulation failed. Try again.");
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
          borderRadius: "32px",
          borderColor: isDragging ? "primary.400" : "rgba(255,255,255,0.08)",
          bgcolor: isDragging ? "rgba(122, 162, 255, 0.08)" : "rgba(18, 20, 28, 0.94)",
          transition: "all 0.2s ease"
        }}
      >
        <Stack spacing={2.5}>
          <Stack spacing={1}>
            <Typography level="h2" sx={{ letterSpacing: "-0.05em", fontSize: { xs: "2rem", md: "2.6rem" } }}>
              Share an image in one calm step
            </Typography>
            <Typography level="body-md" textColor="neutral.400" sx={{ maxWidth: 620 }}>
              Drag in a file or choose one manually. The frontend is ready now, and the backend upload path will connect
              to Cloudflare Pages Functions and R2 later.
            </Typography>
          </Stack>

          <Sheet
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleOpenPicker}
            variant="soft"
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: "28px",
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
                  borderRadius: "18px",
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
              disabled={!selectedFile || isUploading}
              sx={{
                borderRadius: "999px",
                px: 3
              }}
            >
              {isUploading ? <CircularProgress size="sm" color="neutral" /> : "Upload"}
            </Button>
            {selectedFile ? (
              <Button variant="plain" color="neutral" onClick={handleRemove} sx={{ borderRadius: "999px" }}>
                Reset selection
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
