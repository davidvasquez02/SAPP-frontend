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
      <div className="home__content">
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="home__empty">{emptyState}</div>
      </div>
    </main>
  )
}

export default HomeView
