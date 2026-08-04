import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const directory = resolve(process.cwd(), process.argv[2] || '.')
const port = Number(process.argv[3] || 5173)
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' }
const server = http.createServer(async (req, res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0])
  let file = join(directory, raw === '/' ? 'index.html' : raw)
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = join(file, 'index.html')
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Không tìm thấy tệp')
  }
})
server.listen(port, () => console.log(`OS Quest 11: http://localhost:${port}`))
