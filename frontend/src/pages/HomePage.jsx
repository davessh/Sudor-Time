import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import EventCard from '../components/EventCard';
import EventSkeleton from '../components/EventSkeleton';

// Aquí importamos tu archivo real de la API. 
// Nota: Verifica que la función dentro de api/events.js se llame 'getEvents' o cámbiala al nombre correcto.
import { getEvents } from '../api/events'; 

export default function HomePage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        // Llamamos a tu base de datos
        const data = await getEvents(); 
        setEventos(data);
      } catch (error) {
        console.error("Error cargando los eventos:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Hero />
      
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">Próximos Eventos</h2>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            /* Muestra 3 tarjetas de esqueleto mientras carga tu API */
            [1, 2, 3].map((n) => <EventSkeleton key={n} />)
          ) : (
            /* Muestra los eventos reales una vez que la API responde */
            eventos?.map((evento) => (
              <EventCard key={evento.id} evento={evento} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}