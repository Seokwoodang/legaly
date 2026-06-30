import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { FIELD_TINT, GUIDE_CHIPS, HERO_GUIDE_TITLE, type Guide } from '../lib/guidesData';
import { TEAMS, C, FIELD_CHIP_ACTIVE } from '../theme';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import Icon from '../components/Icon';
import { useTitle } from '../lib/useTitle';

export default function GuidesPage() {
  useTitle('절차 가이드');
  const { team, login } = useApp();
  const cfg = TEAMS[team];
  const [params] = useSearchParams();
  const prevTeamRef = useRef(team);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [field, setField] = useState(() => params.get('field') || '전체');
  const [query, setQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  // 팀이 실제로 바뀔 때만 분야를 '전체'로 리셋(마운트의 ?field= 딥링크는 보존).
  useEffect(() => {
    if (prevTeamRef.current !== team) { prevTeamRef.current = team; setField('전체'); }
    dataClient.getGuides(team).then(setGuides);
  }, [team]);

  const results = useMemo(() => {
    const q = query.trim();
    return guides.filter(g =>
      (field === '전체' || g.field === field) &&
      (q === '' || g.title.includes(q) || g.summary.includes(q) || g.field.includes(q)));
  }, [guides, field, query]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="guides" onOpenAuth={() => setAuthOpen(true)} />
      <section style={{ background: cfg.soft, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(28px,4vw,44px) 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: cfg.accent, fontWeight: 700, marginBottom: 10 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 5 }}><Icon name={team === '법무' ? 'scale' : 'calc'} /></span>{cfg.label} 절차 가이드
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 8px', color: C.ink }}>{HERO_GUIDE_TITLE[team]}</h1>
          <p style={{ fontSize: 15, color: C.muted2, margin: '0 0 22px', lineHeight: 1.6 }}>막막할 때, 무엇을·언제·어떻게 해야 하는지 단계별로 정리했어요. 필요 서류와 기한, 근거 법령까지 한 번에 확인하세요.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 13, padding: 6, maxWidth: 520 }}>
            <span style={{ paddingLeft: 12, color: C.faint3, fontSize: 17 }}>⌕</span>
            <input type="text" placeholder="어떤 상황인가요? (예: 해고, 전세, 상속, 양도세)" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 0, border: 'none', padding: '11px 4px', fontSize: 15, fontFamily: 'inherit', color: C.ink, background: 'transparent' }} />
          </div>
        </div>
      </section>

      <main style={{ flex: 1, maxWidth: 1040, width: '100%', margin: '0 auto', padding: '24px 24px clamp(48px,7vw,72px)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          {GUIDE_CHIPS[team].map(f => {
            const on = f === field;
            return <button key={f} onClick={() => setField(f)} style={{ padding: '7px 15px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${on ? FIELD_CHIP_ACTIVE : C.border3}`, background: on ? FIELD_CHIP_ACTIVE : '#fff', color: on ? '#fff' : C.muted2 }}>{f}</button>;
          })}
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 14 }}>총 <strong style={{ color: C.ink, fontWeight: 800 }}>{results.length}</strong>개의 가이드</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {results.map(g => {
            const t = FIELD_TINT[g.field] || { bg: cfg.soft, fg: cfg.accent, icon: 'file' as const };
            return (
              <Link key={g.id} to={`/guides/${g.id}`} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: t.bg, color: t.fg }}><Icon name={t.icon} /></span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: t.bg, color: t.fg }}>{g.field}</span>
                </div>
                <div style={{ fontSize: 17.5, fontWeight: 800, color: C.ink, letterSpacing: '-.01em', marginBottom: 7, lineHeight: 1.35 }}>{g.title}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: C.muted, margin: '0 0 16px', flex: 1 }}>{g.summary}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14, borderTop: '1px solid #f3f1ec', fontSize: 12.5, color: C.faint, fontWeight: 600 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 18, height: 18, borderRadius: 6, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{g.steps.length}</span>단계</span>
                  <span>⏱ {g.duration}</span>
                  <span style={{ marginLeft: 'auto', color: cfg.accent, fontWeight: 700 }}>가이드 보기 →</span>
                </div>
              </Link>
            );
          })}
        </div>

        {guides.length > 0 && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.faint2, fontSize: 15 }}>찾는 가이드가 없어요. {cfg.label}에게 직접 물어보시겠어요?</div>
        )}

        <div style={{ marginTop: 28, borderRadius: 16, padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: '#fff', border: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, marginBottom: 3 }}>내 상황은 좀 다른 것 같나요?</div>
            <div style={{ fontSize: 13.5, color: C.muted }}>{cfg.label}에게 직접 물어보면 내 사정에 맞춰 절차와 근거를 알려드려요.</div>
          </div>
          <Link to="/consult" style={{ flexShrink: 0, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '12px 20px', borderRadius: 11, background: cfg.accent }}>{cfg.label}에게 질문하기 →</Link>
        </div>
      </main>
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}
