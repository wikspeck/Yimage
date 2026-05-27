import { Button, Modal, ModalClose, Sheet, Stack, Typography } from "@mui/joy";

export default function PostFocusDialog({ open, onClose, post, images, activeImageIndex, onPrevious, onNext, onShare, onCopyLink, onOpenPost }) {
  const activeImage = images[activeImageIndex];

  return (
    <Modal open={open} onClose={onClose} className="focus-modal">
      <Sheet variant="outlined" className="focus-dialog">
        <Stack spacing={1.5} sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack spacing={0.25}>
              <Typography level="title-md">{post.title || "Yimage post"}</Typography>
              <Typography level="body-sm" textColor="neutral.500">@{post.authorUsername}</Typography>
            </Stack>
            <ModalClose className="focus-dialog-close" />
          </Stack>

          <div className="focus-dialog-media-shell">
            {images.length > 1 ? (
              <>
                <button type="button" className="post-carousel-arrow is-left focus-arrow" onClick={onPrevious} aria-label="Previous image">
                  {"<"}
                </button>
                <button type="button" className="post-carousel-arrow is-right focus-arrow" onClick={onNext} aria-label="Next image">
                  {">"}
                </button>
              </>
            ) : null}
            {activeImage ? (
              <img
                key={activeImage.url}
                src={activeImage.url}
                alt={post.title || `${post.authorUsername} post`}
                className="focus-dialog-image"
              />
            ) : null}
            {images.length > 1 ? (
              <div className="post-carousel-dots" aria-hidden="true">
                {images.map((image, index) => (
                  <span key={image.key || image.url || index} className={`post-carousel-dot${index === activeImageIndex ? " is-active" : ""}`} />
                ))}
              </div>
            ) : null}
          </div>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap" className="focus-dialog-actions">
            <Button size="lg" variant="soft" color="neutral" onClick={onShare} sx={{ borderRadius: "999px" }}>
              Share
            </Button>
            <Button size="lg" variant="plain" color="neutral" onClick={onCopyLink} sx={{ borderRadius: "999px" }}>
              Copy link
            </Button>
            <Button size="lg" variant="plain" color="neutral" onClick={onOpenPost} sx={{ borderRadius: "999px" }}>
              Open post
            </Button>
          </Stack>
        </Stack>
      </Sheet>
    </Modal>
  );
}
