import { MAX_NON_JSON_CHARS } from '../json/constants'
import { formatJson, looksLikeJson, trimJsonInput } from '../json/parse'

export const ROOT_ID = '__json_formatter_root__'
export const PRE_HIDE_STYLE_ID = '__json_formatter_pre_hide_style__'

export function isJsonContentType(contentType: string | null | undefined): boolean {
    if (!contentType) {
        return false
    }

    const lower = contentType.toLowerCase()
    return lower.includes('application/json') || lower.includes('text/json') || lower.includes('+json')
}

export function ensurePreHideStyle(): void {
    if (document.getElementById(PRE_HIDE_STYLE_ID)) {
        return
    }

    const style = document.createElement('style')
    style.id = PRE_HIDE_STYLE_ID
    style.textContent = `
        html, body { background: #f8f8f8 !important; }
        body > * { visibility: hidden !important; }
        body > #${ROOT_ID} { visibility: visible !important; }
    `

    ;(document.head || document.documentElement).appendChild(style)
}

export function removePreHideStyle(): void {
    document.getElementById(PRE_HIDE_STYLE_ID)?.remove()
}

export function getMeaningfulBodyChildren(body: HTMLElement): ChildNode[] {
    return Array.from(body.childNodes).filter((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            return (node.textContent || '').trim().length > 0
        }

        return true
    })
}

export function getSimpleTextCandidate(bodyChildren: ChildNode[]): string | null {
    if (!document.body || bodyChildren.length === 0) {
        return null
    }

    const allText = bodyChildren.every((node) => node.nodeType === Node.TEXT_NODE)

    if (allText) {
        return document.body.textContent
    }

    if (bodyChildren.length !== 1) {
        return null
    }

    const only = bodyChildren[0]

    if (only.nodeType === Node.TEXT_NODE) {
        return only.textContent
    }

    if (only.nodeType !== Node.ELEMENT_NODE) {
        return null
    }

    const element = only as HTMLElement

    if (element.tagName === 'PRE' || element.tagName === 'CODE') {
        return element.textContent
    }

    if (element.tagName === 'TEXTAREA') {
        return (element as HTMLTextAreaElement).value
    }

    if (element.children.length === 0) {
        return element.textContent
    }

    return null
}

export function getRawJsonTextCandidate(): string | null {
    if (!document.body) {
        return null
    }

    const bodyChildren = getMeaningfulBodyChildren(document.body)
    const contentTypeIsJson = isJsonContentType(document.contentType)

    if (contentTypeIsJson) {
        const simpleCandidate = getSimpleTextCandidate(bodyChildren)
        return simpleCandidate !== null ? simpleCandidate : document.body.textContent
    }

    return getSimpleTextCandidate(bodyChildren)
}

export function setProcessedMarker(): void {
    document.documentElement.dataset.jsonFormatterProcessed = '1'
}

export function alreadyProcessed(): boolean {
    return document.documentElement.dataset.jsonFormatterProcessed === '1'
}

export function shouldPreHideSinglePreJson(): boolean {
    if (alreadyProcessed() || !document.body) {
        return false
    }

    const bodyChildren = getMeaningfulBodyChildren(document.body)
    const text = getSimpleTextCandidate(bodyChildren)

    if (!text || text.length > MAX_NON_JSON_CHARS) {
        return false
    }

    const trimmed = trimJsonInput(text)
    const first = trimmed[0]

    return first === '{' || first === '['
}

export function getJsonPageCandidate(): {
    text: string
    preParsed: ReturnType<typeof formatJson> | null
} | null {
    const candidate = getRawJsonTextCandidate()

    if (!candidate) {
        return null
    }

    const trimmed = trimJsonInput(candidate)
    const contentTypeIsJson = isJsonContentType(document.contentType)

    if (!contentTypeIsJson && trimmed.length > MAX_NON_JSON_CHARS) {
        return null
    }

    if (!looksLikeJson(trimmed)) {
        return null
    }

    if (contentTypeIsJson) {
        return {
            text: candidate,
            preParsed: null
        }
    }

    const parsed = formatJson(candidate)

    if (parsed.state !== 'ok') {
        return null
    }

    return {
        text: candidate,
        preParsed: parsed
    }
}
