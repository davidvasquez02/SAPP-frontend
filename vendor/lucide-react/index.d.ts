import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'

export type LucideProps = SVGProps<SVGSVGElement> & {
  size?: string | number
  strokeWidth?: string | number
}

export type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>

export const GraduationCap: LucideIcon
export const UsersRound: LucideIcon
export const ScrollText: LucideIcon
export const CalendarDays: LucideIcon
export const LogOut: LucideIcon
