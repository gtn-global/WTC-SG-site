/* ==========================================================
   WTC Singapore 系列页面 - 通用 JS（全功能版）
   包含：
   1. 单页 #slide 等比缩放 + 自适应尺寸
   2. 视觉中心 data-visual-center 自动计算（--bg-focus-x/y）
      —— 已确认改动：支持多页 Deck 场景回退查找当前 .slide；
         支持多个 data-visual-center 元素时取几何中心（centroid）
   3. 多页 Deck 翻页系统（#stage > #track > .slide）
   4. 全套图表组件：Waffle / Ticker / IndexList / Ring / Hex / Timeline / PartnerMap
      —— 已确认改动：PartnerMap 卡片字段由"当前状态+拓展目标"
         改为"核心优势"（对齐 GlobalX 页面数据格式）
   ========================================================== */
(function () {
    /* ---------- 单页画布缩放 ---------- */
    function scaleSlide() {
        var slide = document.getElementById('slide');
        if (!slide) return;
        var w = slide.offsetWidth;
        var h = slide.offsetHeight;
        if (!w || !h) return;
        var scale = Math.min(window.innerWidth / w, window.innerHeight / h);
        slide.style.left = '50%';
        slide.style.top = '50%';
        slide.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    }

    /* ---------- 视觉中心更新（已确认改动：第一项 + 第二项） ---------- */
    function updateVisualFocus() {
        // 第一项：单页 #slide 存在则按原逻辑；否则回退到多页 Deck 当前激活的 .slide
        var target = document.getElementById('slide');
        if (!target && deck.track) {
            target = deck.track.children[deck.index];
        }
        if (!target) return;

        // 第二项：querySelector → querySelectorAll，支持多个视觉中心取几何中心
        var centerEls = target.querySelectorAll('[data-visual-center]');
        if (!centerEls.length) return;

        var targetRect = target.getBoundingClientRect();
        if (!targetRect.width || !targetRect.height) return;

        var sumX = 0, sumY = 0;
        centerEls.forEach(function (el) {
            var r = el.getBoundingClientRect();
            sumX += (r.left + r.width / 2 - targetRect.left) / targetRect.width * 100;
            sumY += (r.top + r.height / 2 - targetRect.top) / targetRect.height * 100;
        });
        var x = sumX / centerEls.length;
        var y = sumY / centerEls.length;

        target.style.setProperty('--bg-focus-x', x.toFixed(1) + '%');
        target.style.setProperty('--bg-focus-y', y.toFixed(1) + '%');
    }

    /* ---------- 多页 Deck 系统（纵向滚动吸附）---------- */
    var deck = { index: 0, count: 0, stage: null, track: null, viewport: null };

    function scaleStage() {
        // 每页内容（.slide-inner，1920×1080 设计画布）等比 contain 缩放并居中于其 .slide 容器。
        // 以父 .slide 中心为原点，保证内容完整可见、不变形、不偏位；非 16:9 留黑边不裁切。
        var inners = document.querySelectorAll('.slide-inner');
        var isMobile = window.innerWidth <= 820;
        for (var i = 0; i < inners.length; i++) {
            var slide = inners[i].parentNode;
            var sw = slide.clientWidth || window.innerWidth;
            var sh = slide.clientHeight || window.innerHeight;
            // 窄屏（手机/竖屏）：仅按宽度铺满，不取 min(宽,高)，避免整页被缩到极小无法阅读；
            // 高度由内容自然撑开，用户可纵向滚动浏览（顶部对齐，配合 CSS overflow-y:auto）。
            var scale = isMobile ? (sw / 1920) : Math.min(sw / 1920, sh / 1080);
            // JS 全权控制 top 与 transform，避免与 CSS 媒体查询冲突导致内容跑出视口
            inners[i].style.top = isMobile ? '0' : '50%';
            inners[i].style.transformOrigin = isMobile ? 'center top' : 'center center';
            inners[i].style.transform = isMobile
                ? 'translate(-50%, 0) scale(' + scale + ')'
                : 'translate(-50%,-50%) scale(' + scale + ')';
        }
        return true;
    }

    function renderNav() {
        var pageno = document.getElementById('deckPageno');
        if (pageno) {
            pageno.innerHTML =
                '<span class="cur">' + String(deck.index + 1).padStart(2, '0') + '</span>' +
                '<span class="rule"></span>' +
                '<span class="tot">' + String(deck.count).padStart(2, '0') + '</span>';
        }
        var prevBtn = document.getElementById('deckPrev');
        var nextBtn = document.getElementById('deckNext');
        if (prevBtn) prevBtn.disabled = (deck.index === 0);
        if (nextBtn) nextBtn.disabled = (deck.index === deck.count - 1);
    }

    function goTo(i) {
        if (!deck.viewport) return;
        deck.index = Math.max(0, Math.min(deck.count - 1, i));
        // 每页真实占满一屏（100vh），滚动按真实屏高计算
        deck.viewport.scrollTo({ top: deck.index * deck.viewport.clientHeight, behavior: 'smooth' });
        renderNav();
        updateVisualFocus();
        for (var k = Math.max(0, deck.index - 1); k <= Math.min(deck.count - 1, deck.index + 1); k++) {
            if (revealSlides[k]) revealSlides[k].classList.add('slide-visible');
        }
    }
    function next() { goTo(deck.index + 1); }
    function prev() { goTo(deck.index - 1); }

    /* 锚点路由：按 data-slide（1-based）定位，并同步 URL hash（#slide-N）
       注意：通过 window.WTCDeck.goTo 跳转（而非闭包内 goTo），以便 index.html
       的 syncTopbarActive 劫持层能拦截并更新导航高亮 */
    function goToBySlide(n) {
        var idx = Math.max(1, Math.min(deck.count, n)) - 1;
        // 走被劫持的 window.WTCDeck.goTo（syncTopbarActive 会更新导航高亮）
        if (window.WTCDeck && typeof window.WTCDeck.goTo === 'function') {
            window.WTCDeck.goTo(idx);
        } else {
            goTo(idx);
        }
        // 静默写 hash（replaceState 不触发 hashchange，避免重复跳转）
        if (history.replaceState) {
            history.replaceState(null, '', '#slide-' + (idx + 1));
        }
    }

    /* 解析 URL hash（#slide-N）→ 跳到对应页 */
    function applyHash() {
        var h = location.hash || '';
        var m = h.match(/^#slide-(\d+)$/);
        if (!m) return;
        var n = parseInt(m[1], 10);
        if (n >= 1 && n <= deck.count) goTo(n - 1);
    }

    /* 把每页 .slide 的子节点包进 .slide-inner，内容单独等比缩放，与滚动布局解耦
       .mobile-layout 作为移动端旁路内容保留在 .slide 直系层级，不参与缩放 */
    function wrapSlides() {
        var slides = deck.track ? deck.track.querySelectorAll('.slide') : [];
        for (var i = 0; i < slides.length; i++) {
            var s = slides[i];
            var hasMobileLayout = !!s.querySelector(':scope > .mobile-layout');
            s.classList.toggle('has-mobile-layout', hasMobileLayout);
            if (s.querySelector(':scope > .slide-inner')) continue; // 已包裹则跳过
            var inner = document.createElement('div');
            inner.className = 'slide-inner';
            var kids = Array.prototype.slice.call(s.children);
            kids.forEach(function (k) {
                if (!k.classList.contains('mobile-layout')) inner.appendChild(k);
            });
            s.appendChild(inner);
        }
    }

    function initDeck() {
        var stage = document.getElementById('stage');
        var track = document.getElementById('track');
        var viewport = document.getElementById('viewport');
        if (!stage || !track || !viewport) return false;
        deck.stage = stage;
        deck.track = track;
        deck.viewport = viewport;
        wrapSlides();
        deck.count = track.querySelectorAll('.slide').length;
        if (document.body) document.body.classList.toggle('single-slide', deck.count <= 1);

        // 锚点路由：给每页按 data-slide（1-based）写入 id="slide-N"，供导航/URL 定位
        var slideEls = track.querySelectorAll('.slide');
        for (var si = 0; si < slideEls.length; si++) {
            var ds = slideEls[si].getAttribute('data-slide');
            if (ds) slideEls[si].id = 'slide-' + ds;
        }
        // 注意：不监听 hashchange，避免 goToBySlide 写 hash 时触发重复跳转/死循环

        var prevBtn = document.getElementById('deckPrev');
        var nextBtn = document.getElementById('deckNext');
        if (prevBtn) prevBtn.addEventListener('click', prev);
        if (nextBtn) nextBtn.addEventListener('click', next);

        window.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
            else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
            else if (e.key === 'End') { e.preventDefault(); goTo(deck.count - 1); }
        });

        deck.viewport.addEventListener('scroll', function () {
            var h = deck.viewport.clientHeight || 1080;
            var idx = Math.round(deck.viewport.scrollTop / h);
            if (idx !== deck.index && idx >= 0 && idx < deck.count) {
                deck.index = idx;
                renderNav();
            }
        }, { passive: true });

        goTo(0);
        initReveal();
        // 若 URL 带 #slide-N，加载后定位到对应页（刷新/外链直达）
        applyHash();
        return true;
    }

    /* ---------- 进入视口才淡入（页间过渡自然）---------- */
    /* 用滚动位置定位当前页，避免 IntersectionObserver 在 transform 缩放容器中跨设备计算不可靠 */
    var revealSlides = [];
    function initReveal() {
        revealSlides = deck.track ? Array.prototype.slice.call(deck.track.querySelectorAll('.slide')) : [];
        if (!revealSlides.length) return;
        // 兜底：所有页加载即标记可见，确保任何设备/分辨率下内容都显示
        for (var n = 0; n < revealSlides.length; n++) revealSlides[n].classList.add('slide-visible');
        revealAround();
        if (deck.viewport) {
            deck.viewport.addEventListener('scroll', revealAround, { passive: true });
            window.addEventListener('resize', revealAround);
        }
    }
    function revealAround() {
        if (!revealSlides.length || !deck.viewport) return;
        var h = deck.viewport.clientHeight || 1080;
        var i = Math.round(deck.viewport.scrollTop / h);
        if (i < 0) i = 0;
        if (i > revealSlides.length - 1) i = revealSlides.length - 1;
        // 把首页到当前页下方一页全部标记，保证滚动过的页面都可见
        for (var k = 0; k <= i + 1 && k < revealSlides.length; k++) {
            revealSlides[k].classList.add('slide-visible');
        }
    }

    function rescale() {
        scaleStage();
        if (deck.viewport) {
            deck.viewport.scrollTop = deck.index * deck.viewport.clientHeight;
        }
    }

    function boot() {
        initDeck();
        rescale();
        updateVisualFocus();
    }

    window.addEventListener('resize', rescale);
    window.addEventListener('orientationchange', rescale);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    /* 暴露全局接口 */
    window.scaleSlide = rescale;
    window.updateVisualFocus = updateVisualFocus;
    window.WTCDeck = { next: next, prev: prev, goTo: goTo, goToBySlide: goToBySlide, rescale: rescale };

})();

