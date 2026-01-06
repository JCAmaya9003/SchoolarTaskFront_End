import React, { useState, useEffect } from "react";
import { config } from "../utils/ConfigUtils";
import useFetch from "../hooks/UseFetch";
import Message from "../components/Message";
import FormNews from "../components/FormNews";
import useDelete from "../hooks/UseDelete";
import '../assets/News.css'; // Import the News.css file



const News = () => {
  const [news, setNews] = useState([]);
  const [editingNews, setEditingNews] = useState(null); // Track the news being edited
  const { data, error, isLoading } = useFetch(`${config.backUrl}/api/news/get_all_news`);
  const { deleteData } = useDelete();

  const createNews = (newNews) => {
    setNews([...news, newNews]);
  };

  const handleDeleteNews = async (email, titulo) => {
    try {
      await deleteData(`${config.backUrl}/api/news/delete_news`, { email, titulo });
      setNews(news.filter(item => item.titulo !== titulo));
      alert('Noticia eliminada con éxito');
    } catch (error) {
      alert('Error al eliminar la noticia: ' + error.message);
    }
  };

  useEffect(() => {
    if (data) {
      console.log("Fetched data:", data);
      setNews(data);
    }
  }, [data]);

  return (
    <div className="news-container">
      {/* Editing section */}
      <div className="news-editing">
        <h3>{editingNews ? "Editar Noticia" : "Crear Noticia"}</h3>
        <FormNews 
          createNews={createNews} 
          newsItem={editingNews} 
          setEditing={setEditingNews}
        />
      </div>

      {/* Display news items */}
      <div className="news-items">
        {news.filter(newsItem => newsItem !== undefined).map((newsItem) => (
          <Message 
            key={newsItem._id} 
            message={newsItem} 
            onDelete={handleDeleteNews} 
            setEditingNews={setEditingNews} // Pass setEditingNews to Message component
          />
        ))}
      </div>
    </div>
  );
};

export default News;
