import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { initial } from '../lib/format';
import { C } from '../theme';

interface Props {
  onOpenAuth: () => void;
  firstMenuItem: { label: string; href: string };
  compact?: boolean;
  showNameHeader?: boolean;
}

export default function AccountArea({ onOpenAuth, firstMenuItem, compact, showNameHeader }: Props) {
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const av = compact ? 28 : 30;
  const fs = compact ? 12.5 : 13;

  if (!user) {
    return (
      <button onClick={onOpenAuth} style={{ padding: compact ? '8px 16px' : '9px 18px', borderRadius: 10, border: 'none', background: C.navy, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>로그인</button>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 9, padding: compact ? '5px 11px 5px 5px' : '6px 12px 6px 6px', borderRadius: 999, border: '1px solid #e6e2da', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}>
        <span style={{ width: av, height: av, borderRadius: '50%', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, fontWeight: 700 }}>{initial(user.name)}</span>
        <span style={{ fontSize: compact ? 13.5 : 14, fontWeight: 700, color: C.ink2 }}>{user.name}님</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: compact ? 48 : 52, right: 0, background: '#fff', border: '1px solid #e6e2da', borderRadius: 12, boxShadow: '0 16px 40px -16px rgba(0,0,0,.25)', padding: 6, minWidth: 170, zIndex: 60 }}>
          {showNameHeader && (
            <div style={{ padding: '10px 12px 8px', fontSize: 12, color: C.faint3, fontWeight: 600, borderBottom: '1px solid #f0ede7', marginBottom: 4 }}>{user.name}님</div>
          )}
          <Link to={firstMenuItem.href} onClick={() => setOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#3f4a55', textDecoration: 'none' }}>{firstMenuItem.label}</Link>
          <button onClick={() => { logout(); setOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: C.danger, fontFamily: 'inherit', cursor: 'pointer' }}>로그아웃</button>
        </div>
      )}
    </div>
  );
}
