import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload } from 'lucide-react'

function ExcelUploader({ onUpload, excelData }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('请上传Excel文件 (.xlsx 或 .xls)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const headers = data[0] || []
      const rows = data.slice(1).filter(row => row.length > 0)

      onUpload({
        headers,
        rows,
        totalRows: rows.length
      })
    } catch (err) {
      setError('解析Excel文件失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-700 mb-3">1. 上传Excel文件</h3>
      
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {loading ? (
          <div className="text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            正在解析...
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">点击或拖拽上传Excel文件</p>
            <p className="text-gray-400 text-sm mt-1">支持 .xlsx, .xls 格式</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 text-red-500 text-sm">{error}</div>
      )}

      {excelData && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="text-green-700 font-medium">文件已加载</div>
          <div className="text-green-600 text-sm mt-1">
            共 {excelData.headers.length} 列, {excelData.totalRows} 行数据
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {excelData.headers.map((header, index) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {header}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExcelUploader
