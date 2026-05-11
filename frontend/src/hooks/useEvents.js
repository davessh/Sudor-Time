// hooks/useEvents.js
import { useState, useEffect } from 'react';
import { getEvents } from '../api/events';

const DEFAULT_IMAGES = [
  '/eventos/1.png',
  '/eventos/logo-medio-maraton.png',
  '/eventos/2.png',
];

export function useEvents() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setStatus('loading');
      try {
        const events = await getEvents();
        // Adaptador de datos: Transformamos la respuesta de la API a lo que el UI necesita
        const adapted = events.map((ev, i) => ({
          ...ev,
          imagen: ev.imagen || DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]
        }));
        
        if (isMounted) {
          setData(adapted);
          setStatus('success');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setStatus('error');
        }
      }
    }

    fetchData();
    return () => { isMounted = false; }; // Cleanup para evitar fugas de memoria
  }, []);

  return { data, status, error, isLoading: status === 'loading' };
}