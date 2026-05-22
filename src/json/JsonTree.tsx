import {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react'

import type { JsonValue } from './parse'
import { MAX_LINE_NUMBERS } from './constants'

type JsonTreeProps = {
    value: JsonValue
    plain?: boolean
    lineNumbers?: boolean
    showControls?: boolean
    className?: string
    onCopy?: () => void
}

export type JsonTreeHandle = {
    expandAll: () => void
    collapseAll: () => void
    collapseLevel: (targetLevel: number) => void
}

type NodeMeta = {
    path: string
    level: number
}

const tokenClassByType = {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    null: 'null'
}

function countNewlines(text: string): number {
    let count = 0
    let index = 0

    while (true) {
        index = text.indexOf('\n', index)

        if (index === -1) {
            break
        }

        count++
        index++
    }

    return count
}

function countVisibleNewlines(node: Node): number {
    let newlineCount = 0

    node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
            newlineCount += countNewlines(child.textContent || '')
            return
        }

        if (child.nodeType !== Node.ELEMENT_NODE) {
            return
        }

        const element = child as HTMLElement

        if (element.classList.contains('json-content') && element.classList.contains('collapsed')) {
            return
        }

        if (element.classList.contains('json-placeholder') && !element.classList.contains('show')) {
            return
        }

        newlineCount += countVisibleNewlines(element)
    })

    return newlineCount
}

function collectNodes(value: JsonValue, level = 0, path = 'root'): NodeMeta[] {
    if (value === null || typeof value !== 'object') {
        return []
    }

    const metas: NodeMeta[] = []
    const entries = Array.isArray(value)
        ? value.map((item, index) => [String(index), item] as const)
        : Object.keys(value).map((key) => [key, value[key]] as const)

    if (entries.length > 0) {
        metas.push({ path, level })
    }

    entries.forEach(([key, child]) => {
        metas.push(...collectNodes(child, level + 1, `${path}/${encodeURIComponent(key)}`))
    })

    return metas
}

function Indent({ level }: { level: number }) {
    return (
        <span className="indent-guides">
            {Array.from({ length: level }, (_, i) => (
                <span key={i} className="indent-guide" />
            ))}
            {'  '.repeat(level)}
        </span>
    )
}

function PrimitiveToken({ value }: { value: JsonValue }) {
    if (value === null) {
        return <span className={tokenClassByType.null}>null</span>
    }

    if (typeof value === 'string') {
        return <span className={tokenClassByType.string}>{JSON.stringify(value)}</span>
    }

    if (typeof value === 'number') {
        return <span className={tokenClassByType.number}>{String(value)}</span>
    }

    if (typeof value === 'boolean') {
        return <span className={tokenClassByType.boolean}>{String(value)}</span>
    }

    return <>{String(value)}</>
}

type TreeValueProps = {
    value: JsonValue
    level: number
    path: string
    collapsedPaths: Set<string>
    onToggle: (path: string) => void
}

function TreeValue({ value, level, path, collapsedPaths, onToggle }: TreeValueProps) {
    if (value === null || typeof value !== 'object') {
        return <PrimitiveToken value={value} />
    }

    const isArray = Array.isArray(value)
    const entries = isArray
        ? value.map((item, index) => [String(index), item] as const)
        : Object.keys(value).map((key) => [key, value[key]] as const)

    if (entries.length === 0) {
        return <>{isArray ? '[]' : '{}'}</>
    }

    const collapsed = collapsedPaths.has(path)
    const openChar = isArray ? '[' : '{'
    const closeChar = isArray ? ']' : '}'
    const placeholder = isArray ? `... ${entries.length} 项` : `... ${entries.length} 属性`

    return (
        <>
            <button
                type="button"
                className={`collapse-toggle${collapsed ? ' collapsed' : ''}`}
                aria-label={collapsed ? '展开节点' : '折叠节点'}
                onClick={() => onToggle(path)}>
                {collapsed ? '+' : '-'}
            </button>
            {openChar}
            {'\n'}
            <Indent level={level + 1} />
            <span className={`json-content${collapsed ? ' collapsed' : ''}`}>
                {entries.map(([key, child], index) => {
                    const childPath = `${path}/${encodeURIComponent(key)}`

                    return (
                        <span key={childPath}>
                            {index > 0 ? (
                                <>
                                    {',\n'}
                                    <Indent level={level + 1} />
                                </>
                            ) : null}
                            {isArray ? null : (
                                <>
                                    <span className="key">{JSON.stringify(key)}</span>
                                    {': '}
                                </>
                            )}
                            <TreeValue
                                value={child}
                                level={level + 1}
                                path={childPath}
                                collapsedPaths={collapsedPaths}
                                onToggle={onToggle}
                            />
                        </span>
                    )
                })}
            </span>
            <span className={`json-placeholder${collapsed ? ' show' : ''}`}>{placeholder}</span>
            {'\n'}
            <Indent level={level} />
            {closeChar}
        </>
    )
}

