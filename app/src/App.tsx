import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { RootState } from './store';

// Макеты
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Страницы
import Dashboard from './pages/Dashboard';
import PageEditor from './pages/PageEditor';
import DatabaseView from './pages/DatabaseView';
import AnalyticsView from './pages/AnalyticsView';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

// Компоненты
import PrivateRoute from './components/PrivateRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Маршруты аутентификации */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>

            {/* Защищенные маршруты */}
            <Route
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/pages/:pageId" element={<PageEditor />} />
              <Route path="/databases/:databaseId" element={<DatabaseView />} />
              <Route path="/analytics/:dashboardId" element={<AnalyticsView />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Обработка 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
