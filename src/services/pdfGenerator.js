/**
 * pdfGenerator.js
 * Module pur (0 dépendance React, 0 Supabase).
 * Génère un PDF contenant tous les badges d'une retraite.
 *
 * Dépendances : pdf-lib, qrcode
 *
 * Disposition supportées :
 *   - 'single'  : 1 badge par page A6 (148×105 mm)
 *   - 'grid2x2' : 4 badges par page A4 (210×297 mm)
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'

// ─── Constantes dimensionnelles (en points PDF, 1 mm ≈ 2.834 pt) ─────────────
const MM = 2.834
const A6 = { w: 148 * MM, h: 105 * MM }   // paysage
const A4 = { w: 210 * MM, h: 297 * MM }   // portrait

// Couleurs (valeurs 0-1)
const VIOLET = rgb(0.38, 0.1, 0.5)
const GOLD   = rgb(0.95, 0.75, 0.2)
const WHITE  = rgb(1, 1, 1)
const DARK   = rgb(0.08, 0.04, 0.12)

/**
 * Génère un QR code en PNG (base64 ArrayBuffer) pour une URL donnée.
 * @param {string} url
 * @returns {Promise<Uint8Array>}
 */
async function makeQRCodeBytes(url) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 140,
    margin: 1,
    color: { dark: '#1a0a2e', light: '#ffffff' }
  })
  const base64 = dataUrl.split(',')[1]
  const raw    = atob(base64)
  const bytes  = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/**
 * Dessine un seul badge dans un PDFPage.
 * @param {object} opts
 * @param {import('pdf-lib').PDFPage} opts.page
 * @param {import('pdf-lib').PDFFont}  opts.fontBold
 * @param {import('pdf-lib').PDFFont}  opts.fontReg
 * @param {object}  opts.member        - { nom, prenom, role, carrefour }
 * @param {number}  opts.x  - coin inférieur gauche du badge (en points)
 * @param {number}  opts.y
 * @param {number}  opts.W  - largeur du badge
 * @param {number}  opts.H  - hauteur du badge
 * @param {Uint8Array|null} opts.qrBytes    - PNG bytes du QR code
 * @param {Uint8Array|null} opts.bgBytes    - PNG/JPEG bytes du fond
 * @param {boolean} opts.bgIsJpeg
 * @param {import('pdf-lib').PDFDocument} opts.doc
 */
async function drawBadge({ page, fontBold, fontReg, member, x, y, W, H, qrBytes, bgBytes, bgIsJpeg, doc }) {
  // Fond plein sombre par défaut
  page.drawRectangle({ x, y, width: W, height: H, color: DARK })

  // Image de fond (affiche retraite), si disponible
  if (bgBytes) {
    try {
      const bgImg = bgIsJpeg ? await doc.embedJpg(bgBytes) : await doc.embedPng(bgBytes)
      // Etirer en couvrant tout le badge
      page.drawImage(bgImg, { x, y, width: W, height: H, opacity: 0.55 })
    } catch {
      // Ignorer si l'image est corrompue
    }
  }

  // Bande violette en haut du badge (titre)
  const BAND_H = H * 0.28
  page.drawRectangle({
    x, y: y + H - BAND_H, width: W, height: BAND_H,
    color: rgb(0.24, 0.04, 0.36), opacity: 0.88
  })

  // Ligne dorée sous la bande
  page.drawLine({
    start: { x, y: y + H - BAND_H },
    end:   { x: x + W, y: y + H - BAND_H },
    thickness: 1.5, color: GOLD
  })

  // ── Texte : groupe "MIJERCA Cénacle" ───────────────────────────────
  const GROUP_LABEL = 'MIJERCA Cénacle'
  const groupFontSize = Math.min(W * 0.07, 10)
  const groupLabelW = fontBold.widthOfTextAtSize(GROUP_LABEL, groupFontSize)
  page.drawText(GROUP_LABEL, {
    x: x + (W - groupLabelW) / 2,
    y: y + H - BAND_H * 0.38,
    size: groupFontSize, font: fontBold, color: GOLD
  })

  // ── Texte : Nom Prénom ─────────────────────────────────────────────
  const fullName    = `${member.prenom} ${member.nom}`.toUpperCase()
  const nameFontSize = Math.min(W * 0.085, 12)
  const nameW       = fontBold.widthOfTextAtSize(fullName, nameFontSize)
  const nameX       = x + (W - nameW) / 2
  const nameY       = y + H - BAND_H - nameFontSize * 2.1

  // Ombre légère
  page.drawText(fullName, { x: nameX + 0.5, y: nameY - 0.5, size: nameFontSize, font: fontBold, color: DARK, opacity: 0.4 })
  page.drawText(fullName, { x: nameX, y: nameY, size: nameFontSize, font: fontBold, color: WHITE })

  // ── Texte : Rôle ───────────────────────────────────────────────────
  const roleFontSize = Math.min(W * 0.065, 9)
  const roleW = fontReg.widthOfTextAtSize(member.role, roleFontSize)
  page.drawText(member.role, {
    x: x + (W - roleW) / 2,
    y: nameY - roleFontSize * 1.6,
    size: roleFontSize, font: fontReg, color: rgb(0.85, 0.75, 1)
  })

  // ── Texte : Carrefour (si applicable) ─────────────────────────────
  if (member.carrefour) {
    const cfFontSize = Math.min(W * 0.06, 8.5)
    const cfLabel    = `📍 ${member.carrefour}`
    const cfW        = fontReg.widthOfTextAtSize(cfLabel, cfFontSize)
    page.drawText(cfLabel, {
      x: x + (W - cfW) / 2,
      y: nameY - roleFontSize * 1.6 - cfFontSize * 2,
      size: cfFontSize, font: fontReg, color: GOLD
    })
  }

  // ── QR Code ────────────────────────────────────────────────────────
  if (qrBytes) {
    try {
      const qrImg  = await doc.embedPng(qrBytes)
      const QR_SZ  = Math.min(W * 0.28, H * 0.4)
      const QR_X   = x + W - QR_SZ - W * 0.04
      const QR_Y   = y + H * 0.04

      // Fond blanc derrière le QR
      page.drawRectangle({ x: QR_X - 3, y: QR_Y - 3, width: QR_SZ + 6, height: QR_SZ + 6, color: WHITE })
      page.drawImage(qrImg, { x: QR_X, y: QR_Y, width: QR_SZ, height: QR_SZ })
    } catch {
      // Ignorer
    }
  }

  // Bordure externe du badge
  page.drawRectangle({ x, y, width: W, height: H, borderColor: GOLD, borderWidth: 1, opacity: 0 })
}

