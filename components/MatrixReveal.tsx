import React, { useState, useEffect, useRef } from 'react';

interface MatrixRevealProps {
    text: string;
    className?: string;
}

const MatrixReveal: React.FC<MatrixRevealProps> = ({
    text,
    className = ""
}) => {
    // Determine which character (if any) is currently "glitching"
    // -1 means no glitch (pure gold text)
    const [glitchIndex, setGlitchIndex] = useState<number>(-1);
    const [glitchChar, setGlitchChar] = useState<string>('');
    const elementRef = useRef<HTMLSpanElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*<>[]{}';

    // Visibility Check
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                setIsVisible(entry.isIntersecting);
            });
        }, { threshold: 0.1 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, []);

    // The "Living" Effect Loop
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            // 20% chance to glitch a character every 100ms
            if (Math.random() > 0.7) {
                const index = Math.floor(Math.random() * text.length);
                // Don't glitch spaces
                if (text[index] !== ' ') {
                    setGlitchIndex(index);
                    setGlitchChar(chars[Math.floor(Math.random() * chars.length)]);

                    // Reset back to Gold quickly (50-150ms)
                    setTimeout(() => {
                        setGlitchIndex(-1);
                    }, 50 + Math.random() * 100);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isVisible, text, chars]);

    const handleInteraction = () => {
        // Trigger a manual glitch wave
        if (glitchIndex === -1) {
            // Simple ripple affect? Or just crazy scrambe?
            // Let's just do a quick scramble of 3 random chars
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const index = Math.floor(Math.random() * text.length);
                    if (text[index] !== ' ') {
                        setGlitchIndex(index);
                        setGlitchChar(chars[Math.floor(Math.random() * chars.length)]);
                        setTimeout(() => setGlitchIndex(-1), 100);
                    }
                }, i * 50);
            }
        }
    };

    return (
        <span
            ref={elementRef}
            className={`inline-flex whitespace-pre cursor-default select-none ${className}`}
            onMouseEnter={handleInteraction}
            onClick={handleInteraction}
        >
            {text.split('').map((char, i) => {
                const isGlitching = i === glitchIndex;

                if (char === ' ') return <span key={i}> </span>;

                return (
                    <span
                        key={i}
                        className="inline-block transition-colors duration-75 will-change-transform"
                        style={{
                            // Normal: Inherit (Gold Gradient), Serif, No Shadow
                            // Glitch: Matrix Green, Mono, Glow, Scale
                            color: isGlitching ? '#10b981' : 'transparent', // Gold needs transparent text for bg-clip
                            backgroundImage: isGlitching ? 'none' : 'inherit', // Keep gradient flow for gold
                            fontFamily: isGlitching ? '"JetBrains Mono", monospace' : 'inherit',
                            textShadow: isGlitching ? '0 0 10px rgba(16,185,129,0.9)' : 'none',
                            transform: isGlitching ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                            opacity: isGlitching ? 1 : 1, // Always visible
                            WebkitBackgroundClip: isGlitching ? 'border-box' : 'text', // Disable clip for green char
                            backgroundClip: isGlitching ? 'border-box' : 'text'
                        }}
                    >
                        {isGlitching ? glitchChar : char}
                    </span>
                );
            })}
        </span>
    );
};

export default MatrixReveal;
