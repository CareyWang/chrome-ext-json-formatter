// content.js
console.log('JSON Formatter Content Script Loaded...');

const MAX_JSON_CHARS = 10 * 1024 * 1024; // 10MB (按字符粗略限制，避免极大 JSON 卡死)
const MAX_STRUCTURED_RENDER_CHARS = 800 * 1024; // 超过该大小默认用纯文本渲染，避免大量 DOM 构建卡顿

const ROOT_ID = '__json_formatter_root__';
const PRE_HIDE_STYLE_ID = '__json_formatter_pre_hide_style__';

let formattingStarted = false;

function isJsonContentType(contentType) {
    if (!contentType) return false;
    const lower = contentType.toLowerCase();
    return lower.includes('application/json') || lower.includes('text/json') || lower.includes('+json');
}

function ensurePreHideStyle() {
    if (document.getElementById(PRE_HIDE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = PRE_HIDE_STYLE_ID;
    style.textContent = `
        html, body { background: #f8f8f8 !important; }
        body > * { visibility: hidden !important; }
        body > #${ROOT_ID} { visibility: visible !important; }
    `;

    (document.head || document.documentElement).appendChild(style);
}

function removePreHideStyle() {
    const style = document.getElementById(PRE_HIDE_STYLE_ID);
    if (style) style.remove();
}

function getMeaningfulBodyChildren(body) {
    return Array.from(body.childNodes).filter(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.trim().length > 0;
        }
        return true;
    });
}

function getRawJsonTextCandidate() {
    if (!document.body) return null;

    const bodyChildren = getMeaningfulBodyChildren(document.body);
    const contentTypeIsJson = isJsonContentType(document.contentType);

    // Chrome 打开 raw JSON 往往是单个 <pre>
    if (bodyChildren.length === 1) {
        const only = bodyChildren[0];
        if (only.nodeType === Node.ELEMENT_NODE && only.tagName === 'PRE') {
            return only.textContent;
        }
    }

    // 仅在明确是 JSON Content-Type 时才用 body.textContent，避免误判 HTML 页面
    if (contentTypeIsJson) {
        return document.body.textContent;
    }

    return null;
}

function tryParseJson(text) {
    if (typeof text !== 'string') return {ok: false};
    const trimmed = text.replace(/^\uFEFF/, '').trim();
    if (trimmed.length === 0) return {ok: false};
    if (trimmed.length > MAX_JSON_CHARS) return {ok: false, tooLarge: true, length: trimmed.length};

    const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return {ok: false};

    try {
        return {ok: true, value: JSON.parse(trimmed), raw: trimmed};
    } catch (error) {
        return {ok: false, error};
    }
}

function setProcessedMarker() {
    try {
        document.documentElement.dataset.jsonFormatterProcessed = '1';
    } catch (_) {
        // ignore
    }
}

function alreadyProcessed() {
    try {
        return document.documentElement.dataset.jsonFormatterProcessed === '1';
    } catch (_) {
        return false;
    }
}

function clearBody() {
    if (!document.body) return;
    document.body.textContent = '';
}

function applyShadowStyles(shadowRoot, cssText) {
    const canUseAdopted = typeof CSSStyleSheet !== 'undefined' &&
        'adoptedStyleSheets' in shadowRoot &&
        typeof CSSStyleSheet.prototype.replaceSync === 'function';

    if (canUseAdopted) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        shadowRoot.adoptedStyleSheets = [sheet];
        return;
    }

    const style = document.createElement('style');
    style.textContent = cssText;
    shadowRoot.appendChild(style);
}

function formatByteLike(count) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = count;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    const fixed = unitIndex === 0 ? String(Math.round(value)) : value.toFixed(1);
    return `${fixed} ${units[unitIndex]}`;
}