/* ==========================================================
   图表组件（完整保留自第一版）
   ========================================================== */

/* --- Waffle 华夫点状图 --- */
window.WTCWaffle = {
    render: function (containerId, opts) {
        var el = document.getElementById(containerId);
        if (!el) return;
        opts = opts || {};
        var total = opts.total || 100;
        var highlight = opts.highlight || 0;
        var caption = opts.caption || '';
        el.className = (el.className ? el.className + ' ' : '') + 'wtc-waffle';
        var grid = document.createElement('div');
        grid.className = 'wtc-waffle-grid';
        for (var i = 0; i < total; i++) {
            var cell = document.createElement('div');
            cell.className = 'wtc-waffle-cell' + (i < highlight ? ' hi' : '');
            grid.appendChild(cell);
        }
        el.innerHTML = '';
        el.appendChild(grid);
        if (caption) {
            var cap = document.createElement('div');
            cap.className = 'wtc-waffle-caption';
            cap.innerHTML = caption;
            el.appendChild(cap);
        }
    }
};

/* --- Ticker 跑马灯 --- */
window.WTCTicker = {
    render: function (containerId, items) {
        var el = document.getElementById(containerId);
        if (!el) return;
        items = items || [];
        el.className = (el.className ? el.className + ' ' : '') + 'wtc-ticker-wrap';
        var track = document.createElement('div');
        track.className = 'wtc-ticker-track';
        var doubled = items.concat(items);
        doubled.forEach(function (t) {
            var d = document.createElement('div');
            d.className = 'wtc-ticker-item';
            d.innerHTML = '<span class="dot"></span>' + t.label + '&nbsp;&nbsp;<b>' + t.value + '</b>';
            track.appendChild(d);
        });
        el.innerHTML = '';
        el.appendChild(track);
    }
};

