/**
 * News Service
 *
 * Dual-mode news CRUD operations with English property names.
 * Supports both localStorage and backend API based on APP_CONFIG.USE_BACKEND
 */

import { APP_CONFIG, STORAGE_KEYS } from "../config/appConfig";
import * as storageService from "./storageService";

/**
 * Get all news articles
 *
 * @returns {Promise<Array>} Array of news articles
 */
export const getAllNews = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/news/get_all_news`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const news = storageService.getItem(STORAGE_KEYS.NEWS) || [];
    // Sort by date, newest first
    return news.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

/**
 * Create a new news article
 *
 * @param {Object} newsData - News data { email, title, content, image? }
 * @returns {Promise<Object>} Created news article
 */
export const createNews = async (newsData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/news/create_news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create news');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const news = storageService.getItem(STORAGE_KEYS.NEWS) || [];

    // Look up user across all role-specific storage lists
    // Admins are stored in USERS; teachers in TEACHERS; parents in PARENTS; students in STUDENTS
    const allUsers = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];

    const user =
      allUsers.find((u) => u.email === newsData.email) ||
      teachers.find((u) => u.email === newsData.email);

    // Determine effective role
    const effectiveRole =
      user?.role ||
      (teachers.some((t) => t.email === newsData.email) ? "teacher" : null);

    // Only admins and teachers can create news
    if (
      !effectiveRole ||
      (effectiveRole !== "admin" && effectiveRole !== "teacher")
    ) {
      throw new Error(
        "Permission denied: only admins and teachers can create news.",
      );
    }

    const newNews = {
      _id: String(Date.now()),
      title: newsData.title,
      content: newsData.content,
      email: newsData.email,
      image: newsData.image || null,
      date: new Date().toISOString(),
      user: {
        email: newsData.email,
        firstName: user?.firstName || "Unknown",
        lastName: user?.lastName || "User",
        role: effectiveRole,
      },
    };

    news.push(newNews);
    storageService.setItem(STORAGE_KEYS.NEWS, news);

    return { news: newNews };
  }
};

/**
 * Update an existing news article
 *
 * @param {string} title - Original title (identifier)
 * @param {Object} updatedData - Updated data { email, newTitle, content, image? }
 * @returns {Promise<Object>} Updated news article
 */
export const updateNews = async (title, updatedData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/news/edit_news`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: updatedData.email,
          title: title,
          newTitle: updatedData.newTitle,
          content: updatedData.content,
          image: updatedData.image
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update news');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating news:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const news = storageService.getItem(STORAGE_KEYS.NEWS) || [];
    const newsIndex = news.findIndex((n) => n.title === title);

    if (newsIndex === -1) {
      throw new Error("News article not found");
    }

    // Get user details if email changed
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    let userData = news[newsIndex].user; // Keep existing user data by default

    // If email is being updated, fetch new user data
    if (updatedData.email && updatedData.email !== news[newsIndex].email) {
      const user = users.find((u) => u.email === updatedData.email);
      userData = user
        ? {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : userData;
    }

    // Update the news article
    news[newsIndex] = {
      ...news[newsIndex],
      title: updatedData.newTitle || title,
      content: updatedData.content,
      image: updatedData.image || news[newsIndex].image,
      email: updatedData.email || news[newsIndex].email,
      user: userData, // Preserve user object
    };

    storageService.setItem(STORAGE_KEYS.NEWS, news);

    return { news: news[newsIndex] };
  }
};

/**
 * Delete a news article
 *
 * @param {string} email - User email (authorization check)
 * @param {string} title - News title (identifier)
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteNews = async (email, title) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/news/delete_news`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, title }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete news');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting news:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const news = storageService.getItem(STORAGE_KEYS.NEWS) || [];
    const filteredNews = news.filter((n) => n.title !== title);

    if (filteredNews.length === news.length) {
      throw new Error("News article not found");
    }

    storageService.setItem(STORAGE_KEYS.NEWS, filteredNews);

    return { message: "News deleted successfully" };
  }
};

/**
 * Get a single news article by ID
 *
 * @param {string} id - News ID
 * @returns {Promise<Object|null>} News article or null
 */
export const getNewsById = async (id) => {
  const allNews = await getAllNews();
  return allNews.find((n) => n._id === id) || null;
};
