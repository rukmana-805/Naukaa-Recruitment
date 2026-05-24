import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';
import { userService } from './services/user.service';
import './index.css';

const App = () => {
  const { isAuthenticated, updateUser, logout } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      const syncProfile = async () => {
        try {
          const res = await userService.getProfile();
          updateUser(res.data.data);
        } catch (err) {
          if (err.response?.status === 401) {
            logout();
          }
        }
      };
      syncProfile();
    }
  }, [isAuthenticated, updateUser, logout]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#fff',
            color: '#111827',
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.12)',
            border: '1px solid #f3f4f6',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