/* --- IndexList 目录索引 --- */
window.WTCIndexList = {
    render: function (containerId, items) {
        var el = document.getElementById(containerId);
        if (!el) return;
        items = items || [];
        el.className = (el.className ? el.className + ' ' : '') + 'idx-list';
        el.innerHTML = items.map(function (it) {
            return '<div class="idx-row"><span class="idx-mark"></span>' +
                '<div class="idx-title">' + it.title + '</div>' +
                '<div class="idx-desc">' + it.desc + '</div></div>';
        }).join('');
    }
};

/* --- Ring 圆环进度 --- */
window.WTCRing = {
    render: function (containerId, opts) {
        var el = document.getElementById(containerId);
        if (!el) return;
        opts = opts || {};
        var level = opts.level || 0, max = opts.max || 3, label = opts.label || '';
        var r = 42, circ = 2 * Math.PI * r;
        var pct = Math.max(0, Math.min(1, level / max));
        var offset = circ * (1 - pct);
        el.className = (el.className ? el.className + ' ' : '') + 'ring-wrap';
        el.innerHTML =
            '<svg width="100" height="100" viewBox="0 0 100 100">' +
            '<circle class="ring-track" cx="50" cy="50" r="' + r + '"/>' +
            '<circle class="ring-fill" cx="50" cy="50" r="' + r + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"/>' +
            '</svg>' +
            '<div class="ring-label">' + label + '</div>';
    }
};

