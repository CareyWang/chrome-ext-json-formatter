// content.js
console.log('JSON Formatter Content Script Loaded...');

// 保存已处理的URL，避免重复处理
let processedUrls = new Set();
// 标记是否已经处理过页面的第一个请求
let initialRequestProcessed = false;

// 检查是否在顶级窗口（标签页）中运行，而不是在iframe中
if (window.self !== window.top) {
    console.log('在iframe中检测到JSON格式化扩展，跳过处理');
    // 在iframe中不执行任何操作
} else {
    // 主要逻辑只在标签页中运行
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "processPageForJSON") {
            console.log('收到processPageForJSON消息，内容类型:', request.contentType);
            console.log('URL:', request.url);
            
            // 如果已经处理过任何请求，则跳过所有后续请求
            if (initialRequestProcessed) {
                console.log('已处理过初始请求，跳过所有后续请求');
                if (sendResponse) sendResponse({status: "skipped"});
                return true;
            }
            
            // 避免重复处理同一个URL
            if (processedUrls.has(request.url)) {
                console.log('URL已处理过，跳过:', request.url);
                if (sendResponse) sendResponse({status: "skipped"});
                return true;
            }
            
            // 标记已处理初始请求
            initialRequestProcessed = true;
            processedUrls.add(request.url);
            
            // 等待很短时间再处理，确保DOM完全加载
            setTimeout(() => {
                processPageContent(request.contentType, request.url);
            }, 50);
            
            if (sendResponse) sendResponse({status: "processed"});
        }
        return true; // 保持消息通道开放，用于异步sendResponse
    });

    // 直接在页面加载时尝试处理，不只依赖background.js的消息
    document.addEventListener('DOMContentLoaded', () => {
        // 如果已经处理过请求，就不再处理
        if (!initialRequestProcessed) {
            // 检查页面内容是否为JSON格式
            tryProcessBasedOnContent();
        }
    });

    // 处理已经加载的页面
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // 如果已经处理过请求，就不再处理
        if (!initialRequestProcessed) {
            tryProcessBasedOnContent();
        }
    }
}

// 尝试基于页面内容检测并处理JSON
function tryProcessBasedOnContent() {
    // 首先检查Content-Type
    const contentType = document.contentType;
    const contentTypeIsJson = contentType && contentType.toLowerCase().includes('application/json');
    
    // 如果Content-Type是JSON类型，直接处理
    if (contentTypeIsJson) {
        initialRequestProcessed = true;
        setTimeout(() => {
            processPageContent(contentType, window.location.href);
        }, 100);
        return true;
    }
    
    // 获取页面内容
    let pageContent = "";
    if (document.body) {
        if (document.body.firstChild && 
            document.body.firstChild.nodeType === Node.ELEMENT_NODE && 
            document.body.firstChild.tagName === 'PRE') {
            pageContent = document.body.firstChild.textContent;
        } else {
            pageContent = document.body.textContent;
        }
    }
    pageContent = pageContent.trim();
    
    // 检查长度是否小于5000
    if (pageContent.length > 0 && pageContent.length < 5000) {
        // 尝试直接JSON.parse
        try {
            JSON.parse(pageContent);
            // 如果能成功解析，则认为是JSON
            initialRequestProcessed = true;
            setTimeout(() => {
                processPageContent(contentType || 'text/plain', window.location.href);
            }, 100);
            return true;
        } catch (e) {
            // 解析失败，不是JSON
            console.log('内容不是有效的JSON:', e.message);
        }
    }
    
    return false;
}

