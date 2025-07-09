import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import BookRecommendationForm from '../components/BookRecommendationForm';
import BookSearch from '../components/BookSearch';
import recommendationApiService from '../services/recommendationApi';
import './MyBooks.css';

const MyBooks = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'add', 'edit', 'search'
  const [editingRecommendation, setEditingRecommendation] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load user's recommendations
  const loadRecommendations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await recommendationApiService.getMyRecommendations({
        page,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecommendations(data.recommendations);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await addReadBook(newBook);
      setNewBook({ title: '', author: '', rating: 5 });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add book:', error);
    }
  };

  const MyBooksContent = () => (
    <div className="my-books-page">
      <div className="page-header">
        <h1>My Books</h1>
        <button 
          onClick={() => setShowAddForm(true)}
          className="add-book-btn"
        >
          Add Book
        </button>
      </div>

      {showAddForm && (
        <div className="add-book-form">
          <h3>Add a Book You've Read</h3>
          <form onSubmit={handleAddBook}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Rating (1-5)</label>
              <select
                value={newBook.rating}
                onChange={(e) => setNewBook({...newBook, rating: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5].map(num => (
                  <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-buttons">
              <button type="submit">Add Book</button>
              <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="books-grid">
        {readBooks.length === 0 ? (
          <div className="empty-state">
            <p>You haven't added any books yet.</p>
            <button onClick={() => setShowAddForm(true)}>Add your first book</button>
          </div>
        ) : (
          readBooks.map((book, index) => (
            <div key={index} className="book-card">
              <h3>{book.title}</h3>
              <p>by {book.author}</p>
              <div className="rating">
                {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
              </div>
              <p className="date-read">
                Read on {new Date(book.dateRead).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>




    </div>
  );

  return (
    <ProtectedRoute>
      <MyBooksContent />
    </ProtectedRoute>
  );
};

export default MyBooks;
