import JSZip from 'jszip'
import type { FotoItem } from './album-api'

function safeName(nome: string) {
  return (
    nome
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'album'
  )
}

export async function downloadAlbumZip(
  nomeCasamento: string,
  fotos: FotoItem[],
) {
  if (fotos.length === 0) {
    throw new Error('Não há fotos para baixar.')
  }

  const zip = new JSZip()
  const folder = zip.folder(safeName(nomeCasamento)) ?? zip

  await Promise.all(
    fotos.map(async (foto, index) => {
      if (!foto.url) return
      const res = await fetch(foto.url)
      if (!res.ok) throw new Error('Falha ao baixar uma das fotos.')
      const blob = await res.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const n = String(index + 1).padStart(3, '0')
      folder.file(`foto-${n}.${ext}`, blob)
    }),
  )

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName(nomeCasamento)}-album.zip`
  a.click()
  URL.revokeObjectURL(url)
}
