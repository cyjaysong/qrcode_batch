import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import QRCode from 'qrcode'

function Preview({ elements, canvasSize, excelData, currentRowIndex, qrSettings }) {
  const [qrCodes, setQrCodes] = useState({})

  const getElementContent = (element) => {
    if (!element.column || !excelData) {
      return element.content || ''
    }
    const colIndex = excelData.headers.indexOf(element.column)
    if (colIndex === -1) return element.content || ''
    return excelData.rows[currentRowIndex]?.[colIndex] || ''
  }

  useEffect(() => {
    const generateQRCodes = async () => {
      const newQrCodes = {}
      for (const element of elements) {
        if (element.type === 'qrcode') {
          const content = getElementContent(element)
          if (content) {
            try {
              const options = {
                errorCorrectionLevel: qrSettings.errorCorrectionLevel,
                margin: qrSettings.margin,
                width: element.width,
                color: {
                  dark: qrSettings.darkColor,
                  light: qrSettings.lightColor
                }
              }
              if (qrSettings.version) {
                options.version = qrSettings.version
              }
              newQrCodes[element.id] = await QRCode.toDataURL(String(content), options)
            } catch (err) {
              console.error('QR生成失败:', err)
            }
          }
        }
      }
      setQrCodes(newQrCodes)
    }
    generateQRCodes()
  }, [elements, excelData, currentRowIndex, qrSettings])

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Eye className="w-4 h-4" />
        3. 预览 (第 {currentRowIndex + 1} 条数据)
      </h3>

      <div className="border rounded-lg overflow-auto bg-gray-50 p-4">
        <div
          className="relative bg-white mx-auto"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        >
          {elements.map((element) => {
            const content = getElementContent(element)
            
            return (
              <div
                key={element.id}
                style={{
                  position: 'absolute',
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height
                }}
              >
                {element.type === 'text' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      fontSize: element.fontSize,
                      color: element.fontColor,
                      fontWeight: element.fontWeight,
                      textAlign: element.textAlign,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: element.textAlign === 'center' ? 'center' : 
                                     element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      padding: '4px'
                    }}
                  >
                    {content}
                  </div>
                )}

                {element.type === 'qrcode' && qrCodes[element.id] && (
                  <img 
                    src={qrCodes[element.id]} 
                    alt="QR Code" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}

                {element.type === 'image' && element.imageUrl && (
                  <img 
                    src={element.imageUrl} 
                    alt="Image" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Preview
