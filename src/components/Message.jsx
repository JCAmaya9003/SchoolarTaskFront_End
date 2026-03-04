/**
 * Message — News article card (Admin view).
 * canEdit prop: true=admin (shows Edit/Delete), false=teacher (create-only).
 * Clickable body opens full-screen detail.
 */
import "../assets/News.css";

const Message = ({
  message,
  onDelete,
  setEditingNews,
  onOpenDetail,
  canEdit,
}) => {
  return (
    <div className="news-card">
      {message.image && (
        <img
          src={message.image}
          alt={message.title}
          className="news-card-img"
        />
      )}
      <div
        className="news-card-body news-card-clickable"
        onClick={() => onOpenDetail?.(message)}
        title="Click to read full article"
      >
        <h3 className="news-card-title">{message.title}</h3>
        <p className="news-card-content">{message.content}</p>
        <p className="news-card-author">
          By {message.user?.firstName} {message.user?.lastName}
        </p>
      </div>
      {canEdit && (
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
      )}
    </div>
  );
};

export default Message;
