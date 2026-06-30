import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { TEAMS, C } from '../theme';
import type { CaseDetail } from '../types';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import { useTitle } from '../lib/useTitle';

export default function CaseDetailPage() {
  const { id = '' } = useParams();
  const { team, login, setTeam } = useApp();
  const navigate = useNavigate();
  const prevTeamRef = useRef(team);
  const [c, setC] = useState<CaseDetail | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  useTitle('판례');

  useEffect(() => {
    // 상세에서 팀 전환 → 새 팀 목록으로 이동(stale id 회피)
    if (prevTeamRef.current !== team) {
      prevTeamRef.current = team;
      navigate('/cases', { replace: true });
      return;
    }
    let alive = true;
    dataClient.getCase(team, id).then(c => { if (alive) setC(c); });
    return () => { alive = false; };
  }, [team, id, navigate]);
  if (!c) return <div style={{ minHeight: '100vh', background: C.bg }}><Header variant="team" active="cases" onOpenAuth={() => setAuthOpen(true)} /></div>;
  const cfg = TEAMS[c.team];
  const sectionTitle = (t: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
      <span style={{ width: 4, height: 18, borderRadius: 2, background: cfg.accent }} />
      <h2 style={{ fontSize: 19, fontWeight: 800, color: C.ink, margin: 0 }}>{t}</h2>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="cases" onOpenAuth={() => setAuthOpen(true)} />
      <div style={{ background: cfg.soft, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(24px,3.5vw,40px) 24px' }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            <Link to="/cases" onClick={() => { if (c.team !== team) setTeam(c.team); }} style={{ color: C.muted, textDecoration: 'none' }}>{cfg.label} 판례</Link> <span style={{ opacity: .5 }}>/</span> {c.breadcrumb}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: C.navy, padding: '3px 10px', borderRadius: 6 }}>{c.court}</span>
            {c.result && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', padding: '3px 10px', borderRadius: 6, background: cfg.accent }}>{c.result}</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3.6vw,34px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 8px', lineHeight: 1.35, color: C.ink }}>{c.name}</h1>
          <div className="mono" style={{ fontSize: 15, color: C.muted }}>{c.fullNumber}</div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: 'clamp(26px,4vw,38px) 24px clamp(48px,7vw,72px)', display: 'flex', gap: 'clamp(24px,4vw,40px)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <aside style={{ flex: '1 1 220px', maxWidth: 280, position: 'sticky', top: 128, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.faint2, letterSpacing: '.04em', marginBottom: 14 }}>사건 정보</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <Info label="사건번호" value={c.number} mono />
              <Info label="법원" value={c.courtFull} />
              <Info label="선고일" value={c.date} mono />
              <Info label="사건종류" value={c.caseType} />
              {c.result && <Info label="판결결과" value={c.result} color={cfg.accent} />}
            </div>
          </div>
          <Link to="/consult" style={{ textDecoration: 'none', borderRadius: 16, padding: '16px 18px', display: 'block', background: cfg.soft, border: `1px solid ${cfg.softBorder}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 3 }}>이 판례, 쉽게 풀어드릴까요?</div>
            <div style={{ fontSize: 12.5, color: C.muted2, marginBottom: 10 }}>{cfg.label}이 쟁점과 결론을 일상어로 설명해 드려요.</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: cfg.accent }}>{cfg.label}에게 질문 →</span>
          </Link>
        </aside>

        <article style={{ flex: '1 1 540px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {c.isStub ? (
            <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,32px)', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#4a535d', marginBottom: 8 }}>전문은 준비 중입니다</div>
              <p style={{ fontSize: 14, color: C.faint, lineHeight: 1.7, margin: 0 }}>이 판례의 판시사항·판결요지·전문은 대법원 종합법률정보 연동 예정입니다. 현재는 사건명·법원·선고일 등 기본 정보만 제공됩니다.</p>
            </section>
          ) : (
            <>
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,32px)' }}>
                {sectionTitle('판시사항')}
                <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15.5, lineHeight: 1.8, color: C.ink4 }}>
                  {c.issues.map((t, i) => <li key={i}>{t}</li>)}
                </ol>
              </section>
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,32px)' }}>
                {sectionTitle('판결요지')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 15.5, lineHeight: 1.9, color: C.ink4 }}>
                  {c.holdings.map((h, i) => <p key={i} style={{ margin: 0 }}><strong style={{ color: C.ink }}>{h.tag}</strong> {h.text}</p>)}
                </div>
              </section>
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,32px)' }}>
                {sectionTitle('참조조문')}
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {c.refs.map((r, i) => (
                    <Link key={i} to={`/laws/${r.lawId}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, border: `1px solid ${cfg.softBorder}`, background: cfg.soft }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{r.law}</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: cfg.accent }}>{r.article}</span>
                    </Link>
                  ))}
                </div>
              </section>
              <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,32px)' }}>
                {sectionTitle('판결 전문')}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, fontSize: 15, lineHeight: 1.95, color: C.ink4 }}>
                  {c.opinion.map((o, i) => {
                    const ink = o.label.indexOf('【주') >= 0 || o.label.indexOf('【이') >= 0;
                    return <p key={i} style={{ margin: 0 }}><strong style={{ color: ink ? C.ink : C.muted }}>{o.label}</strong>{o.text}</p>;
                  })}
                  <p style={{ margin: '8px 0 0', fontSize: 12.5, color: C.faint3 }}>※ 본 전문은 이해를 돕기 위해 요약·각색한 예시이며, 실제 판결문은 대법원 종합법률정보에서 확인하시기 바랍니다.</p>
                </div>
              </section>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/cases" style={{ textDecoration: 'none', flex: 1, minWidth: 160, textAlign: 'center', background: '#fff', border: `1px solid ${C.border3}`, borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, color: '#3f4a55' }}>← 판례 목록으로</Link>
            <Link to="/consult" style={{ textDecoration: 'none', flex: 1, minWidth: 160, textAlign: 'center', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, color: '#fff', background: cfg.accent }}>이 판례 {cfg.label}에게 질문 →</Link>
          </div>
        </article>
      </main>
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}

function Info({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: C.faint4, marginBottom: 3 }}>{label}</div>
      <div className={mono ? 'mono' : undefined} style={{ fontSize: 14, fontWeight: 600, color: color ?? C.ink }}>{value}</div>
    </div>
  );
}
