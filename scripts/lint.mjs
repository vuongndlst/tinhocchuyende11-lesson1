import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

let count = 0
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name)
    if (item.isDirectory()) await walk(path)
    else if (['.mjs', '.js'].includes(extname(path))) {
      const text = await readFile(path, 'utf8')
      if (/\beval\s*\(/.test(text)) throw new Error(`${path}: không được dùng eval`)
      if (/service_role/i.test(text) && !path.endsWith('lint.mjs')) throw new Error(`${path}: không được chứa service role key`)
      count += 1
    }
  }
}
await walk('assets')
await walk('scripts')
console.log(`Lint cơ bản hoàn tất cho ${count} tệp JavaScript.`)
