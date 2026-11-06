// Main Application Logic for CS413 Course Companion
// Tanta University - Dr. Moustafa El-Ashry

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        allSlides: courseSlidesData,
        filteredSlides: [...courseSlidesData],
        currentLecture: 'all', // 'all', 'lec1_2', 'lec3'
        currentCategory: 'all',
        searchQuery: '',
        viewMode: 'cards', // 'cards', 'deck'
        deckIndex: 0,
        theme: localStorage.getItem('ps_theme') || 'dark',
        fontScale: localStorage.getItem('ps_font_scale') || 'md',
        lightboxIndex: 0
    };

    // Apply Theme
    function applyTheme(theme) {
        state.theme = theme;
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

        renderCurrentView();
    }

    // View Switcher
    function setViewMode(mode) {
        state.viewMode = mode;
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active-tab');
            } else {
                tab.classList.remove('active-tab');
            }
        });

        // Toggle container visibility
        const cardsEl = document.getElementById('cardsViewContainer');
        const deckEl = document.getElementById('deckViewContainer');
        if (cardsEl) cardsEl.classList.toggle('hidden', mode !== 'cards');
        if (deckEl) deckEl.classList.toggle('hidden', mode !== 'deck');

        renderCurrentView();
    }

    function renderCurrentView() {
        if (state.viewMode === 'cards') {
            renderCards();
        } else if (state.viewMode === 'deck') {
            renderDeck();
        }
    }

    // Render Cards View
    function renderCards() {
        const container = document.getElementById('cardsGrid');
        if (!container) return;

        if (state.filteredSlides.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <div class="text-4xl mb-3">🔍</div>
                    <h3 class="text-lg font-bold text-heading">لم يتم العثور على أي سلايد مطابقة لبحثك</h3>
                    <p class="text-sm text-slate-400 mt-1">جرب كلمات بحث أخرى أو قم بإلغاء الفلاتر المحددة</p>
                    <button onclick="window.resetFilters()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow">
                        إعادة ضبط الفلاتر والبحث
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = state.filteredSlides.map((slide) => `
            <div class="slide-card themed-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between" id="${slide.id}">
                <div>
                    <!-- Card Top Header -->
                    <div class="p-5 pb-3 border-b border-slate-800 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 text-[11px] font-bold rounded-lg ${slide.lec === 'lec1_2' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                                ${slide.lec === 'lec1_2' ? 'محاضرة 1&2' : 'محاضرة 3'}
                            </span>
                            <span class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                سلايد ${slide.slideNum}
                            </span>
                        </div>
                        <span class="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800/60">
                            ${slide.categoryAr}
                        </span>
                    </div>

                    <!-- Slide Image with Lightbox trigger -->
                    <div class="relative group cursor-pointer overflow-hidden themed-inner bg-slate-950" onclick="window.openLightboxBySlideId('${slide.id}')">
                        <img src="${slide.image}" alt="${slide.titleEn}" class="w-full h-56 sm:h-60 object-contain bg-black/20 group-hover:scale-102 transition duration-300" loading="lazy">
                        <div class="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                            <span class="px-3.5 py-2 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-1.5">
                                <span>🔍</span> تكبير السلايد الأصلية
                            </span>
                        </div>
                    </div>

                    <!-- Titles -->
                    <div class="p-5 pb-2">
                        <h3 class="text-xl font-bold text-heading leading-snug">${slide.titleAr}</h3>
                        <div class="text-xs font-mono text-slate-400 mt-1">${slide.titleEn}</div>
                    </div>

                    <!-- Explanations in Egyptian Slang -->
                    <div class="px-5 py-3">
                        <div class="p-4 sm:p-5 rounded-2xl slang-callout shadow-sm">
                            <div class="flex items-center gap-2 text-xs sm:text-sm font-bold slang-callout-title mb-2">
                                <span class="text-base">💡</span> الشرح بالعامية (بالبلدي وبكل بساطة):
                            </div>
                            <p class="text-base slang-callout-text leading-relaxed font-normal whitespace-pre-line">${slide.slangExplanation}</p>
                        </div>
                    </div>

                    <!-- Practical Example -->
                    <div class="px-5 pb-3">
                        <div class="p-4 sm:p-5 rounded-2xl example-callout shadow-sm">
                            <div class="flex items-center gap-2 text-xs sm:text-sm font-bold example-callout-title mb-2">
                                <span class="text-base">🚀</span> مثال عملي من الواقع:
                            </div>
                            <p class="text-sm sm:text-base example-callout-text leading-relaxed whitespace-pre-line">${slide.practicalExample}</p>
                        </div>
                    </div>

                    <!-- Collapsible Original English Content -->
                    <div class="px-5 pb-4">
                        <details class="group themed-inner bg-slate-950 rounded-xl border border-slate-800 text-xs">
                            <summary class="p-3 font-medium text-slate-400 cursor-pointer list-none flex items-center justify-between select-none">
                                <span class="flex items-center gap-1.5">
                                    <span>📄</span> النص الأصلي للسلايد بالإنجليزية
                                </span>
                                <span class="text-slate-500 group-open:rotate-180 transition">▼</span>
                            </summary>
                            <div class="p-3 pt-1 text-slate-300 font-mono text-[11px] space-y-1.5 border-t border-slate-800">
                                ${slide.contentOriginal.map(c => `<div>• ${c}</div>`).join('')}
                            </div>
                        </details>
                    </div>
                </div>

                <!-- Card Footer (Takeaway & Exam Tip) -->
                <div class="p-5 pt-3 themed-inner bg-slate-950/70 border-t border-slate-800 space-y-2">
                    <div class="text-[11px] text-sky-400 flex items-start gap-1.5">
                        <span class="font-bold shrink-0">🎯 كبسولة:</span>
                        <span class="text-slate-300">${slide.keyTakeaway}</span>
                    </div>
                    <div class="text-[11px] text-amber-400 flex items-start gap-1.5">
                        <span class="font-bold shrink-0">📝 في الامتحان:</span>
                        <span class="text-slate-300">${slide.examTip}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render Presentation Deck Mode
    function renderDeck() {
        const deckContainer = document.getElementById('deckViewContent');
        if (!deckContainer) return;

        if (state.deckIndex < 0) state.deckIndex = 0;
        if (state.deckIndex >= state.allSlides.length) state.deckIndex = state.allSlides.length - 1;

        const slide = state.allSlides[state.deckIndex];

        deckContainer.innerHTML = `
            <div class="themed-card bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-7xl mx-auto">
                <!-- Deck Controls Top -->
                <div class="flex items-center justify-between gap-4 pb-5 border-b border-slate-800">
                    <div class="flex items-center gap-3">
                        <span class="px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl ${slide.lec === 'lec1_2' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}">
                            ${slide.lec === 'lec1_2' ? 'محاضرة 1&2' : 'محاضرة 3'}
                        </span>
                        <span class="px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-800/90 text-slate-200">
                            سلايد ${slide.slideNum} من 37
                        </span>
                        <span class="text-xs sm:text-sm text-slate-400 font-mono">(${state.deckIndex + 1} / ${state.allSlides.length})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.deckPrev()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow">
                            السابق ⬅️
                        </button>
                        <button onclick="window.deckNext()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow">
                            التالي ➡️
                        </button>
                    </div>
                </div>

                <!-- Deck Body -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-center">
                    <!-- Original Slide Large Image (6 Cols) -->
                    <div class="lg:col-span-6 relative rounded-2xl overflow-hidden bg-black/40 border border-slate-700/80 cursor-pointer shadow-2xl group flex items-center justify-center min-h-[380px] lg:min-h-[500px]" onclick="window.openLightboxBySlideId('${slide.id}')">
                        <img src="${slide.image}" alt="${slide.titleEn}" class="w-full h-auto max-h-[540px] object-contain transition-transform duration-300 group-hover:scale-102">
                        <div class="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-1.5">
                            <span>🔍</span> انقر للتكبير
                        </div>
                    </div>

                    <!-- Slide Details (6 Cols) -->
                    <div class="lg:col-span-6 space-y-5">
                        <div>
                            <span class="text-xs sm:text-sm text-blue-400 font-extrabold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 inline-block mb-2">${slide.categoryAr}</span>
                            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-heading leading-tight">${slide.titleAr}</h2>
                            <div class="text-xs sm:text-sm font-mono text-slate-400 mt-1.5">${slide.titleEn}</div>
                        </div>

                        <div class="p-5 sm:p-6 rounded-2xl slang-callout shadow-md">
                            <div class="text-sm sm:text-base font-bold slang-callout-title mb-2 flex items-center gap-2">
                                <span class="text-lg">💡</span> الشرح بالعامية (بالبلدي وبكل بساطة):
                            </div>
                            <p class="text-base sm:text-lg slang-callout-text leading-relaxed font-normal whitespace-pre-line">${slide.slangExplanation}</p>
                        </div>

                        <div class="p-4 sm:p-5 rounded-2xl example-callout shadow-md">
                            <div class="text-sm sm:text-base font-bold example-callout-title mb-2 flex items-center gap-2">
                                <span class="text-lg">🚀</span> مثال واقعي:
                            </div>
                            <p class="text-sm sm:text-base example-callout-text leading-relaxed font-normal whitespace-pre-line">${slide.practicalExample}</p>
                        </div>

                        <div class="p-4 themed-inner bg-slate-950 rounded-xl border border-slate-800 text-sm flex items-start gap-2 shadow-inner">
                            <span class="font-bold text-amber-400 shrink-0 text-base">📝 نقطة امتحان:</span> 
                            <span class="text-slate-200 font-normal leading-relaxed text-sm sm:text-base">${slide.examTip}</span>
                        </div>
                    </div>
                </div>

                <!-- Deck Bottom Progress Bar -->
                <div class="w-full bg-slate-800/60 h-2.5 rounded-full overflow-hidden mt-6">
                    <div class="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300" style="width: ${((state.deckIndex + 1) / state.allSlides.length) * 100}%"></div>
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
        if (!document.getElementById('lightboxModal').classList.contains('hidden')) {
            if (e.key === 'Escape') window.closeLightbox();
            if (e.key === 'ArrowRight') window.lightboxNext();
            if (e.key === 'ArrowLeft') window.lightboxPrev();
        } else if (state.viewMode === 'deck') {
            if (e.key === 'ArrowRight') window.deckNext();
            if (e.key === 'ArrowLeft') window.deckPrev();
        }
    });

    window.deckNext = function() {
        if (state.deckIndex < state.allSlides.length - 1) {
            state.deckIndex++;
            renderDeck();
        }
    };

    window.deckPrev = function() {
        if (state.deckIndex > 0) {
            state.deckIndex--;
            renderDeck();
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

    // Nav tabs listeners
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            setViewMode(tab.dataset.mode);
        });
    });

    // Theme buttons listeners
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
        });
    });

    // Initialize View
    filterSlides();
});
