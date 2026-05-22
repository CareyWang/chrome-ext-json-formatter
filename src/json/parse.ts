import { FORMAT_INDENT, MAX_JSON_CHARS } from "./constants"

export type JsonValue =
    | null
    | string
    | number
    | boolean
    | JsonValue[]
    | { [key: string]: JsonValue }

export type ParseResult =
    | {
          state: "ok"
          value: JsonValue
          raw: string
          formatted: string
      }
    | {
          state: "empty"
          message: string
      }
    | {
          state: "invalid"
          message: string
      }
    | {
          state: "too_large"
          message: string
          raw: string
          length: number
      }

export function trimJsonInput(text: string): string {
    return text.replace(/^\uFEFF/, "").trim()
}

export function looksLikeJson(text: string): boolean {
    return (
        (text.startsWith("{") && text.endsWith("}")) ||
        (text.startsWith("[") && text.endsWith("]"))
    )
}

export function formatJson(raw: string, options: { forceSize?: boolean } = {}): ParseResult {
    const trimmed = trimJsonInput(raw)

    if (trimmed.length === 0) {
        return {
            state: "empty",
            message: "等待输入..."
        }
    }

    if (!options.forceSize && trimmed.length > MAX_JSON_CHARS) {
        return {
            state: "too_large",
            message: `输入过大（${trimmed.length} 字符），请减少内容`,
            raw: trimmed,
            length: trimmed.length
        }
    }

    if (!looksLikeJson(trimmed)) {
        return {
            state: "invalid",
            message: "不是有效的 JSON（需要以 { 或 [ 开头并以 } 或 ] 结尾）"
        }
    }

    try {
        const value = JSON.parse(trimmed) as JsonValue

        return {
            state: "ok",
            value,
            raw: trimmed,
            formatted: JSON.stringify(value, null, FORMAT_INDENT)
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "未知错误"

        return {
            state: "invalid",
            message: `解析失败：${message}`
        }
    }
}

export function formatByteLike(count: number): string {
    const units = ["B", "KB", "MB", "GB"]
    let value = count
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex++
    }

    const fixed = unitIndex === 0 ? String(Math.round(value)) : value.toFixed(1)
    return `${fixed} ${units[unitIndex]}`
}
