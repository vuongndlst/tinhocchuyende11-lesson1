import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const roots = ['assets', 'scripts', 'tests']
let checked = 0
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name)
    if (item.isDirectory()) await walk(path)
    else if (['.mjs', '.js', '.css'].includes(extname(item.name))) {
      const text = await readFile(path, 'utf8')
      if (text.includes('\t')) throw new Error(`${path}: không dùng tab để thụt lề`)
      checked += 1
    }
  }
}
for (const root of roots) await walk(root)
console.log(`Đã kiểm tra định dạng cơ bản cho ${checked} tệp.`)
