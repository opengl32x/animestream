import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'catalog' }
  | { name: 'anime'; id: number }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'profile' };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) return { name: 'home' };
  const parts = clean.split('/');
  if (parts[0] === 'catalog') return { name: 'catalog' };
  if (parts[0] === 'anime' && parts[1]) return { name: 'anime', id: parseInt(parts[1], 10) };
  if (parts[0] === 'login') return { name: 'login' };
  if (parts[0] === 'signup') return { name: 'signup' };
  if (parts[0] === 'profile') return { name: 'profile' };
  return { name: 'home' };
}

export function navigate(route: Route) {
  let hash = '#/';
  switch (route.name) {
    case 'home': hash = '#/'; break;
    case 'catalog': hash = '#/catalog'; break;
    case 'anime': hash = `#/anime/${route.id}`; break;
    case 'login': hash = '#/login'; break;
    case 'signup': hash = '#/signup'; break;
    case 'profile': hash = '#/profile'; break;
  }
  window.location.hash = hash;
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handler = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return route;
}
