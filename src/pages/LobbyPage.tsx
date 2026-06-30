import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as storage from '../lib/storage';
import { formatToday } from '../lib/format';
import { GUIDES, FIELD_TINT, LOBBY_FIELDS, FEATURED_IDS } from '../lib/guidesData';
import { TEAMS, C } from '../theme';
import type { Team } from '../types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import Icon from '../components/Icon';
import { useTitle } from '../lib/useTitle';

const EXAMPLES: Record<Team, string[]> = {
  법무: ['전세 보증금을 못 받고 있어요', '부당하게 해고당했어요', '상속을 포기하고 싶어요'],
  세무: ['종합소득세 경비 처리가 궁금해요', '1세대 1주택 양도세 비과세요', '상속세는 언제까지 신고하나요?'],
};

export default function LobbyPage() {
  useTitle('홈');
  const { team, user, isLoggedIn, login, setTeam } = useApp();
  const navigate = useNavigate();
  const [askTeam, setAskTeam] = useState<Team>(team);
  const [ask, setAsk] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  const accent = TEAMS[askTeam].accent;
  const featured = FEATURED_IDS.map(id => GUIDES.find(g => g.id === id)).filter(Boolean) as typeof GUIDES;

  const pick = (t: Team) => { setTeam(t); setAskTeam(t); };
  const onAsk = (e: React.FormEvent) => {
    e.preventDefault();
    setTeam(askTeam);
    const t = ask.trim();
    if (t) storage.setPendingQ(t);
    navigate('/consult');
  };

  const pickStyle = (on: boolean, t: Team): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11,
    fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: '.15s',
    ...(on ? { background: TEAMS[t].accent, color: '#fff', border: 'none' } : { background: '#fff', color: C.muted2, border: `1px solid ${C.border3}` }),
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="lobby" onOpenAuth={() => setAuthOpen(true)} />
      <main style={{ flex: 1, maxWidth: 1120, width: '100%', margin: '0 auto', padding: 'clamp(32px,4.5vw,52px) 24px clamp(48px,7vw,80px)' }}>

        <section style={{ marginBottom: 'clamp(40px,5vw,60px)' }}>
          {isLoggedIn ? (
            <>
              <div style={{ fontSize: 13.5, color: C.faint3, fontWeight: 600, marginBottom: 10 }}>{formatToday(new Date())}</div>
              <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 12px', color: C.ink, lineHeight: 1.25 }}>{user!.name}님, 무엇을 도와드릴까요?</h1>
              <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: C.muted, margin: 0, lineHeight: 1.6 }}>고민을 한마디로 적어주시면 전담 팀이 근거와 함께 답해드려요.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 'clamp(28px,4.4vw,46px)', fontWeight: 800, letterSpacing: '-.03em', margin: '0 0 14px', color: C.ink, lineHeight: 1.2 }}>법이 필요한 순간,<br />혼자 막막하지 않게.</h1>
              <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: 580 }}>고민을 한마디로 적어주시면, 전담 법무팀·세무팀이 관련 법령과 판례를 근거로 답해드려요.</p>
            </>
          )}

          <div style={{ background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 18, padding: 'clamp(16px,2.5vw,22px)', width: '100%', marginTop: 24, boxShadow: '0 12px 32px -22px rgba(0,0,0,.3)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.faint2, marginBottom: 10 }}>어느 팀에게 물어볼까요?</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <button onClick={() => pick('법무')} style={pickStyle(askTeam === '법무', '법무')}><span style={{ width: 17, height: 17, display: 'inline-flex' }}><Icon name="scale" /></span>법무팀</button>
              <button onClick={() => pick('세무')} style={pickStyle(askTeam === '세무', '세무')}><span style={{ width: 17, height: 17, display: 'inline-flex' }}><Icon name="calc" /></span>세무팀</button>
            </div>
            <form onSubmit={onAsk} style={{ display: 'flex', alignItems: 'stretch', gap: 8, background: '#f6f5f2', border: `1px solid ${C.border2}`, borderRadius: 13, padding: '6px 6px 6px 14px', flexWrap: 'wrap' }}>
              <input type="text" value={ask} onChange={e => setAsk(e.target.value)} placeholder={askTeam === '세무' ? '예) 부가세 신고를 놓쳤는데 어떻게 하나요?' : '예) 전세 보증금을 돌려받지 못하고 있어요'} style={{ flex: '1 1 260px', minWidth: 0, border: 'none', padding: '11px 0', fontSize: 15.5, fontFamily: 'inherit', color: C.ink, background: 'transparent' }} />
              <button type="submit" style={{ flex: '0 0 auto', border: 'none', borderRadius: 11, color: '#fff', fontSize: 15, fontWeight: 700, padding: '0 22px', cursor: 'pointer', fontFamily: 'inherit', background: accent }}>물어보기 →</button>
            </form>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {EXAMPLES[askTeam].map(x => (
                <button key={x} onClick={() => setAsk(x)} style={{ fontSize: 13, fontWeight: 600, color: C.muted2, background: '#f6f5f2', border: '1px solid #e9e6df', padding: '7px 13px', borderRadius: 999, fontFamily: 'inherit', cursor: 'pointer' }}>{x}</button>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 'clamp(40px,5vw,60px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
            <h2 style={{ fontSize: 'clamp(19px,2.4vw,23px)', fontWeight: 800, letterSpacing: '-.02em', margin: 0, color: C.ink }}>분야별로 둘러보기</h2>
            <span style={{ fontSize: 13.5, color: C.faint2 }}>분야를 누르면 관련 가이드를 모아봐요</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 11 }}>
            {LOBBY_FIELDS.map(f => {
              const t = FIELD_TINT[f.field] || { bg: '#eef1f5', fg: '#44506b', icon: 'file' as const };
              return (
                <Link key={f.name} to={`/guides?field=${encodeURIComponent(f.field)}`} onClick={() => setTeam(f.team)} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 11, background: t.bg, color: t.fg }}><Icon name={t.icon} /></span>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: C.faint2, marginTop: 2 }}>{TEAMS[f.team].label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
            <h2 style={{ fontSize: 'clamp(19px,2.4vw,23px)', fontWeight: 800, letterSpacing: '-.02em', margin: 0, color: C.ink }}>자주 찾는 절차 가이드</h2>
            <Link to="/guides" style={{ fontSize: 14, fontWeight: 600, color: C.muted, textDecoration: 'none' }}>전체 보기 →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 13 }}>
            {featured.map(g => {
              const t = FIELD_TINT[g.field] || { bg: '#eef1f5', fg: '#44506b', icon: 'file' as const };
              return (
                <Link key={g.id} to={`/guides/${g.id}`} onClick={() => setTeam(g.team)} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10, background: t.bg, color: t.fg }}><Icon name={t.icon} /></span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: t.bg, color: t.fg }}>{g.field}</span>
                  </div>
                  <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, marginBottom: 6, lineHeight: 1.35, letterSpacing: '-.01em' }}>{g.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, margin: '0 0 14px', flex: 1 }}>{g.summary}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: C.faint, fontWeight: 600, paddingTop: 13, borderTop: '1px solid #f3f1ec' }}>
                    <span>{g.steps.length}단계</span><span>⏱ {g.duration}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}
