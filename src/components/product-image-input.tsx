"use client";

import { useState } from "react";

const imageMaxSizeBytes = 2 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function ProductImageInput({ disabled }: { disabled: boolean }) {
  const [error, setError] = useState("");

  return (
    <label className="field">
      <span>Upload de imagem</span>
      <input
        accept={allowedImageTypes.join(",")}
        className="input"
        disabled={disabled}
        name="imageFile"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (!file) {
            setError("");
            event.currentTarget.setCustomValidity("");
            return;
          }

          if (!allowedImageTypes.includes(file.type)) {
            const message = "Envie uma imagem JPG, PNG ou WebP.";
            setError(message);
            event.currentTarget.setCustomValidity(message);
            return;
          }

          if (file.size > imageMaxSizeBytes) {
            const message = "A imagem deve ter no maximo 2 MB.";
            setError(message);
            event.currentTarget.setCustomValidity(message);
            return;
          }

          setError("");
          event.currentTarget.setCustomValidity("");
        }}
        type="file"
      />
      <small className="field-hint">JPG, PNG ou WebP ate 2 MB.</small>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
