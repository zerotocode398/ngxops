(function (window, document) {
    "use strict";

    var requestVersion = 0;

    /** 判断地址是否属于当前站点。 */
    function isLocalUrl(url) {
        return url.origin === window.location.origin;
    }

    /** 规范路径，便于匹配带或不带末尾斜杠的路由。 */
    function normalizePath(path) {
        return path.length > 1 ? path.replace(/\/+$/, "") : path;
    }

    /** 根据目标地址更新侧栏选中项并展开对应分组。 */
    function updateSidebar(url, preferredId) {
        var links = Array.from(document.querySelectorAll(".sidebar a[data-nav]"));
        var normalizedPath = normalizePath(url.pathname);
        var activeLink = links.find(function (link) {
            var linkUrl = new URL(link.href, window.location.href);
            return preferredId && link.dataset.nav === preferredId &&
                normalizePath(linkUrl.pathname) === normalizedPath;
        });
        if (!activeLink) {
            activeLink = links.find(function (link) {
                return normalizePath(new URL(link.href, window.location.href).pathname) === normalizedPath;
            });
        }
        if (!activeLink) {
            activeLink = links.filter(function (link) {
                var linkPath = normalizePath(new URL(link.href, window.location.href).pathname);
                return normalizedPath.indexOf(linkPath + "/") === 0;
            }).sort(function (first, second) {
                var firstPath = normalizePath(new URL(first.href, window.location.href).pathname);
                var secondPath = normalizePath(new URL(second.href, window.location.href).pathname);
                return secondPath.length - firstPath.length;
            })[0];
        }
        if (!activeLink) return;

        links.forEach(function (link) {
            link.classList.toggle("active", link === activeLink);
            if (link === activeLink) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
        document.querySelectorAll(".sidebar [data-submenu-toggle]").forEach(function (button) {
            button.classList.remove("active");
        });

        var submenu = activeLink.closest(".submenu");
        if (submenu) {
            var trigger = submenu.parentElement.querySelector("[data-submenu-toggle]");
            var collapsed = document.documentElement.classList.contains("sidebar-collapsed");
            submenu.classList.toggle("show", !collapsed);
            if (trigger) {
                trigger.classList.add("active");
                trigger.setAttribute("aria-expanded", collapsed ? "false" : "true");
            }
        }
    }

    window.NGXOPS_UPDATE_SIDEBAR = updateSidebar;

    /** 替換頁面主內容、專屬彈窗、樣式及共用頁面資訊。 */
    function replacePageView(pageDocument) {
        var nextContent = pageDocument.getElementById("pageContent");
        var currentContent = document.getElementById("pageContent");
        if (!nextContent || !currentContent) return false;
        currentContent.replaceWith(document.importNode(nextContent, true));

        var nextModals = pageDocument.getElementById("pageModals");
        var currentModals = document.getElementById("pageModals");
        if (nextModals && currentModals) {
            currentModals.replaceWith(document.importNode(nextModals, true));
        }

        var nextHeading = pageDocument.querySelector(".page-heading");
        var currentHeading = document.querySelector(".page-heading");
        if (nextHeading && currentHeading) currentHeading.textContent = nextHeading.textContent;
        document.title = pageDocument.title;

        Array.from(document.head.querySelectorAll("link[rel='stylesheet'][href]"))
            .filter(function (link) {
                var href = link.getAttribute("href") || "";
                return href.indexOf("/static/css/") >= 0 && !/\/static\/css\/app\.css(?:\?|$)/.test(href);
            })
            .forEach(function (link) { link.remove(); });
        Array.from(pageDocument.head.querySelectorAll("link[rel='stylesheet'][href]"))
            .filter(function (link) {
                var href = link.getAttribute("href") || "";
                return href.indexOf("/static/css/") >= 0 && !/\/static\/css\/app\.css(?:\?|$)/.test(href);
            })
            .forEach(function (link) {
                document.head.appendChild(document.importNode(link, true));
            });

        var nextToken = pageDocument.querySelector("meta[name='csrf-token']");
        var currentToken = document.querySelector("meta[name='csrf-token']");
        if (nextToken && currentToken) {
            currentToken.content = nextToken.content;
            if (window.jQuery) window.jQuery.ajaxSetup({ headers: { "X-CSRFToken": nextToken.content } });
        }

        var nextBody = pageDocument.body;
        if (nextBody) {
            document.body.dataset.taskPollInterval = nextBody.dataset.taskPollInterval || "2";
            document.body.dataset.sessionCheckEnabled = nextBody.dataset.sessionCheckEnabled || "0";
            var pollSeconds = Number(document.body.dataset.taskPollInterval);
            window.NGXOPS_TASK_POLL_INTERVAL = (pollSeconds > 0 ? pollSeconds : 2) * 1000;
        }
        return true;
    }

    /** 按頁面模板順序執行目標頁面的專屬腳本。 */
    function executePageScripts(pageDocument, fallbackUrl, version) {
        var host = document.getElementById("pageScripts");
        var scripts = Array.from(pageDocument.querySelectorAll("#pageScripts script"));
        if (!host) return;
        host.replaceChildren();

        function appendAt(index) {
            if (version !== requestVersion || index >= scripts.length) return;
            var source = scripts[index];
            var script = document.createElement("script");
            Array.from(source.attributes).forEach(function (attribute) {
                script.setAttribute(attribute.name, attribute.value);
            });
            if (source.src) {
                script.async = false;
                script.onload = function () { appendAt(index + 1); };
                script.onerror = function () {
                    if (version === requestVersion) window.location.assign(fallbackUrl);
                };
                host.appendChild(script);
                return;
            }
            script.textContent = source.textContent;
            host.appendChild(script);
            appendAt(index + 1);
        }

        appendAt(0);
    }

    /** 请求并渲染目标页面，必要时回退到浏览器原生导航。 */
    function navigate(url, preferredId, pushHistory) {
        var version = ++requestVersion;
        fetch(url.href, {
            credentials: "same-origin",
            headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "text/html" }
        }).then(function (response) {
            var responseUrl = new URL(response.url || url.href, window.location.href);
            if (!isLocalUrl(responseUrl) || !/text\/html/i.test(response.headers.get("Content-Type") || "")) {
                window.location.assign(responseUrl.href);
                return null;
            }
            return response.text().then(function (html) {
                return { html: html, url: responseUrl };
            });
        }).then(function (result) {
            if (!result || version !== requestVersion) return;
            var pageDocument = new DOMParser().parseFromString(result.html, "text/html");
            if (!replacePageView(pageDocument)) {
                window.location.assign(result.url.href);
                return;
            }

            updateSidebar(result.url, preferredId);
            if (pushHistory && result.url.href !== window.location.href) {
                window.history.pushState({ ngxopsPage: true }, "", result.url.href);
            }
            document.dispatchEvent(new CustomEvent("ngxops:page-inserted"));
            window.scrollTo({ top: 0, behavior: "auto" });
            executePageScripts(pageDocument, result.url.href, version);
        }).catch(function () {
            if (version === requestVersion) window.location.assign(url.href);
        });
    }

    /** 拦截侧栏功能链接，保留全局侧栏并只切换右侧页面。 */
    document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
            event.shiftKey || event.altKey) return;
        var target = event.target.nodeType === 1 ? event.target : event.target.parentElement;
        var link = target && target.closest(".sidebar a[data-nav][href]");
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

        var url = new URL(link.href, window.location.href);
        if (!isLocalUrl(url)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (url.href === window.location.href) return;
        navigate(url, link.dataset.nav, true);
    }, true);

    /** 浏览器前进或后退時按当前地址重新加载右侧页面。 */
    window.addEventListener("popstate", function () {
        var url = new URL(window.location.href);
        if (/^\/upgrade(?:\/|$)/.test(url.pathname)) return;
        navigate(url, null, false);
    });
})(window, document);