function processPageContent(mainContentType, url = '') {
    let pageTextContent = "";
    let isLikelyRawJsonPage = false;

    // 检查内容类型是否为JSON
    if (mainContentType && mainContentType.toLowerCase().includes('application/json')) {
        isLikelyRawJsonPage = true;
    }

    // 检查页面全部内容
    if (document.body) {
        // 如果是原始JSON页面，浏览器通常将其包装在单个PRE标签中
        if (document.body.firstChild && 
            document.body.firstChild.nodeType === Node.ELEMENT_NODE && 
            document.body.firstChild.tagName === 'PRE') {
            pageTextContent = document.body.firstChild.textContent;
        } else {
            // 对于其他情况（包括我们可能尝试完全解析的HTML页面）
            pageTextContent = document.body.textContent;
        }
    }
    pageTextContent = pageTextContent.trim();

    // 检查页面内容是否看起来像JSON（不仅基于内容类型）
    const looksLikeJson = (pageTextContent.startsWith('{') && pageTextContent.endsWith('}')) || 
                         (pageTextContent.startsWith('[') && pageTextContent.endsWith(']'));
    
    // 如果看起来不像JSON，就不继续处理
    if (!looksLikeJson && !isLikelyRawJsonPage) {
        return;
    }

    // 尝试解析JSON
    try {
        const jsonObj = JSON.parse(pageTextContent);
        const formatted = JSON.stringify(jsonObj, null, 2);
        
        // 清空文档并创建新的HTML结构
        document.open();
        document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${document.title}</title>
            <link rel="stylesheet" href="${chrome.runtime.getURL('prism.min.css')}">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Monaco', 'SF Mono', 'Consolas', monospace;
                    background-color: #f8f8f8;
                }
                .json-container {
                    padding: 20px;
                    margin: 0 auto;
                    max-width: 98%;
                }
                pre {
                    white-space: pre-wrap;
                    word-break: break-word;
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    line-height: 1.5;
                    margin: 0;
                    counter-reset: line;
                }
                code {
                    font-family: 'Monaco', 'SF Mono', 'Consolas', monospace;
                }
                /* 高亮样式 */
                .string { color: #0b7522; }
                .number { color: #0000ff; }
                .boolean { color: #bc00bc; }
                .null { color: #bc00bc; }
                .key { color: #a52a2a; }
                
                /* 行号样式 */
                .line-numbers-rows {
                    position: absolute;
                    pointer-events: none;
                    top: 15px;
                    left: 0;
                    width: 3em;
                    letter-spacing: -1px;
                    border-right: 1px solid #999;
                    user-select: none;
                }
                
                .line-numbers-rows > span {
                    display: block;
                    counter-increment: line;
                    pointer-events: none;
                }
                
                .line-numbers-rows > span:before {
                    content: counter(line);
                    color: #999;
                    display: block;
                    padding-right: 0.8em;
                    text-align: right;
                }
                
                pre.line-numbers {
                    position: relative;
                    padding-left: 3.8em;
                }
            </style>
        </head>
        <body>
            <div class="json-container">
                <pre class="line-numbers"><code class="language-json">${formatted}</code></pre>
            </div>
            <script src="${chrome.runtime.getURL('prism.min.js')}"></script>
            <script src="${chrome.runtime.getURL('prism-json.min.js')}"></script>
            <script>
                // 生成行号
                function addLineNumbers() {
                    const pre = document.querySelector('pre.line-numbers');
                    const code = pre.querySelector('code');
                    const linesCount = (code.textContent.match(/\\n/g) || []).length + 1;
                    
                    const lineNumbersWrapper = document.createElement('span');
                    lineNumbersWrapper.className = 'line-numbers-rows';
                    
                    let lineNumbersHTML = '';
                    for (let i = 0; i < linesCount; i++) {
                        lineNumbersHTML += '<span></span>';
                    }
                    
                    lineNumbersWrapper.innerHTML = lineNumbersHTML;
                    pre.appendChild(lineNumbersWrapper);
                }
                
                // 等待DOM加载完成后添加行号
                document.addEventListener('DOMContentLoaded', addLineNumbers);
                // 如果DOM已经加载完成，直接添加行号
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    addLineNumbers();
                }
            </script>
        </body>
        </html>
        `);
        document.close();
    } catch (error) {
        console.warn(`解析JSON失败: ${error.message}`);
    }
}
