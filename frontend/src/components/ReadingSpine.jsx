import { useEffect, useState } from 'react';

export default function ReadingSpine() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="reading-spine" aria-hidden="true">
      <div className="track">
        <div className="fill" style={{ height: `${progress}%` }} />
      </div>
      <div className="dot" />
    </div>
  );
}
