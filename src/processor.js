/**
 * Дублює plate_1.gcode всередині .gcode.3mf архіву COUNT разів.
 *
 * @param {Object} files - { [filename]: Uint8Array }
 * @param {number} count - кількість повторень
 * @returns {Object} - оновлений об'єкт файлів
 */
export async function processFiles(files, count) {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const plateFiles = Object.keys(files).filter(name =>
    /^Metadata\/plate_\d+\.gcode$/.test(name)
  )

  if (plateFiles.length === 0) {
    throw new Error('Не знайдено жодного файлу Metadata/plate_N.gcode в архіві')
  }

  const updated = { ...files }
  for (const path of plateFiles) {
    const original = decoder.decode(files[path])
    updated[path] = encoder.encode(original.repeat(count))
  }

  return updated
}
