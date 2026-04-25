// ==========================================
// AirOps AI — Audio Waveform Visualizer
// ==========================================

import { useEffect, useState } from 'react';

interface WaveformProps {
  isActive: boolean;
  color?: string;
  bars?: number;
  height?: number;
  align?: 'center' | 'bottom';
}

export default function WaveformVisualizer({ 
  isActive, 
  color = 'var(--primary)', 
  bars = 5,
  height = 30,
  align = 'center'
}: WaveformProps) {
  const [activeBars, setActiveBars] = useState<number[]>(Array(bars).fill(0.1));

  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      setActiveBars(prev => prev.map(() => {
        // If active, random height between 30% and 100%
        // If inactive, settle down to ~10%
        if (isActive) {
          return 0.3 + Math.random() * 0.7;
        } else {
          return 0.1 + Math.random() * 0.1;
        }
      }));
      
      // Update slower than 60fps for a retro/blocky feel, or fast for smooth
      animationFrame = setTimeout(() => {
        requestAnimationFrame(animate);
      }, isActive ? 100 : 300) as unknown as number;
    };

    animate();

    return () => {
      clearTimeout(animationFrame);
    };
  }, [isActive, bars]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: align === 'center' ? 'center' : 'flex-end', 
      gap: 4, 
      height: height,
      padding: '0 8px'
    }}>
      {activeBars.map((val, idx) => (
        <div 
          key={idx}
          style={{
            width: 4,
            height: `${val * 100}%`,
            backgroundColor: color,
            borderRadius: 2,
            transition: 'height 0.15s ease-in-out',
            opacity: isActive ? 1 : 0.5
          }}
        />
      ))}
    </div>
  );
}
