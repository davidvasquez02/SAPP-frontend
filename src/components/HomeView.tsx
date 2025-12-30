interface HomeViewProps {
  title?: string
  description?: string
  emptyState?: string
}

const HomeView = ({
  title = 'Inicio',
  description = 'Esta pantalla quedará disponible para mostrar la información del backend.',
  emptyState = 'Sin datos por ahora.',
}: HomeViewProps) => {
  return (
    <main className="home">
      <aside className="home__sidebar">
        <div className="home__sidebar-header">
          <span className="home__sidebar-badge">Menú</span>
          <h2>Accesos rápidos</h2>
          <p>Los botones del sidebar se definirán en una siguiente iteración.</p>
        </div>
        <div className="home__sidebar-placeholder">
          Próximamente: accesos a módulos y trámites.
        </div>
      </aside>
      <div className="home__content">
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="home__empty">{emptyState}</div>
      </div>
    </main>
  )
}

export default HomeView
