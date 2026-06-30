import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import * as storage from '../lib/storage';
import { TEAMS, C } from '../theme';
import type { SavedItem, Team } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import { useTitle } from '../lib/useTitle';

type Filter = '전체' | '법무' | '세무';

export default function SavedPage() {
  useTitle('보관함');
  const { user, setTeam, login } = useApp();
  const location = useLocation();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<Filter>('전체');
  const [authOpen, setAuthOpen] = useState(false);

  // 방문(라우트 활성화)마다 재읽기 + 필터 '전체'로 리셋(스펙 §I)
  useEffect(() => { dataClient.getSaved().then(setSaved).catch(() => setSaved([])); setFilter('전체'); }, [location.key]);

  const countAll = saved.length;
  const countLaw = saved.filter(s => s.team === '법무').length;
  const countTax = saved.filter(s => s.team === '세무').length;
  const items = saved.filter(s => filter === '전체' || s.team === filter);

  async function remove(id: string) {
    const prev = saved;
    setSaved(s => s.filter(x => x.id !== id));
    try { await dataClient.deleteSaved(id); } catch { setSaved(prev); }
  }
  function cont(item: SavedItem) { setTeam(item.team); storage.setPendingQ(item.title); }

  const fBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 15px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? C.navy : C.border3}`, background: active ? C.navy : '#fff', color: active ? '#fff' : C.muted2,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="saved" onOpenAuth={() => setAuthOpen(true)} />
      <main style={{ flex: 1, maxWidth: 1040, width: '100%', margin: '0 auto', padding: 'clamp(32px,4vw,48px) 24px clamp(48px,7vw,72px)' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 8px', color: C.ink }}>{user ? `${user.name}님의 보관함` : '내 보관함'}</h1>
          <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>저장해 둔 상담을 다시 보고, 같은 주제로 이어서 상담할 수 있어요.</p>
        </div>

        {countAll > 0 ? (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              <button onClick={() => setFilter('전체')} style={fBtn(filter === '전체')}>전체 {countAll}</button>
              <button onClick={() => setFilter('법무')} style={fBtn(filter === '법무')}>법무팀 {countLaw}</button>
              <button onClick={() => setFilter('세무')} style={fBtn(filter === '세무')}>세무팀 {countTax}</button>
            </div>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: C.faint2, fontSize: 14.5 }}>이 팀의 저장된 상담이 없어요.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(it => {
                  const cfg = TEAMS[it.team as Team];
                  return (
                    <div key={it.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 6, color: cfg.accent, background: cfg.soft }}>{cfg.label}</span>
                        <span style={{ fontSize: 12.5, color: C.faint3 }}>{it.date}</span>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.4, marginBottom: 8 }}>{it.title}</div>
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: '0 0 16px' }}>{it.summary}</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Link to="/consult" onClick={() => cont(it)} style={{ textDecoration: 'none', fontSize: 13.5, fontWeight: 700, color: '#fff', padding: '9px 16px', borderRadius: 10, background: cfg.accent }}>이어서 상담하기</Link>
                        <button onClick={() => remove(it.id)} style={{ fontSize: 13.5, fontWeight: 600, color: '#a08a86', background: 'transparent', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '9px 4px' }}>삭제</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div style={{ background: '#fff', border: `1px dashed ${C.borderDashed}`, borderRadius: 18, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: '#f1efe9', color: '#bcb6a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 16px' }}>＋</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#4a535d', marginBottom: 7 }}>아직 저장된 상담이 없어요</div>
            <p style={{ fontSize: 14.5, color: C.faint, lineHeight: 1.6, margin: '0 auto 20px', maxWidth: 380 }}>팀에게 질문하고 답변 아래 <strong style={{ color: C.muted }}>'이 상담 저장하기'</strong>를 누르면, 여기에서 언제든 다시 볼 수 있어요.</p>
            <Link to="/consult" style={{ display: 'inline-block', textDecoration: 'none', background: C.navy, color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 11 }}>상담 시작하기</Link>
          </div>
        )}
      </main>
      <Footer simple />
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}
