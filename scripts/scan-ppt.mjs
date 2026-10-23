#!/usr/bin/env node
/**
 * PPT 内容扫描与增量更新辅助工具
 *
 * 用法：
 *   node scripts/scan-ppt.mjs                 # 扫描工作区所有 PPT 并输出提取文本
 *   node scripts/scan-ppt.mjs --diff          # 与 reference/ppt-text/ 中的既有提取对比，列出新增/修改
 *   node scripts/scan-ppt.mjs --check         # 校验内容 ID 契约与覆盖情况（无需 PPT）
 *
 * 依赖：仅 Node 内置模块（pptx 是 zip，需要系统有 unzip；缺失时给出提示）
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const REF_DIR = join(ROOT, 'reference', 'ppt-text')

const args = process.argv.slice(2)
const MODE = args.includes('--diff') ? 'diff' : args.includes('--check') ? 'check' : 'scan'

// ---------------------------------------------------------------- 提取

function listPptFiles() {
  return readdirSync(ROOT)
    .filter((f) => extname(f).toLowerCase() === '.pptx')
    .sort()
}

function extractPpt(pptPath) {
  const tmp = join(ROOT, '.ppt-tmp', basename(pptPath))
  try {
    rmSync(tmp, { recursive: true, force: true })
    mkdirSync(tmp, { recursive: true })
    execFileSync('unzip', ['-q', pptPath, '-d', tmp], { stdio: 'pipe' })

    const slidesDir = join(tmp, 'ppt', 'slides')
    if (!existsSync(slidesDir)) return []
    const files = readdirSync(slidesDir)
      .filter((f) => /^slide\d+\.xml$/.test(f))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))

    return files.map((f) => ({
      number: Number(f.match(/\d+/)[0]),
      paragraphs: extractParagraphs(join(slidesDir, f)),
    }))
  } catch (e) {
    console.error(`  ! 解压失败: ${e.message}`)
    return []
  } finally {
    rmSync(join(ROOT, '.ppt-tmp'), { recursive: true, force: true })
  }
}

function extractParagraphs(xmlPath) {
  // 不引入额外依赖：用一个轻量的标签扫描提取 <a:t> 文本，按 <a:p> 分组
  const xml = readFileSync(xmlPath, 'utf8')
  const out = []
  for (const pMatch of xml.matchAll(/<a:p>[\s\S]*?<\/a:p>/g)) {
    const p = pMatch[0]
    let text = ''
    for (const t of p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)) {
      text += t[1]
    }
    text = decodeXml(text).trim()
    if (text) out.push(text)
  }
  return out
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function slidesToText(slides) {
  return slides.map((s) => `--- SLIDE ${s.number} ---\n${s.paragraphs.join('\n')}`).join('\n') + '\n'
}

// ---------------------------------------------------------------- diff

function diffText(oldText, newText) {
  const oldLines = new Set(oldText.split('\n'))
  const newLines = new Set(newText.split('\n'))
  const added = [...newLines].filter((l) => l && !oldLines.has(l))
  const removed = [...oldLines].filter((l) => l && !newLines.has(l))
  return { added, removed }
}

// ---------------------------------------------------------------- check

async function check() {
  const { chapterOutlines, flattenOutline } = await import('../src/content/outline.ts')
  const outline = Object.entries(chapterOutlines).flatMap(([cid, secs]) =>
    flattenOutline(secs).map((p) => ({ ...p, chapterId: cid })),
  )
  console.log(`\n📋 大纲知识点总数: ${outline.length}`)
  for (const [cid, secs] of Object.entries(chapterOutlines)) {
    const pts = flattenOutline(secs)
    const slides = new Set(pts.flatMap((p) => p.slides))
    console.log(`   ${cid}: ${pts.length} 个知识点, 覆盖 ${slides.size} 页 PPT`)
  }

  // 检查章节内容文件（支持 chN.ts 与 chN-partX.ts 两种布局）
  const chapterFiles = { ch1: ['ch1.ts'], ch2: ['ch2.ts'], ch3: ['ch3-part1.ts', 'ch3-part2.ts', 'ch3-part3.ts'] }
  for (const [cid, files] of Object.entries(chapterFiles)) {
    let ids = []
    let missingFiles = []
    for (const file of files) {
      const p = join(ROOT, 'src', 'content', 'chapters', file)
      if (!existsSync(p)) { missingFiles.push(file); continue }
      const src = readFileSync(p, 'utf8')
      ids = ids.concat([...src.matchAll(/id:\s*'(k[\d.]+)'/g)].map((m) => m[1]))
    }
    const expected = flattenOutline(chapterOutlines[cid]).map((p) => p.id)
    const missing = expected.filter((e) => !ids.includes(e))
    const extra = ids.filter((i) => !expected.includes(i))
    console.log(
      `   ${missingFiles.length === 0 && missing.length === 0 && extra.length === 0 ? '✓' : '✗'} ${cid}: 实现 ${ids.length}/${expected.length}` +
        (missingFiles.length ? `  缺文件: ${missingFiles.join(', ')}` : '') +
        (missing.length ? `  缺少: ${missing.join(', ')}` : '') +
        (extra.length ? `  多余: ${extra.join(', ')}` : ''),
    )
  }

  // 检查题目
  const qFiles = ['ch1.ts', 'ch2.ts', 'ch3a.ts', 'ch3b.ts']
  let allIds = []
  for (const qf of qFiles) {
    const fp = join(ROOT, 'src', 'content', 'questions', qf)
    if (!existsSync(fp)) { console.log(`   ✗ 缺少题目文件 ${qf}`); continue }
    const src = readFileSync(fp, 'utf8')
    const ids = [...src.matchAll(/id:\s*'(q[^']+)'/g)].map((m) => m[1])
    allIds = allIds.concat(ids)
    const noExplain = (src.match(/options:\s*\[[\s\S]*?\]\s*,/g) || []).filter((b) => !/explain/.test(b)).length
    console.log(`   ${qf}: ${ids.length} 道, 选项缺解析的题目组: ${noExplain}`)
  }
  const dup = allIds.filter((x, i) => allIds.indexOf(x) !== i)
  console.log(`   ${dup.length === 0 ? '✓' : '✗'} 题目总数 ${allIds.length}, 重复 ID: ${dup.length || '无'}`)
  console.log('')
}

// ---------------------------------------------------------------- main

console.log(`\n=== 计算机网络学习平台 · PPT 扫描工具 ===\n`)

if (MODE === 'check') {
  await check()
  process.exit(0)
}

const ppts = listPptFiles()
if (ppts.length === 0) {
  console.log('工作区没有找到 .pptx 文件。')
  process.exit(0)
}

mkdirSync(REF_DIR, { recursive: true })

for (const ppt of ppts) {
  const pptPath = join(ROOT, ppt)
  console.log(`📄 ${ppt}`)
  const slides = extractPpt(pptPath)
  console.log(`   幻灯片数: ${slides.length}`)
  const text = slidesToText(slides)
  const refPath = join(REF_DIR, `${basename(ppt, '.pptx')}.txt`)

  if (MODE === 'diff' && existsSync(refPath)) {
    const { added, removed } = diffText(readFileSync(refPath, 'utf8'), text)
    console.log(`   新增文本行: ${added.length}   删除文本行: ${removed.length}`)
    if (added.length) {
      console.log('   ── 新增内容（前 40 条）──')
      added.slice(0, 40).forEach((l) => console.log(`   + ${l}`))
    }
    if (removed.length) {
      console.log('   ── 消失内容（前 20 条）──')
      removed.slice(0, 20).forEach((l) => console.log(`   - ${l}`))
    }
  } else {
    writeFileSync(refPath, text, 'utf8')
    console.log(`   已提取到 ${refPath}`)
  }
  console.log('')
}

if (MODE === 'diff') {
  console.log('提示：diff 模式只做对比，不覆盖 reference 文件。确认无误后可运行 scan 模式更新。\n')
}
