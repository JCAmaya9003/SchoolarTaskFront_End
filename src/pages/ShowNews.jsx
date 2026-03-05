/**
 * ShowNews — Public news feed (read-only).
 * Renders a clean grid of news cards using ShowMessage.
 */
import { useEffect, useState, useCallback } from "react";
import useFetch from "../hooks/UseFetch.jsx";
import ShowMessage from "../components/ShowMessage";
import * as newsService from "../services/newsService";
import "../assets/ShowNews.css";

const ShowNewsPage = () => {
  const [news, setNews] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const fetchNews = useCallback(() => newsService.getAllNews(), []);
  const { data } = useFetch(fetchNews);

  useEffect(() => {
    if (data) setNews(data);
  }, [data]);

  return (
    <div>
      <div className="show-news-grid">
        {news
          .filter((item) => item !== undefined)
          .map((item) => (
            <ShowMessage
              key={item._id}
              message={item}
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
                {selectedArticle.date && (
                  <span>
                    {" "}
                    · {new Date(selectedArticle.date).toLocaleDateString()}
                  </span>
                )}
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

export default ShowNewsPage;