function renderErrorPage(message) {
    clearBody();
    setProcessedMarker();
    removePreHideStyle();

    const host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({mode: 'open'});
    applyShadowStyles(shadow, `
        :host, * { box-sizing: border-box; }
        .wrap { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 24px; }
        .card { max-width: 900px; margin: 0 auto; padding: 16px 18px; background: #fff; border: 1px solid #eee; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
        .title { font-weight: 600; margin: 0 0 6px; }
        .msg { margin: 0; color: #444; line-height: 1.5; }
    `);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    shadow.appendChild(wrap);

    const card = document.createElement('div');
    card.className = 'card';
    wrap.appendChild(card);

    const title = document.createElement('p');
    title.className = 'title';
    title.textContent = 'JSON Formatter';
    card.appendChild(title);

    const msg = document.createElement('p');
    msg.className = 'msg';
    msg.textContent = message;
    card.appendChild(msg);
}

function renderLargeJsonPage(rawText) {
    clearBody();
    setProcessedMarker();
    removePreHideStyle();

    const host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({mode: 'open'});
    applyShadowStyles(shadow, `
        :host, * { box-sizing: border-box; }
        .page { font-family: 'Monaco', 'SF Mono', 'Consolas', monospace; background: #f8f8f8; min-height: 100vh; }
        .card {
            background: #fff;
            border-radius: 10px;
            border: 1px solid #eee;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            overflow: hidden;
            margin: 18px;
        }
        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: flex-end;
            padding: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            border-bottom: 1px solid #eee;
        }
        .controls button {
            margin: 0;
            padding: 6px 10px;
            border: 1px solid #ddd;
            background: #f8f8f8;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
        }
        .controls button:hover { background: #ededed; }
        .warning {
            padding: 10px;
            background: #fff3cd;
            border-bottom: 1px solid #ffeaa7;
            color: #856404;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 13px;
        }
        .container { padding: 0; margin: 0; }
        pre {
            margin: 0;
            padding: 14px;
            background: transparent;
            line-height: 1.55;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: calc(100vh - 120px);
            overflow: auto;
        }
        code { font-family: inherit; }
    `);

    const page = document.createElement('div');
    page.className = 'page';
    shadow.appendChild(page);

    const card = document.createElement('div');
    card.className = 'card';
    page.appendChild(card);

    const controls = document.createElement('div');
    controls.className = 'controls';
    card.appendChild(controls);

    function addButton(label, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        controls.appendChild(btn);
        return btn;
    }

    const warning = document.createElement('div');
    warning.className = 'warning';
    warning.textContent = `JSON 过大（约 ${formatByteLike(rawText.length)}），已跳过格式化以避免卡顿。以下为原文内容：`;
    card.appendChild(warning);

    const container = document.createElement('div');
    container.className = 'container';
    card.appendChild(container);

    const pre = document.createElement('pre');
    container.appendChild(pre);

    const code = document.createElement('code');
    code.id = 'json-raw-content';
    pre.appendChild(code);

    addButton('复制原文', () => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(rawText).catch(() => {});
        } else {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = rawText;
                textarea.style.position = 'fixed';
                textarea.style.top = '0';
                textarea.style.left = '0';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
            } catch (_) {
            }
        }
    });

    addButton('全选', () => {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    });

    addButton('滚动到顶部', () => {
        pre.scrollTop = 0;
    });

    addButton('滚动到底部', () => {
        pre.scrollTop = pre.scrollHeight;
    });

    code.textContent = rawText;
}

function removeExistingHost() {
    if (!document.body) return;
    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();
}

function renderLoadingPage(approxLength) {
    if (!document.body) return;

    removeExistingHost();
    ensurePreHideStyle();

    const host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({mode: 'open'});
    applyShadowStyles(shadow, `
        :host, * { box-sizing: border-box; }
        .page { min-height: 100vh; background: #f8f8f8; display: flex; align-items: center; justify-content: center; }
        .card {
            width: min(520px, calc(100vw - 32px));
            background: #fff;
            border: 1px solid #eee;
            border-radius: 12px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            padding: 18px 18px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        .title { font-weight: 600; margin: 0 0 8px; }
        .row { display: flex; align-items: center; gap: 10px; }
        .spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid #ddd;
            border-top-color: #666;
            animation: spin 1s linear infinite;
            flex: 0 0 auto;
        }
        .text { margin: 0; color: #444; font-size: 13px; line-height: 1.5; }
        .meta { margin: 8px 0 0; color: #777; font-size: 12px; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `);

    const page = document.createElement('div');
    page.className = 'page';
    shadow.appendChild(page);

    const card = document.createElement('div');
    card.className = 'card';
    page.appendChild(card);

    const title = document.createElement('p');
    title.className = 'title';
    title.textContent = 'JSON Formatter';
    card.appendChild(title);

    const row = document.createElement('div');
    row.className = 'row';
    card.appendChild(row);

    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    row.appendChild(spinner);

    const text = document.createElement('p');
    text.className = 'text';
    text.textContent = '正在格式化 JSON…';
    row.appendChild(text);

    if (typeof approxLength === 'number') {
        const meta = document.createElement('p');
        meta.className = 'meta';
        meta.textContent = `大小：约 ${formatByteLike(approxLength)}`;
        card.appendChild(meta);
    }
}

