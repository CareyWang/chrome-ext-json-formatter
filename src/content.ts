import type { PlasmoCSConfig } from 'plasmo'
import { createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import {
    ROOT_ID,
    alreadyProcessed,
    ensurePreHideStyle,
    getJsonPageCandidate,
    getMeaningfulBodyChildren,
    isJsonContentType,
    removePreHideStyle,
    setProcessedMarker,
    shouldPreHideSinglePreJson
} from './content/detect'
import { contentStyles } from './content/contentStyles'
import { JsonPage, LargeJsonPage, LoadingPage } from './content/JsonPage'
import { MAX_STRUCTURED_RENDER_CHARS } from './json/constants'
import { formatJson, trimJsonInput, type JsonValue } from './json/parse'

export const config: PlasmoCSConfig = {
    matches: ['http://*/*', 'https://*/*'],
    run_at: 'document_start'
}

let formattingStarted = false
let root: Root | null = null

function removeExistingHost(): void {
    document.getElementById(ROOT_ID)?.remove()
    root = null
}

function mountReact(element: ReactElement, finalRender: boolean): void {
    if (!document.body) {
        return
    }

    if (finalRender) {
        document.body.textContent = ''
        setProcessedMarker()
        removePreHideStyle()
    } else {
        removeExistingHost()
    }

    const host = document.createElement('div')
    host.id = ROOT_ID
    document.body.appendChild(host)

    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = contentStyles
    shadow.appendChild(style)

    const mountNode = document.createElement('div')
    shadow.appendChild(mountNode)
    root = createRoot(mountNode)
    root.render(element)
}

function renderLoadingPage(approxLength: number): void {
    ensurePreHideStyle()
    mountReact(createElement(LoadingPage, { approxLength }), false)
}

function renderJsonPage(value: JsonValue, preferPlain: boolean): void {
    mountReact(createElement(JsonPage, { value, preferPlain }), true)
}

function renderLargeJsonPage(rawText: string): void {
    mountReact(
        createElement(LargeJsonPage, {
            rawText,
            onRenderJson: renderJsonPage
        }),
        true
    )
}

function clearLoadingFallback(): void {
    removeExistingHost()
    removePreHideStyle()
    formattingStarted = false
}

function tryFormatIfJsonPage(): void {
    if (alreadyProcessed() || formattingStarted || window.self !== window.top || !document.body) {
        return
    }

    const candidate = getJsonPageCandidate()

    if (!candidate) {
        return
    }

    const trimmed = trimJsonInput(candidate.text)
    formattingStarted = true
    renderLoadingPage(trimmed.length)

    window.setTimeout(() => {
        const parsed = candidate.preParsed || formatJson(candidate.text)

        if (parsed.state === 'too_large') {
            renderLargeJsonPage(parsed.raw || trimmed)
            return
        }

        if (parsed.state !== 'ok') {
            clearLoadingFallback()
            return
        }

        renderJsonPage(parsed.value, parsed.raw.length > MAX_STRUCTURED_RENDER_CHARS)
    }, 0)
}

function setupEarlyPreHideObserver(): void {
    if (window.self !== window.top || isJsonContentType(document.contentType)) {
        return
    }

    const applyPreHideIfSinglePreJson = () => {
        if (!shouldPreHideSinglePreJson()) {
            return false
        }

        ensurePreHideStyle()
        return true
    }

    if (applyPreHideIfSinglePreJson()) {
        return
    }

    const observer = new MutationObserver(() => {
        if (applyPreHideIfSinglePreJson()) {
            observer.disconnect()
            return
        }

        if (!document.body) {
            return
        }

        const bodyChildren = getMeaningfulBodyChildren(document.body)

        if (bodyChildren.length > 1) {
            observer.disconnect()
            return
        }

        if (bodyChildren.length === 1) {
            const only = bodyChildren[0]

            if (only.nodeType !== Node.ELEMENT_NODE || (only as HTMLElement).tagName !== 'PRE') {
                observer.disconnect()
            }
        }
    })

    observer.observe(document.documentElement, { childList: true, subtree: true })
}

if (window.self === window.top && isJsonContentType(document.contentType)) {
    ensurePreHideStyle()
}

setupEarlyPreHideObserver()

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryFormatIfJsonPage)
} else {
    tryFormatIfJsonPage()
}
