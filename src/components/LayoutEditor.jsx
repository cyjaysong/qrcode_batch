import { useState, useRef, useEffect } from 'react'
import { Type, QrCode, Image, Trash2, Layers, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import QRCode from 'qrcode'

function LayoutEditor({
  elements,
  canvasSize,
  onCanvasSizeChange,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onReorderElements,
  excelData,
  currentRowIndex,
  qrSettings
}) {
  const [selectedElement, setSelectedElement] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [resizing, setResizing] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeOffset, setResizeOffset] = useState({ width: 0, height: 0 })
  const canvasRef = useRef(null)

  const handleMouseDown = (e, element, action = 'drag') => {
    e.stopPropagation()
    setSelectedElement(element.id)
    
    const rect = canvasRef.current.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top

    if (action === 'drag') {
      setDragging({
        id: element.id,
        startX,
        startY,
        originalX: element.x,
        originalY: element.y
      })
      setDragOffset({ x: 0, y: 0 })
    } else if (action === 'resize') {
      setResizing({
        id: element.id,
        startX,
        startY,
        originalWidth: element.width,
        originalHeight: element.height
      })
      setResizeOffset({ width: 0, height: 0 })
    }
  }

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    if (dragging) {
      const deltaX = currentX - dragging.startX
      const deltaY = currentY - dragging.startY
      setDragOffset({ x: deltaX, y: deltaY })
    }

    if (resizing) {
      const deltaX = currentX - resizing.startX
      const deltaY = currentY - resizing.startY
      setResizeOffset({ width: deltaX, height: deltaY })
    }
  }

  const handleMouseUp = () => {
    if (dragging) {
      onUpdateElement(dragging.id, {
        x: Math.max(0, dragging.originalX + dragOffset.x),
        y: Math.max(0, dragging.originalY + dragOffset.y)
      })
    }
    if (resizing) {
      onUpdateElement(resizing.id, {
        width: Math.max(20, resizing.originalWidth + resizeOffset.width),
        height: Math.max(20, resizing.originalHeight + resizeOffset.height)
      })
    }
    setDragging(null)
    setResizing(null)
    setDragOffset({ x: 0, y: 0 })
    setResizeOffset({ width: 0, height: 0 })
  }

  const getElementPosition = (element) => {
    if (dragging && dragging.id === element.id) {
      return {
        x: Math.max(0, dragging.originalX + dragOffset.x),
        y: Math.max(0, dragging.originalY + dragOffset.y)
      }
    }
    return { x: element.x, y: element.y }
  }

  const getElementSize = (element) => {
    if (resizing && resizing.id === element.id) {
      return {
        width: Math.max(20, resizing.originalWidth + resizeOffset.width),
        height: Math.max(20, resizing.originalHeight + resizeOffset.height)
      }
    }
    return { width: element.width, height: element.height }
  }

  const getElementContent = (element) => {
    if (!element.column || !excelData) {
      return element.content || ''
    }
    const colIndex = excelData.headers.indexOf(element.column)
    if (colIndex === -1) return element.content || ''
    return excelData.rows[currentRowIndex]?.[colIndex] || ''
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">2. 布局编辑器</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddElement('text')}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            <Type className="w-4 h-4" />
            文本
          </button>
          <button
            onClick={() => onAddElement('qrcode')}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            <QrCode className="w-4 h-4" />
            二维码
          </button>
          <button
            onClick={() => onAddElement('image')}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
          >
            <Image className="w-4 h-4" />
            图片
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <label className="text-gray-600">画布宽度:</label>
          <input
            type="number"
            value={canvasSize.width}
            onChange={(e) => onCanvasSizeChange({ ...canvasSize, width: parseInt(e.target.value) || 400 })}
            className="w-20 border rounded px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-gray-600">画布高度:</label>
          <input
            type="number"
            value={canvasSize.height}
            onChange={(e) => onCanvasSizeChange({ ...canvasSize, height: parseInt(e.target.value) || 400 })}
            className="w-20 border rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="border rounded-lg overflow-auto bg-gray-50 p-4 flex-1">
          <div
            ref={canvasRef}
            className="relative bg-white border border-gray-300"
            style={{ width: canvasSize.width, height: canvasSize.height }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedElement(null)}
          >
            {elements.map((element, index) => {
              const pos = getElementPosition(element)
              const size = getElementSize(element)
              return (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  posX={pos.x}
                  posY={pos.y}
                  width={size.width}
                  height={size.height}
                  zIndex={index}
                  isSelected={selectedElement === element.id}
                  content={getElementContent(element)}
                  qrSettings={qrSettings}
                  onMouseDown={(e, action) => handleMouseDown(e, element, action)}
                />
              )
            })}
          </div>
        </div>

        <LayerPanel
          elements={elements}
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          onReorderElements={onReorderElements}
        />
      </div>

      {selectedElement && (
        <ElementEditor
          element={elements.find(el => el.id === selectedElement)}
          excelData={excelData}
          onUpdate={(updates) => onUpdateElement(selectedElement, updates)}
          onDelete={() => {
            onDeleteElement(selectedElement)
            setSelectedElement(null)
          }}
        />
      )}
    </div>
  )
}

function ElementRenderer({ element, posX, posY, width, height, zIndex, isSelected, content, qrSettings, onMouseDown }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const qrGeneratedForRef = useRef('')

  useEffect(() => {
    if (element.type === 'qrcode' && content) {
      const key = `${content}-${element.width}-${qrSettings.errorCorrectionLevel}-${qrSettings.margin}-${qrSettings.darkColor}-${qrSettings.lightColor}-${qrSettings.version}`
      
      if (qrGeneratedForRef.current === key) {
        return
      }
      qrGeneratedForRef.current = key

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
      QRCode.toDataURL(String(content), options)
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR生成失败:', err))
    }
  }, [element.type, element.width, content, qrSettings.errorCorrectionLevel, qrSettings.margin, qrSettings.darkColor, qrSettings.lightColor, qrSettings.version])

  const baseStyle = {
    position: 'absolute',
    left: posX,
    top: posY,
    width: width,
    height: height,
    zIndex: zIndex,
    cursor: 'move',
    border: isSelected ? '2px solid #3b82f6' : '1px dashed #ccc',
    boxSizing: 'border-box',
    willChange: 'left, top, width, height'
  }

  const handleClick = (e) => {
    e.stopPropagation()
  }

  return (
    <div
      style={baseStyle}
      onMouseDown={(e) => onMouseDown(e, 'drag')}
      onClick={handleClick}
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
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: element.textAlign === 'center' ? 'center' : 
                           element.textAlign === 'right' ? 'flex-end' : 'flex-start',
            padding: '4px'
          }}
        >
          {content || element.content}
        </div>
      )}

      {element.type === 'qrcode' && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
          ) : (
            <QrCode className="w-8 h-8 text-gray-400" />
          )}
        </div>
      )}

      {element.type === 'image' && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          {element.imageUrl ? (
            <img src={element.imageUrl} alt="Image" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
          ) : (
            <Image className="w-8 h-8 text-gray-400" />
          )}
        </div>
      )}

      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation()
            onMouseDown(e, 'resize')
          }}
        />
      )}
    </div>
  )
}

function LayerPanel({ elements, selectedElement, onSelectElement, onReorderElements }) {
  const [draggedIndex, setDraggedIndex] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newElements = [...elements]
    const [removed] = newElements.splice(draggedIndex, 1)
    newElements.splice(index, 0, removed)
    onReorderElements(newElements)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const moveElement = (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= elements.length) return
    
    const newElements = [...elements]
    const [removed] = newElements.splice(index, 1)
    newElements.splice(newIndex, 0, removed)
    onReorderElements(newElements)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />
      case 'qrcode': return <QrCode className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      default: return null
    }
  }

  // 反转显示顺序，让最上层的元素显示在列表顶部
  const reversedElements = [...elements].reverse()

  return (
    <div className="w-48 bg-gray-50 border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-gray-600" />
        <h4 className="font-medium text-gray-700 text-sm">图层</h4>
      </div>
      
      {elements.length === 0 ? (
        <div className="text-gray-400 text-xs text-center py-4">暂无元素</div>
      ) : (
        <div className="space-y-1">
          {reversedElements.map((element, reversedIndex) => {
            const actualIndex = elements.length - 1 - reversedIndex
            return (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, actualIndex)}
                onDragOver={(e) => handleDragOver(e, actualIndex)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectElement(element.id)}
                className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${
                  selectedElement === element.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-white border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <GripVertical className="w-3 h-3 text-gray-400 cursor-grab" />
                {getTypeIcon(element.type)}
                <span className="flex-1 truncate text-xs">{element.name || '未命名'}</span>
                <div className="flex flex-col">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveElement(actualIndex, 1)
                    }}
                    disabled={actualIndex === elements.length - 1}
                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="上移一层"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      moveElement(actualIndex, -1)
                    }}
                    disabled={actualIndex === 0}
                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="下移一层"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ElementEditor({ element, excelData, onUpdate, onDelete }) {
  if (!element) return null

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-700">
          {element.type === 'text' ? '文本' : element.type === 'qrcode' ? '二维码' : '图片'} 属性
        </h4>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2 py-1 text-red-500 hover:bg-red-50 rounded text-sm"
        >
          <Trash2 className="w-4 h-4" />
          删除
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-gray-600 mb-1 text-sm">元素别名</label>
        <input
          type="text"
          value={element.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="输入元素别名"
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-gray-600 mb-1">X 位置</label>
          <input
            type="number"
            value={element.x}
            onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Y 位置</label>
          <input
            type="number"
            value={element.y}
            onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">宽度</label>
          <input
            type="number"
            value={element.width}
            onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 50 })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">高度</label>
          <input
            type="number"
            value={element.height}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 50 })}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      {(element.type === 'text' || element.type === 'qrcode') && excelData && (
        <div className="mt-3">
          <label className="block text-gray-600 mb-1 text-sm">绑定Excel列</label>
          <select
            value={element.column}
            onChange={(e) => onUpdate({ column: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="">不绑定 (使用固定内容)</option>
            {excelData.headers.map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </div>
      )}

      {element.type === 'text' && (
        <>
          {!element.column && (
            <div className="mt-3">
              <label className="block text-gray-600 mb-1 text-sm">文本内容</label>
              <input
                type="text"
                value={element.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
            <div>
              <label className="block text-gray-600 mb-1">字号</label>
              <input
                type="number"
                value={element.fontSize}
                onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 16 })}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">颜色</label>
              <input
                type="color"
                value={element.fontColor}
                onChange={(e) => onUpdate({ fontColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">粗细</label>
              <select
                value={element.fontWeight}
                onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="normal">正常</option>
                <option value="bold">粗体</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-gray-600 mb-1 text-sm">对齐方式</label>
            <select
              value={element.textAlign}
              onChange={(e) => onUpdate({ textAlign: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
        </>
      )}

      {element.type === 'image' && (
        <div className="mt-3">
          <label className="block text-gray-600 mb-1 text-sm">图片URL</label>
          <input
            type="text"
            value={element.imageUrl}
            onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            placeholder="输入图片URL或Base64"
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <div className="mt-2">
            <label className="block text-gray-600 mb-1 text-sm">或上传图片</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    onUpdate({ imageUrl: event.target.result })
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default LayoutEditor