/* --- Hex 六边形蜂窝网格 --- */
window.WTCHex = {
    render: function (containerId, items, opts) {
        var el = document.getElementById(containerId);
        if (!el) return;
        items = items || [];
        opts = opts || {};
        var perRow = opts.perRow || 5;
        el.className = (el.className ? el.className + ' ' : '') + 'hex-grid';
        el.innerHTML = '';
        var rowCount = Math.ceil(items.length / perRow);
        for (var r = 0; r < rowCount; r++) {
            var rowItems = items.slice(r * perRow, r * perRow + perRow);
            var row = document.createElement('div');
            row.className = 'hex-row' + (r % 2 === 1 ? ' offset' : '');
            rowItems.forEach(function (it) {
                var cell = document.createElement('div');
                var isEmpty = !it || (!it.img && !it.text);
                cell.className = 'hex-cell' + (isEmpty ? ' empty' : '');
                if (it && it.img) {
                    cell.innerHTML = '<img class="img-mono" src="' + it.img + '" alt="' + (it.alt || '企业Logo') + '">';
                } else if (it && it.text) {
                    cell.innerHTML = '<div class="hex-text">' + it.text + '</div>';
                } else {
                    cell.innerHTML = '<div class="hex-placeholder">待补充</div>';
                }
                row.appendChild(cell);
            });
            el.appendChild(row);
        }
    }
};

