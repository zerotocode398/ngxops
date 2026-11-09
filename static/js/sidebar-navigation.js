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
        var navId = preferredId || url.searchParams.get("nav");
        var activeLink = links.find(function (link) {
            var linkUrl = new URL(link.href, window.location.href);
            return navId && link.dataset.nav === navId &&
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
        if (nextHeading && currentHeading) currentHeading.innerHTML = nextHeading.innerHTML;
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
    function navigate(url, preferredId, pushHistory, method, body) {
        var version = ++requestVersion;
        var requestMethod = method || "GET";
        var options = {
            method: requestMethod,
            credentials: "same-origin",
            headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "text/html" }
        };
        if (body) options.body = body;
        if (window.NGXOPS_CAPTURE_UPGRADE_VIEW) {
            window.NGXOPS_CAPTURE_UPGRADE_VIEW(window.location.href);
        }
        fetch(url.href, options).then(function (response) {
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
            if (window.NGXOPS_RESTORE_UPGRADE_VIEW) {
                window.NGXOPS_RESTORE_UPGRADE_VIEW(pageDocument, result.url);
            }
            if (!pageDocument.getElementById("pageContent")) {
                window.location.assign(result.url.href);
                return;
            }
            document.dispatchEvent(new CustomEvent("ngxops:page-leaving"));
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
            if (version === requestVersion) {
                window.location.assign(requestMethod === "GET" ? url.href : window.location.href);
            }
        });
    }

    window.NGXOPS_NAVIGATE = function (url, pushHistory) {
        var destination = new URL(url || window.location.href, window.location.href);
        if (!isLocalUrl(destination)) {
            window.location.assign(destination.href);
            return;
        }
        navigate(destination, null, pushHistory !== false);
    };
    window.NGXOPS_REFRESH_PAGE = function () {
        var activeModal = document.querySelector(".modal.show");
        if (activeModal && window.bootstrap && window.bootstrap.Modal) {
            if (activeModal.dataset.refreshPending === "true") return;
            activeModal.dataset.refreshPending = "true";
            activeModal.addEventListener("hidden.bs.modal", function () {
                delete activeModal.dataset.refreshPending;
                window.NGXOPS_NAVIGATE(window.location.href, false);
            }, { once: true });
            window.bootstrap.Modal.getOrCreateInstance(activeModal).hide();
            return;
        }
        window.NGXOPS_NAVIGATE(window.location.href, false);
    };

    /** 从常规页面表单构建局部页面请求。 */
    function submitPageForm(form, submitter) {
        var method = (submitter && submitter.formMethod || form.method || "GET").toUpperCase();
        var action = submitter && submitter.formAction || form.action || window.location.href;
        var url = new URL(action, window.location.href);
        var data = new FormData(form);
        if (submitter && submitter.name && !submitter.disabled) {
            data.append(submitter.name, submitter.value);
        }
        if (method === "GET") {
            url.search = "";
            data.forEach(function (value, name) {
                if (typeof value === "string") url.searchParams.append(name, value);
            });
            navigate(url, null, true);
            return;
        }
        navigate(url, null, true, method, data);
    }

    /** 拦截普通查询与保存表单，保留特殊弹窗和文件表单处理。 */
    document.addEventListener("submit", function (event) {
        if (event.defaultPrevented) return;
        var form = event.target;
        if (!form || !form.closest("#pageContent") || form.closest(".modal") ||
            form.target && form.target !== "_self" || form.hasAttribute("data-native-nav") ||
            form.hasAttribute("data-custom-submit") ||
            form.enctype === "multipart/form-data" ||
            /^\/upgrade(?:\/|$)/.test(window.location.pathname)) return;

        var submitter = event.submitter;
        if (submitter && submitter.formTarget && submitter.formTarget !== "_self") return;
        var method = (submitter && submitter.formMethod || form.method || "GET").toUpperCase();
        if (method !== "GET" && method !== "POST") return;

        var action = submitter && submitter.formAction || form.action || window.location.href;
        var url;
        try {
            url = new URL(action, window.location.href);
        } catch (error) {
            return;
        }
        if (!isLocalUrl(url) || /^\/api(?:\/|$)/.test(url.pathname)) return;
        if (form.hasAttribute("data-confirm") && form.dataset.confirmed !== "1") return;

        event.preventDefault();
        window.setTimeout(function () {
            if (form.isConnected) submitPageForm(form, submitter);
        }, 0);
    }, true);

    /** 拦截应用内页面链接，保留全局侧栏并只切换右侧页面。 */
    document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
            event.shiftKey || event.altKey) return;
        var target = event.target.nodeType === 1 ? event.target : event.target.parentElement;
        var link = target && target.closest(".sidebar a[href], .main-area a[href]");
        if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") ||
            link.hasAttribute("data-native-nav") || link.hasAttribute("data-custom-nav") ||
            link.hasAttribute("data-bs-toggle")) return;

        var url;
        try {
            url = new URL(link.href, window.location.href);
        } catch (error) {
            return;
        }
        if (!isLocalUrl(url)) return;
        var currentUrl = new URL(window.location.href);
        var currentIsUpgrade = /^\/upgrade(?:\/|$)/.test(currentUrl.pathname);
        var targetIsUpgrade = /^\/upgrade(?:\/|$)/.test(url.pathname);
        if (currentIsUpgrade && targetIsUpgrade) return;
        if (url.pathname === currentUrl.pathname && url.search === currentUrl.search && url.hash !== currentUrl.hash) {
            return;
        }
        if (/\/download\/?$/.test(url.pathname)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        if (url.href === window.location.href) return;
        navigate(url, link.dataset.nav || null, true);
    }, true);

    /** 浏览器前进或后退時按当前地址重新加载右侧页面。 */
    window.addEventListener("popstate", function () {
        var url = new URL(window.location.href);
        if (/^\/upgrade(?:\/|$)/.test(url.pathname)) return;
        if (/^\/releases\/center(?:\/|$)/.test(url.pathname) &&
            document.querySelector("#pageContent #releaseCenterState")) return;
        if (/^\/settings\/?$/.test(url.pathname) &&
            document.querySelector("#pageContent [data-settings-group]")) return;
        navigate(url, null, false);
    });
})(window, document);
