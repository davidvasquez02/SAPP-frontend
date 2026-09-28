import { CalendarDays, GraduationCap, ScrollText, UsersRound } from 'lucide-react'

interface SidebarModuleIconProps {
  modulePath: string
  className?: string
}

const iconPaths: Record<string, React.ReactNode> = {
  '/creditos-condonables': (
    <>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M2 10h20M6 15h2" />
      <path d="M17 2v3M14.5 3.5h5" />
    </>
  ),
  '/solicitudes': (
    <>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </>
  ),
  '/trabajos-grado': (
    <>
      <path d="M2 5.5A3.5 3.5 0 0 1 5.5 2H11v18H5.5A3.5 3.5 0 0 0 2 23.5z" />
      <path d="M22 5.5A3.5 3.5 0 0 0 18.5 2H13v18h5.5a3.5 3.5 0 0 1 3.5 3.5z" />
      <path d="m15.5 9 1.5 1.5 3-3" />
    </>
  ),
  '/admisiones': (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="10" cy="13" r="2" />
      <path d="M6 20a4 4 0 0 1 8 0" />
    </>
  ),
  '/coordinacion/reportes': (
    <>
      <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6A2 2 0 0 1 18.46 20H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
    </>
  ),
  '/coordinacion/profesores': (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
}

const lucideIcons = {
  '/matricula': GraduationCap,
  '/coordinacion/estudiantes': UsersRound,
  '/actas': ScrollText,
  '/fechas': CalendarDays,
} as const

export const SidebarModuleIcon = ({
  modulePath,
  className = 'sidebar__module-icon',
}: SidebarModuleIconProps) => {
  const paths = iconPaths[modulePath]

  if (!paths) {
    const ModuleIcon = lucideIcons[modulePath as keyof typeof lucideIcons]

    return ModuleIcon ? <ModuleIcon className={className} /> : null
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
    >
      {paths}
    </svg>
  )
}
