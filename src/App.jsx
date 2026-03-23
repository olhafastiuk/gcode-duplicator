import { useState, useRef } from 'react'
import JSZip from 'jszip'
import { processFiles } from './processor'
import './App.css'

export default function App() {
  const [file, setFile] = useState(null)
  const [number, setNumber] = useState('')
  const [status, setStatus] = useState('idle') // idle | processing | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.name.endsWith('.gcode.3mf')) {
      setFile(selected)
      setStatus('idle')
      setErrorMsg('')
    } else {
      setFile(null)
      setErrorMsg('Будь ласка, оберіть .gcode.3mf файл')
    }
  }

  const handleStart = async () => {
    if (!file) return setErrorMsg('Оберіть файл')
    if (number === '') return setErrorMsg('Введіть число')

    setStatus('processing')
    setErrorMsg('')

    try {
      const zip = new JSZip()
      await zip.loadAsync(file)

      // Читаємо всі файли з архіву
      const files = {}
      for (const [name, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          files[name] = await zipEntry.async('uint8array')
        }
      }

      // Обробляємо файли
      const processed = await processFiles(files, Number(number))

      // Пакуємо назад у ZIP
      const outZip = new JSZip()
      for (const [name, content] of Object.entries(processed)) {
        outZip.file(name, content)
      }

      const blob = await outZip.generateAsync({ type: 'blob' })

      // Завантаження результату
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const baseName = file.name.replace(/\.gcode\.3mf$/, '')
      a.href = url
      a.download = `${baseName} x${number}.gcode.3mf`
      a.click()
      URL.revokeObjectURL(url)

      setStatus('done')
    } catch (err) {
      console.error(err)
      setErrorMsg(`Помилка: ${err.message}`)
      setStatus('error')
    }
  }

  const isReady = file && number !== '' && status !== 'processing'

  return (
    <div className="container">
      <h1>Дублювання G-code</h1>

      <div className="field">
        <label>.gcode.3mf файл</label>
        <div
          className="dropzone"
          onClick={() => fileInputRef.current.click()}
        >
          {file ? file.name : 'Натисніть або перетягніть .gcode.3mf файл'}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".3mf"
          onChange={handleFileChange}
          hidden
        />
      </div>

      <div className="field">
        <label>Кількість копій</label>
        <input
          type="number"
          min="1"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Введіть кількість"
          className="number-input"
        />
      </div>

      {errorMsg && <p className="error">{errorMsg}</p>}

      {status === 'done' && (
        <p className="success">Готово! Файл завантажується.</p>
      )}

      <button
        className="start-btn"
        onClick={handleStart}
        disabled={!isReady}
      >
        {status === 'processing' ? 'Обробка...' : 'Старт'}
      </button>
    </div>
  )
}
