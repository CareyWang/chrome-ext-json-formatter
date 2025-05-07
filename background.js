// background.js (Service Worker for Manifest V3)
console.log('JSON Formatter Background Script Running...');

chrome.webRequest.onHeadersReceived.addListener(
    details => {
        if (details.tabId >= 0) {
            let contentType = "";
            if (details.responseHeaders) {
                const contentTypeHeader = details.responseHeaders.find(
                    header => header.name.toLowerCase() === "content-type"
                );
                if (contentTypeHeader && contentTypeHeader.value) {
                    contentType = contentTypeHeader.value;
                }
            }
            
            if (contentType.toLowerCase().includes('application/json')) {
                const sendMessageWithRetry = (attempt = 1) => {
                    try {
                        chrome.tabs.sendMessage(details.tabId, {
                            action: "processPageForJSON",
                            contentType: contentType,
                            url: details.url
                        }, response => {
                            if (chrome.runtime.lastError) {
                                if (attempt <= 3) {
                                    console.log(`重试发送消息到标签页 ${details.tabId}，第 ${attempt} 次尝试`);
                                    setTimeout(() => sendMessageWithRetry(attempt + 1), 200 * attempt);
                                }
                            }
                        });
                    } catch (error) {
                        console.warn(`向标签页 ${details.tabId} 发送消息失败: ${error.message}`);
                    }
                };
                
                sendMessageWithRetry();
            }
        }
    },
    { urls: ["<all_urls>"], types: ["main_frame", "xmlhttprequest", "other"] },
    ["responseHeaders"]
); 