function countNewlines(text) {
    let count = 0;
    let index = 0;
    while (true) {
        index = text.indexOf('\n', index);
        if (index === -1) break;
        count++;
        index++;
    }
    return count;
}

function renderJsonPage(jsonValue, options = {}) {
    clearBody();
    setProcessedMarker();
    removePreHideStyle();

    const preferPlain = options.preferPlain === true;

    const host = document.createElement('div');
    host.id = ROOT_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({mode: 'open'});
    applyShadowStyles(shadow, `
        :host, * { box-sizing: border-box; }
        .page { font-family: 'Monaco', 'SF Mono', 'Consolas', monospace; background: #f8f8f8; min-height: 100vh; }
        .card {
            background: #fff;
            border-radius: 10px;
            border: 1px solid #eee;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            overflow: hidden;
        }
        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            justify-content: flex-end;
            padding: 10px 10px 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        .controls button {
            margin: 0;
            padding: 6px 10px;
            border: 1px solid #ddd;
            background: #f8f8f8;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
        }
        .controls button:hover { background: #ededed; }
        .container { padding: 18px; margin: 0 auto; max-width: 98%; }
        pre {
            white-space: pre-wrap;
            word-break: break-word;
            background: transparent;
            padding: 14px;
            line-height: 1.55;
            margin: 0;
            border-top: 1px solid #eee;
        }
        code { font-family: inherit; }

        /* 语法高亮（简单 token 样式，避免依赖第三方脚本） */
        .string { color: #0b7522; }
        .number { color: #0000ff; }
        .boolean { color: #bc00bc; }
        .null { color: #bc00bc; }
        .key { color: #a52a2a; }

        /* 行号 */
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
        .line-numbers-rows > span { display: block; counter-increment: line; }
        .line-numbers-rows > span:before {
            content: counter(line);
            color: #9a9a9a;
            display: block;
            padding-right: 0.8em;
            text-align: right;
        }
        pre.line-numbers { position: relative; padding-left: 3.8em; counter-reset: line; }

        .indent-guides {
            display: inline-block;
            white-space: pre;
            color: transparent;
            position: relative;
        }

        /* 折叠 */
        .collapse-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            margin-right: 6px;
            cursor: pointer;
            user-select: none;
            font-size: 11px;
            line-height: 14px;
            background: #e9e9e9;
            border: 1px solid #dadada;
            border-radius: 4px;
            color: #555;
            font-weight: 700;
        }
        .collapse-toggle:hover { background: #dfdfdf; }
        .collapse-toggle.collapsed { background: #d3d3d3; }
        .json-content { display: inline; }
        .json-content.collapsed { display: none; }
        .json-placeholder { display: none; color: #8a8a8a; font-style: italic; }
        .json-placeholder.show { display: inline; }
    `);

    const page = document.createElement('div');
    page.className = 'page';
    shadow.appendChild(page);

    function addButton(label, onClick, beforeNode) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        if (beforeNode) {
            controls.insertBefore(btn, beforeNode);
        } else {
            controls.appendChild(btn);
        }
        return btn;
    }

    const container = document.createElement('div');
    container.className = 'container';
    page.appendChild(container);

    const card = document.createElement('div');
    card.className = 'card';
    container.appendChild(card);

    const controls = document.createElement('div');
    controls.className = 'controls';
    card.appendChild(controls);

    const pre = document.createElement('pre');
    pre.className = 'line-numbers json-collapsible';
    card.appendChild(pre);

    const code = document.createElement('code');
    code.id = 'json-code';
    pre.appendChild(code);

    const toggleTargets = new WeakMap();
    let lineNumbersScheduled = false;
    let plainTextForLineNumbers = null;

    function scheduleLineNumbersUpdate() {
        if (lineNumbersScheduled) return;
        lineNumbersScheduled = true;
        requestAnimationFrame(() => {
            lineNumbersScheduled = false;
            updateLineNumbers();
        });
    }

    function countVisibleNewlines(node) {
        let newlineCount = 0;
        for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                newlineCount += countNewlines(child.textContent || '');
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child;
                if (el.classList.contains('json-content') && el.classList.contains('collapsed')) {
                    continue;
                }
                if (el.classList.contains('json-placeholder')) {
                    if (el.classList.contains('show')) {
                        newlineCount += countNewlines(el.textContent || '');
                    }
                    continue;
                }
                newlineCount += countVisibleNewlines(el);
            }
        }
        return newlineCount;
    }

    function addLineNumbers() {
        const linesCount = plainTextForLineNumbers !== null
            ? countNewlines(plainTextForLineNumbers) + 1
            : countVisibleNewlines(code) + 1;

        const lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.className = 'line-numbers-rows';
        for (let i = 0; i < linesCount; i++) {
            lineNumbersWrapper.appendChild(document.createElement('span'));
        }
        pre.appendChild(lineNumbersWrapper);
    }

    function updateLineNumbers() {
        const existing = pre.querySelector('.line-numbers-rows');
        if (existing) existing.remove();
        addLineNumbers();
    }

    function setCollapsed(toggle, content, placeholder, collapsed) {
        if (collapsed) {
            content.classList.add('collapsed');
            placeholder.classList.add('show');
            toggle.textContent = '+';
            toggle.classList.add('collapsed');
        } else {
            content.classList.remove('collapsed');
            placeholder.classList.remove('show');
            toggle.textContent = '-';
            toggle.classList.remove('collapsed');
        }
    }

    function createTokenSpan(className, text) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        return span;
    }

    function createIndentSpan(level) {
        const span = document.createElement('span');
        span.className = 'indent-guides';
        span.textContent = '  '.repeat(level);

        if (level > 0) {
            const images = [];
            const positions = [];
            const sizes = [];
            const repeats = [];

            for (let i = 1; i <= level; i++) {
                images.push('linear-gradient(to bottom, #d7d7d7 0 3px, transparent 3px 6px)');
                positions.push(`${(i - 1) * 2 + 1}ch 0`);
                sizes.push('1px 6px');
                repeats.push('repeat-y');
            }

            span.style.backgroundImage = images.join(', ');
            span.style.backgroundPosition = positions.join(', ');
            span.style.backgroundSize = sizes.join(', ');
            span.style.backgroundRepeat = repeats.join(', ');
        }

        return span;
    }

    function appendIndent(parent, level) {
        parent.appendChild(createIndentSpan(level));
    }

    function newId(prefix) {
        return `${prefix}${Math.random().toString(36).slice(2, 11)}`;
    }

    function renderValue(value, level) {
        const fragment = document.createDocumentFragment();

        if (value === null) {
            fragment.appendChild(createTokenSpan('null', 'null'));
            return fragment;
        }
        if (typeof value === 'string') {
            fragment.appendChild(createTokenSpan('string', JSON.stringify(value)));
            return fragment;
        }
        if (typeof value === 'number') {
            fragment.appendChild(createTokenSpan('number', String(value)));
            return fragment;
        }
        if (typeof value === 'boolean') {
            fragment.appendChild(createTokenSpan('boolean', String(value)));
            return fragment;
        }

        const indent = '  '.repeat(level);
        const nextIndent = '  '.repeat(level + 1);

        if (Array.isArray(value)) {
            if (value.length === 0) {
                fragment.appendChild(document.createTextNode('[]'));
                return fragment;
            }

            const toggle = document.createElement('span');
            toggle.className = 'collapse-toggle';
            toggle.textContent = '-';
            toggle.dataset.level = String(level);

            const content = document.createElement('span');
            content.className = 'json-content';
            content.id = newId('content_');

            const placeholder = document.createElement('span');
            placeholder.className = 'json-placeholder';
            placeholder.id = newId('placeholder_');
            placeholder.textContent = `... ${value.length} 项`;

            toggleTargets.set(toggle, {content, placeholder});
            toggle.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');
                setCollapsed(toggle, content, placeholder, !isCollapsed);
                scheduleLineNumbersUpdate();
            });

            fragment.appendChild(toggle);
            fragment.appendChild(document.createTextNode('[\n'));
            appendIndent(fragment, level + 1);
            fragment.appendChild(content);

            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    content.appendChild(document.createTextNode(',\n'));
                    appendIndent(content, level + 1);
                }
                content.appendChild(renderValue(value[i], level + 1));
            }

            fragment.appendChild(placeholder);
            fragment.appendChild(document.createTextNode('\n'));
            appendIndent(fragment, level);
            fragment.appendChild(document.createTextNode(']'));
            return fragment;
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                fragment.appendChild(document.createTextNode('{}'));
                return fragment;
            }

            const toggle = document.createElement('span');
            toggle.className = 'collapse-toggle';
            toggle.textContent = '-';
            toggle.dataset.level = String(level);

            const content = document.createElement('span');
            content.className = 'json-content';
            content.id = newId('content_');

            const placeholder = document.createElement('span');
            placeholder.className = 'json-placeholder';
            placeholder.id = newId('placeholder_');
            placeholder.textContent = `... ${keys.length} 属性`;

            toggleTargets.set(toggle, {content, placeholder});
            toggle.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');
                setCollapsed(toggle, content, placeholder, !isCollapsed);
                scheduleLineNumbersUpdate();
            });

            fragment.appendChild(toggle);
            fragment.appendChild(document.createTextNode('{\n'));
            appendIndent(fragment, level + 1);
            fragment.appendChild(content);

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (i > 0) {
                    content.appendChild(document.createTextNode(',\n'));
                    appendIndent(content, level + 1);
                }
                content.appendChild(createTokenSpan('key', JSON.stringify(key)));
                content.appendChild(document.createTextNode(': '));
                content.appendChild(renderValue(value[key], level + 1));
            }

            fragment.appendChild(placeholder);
            fragment.appendChild(document.createTextNode('\n'));
            appendIndent(fragment, level);
            fragment.appendChild(document.createTextNode('}'));
            return fragment;
        }

        fragment.appendChild(document.createTextNode(String(value)));
        return fragment;
    }

    function expandAll() {
        const toggles = shadow.querySelectorAll('.collapse-toggle');
        toggles.forEach(toggle => {
            const targets = toggleTargets.get(toggle);
            if (!targets) return;
            setCollapsed(toggle, targets.content, targets.placeholder, false);
        });
        scheduleLineNumbersUpdate();
    }

    function collapseAll() {
        const toggles = shadow.querySelectorAll('.collapse-toggle');
        toggles.forEach(toggle => {
            const targets = toggleTargets.get(toggle);
            if (!targets) return;
            setCollapsed(toggle, targets.content, targets.placeholder, true);
        });
        scheduleLineNumbersUpdate();
    }

    function collapseLevel(targetLevel) {
        expandAll();
        const toggles = shadow.querySelectorAll('.collapse-toggle');
        toggles.forEach(toggle => {
            const level = parseInt(toggle.dataset.level || '0', 10);
            if (level >= targetLevel) {
                const targets = toggleTargets.get(toggle);
                if (!targets) return;
                setCollapsed(toggle, targets.content, targets.placeholder, true);
            }
        });
        scheduleLineNumbersUpdate();
    }

    function copyPrettyJson() {
        const text = JSON.stringify(jsonValue, null, 2);
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).catch(() => {
                // ignore
            });
            return;
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.top = '0';
            textarea.style.left = '0';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        } catch (_) {
            // ignore
        }
    }

    function addFoldButtons(beforeNode) {
        addButton('展开全部', expandAll, beforeNode);
        addButton('折叠全部', collapseAll, beforeNode);
        addButton('折叠1级', () => collapseLevel(1), beforeNode);
        addButton('折叠2级', () => collapseLevel(2), beforeNode);
        addButton('折叠3级', () => collapseLevel(3), beforeNode);
    }

    const copyBtn = addButton('复制JSON', copyPrettyJson);

    function renderPlainText() {
        const text = JSON.stringify(jsonValue, null, 2);
        plainTextForLineNumbers = text;
        code.textContent = text;
        updateLineNumbers();
    }

    function renderStructured() {
        plainTextForLineNumbers = null;
        code.textContent = '';
        code.appendChild(renderValue(jsonValue, 0));
        updateLineNumbers();
    }

    if (preferPlain) {
        const btnEnable = addButton('启用折叠（较慢）', () => {
            addFoldButtons(copyBtn);
            renderStructured();
            btnEnable.remove();
        }, copyBtn);
        renderPlainText();
    } else {
        addFoldButtons(copyBtn);
        renderStructured();
    }
}