/**
 * Point d'entrée principal.
 * @param {object} opts
 * @param {Array} opts.members         - Liste de { id, nom, prenom, role, carrefour? }
 * @param {string} opts.layout         - 'single' | 'grid2x2'
 * @param {string} opts.appBaseUrl     - Base URL de l'app pour QR codes
 * @param {string|null} opts.bgImageUrl  - URL publique de l'image de fond (Supabase Storage)
 * @param {Function} opts.onProgress   - Callback (current: number, total: number)
 * @returns {Promise<Uint8Array>}       - Bytes du PDF généré
 */
export async function generateBadgesPDF({ members, layout = 'single', appBaseUrl, bgImageUrl, onProgress }) {
  const doc = await PDFDocument.create()
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontReg  = await doc.embedFont(StandardFonts.Helvetica)

  // Charger l'image de fond une seule fois (si URL disponible)
  let bgBytes   = null
  let bgIsJpeg  = false
  if (bgImageUrl) {
    try {
      const resp = await fetch(bgImageUrl)
      const contentType = resp.headers.get('content-type') || ''
      bgIsJpeg = contentType.includes('jpeg') || contentType.includes('jpg') || bgImageUrl.toLowerCase().includes('.jpg')
      bgBytes  = new Uint8Array(await resp.arrayBuffer())
    } catch {
      // Fond indisponible : on continue sans
    }
  }

  const total = members.length

  if (layout === 'grid2x2') {
    // ── 4 badges par page A4 ─────────────────────────────────────────
    const PAD    = 12 * MM
    const GAP    = 6 * MM
    const COLS   = 2
    const ROWS   = 2
    const CELL_W = (A4.w - PAD * 2 - GAP * (COLS - 1)) / COLS
    const CELL_H = (A4.h - PAD * 2 - GAP * (ROWS - 1)) / ROWS

    for (let pageIdx = 0; pageIdx < Math.ceil(total / 4); pageIdx++) {
      const page = doc.addPage([A4.w, A4.h])
      page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: rgb(0.06, 0.03, 0.1) })

      for (let slot = 0; slot < 4; slot++) {
        const memberIdx = pageIdx * 4 + slot
        if (memberIdx >= total) break

        const member = members[memberIdx]
        const col    = slot % COLS
        const row    = Math.floor(slot / COLS)
        const bx     = PAD + col * (CELL_W + GAP)
        // Y en PDF = bas → haut. La ligne 0 (row=0) est en HAUT de la page
        const by     = A4.h - PAD - (row + 1) * CELL_H - row * GAP

        let qrBytes = null
        try {
          qrBytes = await makeQRCodeBytes(`${appBaseUrl}/presence/${member.id}`)
        } catch { /* ignorer */ }

        await drawBadge({ page, fontBold, fontReg, member, x: bx, y: by, W: CELL_W, H: CELL_H, qrBytes, bgBytes, bgIsJpeg, doc })

        onProgress?.(memberIdx + 1, total)
      }
    }

  } else {
    // ── 1 badge par page A6 (paysage) ────────────────────────────────
    for (let i = 0; i < total; i++) {
      const member = members[i]
      const page   = doc.addPage([A6.w, A6.h])
      page.drawRectangle({ x: 0, y: 0, width: A6.w, height: A6.h, color: rgb(0.06, 0.03, 0.1) })

      let qrBytes = null
      try {
        qrBytes = await makeQRCodeBytes(`${appBaseUrl}/presence/${member.id}`)
      } catch { /* ignorer */ }

      await drawBadge({ page, fontBold, fontReg, member, x: 0, y: 0, W: A6.w, H: A6.h, qrBytes, bgBytes, bgIsJpeg, doc })
      onProgress?.(i + 1, total)
    }
  }

  return doc.save()
}
