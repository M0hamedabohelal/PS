// Main Application Logic for CS413 Course Companion (Presentation Deck Mode)
// Tanta University - Dr. Moustafa El-Ashry

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        allSlides: courseSlidesData,
        filteredSlides: [...courseSlidesData],
        currentLecture: 'all', // 'all', 'lec1_2', 'lec3'
        currentCategory: 'all',
        searchQuery: '',
        deckIndex: 0,
        theme: localStorage.getItem('ps_theme_v3') || 'light', // Default is 'light'
        fontScale: localStorage.getItem('ps_font_scale') || 'md',
        lightboxIndex: 0
    };

    // Apply Theme
    function applyTheme(theme) {
        state.theme = theme;
        localStorage.setItem('ps_theme_v3', theme);
        localStorage.setItem('ps_theme', theme);
        document.documentElement.classList.remove('theme-dark', 'theme-sepia', 'theme-light');
        document.documentElement.classList.add(`theme-${theme}`);
        
        // Update theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === theme) {
                btn.classList.add('active-theme');
            } else {
                btn.classList.remove('active-theme');
            }
        });
    }
    applyTheme(state.theme);

    // Font Scaling
    window.setFontScale = function(scale) {
        state.fontScale = scale;
        localStorage.setItem('ps_font_scale', scale);
        document.documentElement.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg', 'font-scale-xl');
        document.documentElement.classList.add(`font-scale-${scale}`);
        document.querySelectorAll('.font-scale-btn').forEach(btn => {
            btn.classList.toggle('active-scale', btn.dataset.scale === scale);
        });
    };
    window.setFontScale(state.fontScale);

    // Format Arabic Title to prevent BiDi wrapping on trailing English symbols
    function formatArabicTitle(title) {
        if (!title) return '';
        return title.replace(/([A-Za-z0-9\*\+\-]+(?:\s+[A-Za-z0-9\*\+\-]+)*)/g, '<span dir="ltr" class="inline-block whitespace-nowrap font-mono font-bold">$1</span>');
    }

    // Helper to highlight technical terms in English and quoted terms
    function highlightTerms(str) {
        if (!str) return '';
        // 1. Highlight terms in parentheses: e.g. (Atomic Actions) or (State Space Search)
        let res = str.replace(/\(([A-Za-z0-9\s\*_\-\+—/]+)\)/g, (match, term) => {
            return `<span class="tech-badge font-mono" dir="ltr">(${term.trim()})</span>`;
        });
        // 2. Standalone A* algorithm
        res = res.replace(/(^|\s)A\*(\s|$|[،\.!])/g, '$1<span class="tech-badge font-mono font-black" dir="ltr">A*</span>$2');
        // 3. Highlight single quotes: e.g. 'فضاء الحالات' -> «فضاء الحالات»
        res = res.replace(/'([^']+)'/g, '<strong class="font-bold text-heading">«$1»</strong>');
        return res;
    }

    // Rich Text Formatter for Slang & Practical Examples
    function formatRichText(rawText, isAmber = true) {
        if (!rawText) return '';
        const text = rawText.trim();

        // Check if contains numbered items like '1. ' or '1- '
        const hasNumberedList = /(?:^|\n|\s)\d+[\.\-]\s/.test(text);

        if (hasNumberedList) {
            const firstMatch = text.match(/(?:^|\n|\s)(1[\.\-]\s)/);
            let intro = '';
            let listText = text;
            if (firstMatch && firstMatch.index > 0) {
                intro = text.substring(0, firstMatch.index).trim();
                listText = text.substring(firstMatch.index).trim();
            }

            const rawItems = listText.split(/(?=(?:^|\n|\s)\d+[\.\-]\s)/).map(s => s.trim()).filter(Boolean);

            let html = '';
            if (intro) {
                html += `<div class="text-sm sm:text-base font-bold text-heading mb-2.5 leading-relaxed">${highlightTerms(intro)}</div>`;
            }

            html += '<div class="space-y-2.5 mt-2">';
            rawItems.forEach(item => {
                const m = item.match(/^(\d+)[\.\-]\s*([\s\S]*)$/);
                if (m) {
                    const num = m[1];
                    const body = m[2].trim();
                    let itemTitle = '';
                    let itemDesc = body;
                    const colonIdx = body.indexOf(':');
                    if (colonIdx > 0 && colonIdx < 60) {
                        itemTitle = body.substring(0, colonIdx).trim();
                        itemDesc = body.substring(colonIdx + 1).trim();
                    }

                    const badgeClass = isAmber ? 'badge-slang' : 'badge-example';

                    html += `
                        <div class="formatted-item p-3 sm:p-3.5 rounded-xl flex items-start gap-3 shadow-sm transition">
                            <span class="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm ${badgeClass}">${num}</span>
                            <div class="flex-1 text-xs sm:text-sm md:text-base leading-relaxed">
                                ${itemTitle ? `<strong class="font-bold text-heading block mb-0.5 text-sm sm:text-base">${highlightTerms(itemTitle)}:</strong>` : ''}
                                <span class="leading-relaxed opacity-95">${highlightTerms(itemDesc)}</span>
                            </div>
                        </div>
                    `;
                } else {
                    html += `<div class="text-xs sm:text-sm md:text-base leading-relaxed">${highlightTerms(item)}</div>`;
                }
            });
            html += '</div>';
            return html;
        }

        // Line-by-line smart processing (supports bullets, rhetorical questions, and paragraphs)
        const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

        let html = '<div class="space-y-3">';
        lines.forEach(line => {
            // Check if bullet point (- or •)
            if (/^[\-•]\s*/.test(line)) {
                const clean = line.replace(/^[\-•]\s*/, '').trim();
                let bulletTitle = '';
                let bulletBody = clean;
                const colonIdx = clean.indexOf(':');
                if (colonIdx > 0 && colonIdx < 50) {
                    bulletTitle = clean.substring(0, colonIdx).trim();
                    bulletBody = clean.substring(colonIdx + 1).trim();
                }

                html += `
                    <div class="formatted-item p-3 sm:p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm transition">
                        <span class="text-blue-500 mt-0.5 shrink-0 text-base">🔹</span>
                        <div class="flex-1 text-xs sm:text-sm md:text-base leading-relaxed">
                            ${bulletTitle ? `<strong class="font-bold text-heading block mb-0.5 text-sm sm:text-base">${highlightTerms(bulletTitle)}:</strong>` : ''}
                            <span class="leading-relaxed opacity-95">${highlightTerms(bulletBody)}</span>
                        </div>
                    </div>
                `;
            }
            // Check if rhetorical question (e.g. الروبوت عشان يخطط بيعمل إيه؟)
            else if (line.endsWith('؟') || line.endsWith('?')) {
                html += `
                    <div class="font-extrabold text-heading text-sm sm:text-base md:text-lg my-1.5 flex items-center gap-2">
                        <span class="text-base sm:text-lg">❓</span>
                        <span>${highlightTerms(line)}</span>
                    </div>
                `;
            }
            // Check if section lead / intro (ends with ':')
            else if (line.endsWith(':')) {
                html += `
                    <div class="font-bold text-heading text-xs sm:text-sm md:text-base mt-2 mb-0.5">
                        ${highlightTerms(line)}
                    </div>
                `;
            }
            // Normal paragraph
            else {
                html += `
                    <p class="text-xs sm:text-sm md:text-base leading-relaxed opacity-95">
                        ${highlightTerms(line)}
                    </p>
                `;
            }
        });
        html += '</div>';
        return html;
    }

    // Filter Logic
    function filterSlides() {
        state.filteredSlides = state.allSlides.filter(slide => {
            // Lecture filter
            if (state.currentLecture !== 'all' && slide.lec !== state.currentLecture) {
                return false;
            }
            // Category filter
            if (state.currentCategory !== 'all' && slide.category !== state.currentCategory) {
                return false;
            }
            // Search query
            if (state.searchQuery.trim() !== '') {
                const q = state.searchQuery.toLowerCase().trim();
                const matchTitleEn = slide.titleEn.toLowerCase().includes(q);
                const matchTitleAr = slide.titleAr.toLowerCase().includes(q);
                const matchContent = slide.contentOriginal.some(c => c.toLowerCase().includes(q));
                const matchSlang = slide.slangExplanation.toLowerCase().includes(q);
                const matchExample = slide.practicalExample.toLowerCase().includes(q);
                const matchCategory = slide.category.toLowerCase().includes(q) || slide.categoryAr.toLowerCase().includes(q);
                const matchSlideNum = slide.slideNum.toString() === q;
                return matchTitleEn || matchTitleAr || matchContent || matchSlang || matchExample || matchCategory || matchSlideNum;
            }
            return true;
        });

        // Update counts
        const countEl = document.getElementById('slidesCountBadge');
        if (countEl) countEl.innerText = `${state.filteredSlides.length} سلايد`;

        state.deckIndex = 0;
        renderDeck();
    }

    // Render Presentation Deck Mode
    function renderDeck() {
        const deckContainer = document.getElementById('deckViewContent');
        if (!deckContainer) return;

        if (state.filteredSlides.length === 0) {
            deckContainer.innerHTML = `
                <div class="themed-card rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-xl">
                    <div class="text-5xl mb-4">🔍</div>
                    <h3 class="text-xl font-bold text-heading">لم يتم العثور على أي سلايد مطابقة لبحثك</h3>
                    <p class="text-sm text-subtitle mt-2">جرب البحث بكلمات أخرى أو قم بإلغاء الفلاتر المحددة</p>
                    <button onclick="window.resetFilters()" class="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow">
                        إعادة ضبط الفلاتر والبحث
                    </button>
                </div>
            `;
            return;
        }

        if (state.deckIndex < 0) state.deckIndex = 0;
        if (state.deckIndex >= state.filteredSlides.length) state.deckIndex = state.filteredSlides.length - 1;

        const slide = state.filteredSlides[state.deckIndex];

        deckContainer.innerHTML = `
            <div class="themed-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 lg:p-10 shadow-xl max-w-7xl mx-auto w-full min-w-0 overflow-hidden">
                <!-- Deck Controls Top -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-5 border-b tabs-border w-full min-w-0">
                    <div class="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-3 w-full sm:w-auto">
                        <div class="flex items-center gap-1.5 sm:gap-2">
                            <span class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shrink-0 ${slide.lec === 'lec1_2' ? 'badge-lec12' : 'badge-lec3'}">
                                ${slide.lec === 'lec1_2' ? 'محاضرة 1&2' : 'محاضرة 3'}
                            </span>
                            <span class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl badge-slide-num shrink-0">
                                سلايد ${slide.slideNum}
                            </span>
                        </div>
                        <span class="text-xs sm:text-sm text-subtitle font-mono shrink-0 whitespace-nowrap font-bold">(${state.deckIndex + 1} من ${state.filteredSlides.length})</span>
                    </div>
                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <button onclick="window.deckPrev()" class="deck-btn-prev flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 shadow">
                            السابق ⬅️
                        </button>
                        <button onclick="window.deckNext()" class="deck-btn-next flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1 shadow">
                            التالي ➡️
                        </button>
                    </div>
                </div>

                <!-- Deck Body -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 my-5 sm:my-8 items-start w-full min-w-0">
                    <!-- Original Slide Large Image (6 Cols) -->
                    <div class="lg:col-span-6 relative rounded-2xl overflow-hidden themed-inner border tabs-border cursor-pointer shadow-xl group flex items-center justify-center slide-img-container w-full min-w-0" onclick="window.openLightboxBySlideId('${slide.id}')">
                        <img src="${slide.image}" alt="${slide.titleEn}" class="w-full h-auto max-h-[320px] sm:max-h-[440px] lg:max-h-[540px] object-contain transition-transform duration-300 group-hover:scale-102">
                        <div class="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-slate-900/90 text-white text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-1.5">
                            <span>🔍</span> انقر للتكبير
                        </div>
                    </div>

                    <!-- Slide Details (6 Cols) -->
                    <div class="lg:col-span-6 space-y-4 sm:space-y-6 w-full min-w-0">
                        <div>
                            <span class="text-[11px] sm:text-sm font-extrabold px-2.5 sm:px-3 py-1 rounded-full badge-category inline-block mb-1.5 sm:mb-2">${slide.categoryAr}</span>
                            <h2 class="text-xl sm:text-2xl lg:text-3xl font-black text-heading leading-tight">${formatArabicTitle(slide.titleAr)}</h2>
                            <div class="text-xs sm:text-sm font-mono text-subtitle mt-1.5 sm:mt-2" dir="ltr">${slide.titleEn}</div>
                        </div>

                        <!-- Slang Explanation Box -->
                        <div class="p-4 sm:p-6 rounded-2xl slang-callout shadow-md">
                            <div class="text-sm sm:text-base md:text-lg font-black slang-callout-title mb-2.5 sm:mb-3 flex items-center gap-2">
                                <span class="text-lg sm:text-xl">💡</span> الشرح بالعامية (بالبلدي وبكل بساطة):
                            </div>
                            <div class="slang-callout-text leading-relaxed font-normal">
                                ${formatRichText(slide.slangExplanation, true)}
                            </div>
                        </div>

                        <!-- Practical Example Box -->
                        <div class="p-4 sm:p-6 rounded-2xl example-callout shadow-md">
                            <div class="text-sm sm:text-base md:text-lg font-black example-callout-title mb-2.5 sm:mb-3 flex items-center gap-2">
                                <span class="text-lg sm:text-xl">🚀</span> مثال واقعي من الحياة والبرمجة:
                            </div>
                            <div class="example-callout-text leading-relaxed font-normal">
                                ${formatRichText(slide.practicalExample, false)}
                            </div>
                        </div>

                        <!-- Exam Tip -->
                        <div class="p-3.5 sm:p-5 rounded-2xl exam-callout text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3 shadow-sm">
                            <span class="font-bold text-amber-500 shrink-0 text-sm sm:text-base">📝 نقطة امتحان:</span> 
                            <span class="leading-relaxed font-medium">${slide.examTip}</span>
                        </div>

                        <!-- Key Takeaway -->
                        <div class="p-3.5 sm:p-5 rounded-2xl capsule-callout text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3 shadow-sm">
                            <span class="font-bold text-blue-500 shrink-0 text-sm sm:text-base">🎯 كبسولة سريعة:</span> 
                            <span class="leading-relaxed font-medium">${slide.keyTakeaway}</span>
                        </div>
                    </div>
                </div>

                <!-- Bottom Navigation Controls for mobile and quick reading -->
                <div class="pt-3 sm:pt-4 border-t tabs-border flex items-center justify-between gap-2 mt-4 sm:mt-6 w-full min-w-0">
                    <div class="flex items-center gap-2 flex-1 sm:flex-initial">
                        <button onclick="window.deckPrev()" class="deck-btn-prev flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow">
                            السابق ⬅️
                        </button>
                        <button onclick="window.deckNext()" class="deck-btn-next flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow">
                            التالي ➡️
                        </button>
                    </div>
                    <div class="text-xs text-subtitle font-mono shrink-0 whitespace-nowrap">
                        سلايد <strong class="text-heading">${state.deckIndex + 1}</strong> من ${state.filteredSlides.length}
                    </div>
                </div>

                <!-- Deck Bottom Progress Bar -->
                <div class="w-full deck-progress-track h-2 sm:h-2.5 rounded-full overflow-hidden mt-3 sm:mt-4">
                    <div class="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300" style="width: ${((state.deckIndex + 1) / state.filteredSlides.length) * 100}%"></div>
                </div>
            </div>
        `;
    }

    // Lightbox Modal
    window.openLightboxBySlideId = function(slideId) {
        const idx = state.allSlides.findIndex(s => s.id === slideId);
        if (idx !== -1) {
            state.lightboxIndex = idx;
            updateLightboxContent();
            document.getElementById('lightboxModal').classList.remove('hidden');
        }
    };

    function updateLightboxContent() {
        const slide = state.allSlides[state.lightboxIndex];
        const img = document.getElementById('lightboxImg');
        const title = document.getElementById('lightboxTitle');
        const num = document.getElementById('lightboxNum');
        if (img) img.src = slide.image;
        if (title) title.innerText = `${slide.titleAr} (${slide.titleEn})`;
        if (num) num.innerText = `سلايد ${slide.slideNum} (${state.lightboxIndex + 1} من ${state.allSlides.length})`;
    }

    window.closeLightbox = function() {
        document.getElementById('lightboxModal').classList.add('hidden');
    };

    window.lightboxNext = function() {
        state.lightboxIndex = (state.lightboxIndex + 1) % state.allSlides.length;
        updateLightboxContent();
    };

    window.lightboxPrev = function() {
        state.lightboxIndex = (state.lightboxIndex - 1 + state.allSlides.length) % state.allSlides.length;
        updateLightboxContent();
    };

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }
        if (!document.getElementById('lightboxModal').classList.contains('hidden')) {
            if (e.key === 'Escape') window.closeLightbox();
            if (e.key === 'ArrowRight') window.lightboxNext();
            if (e.key === 'ArrowLeft') window.lightboxPrev();
        } else {
            if (e.key === 'ArrowRight') window.deckNext();
            if (e.key === 'ArrowLeft') window.deckPrev();
        }
    });

    // Touch swipe gestures for smartphones and tablets
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Only trigger if horizontal swipe is prominent (> 45px) and horizontal exceeds vertical
            if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
                const isLightboxOpen = !document.getElementById('lightboxModal').classList.contains('hidden');
                if (isLightboxOpen) {
                    if (diffX < 0) {
                        window.lightboxNext();
                    } else {
                        window.lightboxPrev();
                    }
                } else {
                    if (diffX < 0) {
                        window.deckNext();
                    } else {
                        window.deckPrev();
                    }
                }
            }
        }
    }, { passive: true });

    function scrollToDeckTop() {
        const container = document.getElementById('deckViewContainer');
        if (container) {
            const rect = container.getBoundingClientRect();
            if (rect.top < 60) {
                window.scrollTo({
                    top: window.scrollY + rect.top - 75,
                    behavior: 'smooth'
                });
            }
        }
    }

    window.deckNext = function() {
        if (state.deckIndex < state.filteredSlides.length - 1) {
            state.deckIndex++;
            renderDeck();
            scrollToDeckTop();
        }
    };

    window.deckPrev = function() {
        if (state.deckIndex > 0) {
            state.deckIndex--;
            renderDeck();
            scrollToDeckTop();
        }
    };

    // Filter controls
    window.setLectureFilter = function(lec) {
        state.currentLecture = lec;
        document.querySelectorAll('.lec-filter-btn').forEach(btn => {
            if (btn.dataset.lec === lec) {
                btn.classList.add('active-filter');
            } else {
                btn.classList.remove('active-filter');
            }
        });
        filterSlides();
    };

    window.setCategoryFilter = function(cat) {
        state.currentCategory = cat;
        document.querySelectorAll('.cat-filter-btn').forEach(btn => {
            if (btn.dataset.cat === cat) {
                btn.classList.add('active-cat');
            } else {
                btn.classList.remove('active-cat');
            }
        });
        filterSlides();
    };

    window.resetFilters = function() {
        state.currentLecture = 'all';
        state.currentCategory = 'all';
        state.searchQuery = '';
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.lec-filter-btn').forEach(b => b.classList.toggle('active-filter', b.dataset.lec === 'all'));
        document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.toggle('active-cat', b.dataset.cat === 'all'));
        filterSlides();
    };

    // Search input listener
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            filterSlides();
        });
    }

    // Theme buttons listeners
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
        });
    });

    // Initialize Deck View
    filterSlides();
});
