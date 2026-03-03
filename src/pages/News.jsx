/**
 * News Management Page
 *
 * Allows creating, editing, and deleting news articles.
 * Updated to use newsService with dual-mode support and English properties.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import useFetch from "../hooks/UseFetch";
import Message from "../components/Message";
import FormNews from "../components/FormNews";
import useDelete from "../hooks/UseDelete";
import * as newsService from "../services/newsService";
import "../assets/News.css";

/* PRESERVED FOR FUTURE USE:
import { config } from "../utils/ConfigUtils";
*/

const News = () => {
  const [news, setNews] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const formCardRef = useRef(null);

  const handleEditNews = (item) => {
    setEditingNews(item);
    setTimeout(
      () =>
        formCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  // Memoize the service function to prevent infinite loops
  const fetchNews = useCallback(() => newsService.getAllNews(), []);

  // Fetch all news using the service
  const { data, error, isLoading, refetch } = useFetch(fetchNews);
  const { deleteData } = useDelete();

  const createNews = (newNews) => {
    setNews([...news, newNews]);
  };

  const handleDeleteNews = async (email, title) => {
    try {
      await deleteData(newsService.deleteNews, email, title);
      setNews(news.filter((item) => item.title !== title));
      alert("News deleted successfully");
      refetch(); // Refresh the news list
    } catch (error) {
      alert("Error deleting news: " + error.message);
    }
  };

  useEffect(() => {
    if (data) {
      console.log("Fetched news data:", data);
      setNews(data);
    }
  }, [data]);

  if (isLoading) return <div>Loading news...</div>;
  if (error) return <div>Error loading news: {error.message}</div>;

  return (
    <div className="news-page">
      {/* Left: Create/Edit form */}
      <div className="news-form-card">
        <h3 className="news-form-title">
          {editingNews ? "Edit Article" : "New Article"}
        </h3>
        <FormNews
          createNews={createNews}
          newsItem={editingNews}
          setEditing={setEditingNews}
          onSuccess={refetch}
          formCardRef={formCardRef}
        />
      </div>

      {/* Right: Article list */}
      <div className="news-grid">
        {news
          .filter((n) => n !== undefined)
          .map((n) => (
            <Message
              key={n._id}
              message={n}
              onDelete={handleDeleteNews}
              setEditingNews={handleEditNews}
              onOpenDetail={setSelectedArticle}
            />
          ))}
      </div>

      {/* ── Article detail modal ─────────────────────────────── */}
      {selectedArticle && (
        <div
          className="news-detail-backdrop"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="news-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="news-detail-header">
              <button
                className="news-detail-back"
                onClick={() => setSelectedArticle(null)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Back
              </button>
              <p className="news-detail-byline">
                By {selectedArticle.user?.firstName}{" "}
                {selectedArticle.user?.lastName}
              </p>
            </div>
            <h2 className="news-detail-title">{selectedArticle.title}</h2>
            <p className="news-detail-content">{selectedArticle.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
