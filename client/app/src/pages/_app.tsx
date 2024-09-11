import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;