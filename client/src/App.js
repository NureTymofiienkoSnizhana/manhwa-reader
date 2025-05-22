import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from './context/ThemeContext';

// Import pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MyLibrary from './pages/library/MyLibrary';
import Categories from './pages/categories/Categories';
import CategoryDetails from './pages/categories/CategoryDetails';
import ManhwaDetails from './pages/manhwa/ManhwaDetails';
import ChapterReader from './pages/manhwa/ChapterReader';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLevelTasks from './pages/admin/AdminLevelTasks';
import NotFound from './pages/error/NotFound';
import Unauthorized from './pages/error/Unauthorized';
import SearchResults from './pages/search/SearchResults';

// Import components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Import i18n
import './i18n/i18n';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

// Simple notification context until notistack is installed
const NotificationContext = React.createContext({
  showSuccess: (message) => console.log('Success:', message),
  showError: (message) => console.error('Error:', message),
  showInfo: (message) => console.info('Info:', message),
  showWarning: (message) => console.warn('Warning:', message),
});

export const useNotification = () => React.useContext(NotificationContext);

const NotificationProvider = ({ children }) => {
  const value = {
    showSuccess: (message) => console.log('Success:', message),
    showError: (message) => console.error('Error:', message),
    showInfo: (message) => console.info('Info:', message),
    showWarning: (message) => console.warn('Warning:', message),
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <NotificationProvider>
          <ThemeProvider>
            <AuthProvider>
              <LanguageProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="browse" element={<Browse />} />
                    <Route path="manhwa/:manhwaId" element={<ManhwaDetails />} />
                    <Route path="read/:chapterId" element={<ChapterReader />} />
                    <Route path="search" element={<SearchResults />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="unauthorized" element={<Unauthorized />} />
                    
                    {/* Protected routes for all authenticated users */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="my-library" element={<MyLibrary />} />
                      <Route path="categories" element={<Categories />} />
                      <Route path="categories/:categoryId" element={<CategoryDetails />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    
                    {/* Admin routes */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                      <Route path="admin" element={<AdminDashboard />} />
                      <Route path="admin/users" element={<AdminUsers />} />
                      <Route path="admin/level-tasks" element={<AdminLevelTasks />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </LanguageProvider>
            </AuthProvider>
          </ThemeProvider>
        </NotificationProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;