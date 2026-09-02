/* search.js — lightweight client-side site search for this static site.
 * Clicking the magnifier opens an input box; the query is matched against
 * the text of every page (fetched once, same-origin only, so it works
 * on GitHub Pages without any server or third-party service).
 *
 * Also includes mobile hamburger menu toggle.
 */
(function () {
    'use strict';

    /* ---------- mobile hamburger menu ---------- */
    var menuToggle = document.querySelector('.menu-toggle');
    var navLinks   = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close menu when clicking a link inside it
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Auto-close when resizing back to desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 900) {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ---------- site search ---------- */
    var btn = document.querySelector('.search-btn');
    if (!btn) return;

    var PAGES = ['./', 'program/', 'speakers/', 'registration/', 'directions/', 'flyer/'];

    var box = document.createElement('div');
    box.className = 'search-box';
    box.innerHTML =
        '<input type="search" placeholder="Search this site…" aria-label="Search this site" autocomplete="off">' +
        '<div class="search-results"></div>';
    btn.parentNode.insertBefore(box, btn);

    var input = box.querySelector('input');
    var results = box.querySelector('.search-results');
    var index = null;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        box.classList.toggle('open');
        if (box.classList.contains('open')) {
            input.focus();
            if (!index) index = buildIndex();
        } else {
            results.innerHTML = '';
        }
    });

    document.addEventListener('click', function (e) {
        if (!box.contains(e.target)) {
            box.classList.remove('open');
            results.innerHTML = '';
        }
    });

    input.addEventListener('input', function () { run(input.value); });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            var first = results.querySelector('a[href]');
            if (first) window.location.href = first.getAttribute('href');
        }
        if (e.key === 'Escape') {
            box.classList.remove('open');
            results.innerHTML = '';
        }
    });

    function buildIndex() {
        return Promise.all(PAGES.map(function (url) {
            return fetch(url)
                .then(function (r) { return r.text(); })
                .then(function (html) {
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    return {
                        url: url,
                        title: doc.title || url,
                        text: (doc.body.textContent || '').replace(/\s+/g, ' ')
                    };
                })
                .catch(function () { return null; });
        })).then(function (entries) {
            return entries.filter(Boolean);
        });
    }

    function run(query) {
        query = query.trim().toLowerCase();
        if (!query) { results.innerHTML = ''; return; }
        if (!index) index = buildIndex();
        index.then(function (entries) {
            var html = '';
            entries.forEach(function (entry) {
                var pos = entry.text.toLowerCase().indexOf(query);
                if (pos === -1) return;
                var start = Math.max(0, pos - 40);
                var snippet =
                    (start > 0 ? '…' : '') +
                    entry.text.slice(start, pos + query.length + 60) + '…';
                html +=
                    '<a href="' + entry.url + '">' +
                    '<span class="sr-title">' + escapeHtml(entry.title) + '</span>' +
                    '<span class="sr-snippet">' + escapeHtml(snippet) + '</span>' +
                    '</a>';
            });
            results.innerHTML = html || '<span class="sr-empty">No results found.</span>';
        });
    }

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
})();
