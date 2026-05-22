export const jsonTreeStyles = `
    :host, * {
        box-sizing: border-box;
    }

    .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
        padding: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }

    button {
        margin: 0;
        padding: 6px 10px;
        border: 1px solid #ddd;
        background: #f8f8f8;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        color: #222;
    }

    button:hover {
        background: #ededed;
    }

    button:active {
        transform: translateY(1px);
    }

    pre {
        white-space: pre-wrap;
        word-break: break-word;
        background: transparent;
        padding: 14px;
        line-height: 1.55;
        margin: 0;
        border-top: 1px solid #eee;
        font-family: 'Monaco', 'SF Mono', 'Consolas', monospace;
        font-size: 13px;
        overflow: auto;
    }

    code {
        font-family: inherit;
    }

    .string {
        color: #0b7522;
    }

    .number {
        color: #0000ff;
    }

    .boolean,
    .null {
        color: #bc00bc;
    }

    .key {
        color: #a52a2a;
    }

    .no-highlight .string,
    .no-highlight .number,
    .no-highlight .boolean,
    .no-highlight .null,
    .no-highlight .key {
        color: inherit;
    }

    .line-numbers-rows {
        position: absolute;
        pointer-events: none;
        top: 14px;
        left: 0;
        width: 3em;
        letter-spacing: -1px;
        border-right: 1px solid #e0e0e0;
        user-select: none;
    }

    .line-numbers-rows > span {
        display: block;
        counter-increment: line;
    }

    .line-numbers-rows > span::before {
        content: counter(line);
        color: #9a9a9a;
        display: block;
        padding-right: 0.8em;
        text-align: right;
    }

    pre.line-numbers {
        position: relative;
        padding-left: 3.8em;
        counter-reset: line;
    }

    .indent-guides {
        display: inline-block;
        white-space: pre-wrap;
        color: transparent;
        position: relative;
    }

    .indent-guide {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background-image: linear-gradient(to bottom, #d7d7d7 0 3px, transparent 3px 6px);
        background-size: 1px 6px;
        background-repeat: repeat-y;
        pointer-events: none;
    }

    .indent-guide:nth-child(1) { left: 1ch; }
    .indent-guide:nth-child(2) { left: 3ch; }
    .indent-guide:nth-child(3) { left: 5ch; }
    .indent-guide:nth-child(4) { left: 7ch; }
    .indent-guide:nth-child(5) { left: 9ch; }
    .indent-guide:nth-child(6) { left: 11ch; }
    .indent-guide:nth-child(7) { left: 13ch; }
    .indent-guide:nth-child(8) { left: 15ch; }
    .indent-guide:nth-child(9) { left: 17ch; }
    .indent-guide:nth-child(10) { left: 19ch; }
    .indent-guide:nth-child(11) { left: 21ch; }
    .indent-guide:nth-child(12) { left: 23ch; }
    .indent-guide:nth-child(13) { left: 25ch; }
    .indent-guide:nth-child(14) { left: 27ch; }
    .indent-guide:nth-child(15) { left: 29ch; }
    .indent-guide:nth-child(16) { left: 31ch; }
    .indent-guide:nth-child(17) { left: 33ch; }
    .indent-guide:nth-child(18) { left: 35ch; }
    .indent-guide:nth-child(19) { left: 37ch; }
    .indent-guide:nth-child(20) { left: 39ch; }

    .collapse-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        margin: 0 6px 0 0;
        padding: 0;
        cursor: pointer;
        user-select: none;
        font-size: 11px;
        line-height: 14px;
        background: #e9e9e9;
        border: 1px solid #dadada;
        border-radius: 4px;
        color: #555;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }

    .collapse-toggle:hover {
        background: #dfdfdf;
    }

    .collapse-toggle.collapsed {
        background: #d3d3d3;
    }

    .json-content {
        display: inline;
    }

    .json-content.collapsed {
        display: none;
    }

    .json-placeholder {
        display: none;
        color: #8a8a8a;
        font-style: italic;
    }

    .json-placeholder.show {
        display: inline;
    }
`
