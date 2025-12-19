import { Settings } from 'lucide-react'

function QRCodeSettings({ settings, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        二维码设置
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">容错率</label>
          <select
            value={settings.errorCorrectionLevel}
            onChange={(e) => handleChange('errorCorrectionLevel', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="L">L - 7% 容错</option>
            <option value="M">M - 15% 容错</option>
            <option value="Q">Q - 25% 容错</option>
            <option value="H">H - 30% 容错</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">版本 (1-40, 留空自动)</label>
          <input
            type="number"
            min="1"
            max="40"
            value={settings.version || ''}
            onChange={(e) => handleChange('version', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="自动"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">边距</label>
          <input
            type="number"
            min="0"
            max="10"
            value={settings.margin}
            onChange={(e) => handleChange('margin', parseInt(e.target.value) || 0)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">尺寸 (像素)</label>
          <input
            type="number"
            min="50"
            max="1000"
            value={settings.width}
            onChange={(e) => handleChange('width', parseInt(e.target.value) || 200)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">前景色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.darkColor}
                onChange={(e) => handleChange('darkColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.darkColor}
                onChange={(e) => handleChange('darkColor', e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">背景色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.lightColor}
                onChange={(e) => handleChange('lightColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.lightColor}
                onChange={(e) => handleChange('lightColor', e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeSettings
