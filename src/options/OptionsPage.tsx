import { useEffect, useMemo, useRef, useState } from 'react'

import { DEBOUNCE_DELAY } from '../json/constants'
import { JsonTree, type JsonTreeHandle } from '../json/JsonTree'
import { jsonTreeStyles } from '../json/jsonTreeStyles'
import { formatJson, type ParseResult } from '../json/parse'
import './options.css'

type DisplayState =
    | {
          mode: 'tree'
      }
    | {
          mode: 'text'
          text: string
      }

function getOutputStatus(result: ParseResult, displayState: DisplayState): string {
    if (displayState.mode === 'text') {
        return `输出长度：${displayState.text.length} 字符（已压缩）`
    }

    if (result.state === 'ok') {
        return `输出长度：${result.formatted.length} 字符`
    }

    if (result.state === 'too_large') {
        return '超过大小限制'
    }

    if (result.state === 'invalid') {
        return '格式错误'
    }

    return '-'
}

function getFallbackOutputText(result: ParseResult, displayState: DisplayState): string {
    if (displayState.mode === 'text') {
        return displayState.text
    }

    if (result.state === 'empty' || result.state === 'invalid' || result.state === 'too_large') {
        return result.message
    }

    return ''
}

export default function OptionsPage() {
    const [input, setInput] = useState('')
    const [replaceEscapedQuotes, setReplaceEscapedQuotes] = useState(false)
    const [result, setResult] = useState<ParseResult>(() => formatJson(''))
    const [displayState, setDisplayState] = useState<DisplayState>({ mode: 'tree' })
    const [copyMessage, setCopyMessage] = useState<string | null>(null)
    const treeRef = useRef<JsonTreeHandle>(null)

    const normalizedInput = useMemo(() => {
        return replaceEscapedQuotes ? input.replace(/\\"/g, '"') : input
    }, [input, replaceEscapedQuotes])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setResult(formatJson(normalizedInput))
            setDisplayState({ mode: 'tree' })
            setCopyMessage(null)
        }, DEBOUNCE_DELAY)

        return () => {
            window.clearTimeout(timer)
        }
    }, [normalizedInput])

    const inputStatus =
        input.length === 0
            ? '未输入'
            : replaceEscapedQuotes
              ? `输入长度：${input.length} 字符，替换后：${normalizedInput.length} 字符`
              : `输入长度：${input.length} 字符`
    const outputStatus = copyMessage || getOutputStatus(result, displayState)
    const outputError = result.state !== 'ok' && result.state !== 'empty'

    const formattedText = useMemo(() => {
        if (displayState.mode === 'text') {
            return displayState.text
        }

        return result.state === 'ok' ? result.formatted : ''
    }, [displayState, result])

    const handleFormat = () => {
        setResult(formatJson(normalizedInput))
        setDisplayState({ mode: 'tree' })
        setCopyMessage(null)
    }

    const clearAll = () => {
        setInput('')
        setReplaceEscapedQuotes(false)
        setResult(formatJson(''))
        setDisplayState({ mode: 'tree' })
        setCopyMessage(null)
    }

    const copyOutput = async () => {
        if (!formattedText || outputError) {
            return
        }

        try {
            await navigator.clipboard.writeText(formattedText)
            setCopyMessage('已复制到剪贴板')
            window.setTimeout(() => {
                setCopyMessage(null)
            }, 1200)
        } catch (_) {
            setCopyMessage('复制失败（请手动复制）')
        }
    }

    const minifyOutput = () => {
        if (!formattedText || outputError) {
            return
        }

        try {
            const minified = JSON.stringify(JSON.parse(formattedText))
            setDisplayState({
                mode: 'text',
                text: minified
            })
            setCopyMessage(null)
        } catch (_) {
            setCopyMessage('压缩失败（格式不正确）')
        }
    }

    return (
        <>
            <style>{jsonTreeStyles}</style>
            <div className="page">
                <div className="container">
                    <div className="card">
                        <header className="header">
                            <div>
                                <h1>JSON Formatter</h1>
                                <p>粘贴 JSON 字符串，右侧实时格式化显示</p>
                            </div>
                            <div className="actions">
                                <button type="button" onClick={handleFormat}>
                                    格式化
                                </button>
                                <button type="button" onClick={minifyOutput}>
                                    压缩
                                </button>
                                <button type="button" onClick={copyOutput}>
                                    复制结果
                                </button>
                                <button type="button" onClick={clearAll}>
                                    清空
                                </button>
                                <button type="button" onClick={() => treeRef.current?.expandAll()}>
                                    展开全部
                                </button>
                                <button type="button" onClick={() => treeRef.current?.collapseAll()}>
                                    折叠全部
                                </button>
                                <button type="button" onClick={() => treeRef.current?.collapseLevel(1)}>
                                    折叠1级
                                </button>
                                <button type="button" onClick={() => treeRef.current?.collapseLevel(2)}>
                                    折叠2级
                                </button>
                                <button type="button" onClick={() => treeRef.current?.collapseLevel(3)}>
                                    折叠3级
                                </button>
                            </div>
                        </header>

                        <main className="main">
                            <section className="panel">
                                <div className="panel-heading">
                                    <div className="panel-title">输入</div>
                                    <label className="input-option" htmlFor="replaceEscapedQuotes">
                                        <input
                                            id="replaceEscapedQuotes"
                                            type="checkbox"
                                            checked={replaceEscapedQuotes}
                                            onChange={(event) => setReplaceEscapedQuotes(event.target.checked)}
                                        />
                                        <span className="input-option-copy">替换转义引号</span>
                                        <span className="input-option-code">
                                            <code>\"</code> → <code>"</code>
                                        </span>
                                    </label>
                                </div>
                                <textarea
                                    id="input"
                                    spellCheck={false}
                                    placeholder="在这里粘贴 JSON 字符串..."
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                />
                                <div className="panel-footer" id="inputStatus">
                                    {inputStatus}
                                </div>
                            </section>

                            <section className="panel">
                                <div className="panel-title">输出</div>
                                <div
                                    id="output"
                                    className={`output${outputError ? ' error' : ''}${
                                        result.state === 'ok' && displayState.mode === 'tree' ? ' tree-output' : ''
                                    }`}>
                                    {result.state === 'ok' && displayState.mode === 'tree' ? (
                                        <JsonTree ref={treeRef} value={result.value} showControls={false} />
                                    ) : (
                                        <pre>{getFallbackOutputText(result, displayState)}</pre>
                                    )}
                                </div>
                                <div className="panel-footer" id="outputStatus">
                                    {outputStatus}
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            </div>
        </>
    )
}
