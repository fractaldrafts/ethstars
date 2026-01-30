'use client'

import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import './RichTextEditor.css'
import { useMemo, useRef, useState, useCallback } from 'react'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

// Minimal toolbar: bold, italic, Paragraph/H1/H2, bullet + numbered list
const TOOLBAR_OPTIONS = [
  ['bold', 'italic'],
  [{ header: [1, 2, false] }], // false = Paragraph (default)
  [{ list: 'ordered' }, { list: 'bullet' }],
]

const modules = {
  toolbar: TOOLBAR_OPTIONS,
}

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Full description',
  className = '',
  minHeight = '120px',
}: RichTextEditorProps) {
  const quillModules = useMemo(() => modules, [])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  const handleFocus = useCallback(() => setFocused(true), [])
  const handleBlur = useCallback(() => {
    requestAnimationFrame(() => {
      setFocused(!!wrapperRef.current?.contains(document.activeElement))
    })
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`rtf-editor-dark rtf-editor-wrapper ${focused ? 'rtf-editor-focused' : ''} ${className}`}
      style={{ minHeight }}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(content) => onChange(content)}
        modules={quillModules}
        placeholder={placeholder}
        className="rtf-editor-quill"
      />
    </div>
  )
}
