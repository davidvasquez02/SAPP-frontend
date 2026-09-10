import { createElement, forwardRef } from 'react'

const createLucideIcon = (displayName, nodes) => {
  const Icon = forwardRef(({ color = 'currentColor', size = 24, strokeWidth = 2, ...props }, ref) =>
    createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...props,
      },
      nodes.map(([tag, attributes]) => createElement(tag, attributes)),
    ),
  )
  Icon.displayName = displayName
  return Icon
}

export const GraduationCap = createLucideIcon('GraduationCap', [
  ['path', { d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0z', key: '1' }],
  ['path', { d: 'M22 10v6', key: '2' }],
  ['path', { d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5', key: '3' }],
])

export const UsersRound = createLucideIcon('UsersRound', [
  ['path', { d: 'M18 21a8 8 0 0 0-16 0', key: '1' }],
  ['circle', { cx: '10', cy: '8', r: '5', key: '2' }],
  ['path', { d: 'M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3', key: '3' }],
])

export const ScrollText = createLucideIcon('ScrollText', [
  ['path', { d: 'M15 12h-5', key: '1' }],
  ['path', { d: 'M15 8h-5', key: '2' }],
  ['path', { d: 'M19 17V5a2 2 0 0 0-2-2H4', key: '3' }],
  ['path', { d: 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3', key: '4' }],
])

export const CalendarDays = createLucideIcon('CalendarDays', [
  ['path', { d: 'M8 2v4', key: '1' }],
  ['path', { d: 'M16 2v4', key: '2' }],
  ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2', key: '3' }],
  ['path', { d: 'M3 10h18', key: '4' }],
  ['path', { d: 'M8 14h.01', key: '5' }],
  ['path', { d: 'M12 14h.01', key: '6' }],
  ['path', { d: 'M16 14h.01', key: '7' }],
  ['path', { d: 'M8 18h.01', key: '8' }],
  ['path', { d: 'M12 18h.01', key: '9' }],
])

export const LogOut = createLucideIcon('LogOut', [
  ['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', key: '1' }],
  ['polyline', { points: '16 17 21 12 16 7', key: '2' }],
  ['line', { x1: '21', x2: '9', y1: '12', y2: '12', key: '3' }],
])
