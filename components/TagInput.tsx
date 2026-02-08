import React, { useState } from 'react';
import { Command } from 'lucide-react';

interface TagInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    isParagraph?: boolean;
}

const TagInput = React.memo(({ value, onChange, placeholder, isParagraph = false }: TagInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const tags = value ? value.split(',').map(t => t.trim()).filter(t => t !== '') : [];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            if (e.key === 'Enter' && isParagraph && e.shiftKey) return;

            e.preventDefault();
            const tag = inputValue.trim();
            if (tag && !tags.includes(tag)) {
                onChange(value ? `${value}, ${tag}` : tag);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            const newTags = [...tags];
            newTags.pop();
            onChange(newTags.join(', '));
        }
    };

    const removeTag = (index: number) => {
        const newTags = tags.filter((_, i) => i !== index);
        onChange(newTags.join(', '));
    };

    return (
        <div className={`flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-xl transition-all shadow-inner group/taginput ${isParagraph ? 'min-h-[120px] focus-within:border-emerald-500/50' : 'min-h-[56px] focus-within:border-amber-500/50'}`}>
            {tags.map((tag, i) => (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold animate-fade-in group/tag ${isParagraph ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 w-full' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    <span className={`${isParagraph ? '' : 'max-w-[150px] truncate'}`}>{tag}</span>
                    <button
                        onClick={() => removeTag(i)}
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${isParagraph ? 'hover:bg-emerald-500/20 text-emerald-500/50' : 'hover:bg-amber-500/20 text-amber-500/50'}`}
                    >
                        ✕
                    </button>
                </div>
            ))}
            {isParagraph ? (
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            handleKeyDown(e as any);
                        }
                    }}
                    placeholder={tags.length === 0 ? placeholder : 'Add another variant...'}
                    className="w-full bg-transparent border-none outline-none text-[11px] text-white font-mono px-2 py-1 min-h-[40px] placeholder:text-slate-600 resize-none"
                    style={{ minHeight: '40px' }}
                />
            ) : (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className="flex-1 bg-transparent border-none outline-none text-[11px] text-white font-mono px-2 min-w-[150px] placeholder:text-slate-600"
                />
            )}

            <div className="w-full flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                    <Command className="w-3 h-3" />
                    {tags.length} Response {tags.length === 1 ? 'Variant' : 'Variants'}
                </div>
                {isParagraph && (
                    <div className="text-[8px] text-slate-700 font-mono uppercase tracking-tighter">
                        Press Enter to add variant • Shift+Enter for newline
                    </div>
                )}
            </div>
        </div>
    );
});

export default TagInput;
