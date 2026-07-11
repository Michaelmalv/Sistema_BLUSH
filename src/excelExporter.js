import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx-js-style'

const LOGO_BASE64 = "﻿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"

function convertColor(sjsColor) {
  if (!sjsColor) return undefined
  const rgb = sjsColor.rgb || sjsColor
  if (typeof rgb === 'string') {
    return { argb: rgb.length === 6 ? 'FF' + rgb : rgb }
  }
  return undefined
}

export async function exportExcelJS(wb, filename, logoCellInfo = null) {
  const workbook = new ExcelJS.Workbook()
  
  for (const sheetName of wb.SheetNames) {
    const sjsSheet = wb.Sheets[sheetName]
    const worksheet = workbook.addWorksheet(sheetName)
    
    // Parse bounds
    const range = XLSX.utils.decode_range(sjsSheet['!ref'])
    
    // Set columns widths
    if (sjsSheet['!cols']) {
      worksheet.columns = sjsSheet['!cols'].map(col => ({
        width: col.wch || 10
      }))
    }
    
    // Set rows heights
    if (sjsSheet['!rows']) {
      sjsSheet['!rows'].forEach((rowConfig, rIdx) => {
        if (rowConfig && rowConfig.hpt) {
          const row = worksheet.getRow(rIdx + 1)
          row.height = rowConfig.hpt
        }
      })
    }
    
    // Copy cells and apply translated styles
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c })
        const sjsCell = sjsSheet[cellRef]
        
        if (sjsCell) {
          const exceljsCell = worksheet.getCell(r + 1, c + 1)
          
          if (sjsCell.f) {
            exceljsCell.value = { formula: sjsCell.f }
          } else {
            exceljsCell.value = sjsCell.v
          }
          
          // Translate styles
          if (sjsCell.s) {
            const s = sjsCell.s
            const style = {}
            
            if (s.font) {
              style.font = {
                name: s.font.name || 'Segoe UI',
                size: s.font.size,
                bold: s.font.bold,
                italic: s.font.italic,
                underline: s.font.underline,
                color: convertColor(s.font.color)
              }
            }
            
            if (s.fill) {
              style.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: convertColor(s.fill.fgColor || s.fill.bgColor)
              }
            }
            
            if (s.alignment) {
              style.alignment = { ...s.alignment }
            }
            
            if (s.border) {
              style.border = {}
              const borders = ['top', 'bottom', 'left', 'right']
              borders.forEach(b => {
                if (s.border[b]) {
                  style.border[b] = {
                    style: s.border[b].style || 'thin',
                    color: convertColor(s.border[b].color)
                  }
                }
              })
            }
            
            exceljsCell.style = style
          }
        }
      }
    }
    
    // Apply merges
    if (sjsSheet['!merges']) {
      sjsSheet['!merges'].forEach(merge => {
        worksheet.mergeCells(
          merge.s.r + 1,
          merge.s.c + 1,
          merge.e.r + 1,
          merge.e.c + 1
        )
      })
    }
    
    // Add logo image if configured
    if (logoCellInfo && logoCellInfo.sheetName === sheetName) {
      const imageId = workbook.addImage({
        base64: LOGO_BASE64,
        extension: 'png'
      })
      
      // Calculate centering offset inside the merged region
      // Fila 0 (Row 0) has height 45 (approx 60 pixels). Image size is 50x50.
      // So top offset is 5 pixels.
      worksheet.addImage(imageId, {
        tl: { col: logoCellInfo.col + 0.5, row: logoCellInfo.row + 0.1 },
        ext: { width: 50, height: 50 },
        editAs: 'oneCell'
      })
    }
  }
  
  // Write and trigger download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
