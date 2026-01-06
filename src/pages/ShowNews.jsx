import React, { useEffect, useState } from "react";
import { config } from "../utils/ConfigUtils.js";
import useFetch from "../hooks/UseFetch.jsx";
import ShowMessage from "../components/ShowMessage";
import '../assets/ShowNews.css';

const backUrl = config.backUrl;

const News = () => {
  const [news, setNews] = useState([]);
  const { data } = useFetch(`${backUrl}/api/news/get_all_news`);

  useEffect(() => {
    if (data) {
      console.log("Fetched data:", data);
      setNews(data);
    }
  }, [data]);

  return (
    <div className="news-container">
      <div className="news-content">
        <div className="scroll-wrapper">
          <div className="news-grid">
            {news.filter(newsItem => newsItem !== undefined).map((newsItem) => (
              <div className="news-item" key={newsItem._id}>
                <ShowMessage message={newsItem} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
