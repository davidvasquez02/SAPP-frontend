import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { DocumentoTramiteItemDto } from '../src/modules/documentos/api/types.ts'
import {
  tieneDocumentosObligatoriosCargados,
  tieneDocumentosObligatoriosRevisados,
} from '../src/modules/matricula/utils/documentosMatricula.ts'

const studentPageSource = readFileSync('src/pages/Matricula/MatriculaPage.tsx', 'utf8')
const coordinatorPageSource = readFileSync(
  'src/pages/MatriculaDetalleCoordinacion/MatriculaDetalleCoordinacionPage.tsx',
  'utf8',
)
const matriculaServiceSource = readFileSync(
  'src/modules/matricula/services/matriculaAcademicaService.ts',
  'utf8',
)

const documento = (
  id: number,
  obligatorio: boolean,
  estado: string | null,
  cargado = true,
): DocumentoTramiteItemDto => ({
  codigoTipoDocumentoTramite: `DOC-${id}`,
  descripcionTipoDocumentoTramite: `Documento ${id}`,
  documentoCargado: cargado,
  documentoUploadedResponse: cargado
    ? {
        idDocumento: id,
        nombreArchivoDocumento: `documento-${id}.pdf`,
        versionDocumento: 1,
        fechaCargaDocumento: '2026-09-28T10:00:00-05:00',
        estadoDocumento: estado,
      }
    : null,
  idTipoDocumentoTramite: id,
  nombreTipoDocumentoTramite: `Documento ${id}`,
  obligatorioTipoDocumentoTramite: obligatorio,
  tipoTramite: 'MATRICULA',
})

test('el estudiante notifica solo después de una respuesta de carga obligatoria y el checklist completo', () => {
  assert.match(studentPageSource, /for \(const documento of documentosConCambios\)/)
  assert.match(studentPageSource, /const uploaded = await uploadDocument\(/)
  assert.match(studentPageSource, /!uploaded \|\| !Number\.isFinite\(uploaded\.id\)/)
  assert.match(studentPageSource, /cargaObligatoriaConfirmadaPorRespuesta = true/)
  assert.match(studentPageSource, /const documentosActualizados = await getDocumentosMatriculaAcademica\(/)
  assert.match(studentPageSource, /tieneDocumentosObligatoriosCargados\(documentosActualizados\)/)
  assert.match(studentPageSource, /await notificarDocumentosCompletosMatricula\(/)
  assert.ok(
    studentPageSource.indexOf('const uploaded = await uploadDocument(') <
      studentPageSource.indexOf('const documentosActualizados = await getDocumentosMatriculaAcademica('),
  )
  assert.ok(
    studentPageSource.indexOf('const documentosActualizados = await getDocumentosMatriculaAcademica(') <
      studentPageSource.indexOf('await notificarDocumentosCompletosMatricula('),
  )
  assert.match(
    matriculaServiceSource,
    /`\/sapp\/matriculaAcademica\/\$\{matriculaId\}\/notificarDocumentosCompletos`/,
  )
  assert.doesNotMatch(studentPageSource, /finalizarRevisionDocumentosMatricula/)
})

test('la carga completa exige todos los obligatorios y permite opcionales ausentes', () => {
  assert.equal(
    tieneDocumentosObligatoriosCargados([
      documento(1, true, 'RECHAZADO'),
      documento(2, true, null),
      documento(3, false, null, false),
    ]),
    true,
  )
  assert.equal(
    tieneDocumentosObligatoriosCargados([
      documento(1, true, 'APROBADO'),
      documento(2, true, null, false),
    ]),
    false,
  )
})

test('coordinación notifica cuando todos los obligatorios fueron aprobados o rechazados', () => {
  assert.equal(
    tieneDocumentosObligatoriosRevisados([
      documento(1, true, 'APROBADO'),
      documento(2, true, 'RECHAZADO'),
      documento(3, false, null, false),
    ]),
    true,
  )
  assert.equal(
    tieneDocumentosObligatoriosRevisados([
      documento(1, true, 'APROBADO'),
      documento(2, true, 'EN_REVISION'),
    ]),
    false,
  )

  assert.match(coordinatorPageSource, /const updatedDocuments = await refreshDocumentsAfterDecision/)
  assert.match(coordinatorPageSource, /await finalizeCompletedRequiredReview\(updatedDocuments\)/)
  assert.match(coordinatorPageSource, /await finalizarRevisionDocumentosMatricula\(matricula\.id\)/)
  assert.doesNotMatch(coordinatorPageSource, /notificarDocumentosCompletosMatricula/)
  assert.match(
    matriculaServiceSource,
    /`\/sapp\/matriculaAcademica\/\$\{matriculaId\}\/finalizarRevisionDocumentos`/,
  )
  assert.match(coordinatorPageSource, /busyDocumentoId !== null/)
  assert.ok(
    coordinatorPageSource.indexOf('await aprobarRechazarDocumento({') <
      coordinatorPageSource.indexOf('const updatedDocuments = await refreshDocumentsAfterDecision'),
  )
  assert.ok(
    coordinatorPageSource.indexOf('const updatedDocuments = await refreshDocumentsAfterDecision') <
      coordinatorPageSource.indexOf('await finalizeCompletedRequiredReview(updatedDocuments)'),
  )
})
