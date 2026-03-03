/**
 * Message Component — News Article Card (Admin view)
 * Now clickable to open full-screen article detail.
 */
import "../assets/News.css";

const Message = ({ message, onDelete, setEditingNews, onOpenDetail }) => {
  return (
    <div className="news-card">
      <div
        className="news-card-body news-card-clickable"
        onClick={() => onOpenDetail && onOpenDetail(message)}
        title="Click to read full article"
      >
        <h3 className="news-card-title">{message.title}</h3>
        <p className="news-card-content">{message.content}</p>
        <p className="news-card-author">
          By {message.user?.firstName} {message.user?.lastName}
        </p>
      </div>
      <div className="news-card-actions">
        <button
          className="btn btn-info btn-sm"
          onClick={() => setEditingNews(message)}
        >
          Edit
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(message.user?.email, message.title)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default Message;