function LineNumbers({ count }: { count: number }) {
    return (
        <span className="line-numbers-rows" aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <span key={index} />
            ))}
        </span>
    )
}

export const JsonTree = forwardRef<JsonTreeHandle, JsonTreeProps>(function JsonTree(
    {
        value,
        plain = false,
        lineNumbers = true,
        showControls = true,
        className = '',
        onCopy
    },
    ref
) {
    const codeRef = useRef<HTMLElement>(null)
    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set())
    const [lineCount, setLineCount] = useState(1)
    const [lineNumbersEnabled, setLineNumbersEnabled] = useState(lineNumbers)
    const formatted = useMemo(() => JSON.stringify(value, null, 2), [value])
    const nodes = useMemo(() => collectNodes(value), [value])

    useLayoutEffect(() => {
        if (!lineNumbersEnabled) {
            return
        }

        if (plain) {
            const count = countNewlines(formatted) + 1

            if (count > MAX_LINE_NUMBERS) {
                setLineNumbersEnabled(false)
                return
            }

            setLineCount(count)
            return
        }

        if (!codeRef.current) {
            return
        }

        const nextCount = countVisibleNewlines(codeRef.current) + 1

        if (nextCount > MAX_LINE_NUMBERS) {
            setLineNumbersEnabled(false)
            return
        }

        setLineCount(nextCount)
    }, [collapsedPaths, formatted, lineNumbersEnabled, plain])

    const togglePath = useCallback((path: string) => {
        setCollapsedPaths((previous) => {
            const next = new Set(previous)

            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }

            return next
        })
    }, [])

    const expandAll = useCallback(() => {
        setCollapsedPaths(new Set())
    }, [])

    const collapseAll = useCallback(() => {
        setCollapsedPaths(new Set(nodes.map((node) => node.path)))
    }, [nodes])

    const collapseLevel = useCallback(
        (targetLevel: number) => {
            setCollapsedPaths(new Set(nodes.filter((node) => node.level >= targetLevel).map((node) => node.path)))
        },
        [nodes]
    )

    useImperativeHandle(
        ref,
        () => ({
            expandAll,
            collapseAll,
            collapseLevel
        }),
        [collapseAll, collapseLevel, expandAll]
    )

    const copyText = useCallback(async () => {
        if (onCopy) {
            onCopy()
            return
        }

        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            return
        }

        await navigator.clipboard.writeText(formatted)
    }, [formatted, onCopy])

    return (
        <div className={`json-tree ${plain ? 'no-highlight' : ''} ${className}`.trim()}>
            {showControls ? (
                <div className="controls">
                    <button type="button" onClick={copyText}>
                        复制JSON
                    </button>
                    {plain ? null : (
                        <>
                            <button type="button" onClick={expandAll}>
                                展开全部
                            </button>
                            <button type="button" onClick={collapseAll}>
                                折叠全部
                            </button>
                            <button type="button" onClick={() => collapseLevel(1)}>
                                折叠1级
                            </button>
                            <button type="button" onClick={() => collapseLevel(2)}>
                                折叠2级
                            </button>
                            <button type="button" onClick={() => collapseLevel(3)}>
                                折叠3级
                            </button>
                        </>
                    )}
                    {!lineNumbersEnabled ? (
                        <button type="button" onClick={() => setLineNumbersEnabled(true)}>
                            启用行号（较慢）
                        </button>
                    ) : null}
                </div>
            ) : null}
            <pre className={lineNumbersEnabled ? 'line-numbers json-collapsible' : 'json-collapsible'}>
                <code ref={codeRef} id="json-code">
                    {plain ? formatted : (
                        <TreeValue
                            value={value}
                            level={0}
                            path="root"
                            collapsedPaths={collapsedPaths}
                            onToggle={togglePath}
                        />
                    )}
                </code>
                {lineNumbersEnabled ? <LineNumbers count={lineCount} /> : null}
            </pre>
        </div>
    )
})
