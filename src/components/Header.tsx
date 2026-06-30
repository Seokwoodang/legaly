import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TEAMS, C } from '../theme';
import AccountArea from './AccountArea';
import Icon from './Icon';

type Active = 'consult' | 'guides' | 'laws' | 'cases' | 'saved' | null;

interface Props {
  variant: 'lobby' | 'team';
  active?: Active;
  onOpenAuth: () => void;
}

const NAV: { key: Active; label: string; href: string }[] = [
  { key: 'consult', label: '상담', href: '/consult' },
  { key: 'guides', label: '절차 가이드', href: '/guides' },
  { key: 'laws', label: '자료실', href: '/laws' },
  { key: 'cases', label: '판례', href: '/cases' },
  { key: 'saved', label: '보관함', href: '/saved' },
];

export default function Header({ variant, active = null, onOpenAuth }: Props) {
  const { team, setTeam } = useApp();
  const cfg = TEAMS[team];
  const firstMenuItem = active === 'saved'
    ? { label: '홈으로', href: '/' }
    : { label: '내 보관함', href: '/saved' };

  if (variant === 'lobby') {
    return (
      <header style={{ background: C.surfaceHeader, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 20, height: 66 }}>
          <Logo big />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/guides" style={{ fontSize: 14, fontWeight: 700, color: C.muted2, textDecoration: 'none', padding: '8px 6px' }}>절차 가이드</Link>
            <Link to="/consult" style={{ fontSize: 14, fontWeight: 700, color: C.muted2, textDecoration: 'none', padding: '8px 6px', marginRight: 4 }}>AI 상담</Link>
            <AccountArea onOpenAuth={onOpenAuth} firstMenuItem={firstMenuItem} showNameHeader />
          </div>
        </div>
      </header>
    );
  }

  const tab = (on: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 15px', borderRadius: 9,
    fontSize: 13.5, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    transition: '.15s',
    ...(on ? { background: cfg.accent, color: '#fff', boxShadow: `0 2px 8px -2px ${cfg.shadow}` } : { background: 'transparent', color: '#6b6459' }),
  });

  return (
    <header style={{ background: C.surfaceHeader, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 60 }}>
        <Logo />
        <div style={{ display: 'inline-flex', background: C.segTrack, borderRadius: 11, padding: 4, gap: 4, marginLeft: 6 }}>
          <button onClick={() => setTeam('법무')} style={tab(team === '법무')}><span style={{ width: 15, height: 15, display: 'inline-flex' }}><Icon name="scale" /></span>법무팀</button>
          <button onClick={() => setTeam('세무')} style={tab(team === '세무')}><span style={{ width: 15, height: 15, display: 'inline-flex' }}><Icon name="calc" /></span>세무팀</button>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <AccountArea onOpenAuth={onOpenAuth} firstMenuItem={firstMenuItem} compact />
        </div>
      </div>
      <div style={{ borderTop: '1px solid #f0ede7' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {NAV.map(n => {
            const on = n.key === active;
            return (
              <Link key={n.key} to={n.href} style={{ padding: '13px 4px', marginRight: 18, fontSize: 14.5, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', borderBottom: '2.5px solid transparent', ...(on ? { color: cfg.accent, borderBottomColor: cfg.accent } : { color: C.faint }) }}>{n.label}</Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function Logo({ big }: { big?: boolean }) {
  const sz = big ? 38 : 34;
  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: big ? 11 : 10, textDecoration: 'none', flexShrink: 0 }}>
      <span style={{ width: sz, height: sz, borderRadius: big ? 11 : 10, background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: big ? 9 : 8 }}><Icon name="scale" /></span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12 }}>
        <span style={{ fontSize: big ? 18 : 17, fontWeight: 800, color: C.navy, letterSpacing: '-.02em' }}>리걸리</span>
        {big && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.faint2, letterSpacing: '-.01em' }}>나의 법무팀 &amp; 세무팀</span>}
      </span>
    </Link>
  );
}
