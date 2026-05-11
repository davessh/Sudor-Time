export default function EventSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/50 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl animate-pulse">
      
      {/* Placeholder de la Imagen del Evento */}
      <div className="h-52 w-full rounded-2xl bg-slate-200/60" />

      <div className="mt-6 flex flex-col px-2 pb-2">
        {/* Placeholder de la Fecha o Etiqueta */}
        <div className="mb-4 h-3 w-24 rounded-full bg-slate-200/80" />

        {/* Placeholder del Título (Dos líneas simuladas) */}
        <div className="mb-2 h-7 w-4/5 rounded-full bg-slate-200/80" />
        <div className="mb-6 h-7 w-1/2 rounded-full bg-slate-200/80" />

        {/* Placeholder de Detalles (Ubicación, etc.) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-slate-200/80" />
            <div className="h-3 w-full rounded-full bg-slate-200/80" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full bg-slate-200/80" />
            <div className="h-3 w-2/3 rounded-full bg-slate-200/80" />
          </div>
        </div>

        {/* Placeholder del Botón */}
        <div className="mt-8 h-12 w-full rounded-xl bg-slate-200/60" />
      </div>
    </div>
  )
}