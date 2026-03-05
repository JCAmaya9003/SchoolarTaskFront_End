/**
 * FormNews — Create/edit news articles.
 * Features:
 * - 10,000 char limit with live counter
 * - Image attachment (2 MB / 1920×1080 max, base64)
 * - Cancel button when editing
 * - Toast notifications instead of alert()
 */
import { useState, useContext, useEffect, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import useFormErrors from "../hooks/useFormErrors";
import FieldError from "./FieldError";
import FormInput from "./FormInput";
import * as newsService from "../services/newsService";

const MAX_CONTENT = 10000;
const MAX_IMG_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_IMG_W = 1920;
const MAX_IMG_H = 1080;

// ── Validation ──────────────────────────────────────────────────
const validateNews = ({ title, content }) => {
  const errs = {};
  if (!title.trim()) {
    errs.title = "Title is required.";
  } else if (title.trim().length < 3) {
    errs.title = "Title must be at least 3 characters.";
  } else if (title.trim().length > 120) {
    errs.title = "Title must be 120 characters or fewer.";
  }
  if (!content.trim()) {
    errs.content = "Content is required.";
  } else if (content.trim().length < 10) {
    errs.content = "Content must be at least 10 characters.";
  }
  return errs;
};

/* Returns a rejected promise with a friendly message string */
const validateImage = (file) =>
  new Promise((resolve, reject) => {
    if (file.size > MAX_IMG_BYTES) {
      return reject(
        `Image too large (max 2 MB). Yours: ${(file.size / 1024 / 1024).toFixed(1)} MB`,
      );
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > MAX_IMG_W || img.height > MAX_IMG_H) {
        return reject(
          `Resolution too high (max 1920×1080). Yours: ${img.width}×${img.height}`,
        );
      }
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject("Could not read image file");
    };
    img.src = url;
  });

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject("Failed to convert image");
    reader.readAsDataURL(file);
  });

const FormNews = ({
  createNews,
  newsItem,
  setEditing,
  onSuccess,
  formCardRef,
  showToast,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [imgError, setImgError] = useState("");

  const { postData: postNews, isLoading: loadNews } = usePost();
  const { updateData, isLoading: loadUpdate } = useUpdate();
  const { user } = useContext(AuthContext);

  // ── Submit logic (runs only when validation passes) ───────────
  const doSubmit = useCallback(
    async ({ title, content }) => {
      const email = user?.email;
      if (!email) {
        showToast?.("User not authenticated", "error");
        return;
      }
      const res = newsItem
        ? await updateData(newsService.updateNews, newsItem.title, {
            email,
            newTitle: title,
            content,
            image: imageDataUrl,
          })
        : await postNews(newsService.createNews, {
            email,
            title,
            content,
            image: imageDataUrl,
          });
      if (newsItem) {
        setEditing(null);
      } else {
        createNews(res.news);
      }
      setTitle("");
      setContent("");
      setImageDataUrl(null);
      clearErrors();
      if (onSuccess) onSuccess();
      showToast?.(
        newsItem ? "Article updated!" : "Article published!",
        "success",
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      newsItem,
      imageDataUrl,
      postNews,
      updateData,
      createNews,
      setEditing,
      onSuccess,
      showToast,
    ],
  );

  const { errors, trySubmit, clearFieldError, clearErrors } = useFormErrors(
    validateNews,
    async (data) => {
      try {
        await doSubmit(data);
      } catch (error) {
        showToast?.("Error: " + error.message, "error");
      }
    },
  );

  useEffect(() => {
    if (newsItem) {
      setTitle(newsItem.title);
      setContent(newsItem.content ?? "");
      setImageDataUrl(newsItem.image ?? null);
    } else {
      setTitle("");
      setContent("");
      setImageDataUrl(null);
    }
    setImgError("");
  }, [newsItem]);

  const handleCancel = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setImageDataUrl(null);
    clearErrors();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError("");
    try {
      await validateImage(file);
      const b64 = await toBase64(file);
      setImageDataUrl(b64);
    } catch (msg) {
      setImgError(msg);
      e.target.value = "";
    }
  };

  const charsLeft = MAX_CONTENT - content.length;

  return (
    <div ref={formCardRef}>
      <form onSubmit={(e) => trySubmit(e, { title, content })} noValidate>
        <div className={errors.title ? "field-has-error" : ""}>
          <FormInput
            name="news-title"
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearFieldError("title");
            }}
            type="text"
          />
          <FieldError message={errors.title} />
        </div>

        {/* Textarea with char limit */}
        <div className={errors.content ? "field-has-error" : ""}>
          <label htmlFor="news-content">Content</label>
          <textarea
            id="news-content"
            name="news-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              clearFieldError("content");
            }}
            maxLength={MAX_CONTENT}
            style={{ height: 160, resize: "none", fontFamily: "inherit" }}
          />
          <p
            className={`fn-char-counter${charsLeft < 500 ? " fn-char-counter--warn" : ""}`}
          >
            {charsLeft.toLocaleString()} / {MAX_CONTENT.toLocaleString()}{" "}
            characters remaining
          </p>

          <FieldError message={errors.content} />
        </div>

        <div className="fn-image-field">
          <label htmlFor="news-image" className="fn-image-label">
            Image{" "}
            <span className="fn-image-hint">
              optional · max 2 MB · 1920×1080
            </span>
          </label>
          {/* Native file input is visually hidden; the styled button below triggers it */}
          <input
            id="news-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="fn-file-input"
          />
          <label htmlFor="news-image" className="btn btn-secondary fn-file-btn">
            Choose image
          </label>
          {imgError && <p className="fn-img-error">{imgError}</p>}
          {imageDataUrl && (
            <div className="fn-preview-wrap">
              <img
                src={imageDataUrl}
                alt="Preview"
                className="news-img-preview"
              />
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                className="fn-preview-remove"
                title="Remove image"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="fn-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loadNews || loadUpdate}
          >
            {newsItem ? "Update" : "Save"} Article
          </button>
          {newsItem && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormNews;
