import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('userInfo');
      return null;
    }
  });
  const loading = false;

  const login = (userData) => {
    // 🔐 Store both user data and tokens
    const userToStore = {
      _id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatar: userData.avatar,
      bio: userData.bio || '',
      work: userData.work || '',
      location: userData.location || '',
      website: userData.website || '',
      interests: userData.interests || [],
      interestsCompleted: userData.interestsCompleted || false,
      isVerified: userData.isVerified,
    };
    
    setUser(userToStore);
    localStorage.setItem('userInfo', JSON.stringify(userToStore));
    
    // Store tokens separately
    if (userData.accessToken) {
      localStorage.setItem('accessToken', userData.accessToken);
    }
    if (userData.refreshToken) {
      localStorage.setItem('refreshToken', userData.refreshToken);
    }
  };

  const logout = () => {
    // 🔐 Clear all auth data
    setUser(null);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
