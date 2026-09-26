import { Navigate, useParams } from 'react-router-dom'
import { getMatriculaAcademicaDetallePath } from '../../modules/matricula/utils/matriculaPresentation'

const LegacyMatriculaDetailRedirect = () => {
  const { matriculaId } = useParams()

  return (
    <Navigate
      to={matriculaId ? getMatriculaAcademicaDetallePath(matriculaId) : '/matricula/academica'}
      replace
    />
  )
}

export default LegacyMatriculaDetailRedirect
