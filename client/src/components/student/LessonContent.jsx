/**
 * Renders a lesson's optional notes / test examples.
 *
 * Supported lightweight syntax:
 *   - Plain paragraphs (newlines preserved)
 *   - Fenced code blocks:
 *       ```js
 *       console.log('hi')
 *       ```
 *
 * Everything renders as React text nodes only — no HTML injection.
 */
function parseSegments(text) {
  const segments = []
  let paraBuf = []
  let codeBuf = []
  let lang = ''
  let inCode = false

  const flushParagraph = () => {
    const joined = paraBuf.join('\n').trim()
    if (joined) segments.push({ type: 'para', text: joined })
    paraBuf = []
  }

  for (const line of text.split(/\r?\n/)) {
    const fence = line.trim().match(/^```(\S*)\s*$/)
    if (fence) {
      if (inCode) {
        segments.push({ type: 'code', lang: lang || 'text', text: codeBuf.join('\n') })
        codeBuf = []
        inCode = false
      } else {
        flushParagraph()
        inCode = true
        lang = fence[1] || ''
      }
      continue
    }
    if (inCode) codeBuf.push(line)
    else paraBuf.push(line)
  }
  if (inCode && codeBuf.length) {
    segments.push({ type: 'code', lang: lang || 'text', text: codeBuf.join('\n') })
  }
  flushParagraph()
  return segments
}

export default function LessonContent({ content }) {
  if (!content || !content.trim()) return null
  const segments = parseSegments(content)
  if (!segments.length) return null

  return (
    <div className="flex flex-col gap-3">
      {segments.map((seg, i) =>
        seg.type === 'code' ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-xl border border-[rgba(143,170,205,0.14)] bg-[rgba(2,6,12,0.92)] p-4 text-xs leading-relaxed text-[#9fe8ff]"
          >
            {seg.lang !== 'text' && (
              <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted/70">
                {seg.lang}
              </span>
            )}
            <code className="font-mono whitespace-pre">{seg.text}</code>
          </pre>
        ) : (
          <p
            key={i}
            className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[#c8d6e8]"
          >
            {seg.text}
          </p>
        )
      )}
    </div>
  )
}