/* --- Timeline 多节点路线图 --- */
window.WTCTimeline = {
    render: function (containerId, opts) {
        var el = document.getElementById(containerId);
        if (!el) return;
        opts = opts || {};
        var W = opts.width || 1760, H = opts.height || 560;
        var nodes = opts.nodes || [];
        var STATUS_LABEL = { done: '已完成 · COMPLETED', active: '进行中 · IN PROGRESS', planned: '规划中 · PLANNED' };
        el.className = (el.className ? el.className + ' ' : '') + 'wtc-tl-canvas';

        function buildSmoothPath(pts) {
            if (pts.length < 2) return '';
            var d = 'M' + pts[0].x + ',' + pts[0].y;
            for (var i = 1; i < pts.length; i++) {
                var p0 = pts[i - 1], p1 = pts[i];
                var midX = (p0.x + p1.x) / 2;
                d += ' C' + midX + ',' + p0.y + ' ' + midX + ',' + p1.y + ' ' + p1.x + ',' + p1.y;
            }
            return d;
        }
        var pathD = buildSmoothPath(nodes);

        var diagram = document.createElement('div');
        diagram.className = 'wtc-tl-diagram';
        diagram.innerHTML =
            '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
            '<defs><linearGradient id="wtcTlGradient" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0%" stop-color="#C5A059"/><stop offset="60%" stop-color="#D4AF37"/><stop offset="100%" stop-color="#3A4356"/>' +
            '</linearGradient></defs>' +
            '<path class="wtc-tl-path" d="' + pathD + '"/>' +
            '<circle class="wtc-tl-pulse" r="4"/>' +
            '</svg>';

        var nodeLayer = document.createElement('div');
        nodeLayer.style.position = 'absolute'; nodeLayer.style.inset = '0';

        nodes.forEach(function (n) {
            var wrap = document.createElement(n.href ? 'a' : 'div');
            wrap.className = 'wtc-tl-node';
            if (n.href) { wrap.href = n.href; if (/^https?:/.test(n.href)) wrap.target = '_blank'; }
            var status = n.status || 'planned';
            wrap.dataset.status = status;
            wrap.style.left = (n.x / W * 100) + '%';
            wrap.style.top = (n.y / H * 100) + '%';

            var nearRightEdge = (n.x / W) > 0.8;
            var statusChip = n.tag
                ? '<span class="tag tag-planned">' + n.tag + '</span>'
                : '<span class="tag tag-' + status + '">' + STATUS_LABEL[status].split(' · ')[1] + '</span>';

            wrap.innerHTML =
                '<div class="wtc-tl-card' + (nearRightEdge ? ' card-left' : '') + '">' +
                '<div class="wtc-tl-card-top"><span class="wtc-tl-card-phase">PHASE ' + String(n.n).padStart(2, '0') + '</span>' + statusChip + '</div>' +
                '<div class="wtc-tl-card-title">' + n.label + '</div>' +
                (n.en ? '<div class="wtc-tl-card-title-en">' + n.en + '</div>' : '') +
                (n.mission ? '<div class="wtc-tl-card-row"><span class="k">Mission 核心使命</span><span class="v">' + n.mission + '</span></div>' : '') +
                (n.gate ? '<div class="wtc-tl-card-row"><span class="k">Gate 进入下一阶段条件</span><span class="v">' + n.gate + '</span></div>' : '') +
                (n.href ? '<div class="wtc-tl-card-link"><span>查看详情文档</span><span>→</span></div>' : '') +
                '</div>' +
                '<div class="wtc-tl-ring"></div>' +
                '<div class="wtc-tl-marker"></div>' +
                '<div class="wtc-tl-caption"><div class="wtc-tl-idx">PHASE ' + String(n.n).padStart(2, '0') + '</div>' +
                '<div class="wtc-tl-label">' + n.label + '</div></div>';
            nodeLayer.appendChild(wrap);
        });

        var legend =
            '<div class="wtc-tl-legend">' +
            '<div class="wtc-tl-legend-item"><span class="wtc-tl-legend-marker done"></span><span class="wtc-tl-legend-text">已完成 COMPLETED</span></div>' +
            '<div class="wtc-tl-legend-item"><span class="wtc-tl-legend-marker active"></span><span class="wtc-tl-legend-text">进行中 IN PROGRESS</span></div>' +
            '<div class="wtc-tl-legend-item"><span class="wtc-tl-legend-marker planned"></span><span class="wtc-tl-legend-text">规划中 PLANNED</span></div>' +
            '</div>';

        diagram.appendChild(nodeLayer);
        el.innerHTML = '';
        el.appendChild(diagram);
        el.insertAdjacentHTML('beforeend', legend);

        var pathEl = el.querySelector('.wtc-tl-path');
        var pulse = el.querySelector('.wtc-tl-pulse');
        if (pathEl) {
            var len = pathEl.getTotalLength();
            pathEl.style.strokeDasharray = len + ' ' + len;
            pathEl.style.strokeDashoffset = len;
            pathEl.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(.65,0,.35,1) .2s';
            pathEl.getBoundingClientRect();
            requestAnimationFrame(function () { pathEl.style.strokeDashoffset = '0'; });
        }
        if (pulse) pulse.style.offsetPath = "path('" + pathD + "')";
    }
};

