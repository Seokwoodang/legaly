import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { filterLaws, sortLaws } from '../lib/laws';
import { TEAMS, C, FIELD_CHIP_ACTIVE } from '../theme';
import { FIELDIC } from '../lib/guidesData';
import type { LawListItem, LawSort, Team } from '../types';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import Icon from '../components/Icon';
import { useTitle } from '../lib/useTitle';

const CHIPS: Record<Team, string[]> = {
  법무: ['전체', '민사', '형사', '상사', '노동', '행정', '부동산', '가사'],
  세무: ['전체', '소득세', '법인세', '부가세', '상속·증여', '국세일반', '지방세'],
};
const HERO: Record<Team, { title: string; sub: string; ph: string }> = {
  법무: { title: '법령과 자료 찾아보기', sub: '계약·부동산·노동·형사 등 분야별 현행 법령을 살펴보세요.', ph: '법령명으로 검색 (예: 임대차, 근로, 상속)' },
  세무: { title: '세법과 자료 찾아보기', sub: '세법·국세 관련 법령과 국세청 예규·집행기준을 살펴보세요.', ph: '세법명·자료명으로 검색 (예: 소득세, 부가세, 상속)' },
};

export default function LawsPage() {
  useTitle('자료실');
  const { team, login } = useApp();
  const cfg = TEAMS[team];
  const [laws, setLaws] = useState<LawListItem[]>([]);
  const [field, setField] = useState('전체');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LawSort>('name');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => { dataClient.getLaws(team).then(setLaws); setField('전체'); }, [team]);

  const results = useMemo(() => sortLaws(filterLaws(laws, field, query), sort), [laws, field, query, sort]);

  const sortBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? cfg.accent : C.border3}`, background: active ? cfg.soft : '#fff', color: active ? cfg.accent : C.muted,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="laws" onOpenAuth={() => setAuthOpen(true)} />
      <section style={{ background: cfg.soft, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(28px,4vw,44px) 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: cfg.accent, fontWeight: 700, marginBottom: 10 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 5 }}><Icon name={team === '법무' ? 'scale' : 'calc'} /></span>{cfg.label} 자료실
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 8px', color: C.ink }}>{HERO[team].title}</h1>
          <p style={{ fontSize: 15, color: C.muted2, margin: '0 0 22px' }}>{HERO[team].sub}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 13, padding: 6, maxWidth: 560 }}>
            <span style={{ paddingLeft: 12, color: C.faint3, fontSize: 17 }}>⌕</span>
            <input type="text" placeholder={HERO[team].ph} value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 0, border: 'none', padding: '11px 4px', fontSize: 15, fontFamily: 'inherit', color: C.ink, background: 'transparent' }} />
          </div>
        </div>
      </section>

      <main style={{ flex: 1, maxWidth: 1040, width: '100%', margin: '0 auto', padding: '24px 24px clamp(48px,7vw,72px)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          {CHIPS[team].map(f => {
            const on = f === field;
            return <button key={f} onClick={() => setField(f)} style={{ padding: '7px 15px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${on ? FIELD_CHIP_ACTIVE : C.border3}`, background: on ? FIELD_CHIP_ACTIVE : '#fff', color: on ? '#fff' : C.muted2 }}>{f}</button>;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid #e6e2da` }}>
          <div style={{ fontSize: 14, color: C.muted }}>총 <strong style={{ color: C.ink, fontWeight: 800 }}>{results.length}</strong>건</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setSort('name')} style={sortBtn(sort === 'name')}>가나다순</button>
            <button onClick={() => setSort('date')} style={sortBtn(sort === 'date')}>시행일순</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(r => (
            <Link key={r.id} to={`/laws/${r.id}`} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 13, background: cfg.soft, color: cfg.accent }}><Icon name={FIELDIC[r.field] || 'file'} /></span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{r.name}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 6, color: cfg.accent, background: cfg.soft }}>{r.field}</span>
                  <span style={r.kind === '예규'
                    ? { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: cfg.accent, background: '#fff', border: `1px solid ${cfg.accent}33` }
                    : { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: C.faint, background: '#f1efe9' }}>{r.kind}</span>
                </div>
                <div style={{ fontSize: 13, color: C.faint }}>소관 · {r.ministry}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: C.faint4, marginBottom: 2 }}>시행일</div>
                <div className="mono" style={{ fontSize: 13.5, color: C.muted2, fontWeight: 600 }}>{r.date}</div>
              </div>
              <span style={{ color: '#c8c1b4', fontSize: 20, flexShrink: 0 }}>›</span>
            </Link>
          ))}
        </div>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.faint2, fontSize: 15 }}>검색 결과가 없어요. 다른 키워드로 찾아보시겠어요?</div>
        )}

        <div style={{ marginTop: 28, borderRadius: 16, padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: '#fff', border: `1px solid ${C.border}` }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, marginBottom: 3 }}>찾는 자료가 어려우신가요?</div>
            <div style={{ fontSize: 13.5, color: C.muted }}>{cfg.label}에게 바로 물어보시면 관련 조문과 판례를 근거로 풀어드릴게요.</div>
          </div>
          <Link to="/consult" style={{ flexShrink: 0, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '12px 20px', borderRadius: 11, background: cfg.accent }}>{cfg.label}에게 질문하기 →</Link>
        </div>
      </main>
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}
