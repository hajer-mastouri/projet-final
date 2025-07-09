import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  return (
    <div onClick={handleBackdropClick}>
      {mode === 'login' ? (
        <LoginForm 
          onSwitchToRegister={switchToRegister}
          onClose={onClose}
        />
      ) : (
        <RegisterForm 
          onSwitchToLogin={switchToLogin}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default AuthModal;
