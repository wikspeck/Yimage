import { useState } from "react";
import { Button, Modal, ModalClose, ModalDialog, Option, Select, Stack, Textarea, Typography, Input } from "@mui/joy";
import { createReport } from "../api/yimageApi";
import TurnstileWidget from "./TurnstileWidget";

const REPORT_OPTIONS = [
  "spam",
  "harassment",
  "illegal content",
  "sexual content",
  "violence",
  "hate speech",
  "copyright violation",
  "other"
];

export default function ReportDialog({ open, onClose, targetType, targetId, title = "Report content", onSubmitted, onFeedback }) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [copyrightDescription, setCopyrightDescription] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createReport({
        targetType,
        targetId,
        reason,
        details,
        turnstileToken,
        claimantName,
        claimantEmail,
        copyrightDescription
      });
      onFeedback?.(result.message || "Report submitted.", "success");
      onSubmitted?.(result);
      setTimeout(() => {
        onClose?.();
        setDetails("");
        setClaimantName("");
        setClaimantEmail("");
        setCopyrightDescription("");
      }, 150);
    } catch (submitError) {
      onFeedback?.(submitError.message || "Could not submit report.", "danger");
    } finally {
      setIsSubmitting(false);
      setTurnstileResetKey((current) => current + 1);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ minWidth: { xs: "90vw", sm: 460 }, borderRadius: "20px", bgcolor: "#050505" }}>
        <ModalClose />
        <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
          <Typography level="title-lg">{title}</Typography>
          <Select value={reason} onChange={(_, value) => setReason(value || "spam")} sx={{ borderRadius: "14px" }}>
            {REPORT_OPTIONS.map((option) => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
          <Textarea
            minRows={3}
            maxRows={6}
            placeholder="Extra details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            sx={{ borderRadius: "14px" }}
          />
          {reason === "copyright violation" ? (
            <>
              <Input placeholder="Your name" value={claimantName} onChange={(event) => setClaimantName(event.target.value)} sx={{ borderRadius: "14px" }} />
              <Input placeholder="Your email" value={claimantEmail} onChange={(event) => setClaimantEmail(event.target.value)} sx={{ borderRadius: "14px" }} />
              <Textarea
                minRows={3}
                placeholder="Describe the copyrighted work and your claim"
                value={copyrightDescription}
                onChange={(event) => setCopyrightDescription(event.target.value)}
                sx={{ borderRadius: "14px" }}
              />
            </>
          ) : null}
          <TurnstileWidget onTokenChange={setTurnstileToken} resetKey={turnstileResetKey} />
          <Button type="submit" loading={isSubmitting} disabled={!turnstileToken} className="app-primary-button" sx={{ borderRadius: "14px" }}>
            Submit report
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
