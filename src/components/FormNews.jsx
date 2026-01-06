import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import { jwtDecode } from "jwt-decode";
import FormInput from "./FormInput";
import { config } from "../utils/ConfigUtils";

const FormNews = ({ createNews, newsItem, setEditing }) => {
  const backUrl = config.backUrl;
  
  const [title, setTitle] = useState(''); // Track title input
  const [content, setContent] = useState(''); // Track content input
  const { postData: postNews, error: errorNews, isLoading: loadNews } = usePost();
  const { updateData, error: errorUpdate, isLoading: loadUpdate } = useUpdate();
  const { token } = useContext(AuthContext);

  // Populate form fields when editing an existing news item
  useEffect(() => {
    if (newsItem) {
      setTitle(newsItem.titulo); // Set title to current news title
      setContent(newsItem.contenido); // Set content to current news content
    }
  }, [newsItem]);

  const handleSubmitNews = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    try {
      // Decode the JWT to get the user email
      const decoded = jwtDecode(token);
      const email = decoded.email;

      const dataToSend = {
        email: email,
        titulo: newsItem ? newsItem.titulo : title, // Use current title if editing
        nuevoTitulo: title, // Updated title
        contenido: content // Updated content
      };

      // Decide whether to update an existing news item or create a new one
      const res = await (newsItem 
        ? updateData(`${backUrl}/api/news/edit_news`, dataToSend)  // Edit existing news item
        : postNews(`${backUrl}/api/news/create_news`, dataToSend)); // Create new news item
            
      // If editing, close the form and update state
      if (newsItem) {
        setEditing(false);
      } else {
        // If creating, add the new news to the list
        createNews(res.news);
      }
        
      // Clear form fields after submit
      setTitle('');
      setContent('');
    } catch (error) {
      alert('Error: ' + error); // Display an error if the request fails
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmitNews}>
        <FormInput
          name="news-title"
          label="Titulo"
          value={title} // Bind title to input field
          onChange={(e) => setTitle(e.target.value)} // Update title on change
          type="text"
          required
        />
        <FormInput
          name="news-content"
          label="Contenido"
          value={content} // Bind content to input field
          onChange={(e) => setContent(e.target.value)} // Update content on change
          type="text"
          as="textarea"
          required
        />
        <button type="submit">
          {newsItem ? 'Actualizar' : 'Guardar'} Noticia
        </button>
      </form>
    </div>
  );
};

export default FormNews;
