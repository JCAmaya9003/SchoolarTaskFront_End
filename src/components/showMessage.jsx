/**
 * ShowMessage — Single news card (read-only, public view).
 * Clickable to open full-screen article detail.
 */
import "../assets/News.css";

const ShowMessage = ({ message, onOpenDetail }) => {
  return (
    <div
      className="news-card news-card-clickable"
      onClick={() => onOpenDetail && onOpenDetail(message)}
      title="Click to read full article"
      style={{ cursor: "pointer" }}
    >
      <div className="news-card-body">
        <h3 className="news-card-title">{message.title}</h3>
        <p className="news-card-content">{message.content}</p>
        <p className="news-card-author">
          By {message.user?.firstName} {message.user?.lastName}
          {message.date && (
            <span> · {new Date(message.date).toLocaleDateString()}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ShowMessage;
