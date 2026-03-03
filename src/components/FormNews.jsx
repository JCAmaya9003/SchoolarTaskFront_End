/**
 * Form News Component
 *
 * Form for creating and editing news articles.
 * - Scroll-to-form on edit
 * - Textarea fixed height, 10,000 char limit, consistent font
 * - Char counter displayed below textarea
 * - Cancel button when editing
 */

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import FormInput from "./FormInput";
import * as newsService from "../services/newsService";

/* PRESERVED FOR FUTURE USE:
import { jwtDecode } from "jwt-decode";
import { config } from "../utils/ConfigUtils";
*/

const MAX_CONTENT = 10000;

const FormNews = ({
  createNews,
  newsItem,
  setEditing,
  onSuccess,
  formCardRef,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { postData: postNews, isLoading: loadNews } = usePost();
  const { updateData, isLoading: loadUpdate } = useUpdate();
  const { user } = useContext(AuthContext);

  // Populate form fields when editing an existing news item
  useEffect(() => {
    if (newsItem) {
      setTitle(newsItem.title);
      setContent(newsItem.content ?? "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [newsItem]);

  const handleCancel = () => {
    setEditing(null);
    setTitle("");
    setContent("");
  };

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    try {
      const email = user?.email;
      if (!email) {
        alert("User not authenticated");
        return;
      }

      const res = newsItem
        ? await updateData(newsService.updateNews, newsItem.title, {
            email,
            newTitle: title,
            content,
          })
        : await postNews(newsService.createNews, { email, title, content });

      if (newsItem) {
        setEditing(null);
      } else {
        createNews(res.news);
      }

      setTitle("");
      setContent("");
      if (onSuccess) onSuccess();
      alert(
        newsItem ? "News updated successfully" : "News created successfully",
      );
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const charsLeft = MAX_CONTENT - content.length;
  const charsWarn = charsLeft < 500;

  return (
    <div ref={formCardRef}>
      <form onSubmit={handleSubmitNews}>
        <FormInput
          name="news-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          type="text"
          required
        />

        {/* Textarea: fixed height, char limit, consistent font */}
        <div>
          <label htmlFor="news-content">Content</label>
          <textarea
            id="news-content"
            name="news-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_CONTENT}
            required
            style={{
              height: 160,
              resize: "none",
              fontFamily: "inherit",
            }}
          />
          <p
            style={{
              fontSize: 11,
              color: charsWarn ? "#DC2626" : "#94A3B8",
              textAlign: "right",
              margin: "3px 0 0",
            }}
          >
            {charsLeft.toLocaleString()} / {MAX_CONTENT.toLocaleString()}{" "}
            characters remaining
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loadNews || loadUpdate}>
            {newsItem ? "Update" : "Save"} News
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