/* --- PartnerMap 国际合伙人地图 --- */
window.WTCPartnerMap = {
    render: function (containerId, opts) {
        var el = document.getElementById(containerId);
        if (!el) return;
        opts = opts || {};
        var W = opts.width || 1200, H = opts.height || 900;
        var hub = opts.hub || { x: W * 0.2, y: H * 0.8, label: 'WTC SINGAPORE' };
        var nodes = opts.nodes || [];
        var TYPE_LABEL = { regional: '区域国际合伙人', industry: '行业国际合伙人', both: '区域＋行业国际合伙人' };
        el.className = (el.className ? el.className + ' ' : '') + 'wtc-map-wrap';

        function arcCtrl(x1, y1, x2, y2) {
            var mx = (x1 + x2) / 2, my = (y1 + y2) / 2,
                dx = x2 - x1, dy = y2 - y1, dist = Math.hypot(dx, dy) || 1;
            var nx = -dy / dist, ny = dx / dist,
                bend = (x2 < x1 ? -1 : 1) * dist * 0.12;
            return { cx: mx + nx * bend, cy: my + ny * bend };
        }

        var routes = '';
        nodes.forEach(function (n) {
            var c = arcCtrl(hub.x, hub.y, n.x, n.y);
            routes += '<path class="wtc-map-route ' + (n.status === 'established' ? 'established' : '') +
                '" d="M' + hub.x + ',' + hub.y + ' Q' + c.cx + ',' + c.cy + ' ' + n.x + ',' + n.y + '"/>';
        });

        var diagram = document.createElement('div');
        diagram.className = 'wtc-map-diagram';
        diagram.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><g>' + routes + '</g></svg>';

        var nodeLayer = document.createElement('div');
        nodeLayer.style.position = 'absolute'; nodeLayer.style.inset = '0';

        // 枢纽节点
        var hubWrap = document.createElement('div');
        hubWrap.className = 'wtc-map-hub-node';
        hubWrap.style.left = (hub.x / W * 100) + '%';
        hubWrap.style.top = (hub.y / H * 100) + '%';
        hubWrap.innerHTML = '<div class="wtc-map-hub-ring"></div><div class="wtc-map-hub-dot"></div><div class="wtc-map-hub-label">' + (hub.label || 'WTC SINGAPORE') + '</div>';
        nodeLayer.appendChild(hubWrap);

        nodes.forEach(function (n) {
            var nearRightEdge = (n.x / W) > 0.82;
            var wrap = document.createElement('div');
            wrap.className = 'wtc-map-node' + (n.priority ? ' priority' : '');
            wrap.dataset.status = n.status || 'planned';
            wrap.dataset.type = n.type || 'regional';
            wrap.style.left = (n.x / W * 100) + '%';
            wrap.style.top = (n.y / H * 100) + '%';
            wrap.innerHTML =
                '<div class="wtc-map-card' + (nearRightEdge ? ' card-left' : '') + '">' +
                '<div class="wtc-map-card-title">' + n.city + (n.en ? ' <span style="color:var(--color-slate); font-family:\'IBM Plex Mono\',monospace; font-size:11px;">' + n.en + '</span>' : '') + '</div>' +
                '<div class="row">合伙人类型　<b>' + (TYPE_LABEL[n.type] || TYPE_LABEL.regional) + '</b></div>' +
                (n.desc ? '<div class="row">核心优势　　<b>' + n.desc + '</b></div>' : '') +
                (n.priority ? '<div class="row" style="color:var(--color-gold-strong);">★ 重点拓展城市</div>' : '') +
                '</div>' +
                '<div class="wtc-map-marker"></div><div class="wtc-map-cap">' + n.city + '</div>';
            nodeLayer.appendChild(wrap);
        });
        diagram.appendChild(nodeLayer);
        el.innerHTML = '';
        el.appendChild(diagram);

        var legend =
            '<div class="wtc-map-legend">' +
            '<div class="li"><span class="lm established"></span><span class="wtc-map-legend-text">已布局合伙人</span></div>' +
            '<div class="li"><span class="lm planned"></span><span class="wtc-map-legend-text">规划拓展中</span></div>' +
            '<div class="li"><span class="lm regional"></span><span class="wtc-map-legend-text">区域国际合伙人</span></div>' +
            '<div class="li"><span class="lm industry"></span><span class="wtc-map-legend-text">行业国际合伙人</span></div>' +
            '</div>';
        el.insertAdjacentHTML('beforeend', legend);
    }
};