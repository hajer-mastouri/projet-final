import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      // Set token in API headers
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await API.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        // Token is invalid
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await API.post('/auth/login', credentials);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await API.put('/auth/profile', profileData);

      if (response.data.success) {
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const addReadBook = async (bookData) => {
    try {
      const response = await API.post('/auth/books/read', bookData);

      if (response.data.success) {
        // Update user's read books in context
        setUser(prev => ({
          ...prev,
          readBooks: response.data.readBooks
        }));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to add book');
      }
    } catch (error) {
      console.error('Add book error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    addReadBook,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
