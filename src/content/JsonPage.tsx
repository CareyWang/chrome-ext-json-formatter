import { useRef, useState } from 'react'

import { MAX_STRUCTURED_RENDER_CHARS } from '../json/constants'
import { JsonTree } from '../json/JsonTree'
import { formatByteLike, formatJson, type JsonValue } from '../json/parse'

type LoadingPageProps = {
    approxLength?: number
}

type JsonPageProps = {
    value: JsonValue
    preferPlain?: boolean
}

type LargeJsonPageProps = {
    rawText: string
    onRenderJson: (value: JsonValue, preferPlain: boolean) => void
}

export function LoadingPage({ approxLength }: LoadingPageProps) {
    return (
        <div className="loading-page">
            <div className="loading-card">
                <p className="loading-title">JSON Formatter</p>
                <div className="loading-row">
                    <span className="spinner" />
                    <p className="loading-text">正在格式化 JSON...</p>
                </div>
                {typeof approxLength === 'number' ? (
                    <p className="loading-meta">大小：约 {formatByteLike(approxLength)}</p>
                ) : null}
            </div>
        </div>
    )
}

export function ErrorPage({ message }: { message: string }) {
    return (
        <div className="page">
            <div className="error-card">
                <p className="error-title">JSON Formatter</p>
                <p className="error-message">{message}</p>
            </div>
        </div>
    )
}

export function JsonPage({ value, preferPlain = false }: JsonPageProps) {
    return (
        <div className="page">
            <div className="container">
                <div className="card">
                    <JsonTree value={value} plain={preferPlain} />
                </div>
            </div>
        </div>
    )
}

export function LargeJsonPage({ rawText, onRenderJson }: LargeJsonPageProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [busy, setBusy] = useState(false)

    const copyRaw = async () => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(rawText)
        }
    }

    const formatLarge = () => {
        setBusy(true)
        window.setTimeout(() => {
            const parsed = formatJson(rawText, { forceSize: true })

            setBusy(false)

            if (parsed.state !== 'ok') {
                return
            }

            onRenderJson(parsed.value, parsed.raw.length > MAX_STRUCTURED_RENDER_CHARS)
        }, 0)
    }

    const selectAll = () => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
    }

    return (
        <div className="page">
            <div className="card large-card">
                <div className="controls">
                    <button type="button" onClick={copyRaw}>
                        复制原文
                    </button>
                    <button type="button" onClick={formatLarge} disabled={busy}>
                        {busy ? '格式化中...' : '格式化（可能卡）'}
                    </button>
                    <button type="button" onClick={selectAll}>
                        全选
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (textareaRef.current) {
                                textareaRef.current.scrollTop = 0
                            }
                        }}>
                        滚动到顶部
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (textareaRef.current) {
                                textareaRef.current.scrollTop = textareaRef.current.scrollHeight
                            }
                        }}>
                        滚动到底部
                    </button>
                </div>
                <div className="warning">
                    JSON 过大（约 {formatByteLike(rawText.length)}），默认仅展示原文，格式化可能会卡顿。
                </div>
                <textarea
                    ref={textareaRef}
                    id="json-raw-content"
                    className="raw-textarea"
                    value={rawText}
                    spellCheck={false}
                    readOnly
                    wrap="soft"
                />
            </div>
        </div>
    )
}
