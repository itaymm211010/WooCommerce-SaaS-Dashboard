import { useEffect, useState } from 'react';

export function useDirection() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    const updateDirection = () => {
      const dir = document.documentElement.getAttribute('dir') || 'ltr';
      setDirection(dir as 'ltr' | 'rtl');
    };

    updateDirection();

    const observer = new MutationObserver(updateDirection);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    return () => observer.disconnect();
  }, []);

  return direction;
}
