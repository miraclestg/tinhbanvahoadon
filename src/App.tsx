import { useEffect, useState } from 'react';
import { AppFooter } from '@/components/AppFooter';
import { TripList } from '@/components/TripList';
import { TripView } from '@/components/TripView';

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  // #/t/<id>            → xem
  // #/t/<id>/<editKey>  → chỉnh sửa
  const m = hash.match(/^#\/t\/([\w-]+)(?:\/([\w-]+))?/);
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1">
        {m ? <TripView key={m[1]} id={m[1]} editKey={m[2]} /> : <TripList />}
      </div>
      <AppFooter />
    </div>
  );
}
