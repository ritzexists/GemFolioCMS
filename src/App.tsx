import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Blog from '@/pages/Blog';
import Post from '@/pages/Post';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import Page from '@/pages/Page';
import { ThemeProvider } from '@/context/ThemeContext';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import { LoadingProvider } from '@/context/LoadingContext';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useLoading } from '@/context/LoadingContext';

function AppContent({ children }: { children: React.ReactNode }) {
  const { loading, setLoading } = useLoading();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location, setLoading]);

  return (
    <>
      {loading && <LoadingIndicator />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SiteConfigProvider>
        <LoadingProvider>
          <Router>
            <AppContent>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<Post />} />
                  <Route path="/profile" element={<Profile />} />
                  {import.meta.env.VITE_DISABLE_ADMIN !== 'true' && (
                    <Route path="/admin" element={<Admin />} />
                  )}
                  <Route path="/p/:slug" element={<Page />} />
                </Routes>
              </Layout>
            </AppContent>
          </Router>
        </LoadingProvider>
      </SiteConfigProvider>
    </ThemeProvider>
  );
}
