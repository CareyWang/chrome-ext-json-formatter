import { jsonTreeStyles } from '../json/jsonTreeStyles'

export const contentStyles = `
    ${jsonTreeStyles}

    .page {
        font-family: 'Monaco', 'SF Mono', 'Consolas', monospace;
        background: #f8f8f8;
        color: #222;
        min-height: 100vh;
    }

    .container {
        padding: 18px;
        margin: 0 auto;
        max-width: 98%;
    }

    .card {
        background: #fff;
        border-radius: 10px;
        border: 1px solid #eee;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        overflow: hidden;
    }

    .large-card {
        margin: 18px;
    }

    .loading-page {
        min-height: 100vh;
        background: #f8f8f8;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-card,
    .error-card {
        width: min(520px, calc(100vw - 32px));
        background: #fff;
        border: 1px solid #eee;
        border-radius: 12px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
        padding: 18px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }

    .error-card {
        max-width: 900px;
        margin: 24px auto;
    }

    .loading-title,
    .error-title {
        font-weight: 600;
        margin: 0 0 8px;
    }

    .loading-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .spinner {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #ddd;
        border-top-color: #666;
        animation: spin 1s linear infinite;
        flex: 0 0 auto;
    }

    .loading-text,
    .error-message {
        margin: 0;
        color: #444;
        font-size: 13px;
        line-height: 1.5;
    }

    .loading-meta {
        margin: 8px 0 0;
        color: #777;
        font-size: 12px;
    }

    .warning {
        padding: 10px;
        background: #fff3cd;
        border-bottom: 1px solid #ffeaa7;
        color: #856404;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        font-size: 13px;
    }

    .raw-textarea {
        margin: 0;
        padding: 14px;
        background: transparent;
        line-height: 1.55;
        white-space: pre;
        width: 100%;
        height: calc(100vh - 120px);
        border: 0;
        resize: none;
        outline: none;
        overflow: auto;
        font-family: 'Monaco', 'SF Mono', 'Consolas', monospace;
        font-size: 13px;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`
