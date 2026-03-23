import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import JavaScriptObfuscator from 'javascript-obfuscator'

const DIST_DIR = './dist'

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.4,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  selfDefending: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.6,
  rotateStringArray: true,
  shuffleStringArray: true,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  target: 'browser',
}

function getJsFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...getJsFiles(full))
    } else if (extname(entry) === '.js') {
      files.push(full)
    }
  }
  return files
}

const files = getJsFiles(DIST_DIR)
console.log(`\n🔒 Obfuscating ${files.length} JS file(s)...\n`)

let ok = 0
let fail = 0

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const sizeBefore = src.length
  try {
    const result = JavaScriptObfuscator.obfuscate(src, OBFUSCATOR_OPTIONS)
    const obf = result.getObfuscatedCode()
    writeFileSync(file, obf, 'utf8')
    const ratio = ((obf.length / sizeBefore) * 100).toFixed(0)
    console.log(`  ✓  ${file.replace(DIST_DIR + '/', '')}  (${(sizeBefore / 1024).toFixed(1)} kB → ${(obf.length / 1024).toFixed(1)} kB, ${ratio}%)`)
    ok++
  } catch (err) {
    console.error(`  ✗  ${file}: ${err.message}`)
    fail++
  }
}

console.log(`\n🔒 Done — ${ok} obfuscated${fail ? `, ${fail} failed` : ''}.\n`)
if (fail > 0) process.exit(1)
