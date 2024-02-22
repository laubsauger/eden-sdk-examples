import eden from '../init_eden.js'
import fs from 'fs'

/**
 * @param filePath {string}
 */
const upload_media = async (filePath) => {
  const media = await fs.readFileSync(filePath)
  const result = await eden.media.upload({ media })
  return result
}

export default upload_media