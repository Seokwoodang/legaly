import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { filterCases, sortCases } from '../lib/cases';
import { TEAMS, C, FIELD_CHIP_ACTIVE } from '../theme';
import type { CaseListItem, CaseSort, CourtFilter, Team } from '../types';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import Icon from '../components/Icon';
import { useTitle } from '../lib/useTitle';

const CHIPS: Record<Team, string[]> = {
  법무: ['전체', '민사', '형사', '노동', '행정', '부동산', '가사'],
  세무: ['전체', '소득세', '법인세', '부가세', '상속·증여', '양도'],
};
const HERO_TITLE: Record<Team, string> = { 법무: '판례 찾아보기', 세무: '조세 판례 찾아보기' };

export default function CasesPage() {
  useTitle('판례');
  const { team, login } = useApp();
  const cfg = TEAMS[team];
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [field, setField] = useState('전체');
  const [court, setCourt] = useState<CourtFilter>('전체');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CaseSort>('new');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => { dataClient.getCases(team).then(setCases); setField('전체'); }, [team]);
  const results = useMemo(() => sortCases(filterCases(cases, field, court, query), sort), [cases, field, court, query, sort]);

  const sortBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 13px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? cfg.accent : C.border3}`, background: active ? cfg.soft : '#fff', color: active ? cfg.accent : C.muted,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="cases" onOpenAuth={() => setAuthOpen(true)} />
      <section style={{ background: cfg.soft, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(28px,4vw,44px) 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: cfg.accent, fontWeight: 700, marginBottom: 10 }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 5 }}><Icon name={team === '법무' ? 'scale' : 'calc'} /></span>{cfg.label} 판례
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 8px', color: C.ink }}>{HERO_TITLE[team]}</h1>
          <p style={{ fontSize: 15, color: C.muted2, margin: '0 0 22px' }}>실제 재판 결과를 검색하고 판결요지와 전문을 확인하세요.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 13, padding: 6, maxWidth: 560 }}>
            <span style={{ paddingLeft: 12, color: C.faint3, fontSize: 17 }}>⌕</span>
            <input type="text" placeholder="사건명 또는 사건번호로 검색" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 0, border: 'none', padding: '11px 4px', fontSize: 15, fontFamily: 'inherit', color: C.ink, background: 'transparent' }} />
          </div>
        </div>
      </section>

      <main style={{ flex: 1, maxWidth: 1040, width: '100%', margin: '0 auto', padding: '24px 24px clamp(48px,7vw,72px)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          {CHIPS[team].map(f => {
            const on = f === field;
            return <button key={f} onClick={() => setField(f)} style={{ padding: '7px 15px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${on ? FIELD_CHIP_ACTIVE : C.border3}`, background: on ? FIELD_CHIP_ACTIVE : '#fff', color: on ? '#fff' : C.muted2 }}>{f}</button>;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #e6e2da' }}>
          <div style={{ fontSize: 14, color: C.muted }}>총 <strong style={{ color: C.ink, fontWeight: 800 }}>{results.length}</strong>건</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={court} onChange={e => setCourt(e.target.value as CourtFilter)} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border3}`, background: '#fff', fontSize: 13, fontWeight: 600, color: C.muted2, cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="전체">전체 법원</option>
              <option value="대법원">대법원</option>
              <option value="대법원(전합)">대법원 전원합의체</option>
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setSort('new')} style={sortBtn(sort === 'new')}>최신순</button>
              <button onClick={() => setSort('old')} style={sortBtn(sort === 'old')}>오래된순</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(r => (
            <Link key={r.id} to={`/cases/${r.id}`} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 9px', borderRadius: 6, color: cfg.accent, background: cfg.soft }}>{r.field}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.muted2, background: '#f1efe9', padding: '2px 9px', borderRadius: 6 }}>{r.court}</span>
              </div>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: C.ink, lineHeight: 1.45, marginBottom: 10 }}>{r.name}</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: C.faint }}>
                <span><span style={{ color: C.faint4 }}>사건번호</span> <span className="mono" style={{ color: C.muted2, fontWeight: 600 }}>{r.number}</span></span>
                <span><span style={{ color: C.faint4 }}>선고일</span> <span className="mono" style={{ color: C.muted2, fontWeight: 600 }}>{r.date}</span></span>
              </div>
            </Link>
          ))}
        </div>
        {results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.faint2, fontSize: 15 }}>검색 결과가 없어요. 다른 키워드로 찾아보시겠어요?</div>
        )}
      </main>
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}
