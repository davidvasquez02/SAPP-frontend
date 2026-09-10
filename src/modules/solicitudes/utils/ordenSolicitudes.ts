interface SolicitudOrdenable {
  id: number
  fechaRegistro: string | null
}

const parseDateToEpoch = (value: string | null) => {
  if (!value) {
    return 0
  }

  const epoch = Date.parse(value)
  return Number.isNaN(epoch) ? 0 : epoch
}

export const compareSolicitudesDesc = (left: SolicitudOrdenable, right: SolicitudOrdenable) => {
  const dateDifference = parseDateToEpoch(right.fechaRegistro) - parseDateToEpoch(left.fechaRegistro)

  return dateDifference || right.id - left.id
}

export const sortSolicitudesDesc = <T extends SolicitudOrdenable>(solicitudes: T[]) =>
  [...solicitudes].sort(compareSolicitudesDesc)
