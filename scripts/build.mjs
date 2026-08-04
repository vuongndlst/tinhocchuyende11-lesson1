import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })
await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'))
await cp(resolve(root, 'assets'), resolve(dist, 'assets'), { recursive: true })
const size = (await stat(resolve(dist, 'index.html'))).size
if (size < 500) throw new Error('index.html quá nhỏ, build không hợp lệ')
console.log('Build thành công: dist/')
