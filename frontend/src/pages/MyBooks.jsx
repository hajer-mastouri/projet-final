import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const MyBooks = () => {
  const { user, addReadBook } = useAuth();
  const [readBooks, setReadBooks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    rating: 5
  });

  useEffect(() => {
    if (user?.readBooks) {
      setReadBooks(user.readBooks);
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

      <style jsx>{`
        .my-books-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          color: #1f2937;
          font-size: 2rem;
        }

        .add-book-btn {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .add-book-btn:hover {
          background-color: #2563eb;
        }

        .add-book-form {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .add-book-form h3 {
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-buttons {
          display: flex;
          gap: 1rem;
        }

        .form-buttons button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .form-buttons button[type="submit"] {
          background-color: #10b981;
          color: white;
        }

        .form-buttons button[type="button"] {
          background-color: #6b7280;
          color: white;
        }

        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .book-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .book-card h3 {
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .book-card p {
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .rating {
          color: #fbbf24;
          font-size: 1.2rem;
          margin: 0.5rem 0;
        }

        .date-read {
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-state button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );

  return (
    <ProtectedRoute>
      <MyBooksContent />
    </ProtectedRoute>
  );
};

export default MyBooks;
