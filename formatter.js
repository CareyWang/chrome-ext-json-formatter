const MAX_JSON_CHARS = 10 * 1024 * 1024;
const debounceDelay = 300;

const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const inputStatusEl = document.getElementById('inputStatus');
const outputStatusEl = document.getElementById('outputStatus');
const formatBtn = document.getElementById('formatBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const minifyBtn = document.getElementById('minifyBtn');
const expandAllBtn = document.getElementById('expandAllBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn');
const collapse1Btn = document.getElementById('collapse1Btn');
const collapse2Btn = document.getElementById('collapse2Btn');
const collapse3Btn = document.getElementById('collapse3Btn');

let debounceTimer = null;
let lastFormattedText = '';
const toggleTargets = new WeakMap();

function formatJson(raw) {
    const trimmed = raw.replace(/^\uFEFF/, '').trim();
    if (trimmed.length === 0) {
        return {state: 'empty', message: '等待输入...'};
    }
    if (trimmed.length > MAX_JSON_CHARS) {
        return {state: 'too_large', message: `输入过大（${trimmed.length} 字符），请减少内容`};
    }
    const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (!looksLikeJson) {
        return {state: 'invalid', message: '不是有效的 JSON（需要以 { 或 [ 开头并以 } 或 ] 结尾）'};
    }
    try {
        const parsed = JSON.parse(trimmed);
        return {state: 'ok', value: parsed, formatted: JSON.stringify(parsed, null, 2)};
    } catch (error) {
        return {state: 'invalid', message: `解析失败：${error.message}`};
    }
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

function renderHighlighted(jsonValue) {
    outputEl.textContent = '';
    outputEl.appendChild(renderValue(jsonValue, 0));
}

function expandAll() {
    const toggles = outputEl.querySelectorAll('.collapse-toggle');
    toggles.forEach(toggle => {
        const targets = toggleTargets.get(toggle);
        if (!targets) return;
        setCollapsed(toggle, targets.content, targets.placeholder, false);
    });
}

function collapseAll() {
    const toggles = outputEl.querySelectorAll('.collapse-toggle');
    toggles.forEach(toggle => {
        const targets = toggleTargets.get(toggle);
        if (!targets) return;
        setCollapsed(toggle, targets.content, targets.placeholder, true);
    });
}

function collapseLevel(targetLevel) {
    expandAll();
    const toggles = outputEl.querySelectorAll('.collapse-toggle');
    toggles.forEach(toggle => {
        const level = parseInt(toggle.dataset.level || '0', 10);
        if (level >= targetLevel) {
            const targets = toggleTargets.get(toggle);
            if (!targets) return;
            setCollapsed(toggle, targets.content, targets.placeholder, true);
        }
    });
}

function updateStatus(result, inputLength) {
    if (inputLength === 0) {
        inputStatusEl.textContent = '未输入';
    } else {
        inputStatusEl.textContent = `输入长度：${inputLength} 字符`;
    }

    if (result.state === 'ok') {
        outputStatusEl.textContent = `输出长度：${result.formatted.length} 字符`;
    } else if (result.state === 'too_large') {
        outputStatusEl.textContent = '超过大小限制';
    } else if (result.state === 'invalid') {
        outputStatusEl.textContent = '格式错误';
    } else {
        outputStatusEl.textContent = '-';
    }
}

function renderResult(result, inputLength) {
    outputEl.classList.remove('error');

    if (result.state === 'ok') {
        renderHighlighted(result.value);
        lastFormattedText = result.formatted;
    } else {
        outputEl.textContent = result.message;
        if (result.state !== 'empty') {
            outputEl.classList.add('error');
        }
        lastFormattedText = '';
    }

    updateStatus(result, inputLength);
}

function handleFormat() {
    const raw = inputEl.value;
    const result = formatJson(raw);
    renderResult(result, raw.length);
}

function scheduleFormat() {
    if (debounceTimer) {
        window.clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(handleFormat, debounceDelay);
}

function clearAll() {
    inputEl.value = '';
    renderResult({state: 'empty', message: '等待输入...'}, 0);
    inputEl.focus();
}

async function copyOutput() {
    const text = lastFormattedText;
    if (!text || outputEl.classList.contains('error')) {
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        outputStatusEl.textContent = '已复制到剪贴板';
        window.setTimeout(() => {
            handleFormat();
        }, 1200);
    } catch (_) {
        outputStatusEl.textContent = '复制失败（请手动复制）';
    }
}

function minifyOutput() {
    if (!lastFormattedText || outputEl.classList.contains('error')) {
        return;
    }
    try {
        const parsed = JSON.parse(lastFormattedText);
        const minified = JSON.stringify(parsed);
        outputEl.textContent = minified;
        outputEl.classList.remove('error');
        lastFormattedText = minified;
        outputStatusEl.textContent = `输出长度：${minified.length} 字符（已压缩）`;
    } catch (_) {
        outputStatusEl.textContent = '压缩失败（格式不正确）';
    }
}

inputEl.addEventListener('input', scheduleFormat);
formatBtn.addEventListener('click', handleFormat);
clearBtn.addEventListener('click', clearAll);
copyBtn.addEventListener('click', copyOutput);
minifyBtn.addEventListener('click', minifyOutput);
expandAllBtn.addEventListener('click', expandAll);
collapseAllBtn.addEventListener('click', collapseAll);
collapse1Btn.addEventListener('click', () => collapseLevel(1));
collapse2Btn.addEventListener('click', () => collapseLevel(2));
collapse3Btn.addEventListener('click', () => collapseLevel(3));

renderResult({state: 'empty', message: '等待输入...'}, 0);
