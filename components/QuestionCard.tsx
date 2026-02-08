import React, { useCallback } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { FormQuestion, QuestionType } from '../types';
import TagInput from './TagInput';

interface QuestionCardProps {
    question: FormQuestion;
    index: number;
    onUpdate: (updatedQuestion: FormQuestion) => void;
    customResponse: string;
    onCustomResponseChange: (val: string) => void;
}

const QuestionCard = React.memo(({ question: q, onUpdate, customResponse, onCustomResponseChange }: QuestionCardProps) => {

    const [localOptions, setLocalOptions] = React.useState(q.options);

    // Sync local state when question prop changes from parent (e.g. AI injection or search)
    React.useEffect(() => {
        setLocalOptions(q.options);
    }, [q.options]);

    const handleBalanceEvenly = useCallback(() => {
        if (!localOptions || localOptions.length === 0) return;

        const options = [...localOptions];
        const count = options.length;
        const equalWeight = Math.floor(100 / count);
        const remainder = 100 - (equalWeight * count);

        const newOptions = options.map((opt, i) => ({
            ...opt,
            weight: equalWeight + (i === 0 ? remainder : 0)
        }));

        setLocalOptions(newOptions);
        onUpdate({ ...q, options: newOptions });
    }, [q, localOptions, onUpdate]);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, oIdx: number) => {
        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
        const options = [...localOptions];

        // 1. Update the target option
        options[oIdx] = { ...options[oIdx], weight: val };

        // 2. Proportional redistribution
        const remaining = 100 - val;
        const otherIndices = options.map((_, i) => i).filter(i => i !== oIdx);

        if (otherIndices.length > 0) {
            const sumOthers = otherIndices.reduce((sum, i) => sum + (options[i].weight || 0), 0);

            if (sumOthers > 0) {
                // Redistribute proportionally
                otherIndices.forEach(i => {
                    options[i] = {
                        ...options[i],
                        weight: Math.round((options[i].weight! / sumOthers) * remaining)
                    };
                });
            } else {
                // Redistribute equally if others are 0
                const equalShare = Math.floor(remaining / otherIndices.length);
                otherIndices.forEach(i => {
                    options[i] = { ...options[i], weight: equalShare };
                });
            }

            // 3. Normalization (Fix rounding errors)
            const currentSum = options.reduce((sum, opt) => sum + (opt.weight || 0), 0);
            const diff = 100 - currentSum;
            if (diff !== 0) {
                const adjustIdx = otherIndices[0];
                options[adjustIdx].weight = (options[adjustIdx].weight || 0) + diff;
            }
        }

        setLocalOptions(options);

        // Debounced sync logic could be here, but for now we update state 
        // We'll add a timer to avoid spamming the parent
        const timeoutId = (window as any)[`timeout_${q.id}`];
        if (timeoutId) clearTimeout(timeoutId);
        (window as any)[`timeout_${q.id}`] = setTimeout(() => {
            onUpdate({ ...q, options });
        }, 300);
    }, [q, localOptions, onUpdate]);

    return (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-slate-200 font-medium max-w-[70%] group-hover:text-white transition-colors capitalize">{q.title}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-white/5 px-2 py-1 rounded text-slate-500 font-mono uppercase tracking-tighter opacity-60">{q.type}</span>
                </div>
            </div>

            {/* Quick Actions */}
            {q.options.length > 0 && (
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleBalanceEvenly}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Balance Evenly</span>
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {/* Text Fields: Manual Tag Input */}
                {(q.type === QuestionType.SHORT_ANSWER || q.type === QuestionType.PARAGRAPH) && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Manual Response Pool</span>
                                <span className="text-[8px] text-slate-600 italic font-mono">Variants for: {q.title}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded border ${q.type === QuestionType.PARAGRAPH ? 'text-emerald-500/80 bg-emerald-500/5 border-emerald-500/10' : 'text-amber-500/80 bg-amber-500/5 border-amber-500/10'}`}>
                                <span className={`w-1 h-1 rounded-full animate-pulse ${q.type === QuestionType.PARAGRAPH ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {q.type === QuestionType.PARAGRAPH ? 'LONG FORM' : 'SMART CHIPS'}
                            </div>
                        </div>
                        <TagInput
                            value={customResponse || ''}
                            onChange={onCustomResponseChange}
                            placeholder={q.type === QuestionType.PARAGRAPH ? "Provide a sample paragraph..." : "Enter a response..."}
                            isParagraph={q.type === QuestionType.PARAGRAPH}
                        />
                        <p className="text-[9px] text-slate-500 italic opacity-60">
                            {q.type === QuestionType.PARAGRAPH
                                ? "Generate rich, varied paragraphs. Use multiple variants to avoid detection."
                                : "Add multiple unique responses. The AI will rotate through them to avoid duplicates."}
                        </p>
                    </div>
                )}

                {/* Option Based Fields: Sliders */}
                {localOptions.length > 0 && localOptions.slice(0, 10).map((opt, oIdx) => (
                    <div key={oIdx} className="space-y-1.5">
                        {/* Option name and percentage */}
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 truncate max-w-[70%]" title={opt.value}>{opt.value}</span>
                            <span className="text-amber-400 font-mono font-bold text-xs tabular-nums">{opt.weight || 0}%</span>
                        </div>

                        {/* Interactive slider */}
                        <div className="relative group/slider">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={opt.weight || 0}
                                onChange={(e) => handleSliderChange(e, oIdx)}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-grab active:cursor-grabbing focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(245,158,11,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-125"
                            />
                            {/* Track Fill Visual - Simple hack using gradient or just reliance on standard input style */}
                            <div
                                className="absolute top-0 left-0 h-1.5 bg-amber-500 rounded-lg opacity-50 pointer-events-none"
                                style={{ width: `${opt.weight || 0}%` }}
                            />
                        </div>
                    </div>
                ))}

                {q.type === QuestionType.LINEAR_SCALE && (
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Linear Scale Range</span>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/5">
                                    <span className="text-[9px] text-slate-500 uppercase">Min</span>
                                    <input
                                        type="number"
                                        className="bg-transparent w-8 text-center text-[10px] text-white font-mono outline-none"
                                        placeholder="1"
                                        defaultValue={localOptions.length > 0 ? localOptions[0].value : "1"}
                                        onBlur={(e) => {
                                            const min = parseInt(e.target.value) || 1;
                                            const max = parseInt((e.target.parentElement?.parentElement?.querySelector('input:last-child') as HTMLInputElement)?.value) || 5;
                                            if (max > min) {
                                                const newOptions = [];
                                                const range = max - min + 1;
                                                const weight = Math.floor(100 / range);
                                                const remainder = 100 - (weight * range);

                                                for (let i = 0; i < range; i++) {
                                                    newOptions.push({
                                                        value: (min + i).toString(),
                                                        weight: weight + (i === 0 ? remainder : 0)
                                                    });
                                                }
                                                onUpdate({ ...q, options: newOptions });
                                            }
                                        }}
                                    />
                                </label>
                                <span className="text-slate-600">-</span>
                                <label className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded border border-white/5">
                                    <span className="text-[9px] text-slate-500 uppercase">Max</span>
                                    <input
                                        type="number"
                                        className="bg-transparent w-8 text-center text-[10px] text-white font-mono outline-none"
                                        placeholder="5"
                                        defaultValue={localOptions.length > 0 ? localOptions[localOptions.length - 1].value : "5"}
                                        onBlur={(e) => {
                                            const max = parseInt(e.target.value) || 5;
                                            const min = parseInt((e.target.parentElement?.parentElement?.querySelector('input:first-child') as HTMLInputElement)?.value) || 1;
                                            if (max > min) {
                                                const newOptions = [];
                                                const range = max - min + 1;
                                                const weight = Math.floor(100 / range);
                                                const remainder = 100 - (weight * range);

                                                for (let i = 0; i < range; i++) {
                                                    newOptions.push({
                                                        value: (min + i).toString(),
                                                        weight: weight + (i === 0 ? remainder : 0)
                                                    });
                                                }
                                                onUpdate({ ...q, options: newOptions });
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500 italic opacity-70">
                            Adjust the range if the detected scale (e.g. 1-5, 0-10) is incorrect.
                        </p>
                    </div>
                )}

                {q.type === QuestionType.LINEAR_SCALE && localOptions.length === 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-[10px] text-red-300">
                            Warning: No options detected for this linear scale.
                            The automation may default to the first value.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default QuestionCard;