function tryFormatIfJsonPage() {
    if (alreadyProcessed()) return;
    if (formattingStarted) return;
    if (window.self !== window.top) return;
    if (!document.body) return;

    const candidate = getRawJsonTextCandidate();
    if (!candidate) return;

    const trimmed = candidate.replace(/^\uFEFF/, '').trim();
    const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) return;

    formattingStarted = true;
    ensurePreHideStyle();
    renderLoadingPage(trimmed.length);

    // 让浏览器先绘制 loading，再做 JSON.parse / 大量 DOM 构建
    setTimeout(() => {
        const parsed = tryParseJson(candidate);
        if (parsed.tooLarge) {
            renderLargeJsonPage(parsed.raw || trimmed);
            return;
        }
        if (!parsed.ok) {
            removeExistingHost();
            removePreHideStyle();
            return;
        }

        const rawLength = typeof parsed.raw === 'string' ? parsed.raw.length : trimmed.length;
        const preferPlain = rawLength > MAX_STRUCTURED_RENDER_CHARS;
        renderJsonPage(parsed.value, {preferPlain});
    }, 0);
}

// 尽可能早一点避免 raw JSON 先被渲染出来（导致闪屏）
if (window.self === window.top && isJsonContentType(document.contentType)) {
    ensurePreHideStyle();
}

