import { AuthProvider } from '@/lib/auth-context';
import { useRoute } from '@/lib/router';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { AnimeDetailPage } from '@/pages/AnimeDetailPage';
import { AuthPage } from '@/pages/AuthPage';
import { ProfilePage } from '@/pages/ProfilePage';

function AppContent() {
  const route = useRoute();

  let page: React.ReactNode;
  switch (route.name) {
    case 'home': page = <HomePage />; break;
    case 'catalog': page = <CatalogPage />; break;
    case 'anime': page = <AnimeDetailPage animeId={route.id} />; break;
    case 'login': page = <AuthPage mode="login" />; break;
    case 'signup': page = <AuthPage mode="signup" />; break;
    case 'profile': page = <ProfilePage />; break;
    default: page = <HomePage />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
