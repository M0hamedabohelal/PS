// Blocks World AI Planner Simulator based on STRIPS Operators (Slide 20-25)
// CS413: Problem Solving and Decision Making - Dr. Moustafa El-Ashry

class BlocksWorldSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.resetToInitialState();
    }

    resetToInitialState() {
        // Initial state from slide 19 & 20:
        // Table has: a, c, d
        // b is on a
        // e is on d
        // gripper is empty
        this.blocks = ['a', 'b', 'c', 'd', 'e'];
        this.blockColors = {
            'a': '#3b82f6', // blue
            'b': '#ef4444', // red
            'c': '#10b981', // green
            'd': '#f59e0b', // amber
            'e': '#8b5cf6'  // purple
        };
        
        this.on = { 'b': 'a', 'e': 'd' }; // block -> block it is on
        this.onTable = new Set(['a', 'c', 'd']);
        this.holding = null; // null means gripping() is true (empty)
        this.history = [];
        this.lastMessage = { type: 'info', text: 'تم إعادة ضبط المحاكي للحالة الابتدائية المذكورة في السلايد (شكل 8.18).' };
        this.render();
    }

    isClear(block) {
        if (this.holding === block) return false;
        // A block is clear if no other block is ON it
        for (let b of this.blocks) {
            if (this.on[b] === block) return false;
        }
        return true;
    }

    getPredicates() {
        let preds = [];
        // on(X,Y)
        for (let b of this.blocks) {
            if (this.on[b]) {
                preds.push(`on(${b}, ${this.on[b]})`);
            }
        }
        // ontable(X)
        for (let b of this.blocks) {
            if (this.onTable.has(b)) {
                preds.push(`ontable(${b})`);
            }
        }
        // clear(X)
        for (let b of this.blocks) {
            if (this.isClear(b)) {
                preds.push(`clear(${b})`);
            }
        }
        // gripping
        if (this.holding) {
            preds.push(`gripping(${this.holding})`);
        } else {
            preds.push(`gripping()`);
        }
        return preds;
    }

    pickup(x) {
        // P: gripping() ^ clear(X) ^ ontable(X)
        if (this.holding !== null) {
            this.lastMessage = { type: 'error', text: `فشل الأمر pickup(${x}): شرط gripping() غير متحقق لأن الملقاط ماسك المكعب (${this.holding}) بالفعل!` };
            this.render();
            return false;
        }
        if (!this.isClear(x)) {
            this.lastMessage = { type: 'error', text: `فشل الأمر pickup(${x}): شرط clear(${x}) غير متحقق لأن فيه مكعب راكب فوقه!` };
            this.render();
            return false;
        }
        if (!this.onTable.has(x)) {
            this.lastMessage = { type: 'error', text: `فشل الأمر pickup(${x}): شرط ontable(${x}) غير متحقق لأن المكعب ليس ملامساً للترابيزة مباشرة (استخدم unstack)!` };
            this.render();
            return false;
        }

        // Apply A and D
        // A: gripping(X)
        // D: ontable(X) ^ gripping()
        this.onTable.delete(x);
        this.holding = x;
        this.history.push(`pickup(${x})`);
        this.lastMessage = { type: 'success', text: `تم بنجاح: pickup(${x}) -> الملقاط رفع المكعب ${x} من على الترابيزة.` };
        this.render();
        return true;
    }

    putdown(x) {
        // P: gripping(X)
        if (this.holding !== x) {
            this.lastMessage = { type: 'error', text: `فشل الأمر putdown(${x}): شرط gripping(${x}) غير متحقق لأن الملقاط لا يمسك بالمكعب ${x}!` };
            this.render();
            return false;
        }

        // Apply A and D
        // A: ontable(X) ^ gripping() ^ clear(X)
        // D: gripping(X)
        this.holding = null;
        this.onTable.add(x);
        this.history.push(`putdown(${x})`);
        this.lastMessage = { type: 'success', text: `تم بنجاح: putdown(${x}) -> الملقاط وضع المكعب ${x} على سطح الترابيزة وأصبح حراً.` };
        this.render();
        return true;
    }

    stack(x, y) {
        // P: clear(Y) ^ gripping(X)
        if (this.holding !== x) {
            this.lastMessage = { type: 'error', text: `فشل الأمر stack(${x}, ${y}): شرط gripping(${x}) غير متحقق؛ الملقاط لا يمسك المكعب ${x}!` };
            this.render();
            return false;
        }
        if (!this.isClear(y)) {
            this.lastMessage = { type: 'error', text: `فشل الأمر stack(${x}, ${y}): شرط clear(${y}) غير متحقق؛ المكعب ${y} ليس فارغاً من الأعلى!` };
            this.render();
            return false;
        }
        if (x === y) {
            this.lastMessage = { type: 'error', text: `لا يمكن رص مكعب فوق نفسه!` };
            this.render();
            return false;
        }

        // Apply A and D
        // A: on(X,Y) ^ gripping() ^ clear(X)
        // D: clear(Y) ^ gripping(X)
        this.holding = null;
        this.on[x] = y;
        this.history.push(`stack(${x}, ${y})`);
        this.lastMessage = { type: 'success', text: `تم بنجاح: stack(${x}, ${y}) -> تم رص المكعب ${x} فوق المكعب ${y} وأصبح الملقاط فارغاً.` };
        this.render();
        return true;
    }

    unstack(x, y) {
        // P: clear(X) ^ gripping() ^ on(X,Y)
        if (this.holding !== null) {
            this.lastMessage = { type: 'error', text: `فشل الأمر unstack(${x}, ${y}): شرط gripping() غير متحقق؛ يد الروبوت ليست فارغة!` };
            this.render();
            return false;
        }
        if (!this.isClear(x)) {
            this.lastMessage = { type: 'error', text: `فشل الأمر unstack(${x}, ${y}): شرط clear(${x}) غير متحقق؛ يوجد مكعب آخر فوق ${x}!` };
            this.render();
            return false;
        }
        if (this.on[x] !== y) {
            this.lastMessage = { type: 'error', text: `فشل الأمر unstack(${x}, ${y}): شرط on(${x}, ${y}) غير متحقق؛ المكعب ${x} ليس راكباً فوق ${y}!` };
            this.render();
            return false;
        }

        // Apply A and D
        // A: gripping(X) ^ clear(Y)
        // D: gripping() ^ on(X,Y)
        delete this.on[x];
        this.holding = x;
        this.history.push(`unstack(${x}, ${y})`);
        this.lastMessage = { type: 'success', text: `تم بنجاح: unstack(${x}, ${y}) -> تم رفع المكعب ${x} من فوق المكعب ${y} وأصبح ${y} فارغاً.` };
        this.render();
        return true;
    }

    // Build stacks from bottom to top
    getStacks() {
        let stacks = [];
        let visited = new Set();

        for (let b of this.blocks) {
            if (this.onTable.has(b)) {
                let currentStack = [b];
                visited.add(b);
                let currentTop = b;
                while (true) {
                    let next = null;
                    for (let candidate of this.blocks) {
                        if (this.on[candidate] === currentTop) {
                            next = candidate;
                            break;
                        }
                    }
                    if (next) {
                        currentStack.push(next);
                        visited.add(next);
                        currentTop = next;
                    } else {
                        break;
                    }
                }
                stacks.push(currentStack);
            }
        }
        return stacks;
    }

    render() {
        if (!this.container) return;
        const stacks = this.getStacks();
        const predicates = this.getPredicates();

        const messageBg = this.lastMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          this.lastMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          'bg-sky-500/10 border-sky-500/30 text-sky-400';

        this.container.innerHTML = `
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm text-slate-100">
                <!-- Header -->
                <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                محاكي تفاعلي ذكي
                            </span>
                            <h3 class="text-xl font-black text-white">محاكي عالم المكعبات (Blocks World AI Simulator)</h3>
                        </div>
                        <p class="text-xs text-slate-400 mt-1">تطبيق عملي لقواعد ومُشغلات نظام STRIPS (سلايد 19-25) لدكتور مصطفى العشري</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="window.blocksSim.resetToInitialState()" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
                            🔄 إعادة ضبط (Slide State)
                        </button>
                    </div>
                </div>

                <!-- Status alert message -->
                <div class="my-4 p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${messageBg} transition-all">
                    <span>${this.lastMessage.type === 'error' ? '⚠️' : this.lastMessage.type === 'success' ? '✅' : 'ℹ️'}</span>
                    <span>${this.lastMessage.text}</span>
                </div>

                <!-- Simulation Visual Area -->
                <div class="relative bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 min-h-[300px] flex flex-col justify-end overflow-hidden">
                    <!-- Robot Arm Gripper at Top -->
                    <div class="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300">
                        <div class="w-1.5 h-10 bg-slate-500 rounded"></div>
                        <div class="flex items-center gap-2 bg-slate-800 border-2 ${this.holding ? 'border-amber-400 shadow-amber-500/20' : 'border-sky-400 shadow-sky-500/20'} px-4 py-2 rounded-xl shadow-lg">
                            <span class="text-xs font-bold ${this.holding ? 'text-amber-300' : 'text-sky-300'}">
                                ${this.holding ? `الملقاط ماسك: [ ${this.holding.toUpperCase()} ]` : 'الملقاط فارغ gripping()'}
                            </span>
                        </div>
                        ${this.holding ? `
                            <div class="mt-2 w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-xl animate-bounce"
                                 style="background-color: ${this.blockColors[this.holding]}; border: 2px solid rgba(255,255,255,0.4);">
                                ${this.holding.toUpperCase()}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Blocks Table Area -->
                    <div class="pt-28 pb-4 flex items-end justify-center gap-8 min-h-[180px]">
                        ${stacks.map((stack, stackIdx) => `
                            <div class="flex flex-col-reverse items-center gap-1.5">
                                ${stack.map((b, bIdx) => `
                                    <div class="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black text-xl text-white shadow-lg transition-transform hover:scale-105 border-2 border-white/20 relative group"
                                         style="background-color: ${this.blockColors[b]};">
                                        <span>${b.toUpperCase()}</span>
                                        ${this.isClear(b) ? '<span class="absolute -top-2 -right-1 text-[10px] bg-emerald-500 text-white px-1 rounded-full font-bold">Clear</span>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Table Surface Line -->
                    <div class="w-full h-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-lg shadow-md border-t-2 border-amber-500/40 flex items-center justify-center">
                        <span class="text-[10px] text-amber-200/60 font-semibold tracking-wider">سطح الطاولة TABLETOP</span>
                    </div>
                </div>

                <!-- Controls & STRIPS Operators -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <!-- Action Buttons -->
                    <div class="space-y-4">
                        <h4 class="text-sm font-bold text-slate-300 flex items-center gap-2">
                            <span>🎮</span> تنفيذ مشغلات STRIPS الأربعة:
                        </h4>

                        <!-- 1. Pickup -->
                        <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                            <div class="text-xs font-bold text-sky-400 mb-2">1- pickup(X) - رفع مكعب ملامس للترابيزة:</div>
                            <div class="flex flex-wrap gap-2">
                                ${this.blocks.map(b => `
                                    <button onclick="window.blocksSim.pickup('${b}')"
                                        class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 transition">
                                        pickup(${b})
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 2. Putdown -->
                        <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                            <div class="text-xs font-bold text-emerald-400 mb-2">2- putdown(X) - تنزيل المكعب الممسوك على الترابيزة:</div>
                            <div class="flex flex-wrap gap-2">
                                ${this.blocks.map(b => `
                                    <button onclick="window.blocksSim.putdown('${b}')"
                                        class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 transition">
                                        putdown(${b})
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 3. Stack & 4. Unstack -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                                <div class="text-xs font-bold text-indigo-400 mb-2">3- stack(X, Y) - رص:</div>
                                <div class="flex items-center gap-2">
                                    <select id="simStackX" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                                        ${this.blocks.map(b => `<option value="${b}">${b.toUpperCase()}</option>`).join('')}
                                    </select>
                                    <span class="text-xs text-slate-400">فوق</span>
                                    <select id="simStackY" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                                        ${this.blocks.map(b => `<option value="${b}">${b.toUpperCase()}</option>`).join('')}
                                    </select>
                                    <button onclick="window.blocksSim.stack(document.getElementById('simStackX').value, document.getElementById('simStackY').value)"
                                            class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold">
                                        تنفيذ
                                    </button>
                                </div>
                            </div>

                            <div class="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                                <div class="text-xs font-bold text-rose-400 mb-2">4- unstack(X, Y) - فك رص:</div>
                                <div class="flex items-center gap-2">
                                    <select id="simUnstackX" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                                        ${this.blocks.map(b => `<option value="${b}">${b.toUpperCase()}</option>`).join('')}
                                    </select>
                                    <span class="text-xs text-slate-400">من فوق</span>
                                    <select id="simUnstackY" class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200">
                                        ${this.blocks.map(b => `<option value="${b}">${b.toUpperCase()}</option>`).join('')}
                                    </select>
                                    <button onclick="window.blocksSim.unstack(document.getElementById('simUnstackX').value, document.getElementById('simUnstackY').value)"
                                            class="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold">
                                        تنفيذ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- World State Predicates View -->
                    <div class="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                                <h4 class="text-sm font-bold text-amber-400 flex items-center gap-2">
                                    <span>📋</span> محمولات الحالة الحالية (World State Predicates):
                                </h4>
                                <span class="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">${predicates.length} حقيقة</span>
                            </div>
                            <div class="flex flex-wrap gap-1.5 mt-3 max-h-48 overflow-y-auto">
                                ${predicates.map(p => `
                                    <span class="px-2 py-1 text-xs font-mono rounded bg-slate-800/90 text-cyan-300 border border-slate-700/80">
                                        ${p}
                                    </span>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Execution History -->
                        <div class="mt-4 pt-3 border-t border-slate-800">
                            <div class="text-xs font-semibold text-slate-400 mb-1.5">سجل الأوامر المنفذة (Plan Sequence):</div>
                            <div class="text-xs font-mono text-emerald-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800 min-h-[32px] overflow-x-auto whitespace-nowrap">
                                ${this.history.length > 0 ? this.history.join('  ➔  ') : '(لم يتم تنفيذ أي أمر بعد)'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

window.BlocksWorldSimulator = BlocksWorldSimulator;
