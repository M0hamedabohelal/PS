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
        viewMode: 'cards', // 'cards', 'deck', 'simulator', 'tools', 'quiz'
        deckIndex: 0,
        theme: localStorage.getItem('ps_theme') || 'dark',
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
        document.getElementById('cardsViewContainer').classList.toggle('hidden', mode !== 'cards');
        document.getElementById('deckViewContainer').classList.toggle('hidden', mode !== 'deck');
        document.getElementById('simulatorViewContainer').classList.toggle('hidden', mode !== 'simulator');
        document.getElementById('toolsViewContainer').classList.toggle('hidden', mode !== 'tools');
        document.getElementById('quizViewContainer').classList.toggle('hidden', mode !== 'quiz');

        renderCurrentView();

        if (mode === 'simulator' && !window.blocksSim) {
            window.blocksSim = new BlocksWorldSimulator('blocksSimMount');
        }
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
                    <h3 class="text-lg font-bold text-slate-300">لم يتم العثور على أي سلايد مطابقة لبحثك</h3>
                    <p class="text-sm text-slate-500 mt-1">جرب كلمات بحث أخرى أو قم بإلغاء الفلاتر المحددة</p>
                    <button onclick="window.resetFilters()" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition">
                        إعادة ضبط الفلاتر والبحث
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = state.filteredSlides.map((slide, idx) => `
            <div class="slide-card bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-slate-700 transition duration-300 flex flex-col justify-between" id="${slide.id}">
                <div>
                    <!-- Card Top Header -->
                    <div class="p-5 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 text-[11px] font-black rounded-lg ${slide.lec === 'lec1_2' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                                ${slide.lec === 'lec1_2' ? 'محاضرة 1&2' : 'محاضرة 3'}
                            </span>
                            <span class="px-2.5 py-1 text-[11px] font-black rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                سلايد ${slide.slideNum}
                            </span>
                        </div>
                        <span class="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800/80">
                            ${slide.categoryAr}
                        </span>
                    </div>

                    <!-- Slide Image with Lightbox trigger -->
                    <div class="relative group cursor-pointer overflow-hidden bg-slate-950" onclick="window.openLightboxBySlideId('${slide.id}')">
                        <img src="${slide.image}" alt="${slide.titleEn}" class="w-full h-52 object-contain bg-black/40 group-hover:scale-102 transition duration-300" loading="lazy">
                        <div class="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[1px]">
                            <span class="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-1.5">
                                <span>🔍</span> تكبير السلايد الأصلية
                            </span>
                        </div>
                    </div>

                    <!-- Titles -->
                    <div class="p-5 pb-2">
                        <h3 class="text-lg font-bold text-white leading-snug">${slide.titleAr}</h3>
                        <div class="text-xs font-mono text-slate-400 mt-0.5">${slide.titleEn}</div>
                    </div>

                    <!-- Explanations in Egyptian Slang -->
                    <div class="px-5 py-3">
                        <div class="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
                            <div class="flex items-center gap-2 text-xs font-black text-amber-400 mb-1.5">
                                <span class="text-sm">💡</span> الشرح بالعامية (بالبلدي):
                            </div>
                            <p class="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">${slide.slangExplanation}</p>
                        </div>
                    </div>

                    <!-- Practical Example -->
                    <div class="px-5 pb-3">
                        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div class="flex items-center gap-2 text-xs font-black text-emerald-400 mb-1.5">
                                <span class="text-sm">🚀</span> مثال عملي من الواقع:
                            </div>
                            <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${slide.practicalExample}</p>
                        </div>
                    </div>

                    <!-- Collapsible Original English Content -->
                    <div class="px-5 pb-4">
                        <details class="group bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                            <summary class="p-3 font-semibold text-slate-400 cursor-pointer list-none flex items-center justify-between select-none">
                                <span class="flex items-center gap-1.5">
                                    <span>📄</span> النص الأصلي للسلايد بالإنجليزية
                                </span>
                                <span class="text-slate-500 group-open:rotate-180 transition">▼</span>
                            </summary>
                            <div class="p-3 pt-1 text-slate-300 font-mono text-[11px] space-y-1.5 border-t border-slate-800/60">
                                ${slide.contentOriginal.map(c => `<div>• ${c}</div>`).join('')}
                            </div>
                        </details>
                    </div>
                </div>

                <!-- Card Footer (Takeaway & Exam Tip) -->
                <div class="p-5 pt-3 bg-slate-950/40 border-t border-slate-800/80 space-y-2">
                    <div class="text-[11px] text-sky-300 flex items-start gap-1.5">
                        <span class="font-bold text-sky-400 shrink-0">🎯 كبسولة:</span>
                        <span>${slide.keyTakeaway}</span>
                    </div>
                    <div class="text-[11px] text-amber-300/90 flex items-start gap-1.5">
                        <span class="font-bold text-amber-400 shrink-0">📝 في الامتحان:</span>
                        <span>${slide.examTip}</span>
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
            <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-5xl mx-auto">
                <!-- Deck Controls Top -->
                <div class="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 text-xs font-bold rounded-xl ${slide.lec === 'lec1_2' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}">
                            ${slide.lec === 'lec1_2' ? 'محاضرة 1&2' : 'محاضرة 3'}
                        </span>
                        <span class="px-3 py-1 text-xs font-bold rounded-xl bg-slate-800 text-slate-200">
                            سلايد ${slide.slideNum} من 37
                        </span>
                        <span class="text-xs text-slate-400">(${state.deckIndex + 1} / ${state.allSlides.length})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.deckPrev()" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1">
                            السابق ⬅️
                        </button>
                        <button onclick="window.deckNext()" class="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1">
                            التالي ➡️
                        </button>
                    </div>
                </div>

                <!-- Deck Body -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 my-6 items-center">
                    <!-- Original Slide Large Image -->
                    <div class="relative rounded-2xl overflow-hidden bg-black/60 border border-slate-800 cursor-pointer shadow-xl group" onclick="window.openLightboxBySlideId('${slide.id}')">
                        <img src="${slide.image}" alt="${slide.titleEn}" class="w-full h-auto max-h-[420px] object-contain">
                        <div class="absolute bottom-3 right-3 bg-slate-900/90 text-white text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">
                            انقر للتكبير 🔍
                        </div>
                    </div>

                    <!-- Slide Details -->
                    <div class="space-y-4">
                        <div>
                            <span class="text-xs text-blue-400 font-bold">${slide.categoryAr}</span>
                            <h2 class="text-2xl font-black text-white mt-1">${slide.titleAr}</h2>
                            <div class="text-xs font-mono text-slate-400 mt-1">${slide.titleEn}</div>
                        </div>

                        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                            <div class="text-xs font-bold text-amber-400 mb-1">💡 الشرح بالعامية (بالبلدي):</div>
                            <p class="text-sm text-slate-200 leading-relaxed">${slide.slangExplanation}</p>
                        </div>

                        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                            <div class="text-xs font-bold text-emerald-400 mb-1">🚀 مثال واقعي:</div>
                            <p class="text-xs text-slate-300 leading-relaxed">${slide.practicalExample}</p>
                        </div>

                        <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-sky-300">
                            <span class="font-bold text-sky-400">🎯 كبسولة الامتحان:</span> ${slide.examTip}
                        </div>
                    </div>
                </div>

                <!-- Deck Bottom Progress Bar -->
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-6">
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

    // ==========================================
    // Interactive Tool 1: 5 Whys Root Cause Tool
    // ==========================================
    window.runFiveWhysPreset = function(presetType) {
        const presets = {
            server: {
                problem: "السيرفر الرئيسي للكلية وقع أثناء تسجيل رغبات ومواد التخرج.",
                whys: [
                    { q: "ليه السيرفر وقع؟", a: "عشان استهلاك الذاكرة (RAM) وصل 100% وحصل Crash." },
                    { q: "ليه الذاكرة اتملت للدرجة دي؟", a: "عشان عدد المستخدمين المتزامنين وصل 5000 طالب بينما السيرفر متحمل 500 فقط." },
                    { q: "ليه السيستم مش قادر يوزع الحمل (Load Balancing)؟", a: "عشان التطبيق متصمم بنظام Monolithic قديم على جهاز سيرفر فردي ملوش Auto-scaling." },
                    { q: "ليه ما اتعملش تحديث للـ Cloud Infrastructure قبل بداية السنة؟", a: "عشان مكنش فيه خطة اختبارات ضغط (Load Testing) مسبقة قبل فتح التسجيل." },
                    { q: "ليه مكنش فيه خطة اختبارات وضمان جودة دورية؟", a: "السبب الجذري الحقيقي: غياب إطار عمل معتمد (Framework) لإدارة التغيير والجودة قبل إطلاق أي خدمة حرجة (المطابقة للسلايد 10 و 37)." }
                ]
            },
            app: {
                problem: "العملاء بيلغوا تثبيت تطبيق التوصيل (Uninstall) بعد أول طلبية.",
                whys: [
                    { q: "ليه بيلغوا التطبيق؟", a: "عشان الطلب بيوصل متأخر أكتر من ساعة والأكل بيكون بارد." },
                    { q: "ليه التوصيل بيتأخر ساعة؟", a: "عشان الطيار مبيعرفش عنوان العميل الدقيق وبيتوه في الشوارع." },
                    { q: "ليه مش بيعرف العنوان الدقيق؟", a: "عشان التطبيق بيعتمد على كتابة العنوان يدوياً كنص بدون خريطة GPS دقيقة." },
                    { q: "ليه متضافتش خريطة الـ GPS؟", a: "عشان الفريق اعتبر إضافة الـ Maps API مكلفة ومخدش رأي الزبائن والطيارين في البداية." },
                    { q: "ليه تم تجاهل المعنيين؟", a: "السبب الجذري: ارتكاب الخطأ رقم 1 في حل المشكلات (سلايد 37): عدم إشراك الأشخاص المناسبين (Not involving the right people)." }
                ]
            }
        };

        const data = presets[presetType];
        if (!data) return;

        document.getElementById('fiveWhysProblemInput').value = data.problem;
        const container = document.getElementById('fiveWhysStepsContainer');
        container.innerHTML = `
            <div class="space-y-3 mt-4">
                ${data.whys.map((step, i) => `
                    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
                        <div class="text-xs font-bold text-amber-400 mb-1">السبب ${i + 1} (${step.q}):</div>
                        <div class="text-sm text-slate-200 font-semibold">${step.a}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    // ==========================================
    // Interactive Tool 2: 5 Ws Problem Statement Builder
    // ==========================================
    window.buildProblemStatement = function() {
        const who = document.getElementById('psWho').value.trim() || '[المتضرر]';
        const what = document.getElementById('psWhat').value.trim() || '[المشكلة الفعلية]';
        const where = document.getElementById('psWhere').value.trim() || '[المكان / النظام]';
        const when = document.getElementById('psWhen').value.trim() || '[التوقيت / المناسبة]';
        const why = document.getElementById('psWhy').value.trim() || '[الأهمية والأثر المترتب]';

        const resultArabic = `يواجه (${who}) مشكلة (${what}) في (${where}) وذلك أثناء (${when})، ويعد حل هذه المشكلة أمراً حاسماً نظراً لأن (${why}).`;
        const resultEnglish = `(${who}) experiences (${what}) at (${where}) during (${when}). Resolving this issue is critical because (${why}).`;

        document.getElementById('generatedPSAr').innerText = resultArabic;
        document.getElementById('generatedPSEn').innerText = resultEnglish;
        document.getElementById('psOutputCard').classList.remove('hidden');
    };

    window.copyGeneratedPS = function() {
        const text = document.getElementById('generatedPSAr').innerText;
        navigator.clipboard.writeText(text);
        alert('تم نسخ صياغة المشكلة بنجاح!');
    };

    // ==========================================
    // Interactive Tool 3: Quiz & Exam Prep
    // ==========================================
    const quizData = [
        {
            q: "ما هو الشرط المسبق (Precondition) لتنفيذ الأمر pickup(X) في نظام STRIPS؟",
            options: [
                "gripping(X) ∧ ontable(X)",
                "gripping() ∧ clear(X) ∧ ontable(X)",
                "clear(X) ∧ on(X,Y)",
                "gripping() ∧ on(X,Y)"
            ],
            correct: 1,
            explanation: "في سلايد 25: عملية pickup(X) تشترط أن تكون يد الروبوت فارغة gripping()، والمكعب خالي الرأس clear(X)، وملامساً للترابيزة ontable(X)."
        },
        {
            q: "ما هي عناصر الثلاثية (Triple) التي تمثل أي مُشغّل في نظام STRIPS؟",
            options: [
                "Past, Present, Future",
                "Input, Process, Output",
                "Preconditions, Add list, Delete list",
                "Problem, Analysis, Decision"
            ],
            correct: 2,
            explanation: "في سلايد 24: كل مُشغّل يُمثّل بثلاثية: الشروط المسبقة (P)، قائمة الإضافات (A)، وقائمة المحذوفات (D)."
        },
        {
            q: "ماذا تعني كلمة 'Gemba' في سياق تحديد المشكلة (سلايد 8)؟",
            options: [
                "مكتب الإدارة العليا والتخطيط",
                "المكان الفعلي لحدوث العمل ومصدر المشكلة الحقيقي",
                "قاعدة البيانات الرقمية للشركة",
                "اسم مؤتمر إدارة الجودة في طوكيو"
            ],
            correct: 1,
            explanation: "في سلايد 8: Gemba كلمة يابانية تعني الذهاب إلى المكان الحقيقي للعمل لملاحظة العمليات وتوثيق ما يحدث على أرض الواقع."
        },
        {
            q: "ما هو مبدأ باريتو (The Pareto Principle - 80/20 Rule) في حل المشكلات؟",
            options: [
                "80% من المشكلات تتطلب 20 مهندس لحلها",
                "80% من التأثيرات والمشاكل تنبع من 20% فقط من الأسباب الرئيسية",
                "حل 80% من المشكلات يستهلك 20% من الميزانية دائماً",
                "نسبة الخطأ المسموح بها في أي مصنع هي 20%"
            ],
            correct: 1,
            explanation: "في سلايد 34: مبدأ باريتو يؤكد أن 80% من النتائج أو المشاكل ناتجة عن 20% فقط من الأسباب الحيوية."
        },
        {
            q: "ما هي المراحل الخمس لمنهجية التفكير التصميمي (Design Thinking) بالترتيب؟",
            options: [
                "Plan, Do, Check, Act, Repeat",
                "Empathize, Define, Ideate, Prototype, Test",
                "Define, Measure, Analyze, Improve, Control",
                "Ask, Research, Brainstorm, Decide, Review"
            ],
            correct: 1,
            explanation: "في سلايد 34: مراحل التفكير التصميمي الخمس هي: التعاطف (Empathize)، ثم التعريف (Define)، ثم توليد الأفكار (Ideate)، ثم النموذج الأولي (Prototype)، وأخيراً الاختبار (Test)."
        },
        {
            q: "أي مما يلي يُعد من الأخطاء الخمسة القاتلة التي يجب تجنبها عند حل المشكلات (سلايد 37)؟",
            options: [
                "استخدام تقنية 5 Whys",
                "إشراك الموردين والعملاء في طرح الأفكار",
                "إجراء تحسينات لا تعالج السبب الجذري للمشكلة",
                "توثيق الدروس المستفادة في نهاية المشروع"
            ],
            correct: 2,
            explanation: "في سلايد 37: الخطأ رقم 3 هو (Making improvements that don't address the source of the problem)، أي وضع مسكنات سطحية دون علاج الجذور."
        }
    ];

    let userAnswers = {};
    window.renderQuiz = function() {
        const container = document.getElementById('quizQuestionsContainer');
        if (!container) return;

        container.innerHTML = quizData.map((item, qIdx) => `
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                        ${qIdx + 1}
                    </span>
                    <h4 class="text-base font-bold text-white">${item.q}</h4>
                </div>
                <div class="space-y-2">
                    ${item.options.map((opt, optIdx) => `
                        <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition">
                            <input type="radio" name="quiz_q_${qIdx}" value="${optIdx}" onchange="window.selectQuizAnswer(${qIdx}, ${optIdx})" class="w-4 h-4 text-blue-600">
                            <span class="text-sm text-slate-300 font-mono">${opt}</span>
                        </label>
                    `).join('')}
                </div>
                <div id="quizFeedback_${qIdx}" class="hidden p-3 rounded-xl text-xs font-semibold"></div>
            </div>
        `).join('');
    };

    window.selectQuizAnswer = function(qIdx, optIdx) {
        userAnswers[qIdx] = optIdx;
    };

    window.submitQuiz = function() {
        let score = 0;
        quizData.forEach((item, qIdx) => {
            const feedbackEl = document.getElementById(`quizFeedback_${qIdx}`);
            const selected = userAnswers[qIdx];
            feedbackEl.classList.remove('hidden', 'bg-emerald-500/20', 'text-emerald-300', 'bg-red-500/20', 'text-red-300');

            if (selected === item.correct) {
                score++;
                feedbackEl.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/40');
                feedbackEl.innerHTML = `✅ إجابة صحيحة وممتازة! <br><span class="text-slate-300 font-normal">${item.explanation}</span>`;
            } else {
                feedbackEl.classList.add('bg-red-500/20', 'text-red-300', 'border', 'border-red-500/40');
                feedbackEl.innerHTML = `❌ إجابة غير صحيحة. الإجابة الصحيحة هي: <strong class="font-mono text-white">${item.options[item.correct]}</strong>.<br><span class="text-slate-300 font-normal">${item.explanation}</span>`;
            }
        });

        const scoreBanner = document.getElementById('quizScoreBanner');
        scoreBanner.classList.remove('hidden');
        scoreBanner.innerHTML = `
            <div class="text-center p-6 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-blue-500/40 rounded-2xl">
                <div class="text-3xl mb-1">${score === quizData.length ? '🏆 مبروك امتياز!' : score >= quizData.length / 2 ? '👏 جيد جداً، عاش يا بطل!' : '📚 محتاج تراجع السلايدات تاني'}</div>
                <div class="text-xl font-black text-white">درجتك: ${score} من ${quizData.length} (${Math.round((score / quizData.length) * 100)}%)</div>
                <p class="text-xs text-slate-300 mt-2">راجع الإجابات النموذجية والشرح بالعامية لتثبيت المعلومات قبل الامتحان!</p>
            </div>
        `;
    };

    // Initialize View
    filterSlides();
    window.renderQuiz();
});
