import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Blog from '@/pages/Blog';
import Post from '@/pages/Post';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import Page from '@/pages/Page';
import { ThemeProvider } from '@/context/ThemeContext';
import { SiteConfigProvider } from '@/context/SiteConfigContext';

export default function App() {
  return (
    <ThemeProvider>
      <SiteConfigProvider>
        <Router>
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
        </Router>
      </SiteConfigProvider>
    </ThemeProvider>
  );
}
