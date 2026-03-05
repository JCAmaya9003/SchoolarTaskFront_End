/**
 * News Management Page
 *
 * Admin:   full CRUD, sees all articles.
 * Teacher: "My Articles" tab — create their own articles, edit/delete their own.
 *          "All News" tab — read-only view of all articles.
 * Others:  Read-only list of all articles, no form.
 */
import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import useFetch from "../hooks/UseFetch";
import Message from "../components/Message";
import FormNews from "../components/FormNews";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";
import useDelete from "../hooks/UseDelete";
import * as newsService from "../services/newsService";
import "../assets/News.css";

const News = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  const { toasts, showToast, dismissToast } = useToast();

  const [news, setNews] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Tab state — only meaningful for teachers; admins see full CRUD inline
  const [tab, setTab] = useState("all"); // "all" | "mine"

  const formCardRef = useRef(null);

  const handleEditNews = (item) => {
    // Switch to "mine" tab when editing own article from "all" view (teacher)
    if (isTeacher) setTab("mine");
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

  const fetchNews = useCallback(() => newsService.getAllNews(), []);
  const { data, error, isLoading, refetch } = useFetch(fetchNews);
  const { deleteData } = useDelete();

  const createNews = (newNews) => setNews((prev) => [...prev, newNews]);

  const handleDeleteNews = async (email, title) => {
    try {
      await deleteData(newsService.deleteNews, email, title);
      setNews((prev) => prev.filter((item) => item.title !== title));
      showToast("Article deleted", "success");
      refetch();
    } catch (err) {
      showToast("Error deleting article: " + err.message, "error");
    }
  };

  useEffect(() => {
    if (data) setNews(data);
  }, [data]);

  if (isLoading) return <div>Loading news…</div>;
  if (error) return <div>Error loading news: {error.message}</div>;

  // Articles visible in the current tab
  const visibleArticles =
    tab === "mine"
      ? news.filter((n) => n?.user?.email === user?.email)
      : news.filter((n) => n !== undefined);

  return (
    <div className="news-page">
      <Toast toasts={toasts} dismissToast={dismissToast} />

      {/* ── Tab bar (shown to teachers only) ── */}
      {isTeacher && (
        <div className="news-tabs">
          <button
            className={`news-tab ${tab === "all" ? "news-tab--active" : ""}`}
            onClick={() => {
              setTab("all");
              setEditingNews(null);
            }}
          >
            All News
          </button>
          <button
            className={`news-tab ${tab === "mine" ? "news-tab--active" : ""}`}
            onClick={() => setTab("mine")}
          >
            My Articles
          </button>
        </div>
      )}

      {/* ── Create / Edit form ── Admin always · Teacher only on "My Articles" tab ── */}
      {(isAdmin || (isTeacher && tab === "mine")) && (
        <div className="news-form-card" ref={formCardRef}>
          <h3 className="news-form-title">
            {editingNews ? "Edit Article" : "New Article"}
          </h3>
          <FormNews
            createNews={createNews}
            newsItem={editingNews}
            setEditing={setEditingNews}
            onSuccess={refetch}
            formCardRef={formCardRef}
            showToast={showToast}
          />
        </div>
      )}

      {/* ── Article grid ── */}
      <div className="news-grid">
        {visibleArticles.map((n) => (
          <Message
            key={n._id}
            message={n}
            onDelete={handleDeleteNews}
            setEditingNews={handleEditNews}
            onOpenDetail={setSelectedArticle}
            canEdit={isAdmin || n.user?.email === user?.email}
          />
        ))}
        {visibleArticles.length === 0 && (
          <p className="news-empty">
            {tab === "mine"
              ? "You haven't published any articles yet. Use the form above to create one."
              : "No articles published yet."}
          </p>
        )}
      </div>

      {/* ── Article detail modal ── */}
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
            {selectedArticle.image && (
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="news-detail-img"
              />
            )}
            <h2 className="news-detail-title">{selectedArticle.title}</h2>
            <p className="news-detail-content">{selectedArticle.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