// 对于非 JSON Content-Type 但 Chrome 用单个 <pre> 展示的场景，尽早检测并预隐藏，减少闪屏
if (window.self === window.top && !isJsonContentType(document.contentType)) {
    const applyPreHideIfSinglePreJson = () => {
        if (alreadyProcessed() || formattingStarted) return false;
        if (!document.body) return false;
        const bodyChildren = getMeaningfulBodyChildren(document.body);
        if (bodyChildren.length !== 1) return false;
        const only = bodyChildren[0];
        if (only.nodeType !== Node.ELEMENT_NODE || only.tagName !== 'PRE') return false;

        const text = only.textContent || '';
        const match = text.match(/[^\s\uFEFF]/);
        const first = match ? match[0] : '';
        if (first !== '{' && first !== '[') return false;

        ensurePreHideStyle();
        return true;
    };

    if (!applyPreHideIfSinglePreJson()) {
        const observer = new MutationObserver(() => {
            if (applyPreHideIfSinglePreJson()) {
                observer.disconnect();
                return;
            }
            if (!document.body) return;
            const bodyChildren = getMeaningfulBodyChildren(document.body);
            if (bodyChildren.length > 1) {
                observer.disconnect();
                return;
            }
            if (bodyChildren.length === 1) {
                const only = bodyChildren[0];
                if (only.nodeType !== Node.ELEMENT_NODE || only.tagName !== 'PRE') {
                    observer.disconnect();
                }
            }
        });
        observer.observe(document.documentElement, {childList: true, subtree: true});
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryFormatIfJsonPage);
} else {
    tryFormatIfJsonPage();
}
