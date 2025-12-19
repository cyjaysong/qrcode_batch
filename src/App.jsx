import { useState, useCallback } from 'react'
import ExcelUploader from './components/ExcelUploader'
import LayoutEditor from './components/LayoutEditor'
import QRCodeSettings from './components/QRCodeSettings'
import Preview from './components/Preview'
import BatchExport from './components/BatchExport'

function App() {
  const [excelData, setExcelData] = useState(null)
  const [qrSettings, setQRSettings] = useState({
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 200,
    darkColor: '#000000',
    lightColor: '#ffffff',
    version: null
  })
  const [layoutElements, setLayoutElements] = useState([])
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 })
  const [currentRowIndex, setCurrentRowIndex] = useState(0)

  const handleExcelUpload = useCallback((data) => {
    setExcelData(data)
    setCurrentRowIndex(0)
  }, [])

  const handleAddElement = useCallback((type) => {
    const typeNames = { text: '文本', qrcode: '二维码', image: '图片' }
    const existingCount = layoutElements.filter(el => el.type === type).length
    const newElement = {
      id: Date.now(),
      type,
      name: `${typeNames[type]} ${existingCount + 1}`,
      x: 50,
      y: 50,
      width: type === 'qrcode' ? 150 : (type === 'image' ? 100 : 200),
      height: type === 'qrcode' ? 150 : (type === 'image' ? 100 : 40),
      content: type === 'text' ? '示例文本' : '',
      column: '',
      fontSize: 16,
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      imageUrl: ''
    }
    setLayoutElements(prev => [...prev, newElement])
  }, [layoutElements])

  const handleUpdateElement = useCallback((id, updates) => {
    setLayoutElements(prev =>
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }, [])

  const handleDeleteElement = useCallback((id) => {
    setLayoutElements(prev => prev.filter(el => el.id !== id))
  }, [])

  const handleReorderElements = useCallback((newElements) => {
    setLayoutElements(newElements)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">批量二维码生成工具</h1>
          <p className="text-gray-500 text-sm mt-1">从Excel导入数据，自定义布局，批量生成二维码</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ExcelUploader onUpload={handleExcelUpload} excelData={excelData} />
            
            {excelData && (
              <>
                <QRCodeSettings
                  settings={qrSettings}
                  onChange={setQRSettings}
                />
                
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">数据预览</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    共 {excelData.totalRows} 条数据
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentRowIndex(Math.max(0, currentRowIndex - 1))}
                      disabled={currentRowIndex === 0}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      上一条
                    </button>
                    <span className="text-sm">
                      {currentRowIndex + 1} / {excelData.totalRows}
                    </span>
                    <button
                      onClick={() => setCurrentRowIndex(Math.min(excelData.totalRows - 1, currentRowIndex + 1))}
                      disabled={currentRowIndex >= excelData.totalRows - 1}
                      className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                    >
                      下一条
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <LayoutEditor
              elements={layoutElements}
              canvasSize={canvasSize}
              onCanvasSizeChange={setCanvasSize}
              onAddElement={handleAddElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onReorderElements={handleReorderElements}
              excelData={excelData}
              currentRowIndex={currentRowIndex}
              qrSettings={qrSettings}
            />

            {excelData && layoutElements.length > 0 && (
              <>
                <Preview
                  elements={layoutElements}
                  canvasSize={canvasSize}
                  excelData={excelData}
                  currentRowIndex={currentRowIndex}
                  qrSettings={qrSettings}
                />
                
                <BatchExport
                  elements={layoutElements}
                  canvasSize={canvasSize}
                  excelData={excelData}
                  qrSettings={qrSettings}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
