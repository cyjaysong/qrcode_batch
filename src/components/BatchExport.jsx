import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

function BatchExport({ elements, canvasSize, excelData, qrSettings }) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [filenameColumn, setFilenameColumn] = useState('')

  const getElementContent = (element, rowIndex) => {
    if (!element.column || !excelData) {
      return element.content || ''
    }
    const colIndex = excelData.headers.indexOf(element.column)
    if (colIndex === -1) return element.content || ''
    return excelData.rows[rowIndex]?.[colIndex] || ''
  }

  const generateQRDataUrl = async (content, width) => {
    const options = {
      errorCorrectionLevel: qrSettings.errorCorrectionLevel,
      margin: qrSettings.margin,
      width: width,
      color: {
        dark: qrSettings.darkColor,
        light: qrSettings.lightColor
      }
    }
    if (qrSettings.version) {
      options.version = qrSettings.version
    }
    return await QRCode.toDataURL(String(content), options)
  }

  const waitForImageLoad = (img) => {
    return new Promise((resolve, reject) => {
      if (img.complete && img.naturalHeight !== 0) {
        resolve()
      } else {
        img.onload = resolve
        img.onerror = reject
      }
    })
  }

  const renderSingleImage = async (rowIndex) => {
    // 使用 Canvas API 直接绘制，避免 html-to-image 的问题
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize.width * 2  // 2x for better quality
    canvas.height = canvasSize.height * 2
    const ctx = canvas.getContext('2d')
    
    // 设置缩放
    ctx.scale(2, 2)
    
    // 填充白色背景
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    // 按顺序绘制元素
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const content = getElementContent(element, rowIndex)

      if (element.type === 'text') {
        ctx.save()
        ctx.font = `${element.fontWeight} ${element.fontSize}px sans-serif`
        ctx.fillStyle = element.fontColor
        ctx.textBaseline = 'middle'
        
        let textX = element.x + 4
        if (element.textAlign === 'center') {
          ctx.textAlign = 'center'
          textX = element.x + element.width / 2
        } else if (element.textAlign === 'right') {
          ctx.textAlign = 'right'
          textX = element.x + element.width - 4
        } else {
          ctx.textAlign = 'left'
        }
        
        const textY = element.y + element.height / 2
        ctx.fillText(content, textX, textY)
        ctx.restore()
      } else if (element.type === 'qrcode' && content) {
        const qrDataUrl = await generateQRDataUrl(content, element.width)
        const img = new window.Image()
        img.src = qrDataUrl
        await waitForImageLoad(img)
        ctx.drawImage(img, element.x, element.y, element.width, element.height)
      } else if (element.type === 'image' && element.imageUrl) {
        try {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          img.src = element.imageUrl
          await waitForImageLoad(img)
          ctx.drawImage(img, element.x, element.y, element.width, element.height)
        } catch (e) {
          console.warn('图片加载失败:', e)
        }
      }
    }

    return canvas.toDataURL('image/png')
  }

  const handleExport = async () => {
    if (elements.length === 0) {
      alert('请先添加元素')
      return
    }

    setExporting(true)
    setProgress(0)

    try {
      const zip = new JSZip()
      const total = excelData.totalRows

      for (let i = 0; i < total; i++) {
        const dataUrl = await renderSingleImage(i)
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
        
        let filename
        if (filenameColumn) {
          const colIndex = excelData.headers.indexOf(filenameColumn)
          filename = colIndex !== -1 ? String(excelData.rows[i][colIndex]) : `qrcode_${i + 1}`
        } else {
          filename = `qrcode_${i + 1}`
        }
        
        zip.file(`${filename}.png`, base64Data, { base64: true })
        setProgress(Math.round(((i + 1) / total) * 100))
      }

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'qrcodes.zip')
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败: ' + error.message)
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Download className="w-4 h-4" />
        4. 批量导出
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">文件名列 (可选)</label>
          <select
            value={filenameColumn}
            onChange={(e) => setFilenameColumn(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">使用序号命名</option>
            {excelData.headers.map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || elements.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                导出中 {progress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                批量导出全部 ({excelData.totalRows} 张)
              </>
            )}
          </button>
        </div>

        {exporting && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchExport
