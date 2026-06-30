import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { TEAMS, C } from '../theme';
import type { CaseListItem, LawDetail } from '../types';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import { useTitle } from '../lib/useTitle';

export default function LawDetailPage() {
  const { id = '' } = useParams();
  const { team, login, setTeam } = useApp();
  const navigate = useNavigate();
  const prevTeamRef = useRef(team);
  const [law, setLaw] = useState<LawDetail | null>(null);
  const [active, setActive] = useState('');
  const [related, setRelated] = useState<CaseListItem[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  useTitle('법령');

  useEffect(() => {
    // 상세에서 팀 전환 → 새 팀 목록으로 이동(stale id 회피)
    if (prevTeamRef.current !== team) {
      prevTeamRef.current = team;
      navigate('/laws', { replace: true });
      return;
    }
    let alive = true;
    dataClient.getLaw(team, id).then(l => {
      if (!alive) return;
      setLaw(l);
      setActive(l.articles[0]?.id ?? '');
      Promise.all(l.relatedCaseIds.map(cid => dataClient.getCase(l.team, cid))).then(cs => {
        if (!alive) return;
        setRelated(cs.map(c => ({ id: c.id, name: c.name, number: c.number, court: c.court, field: c.caseType, date: c.date })));
      });
    });
    return () => { alive = false; };
  }, [team, id, navigate]);

  if (!law) return <div style={{ minHeight: '100vh', background: C.bg }}><Header variant="team" active="laws" onOpenAuth={() => setAuthOpen(true)} /></div>;
  const cfg = TEAMS[law.team];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="laws" onOpenAuth={() => setAuthOpen(true)} />

      <div style={{ background: cfg.soft, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(24px,3.5vw,40px) 24px' }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            <Link to="/laws" onClick={() => { if (law.team !== team) setTeam(law.team); }} style={{ color: C.muted, textDecoration: 'none' }}>{cfg.label} 자료실</Link> <span style={{ opacity: .5 }}>/</span> {law.breadcrumbCat}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', padding: '3px 10px', borderRadius: 6, background: cfg.accent }}>시행중</span>
            {law.lawNo && <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, background: '#fff', padding: '3px 10px', borderRadius: 6 }}>{law.lawNo}</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 18px', color: C.ink }}>{law.name}</h1>
          <div style={{ display: 'flex', gap: 'clamp(20px,4vw,44px)', flexWrap: 'wrap' }}>
            <Meta label="시행일" value={law.effDate} mono />
            <Meta label="소관부처" value={law.ministry} />
            <Meta label="법령 종류" value={law.kind} />
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: 'clamp(26px,4vw,38px) 24px clamp(48px,7vw,72px)', display: 'flex', gap: 'clamp(24px,4vw,40px)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {law.isStub ? (
          <article style={{ flex: '1 1 520px', minWidth: 0 }}>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#4a535d', marginBottom: 8 }}>전문은 준비 중입니다</div>
              <p style={{ fontSize: 14, color: C.faint, lineHeight: 1.7, margin: 0 }}>이 법령의 조문 전문은 국가법령정보 연동 예정입니다. 현재는 명칭·소관부처·시행일 등 기본 정보만 제공됩니다.</p>
            </div>
            <CtaBox cfg={cfg} />
          </article>
        ) : (
          <>
            <aside style={{ flex: '1 1 220px', maxWidth: 260, position: 'sticky', top: 128 }}>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.faint2, letterSpacing: '.04em', marginBottom: 10, padding: '0 6px' }}>조문 목차</div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '58vh', overflowY: 'auto' }}>
                  {law.articles.map(a => (
                    <a key={a.id} href={`#${a.id}`} onClick={() => setActive(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', transition: '.12s', ...(a.id === active ? { background: cfg.soft, color: cfg.accent } : { color: C.muted2 }) }}>
                      <span className="mono" style={{ fontSize: 11.5, opacity: .7, flexShrink: 0 }}>{a.num}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <article style={{ flex: '1 1 520px', minWidth: 0 }}>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(24px,4vw,40px)' }}>
                {law.articles.map(a => (
                  <section key={a.id} id={a.id} style={{ padding: '22px 0', borderBottom: '1px solid #f3f1ec', scrollMarginTop: 128 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: cfg.accent }}>{a.num}</span>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>{a.title}</h2>
                    </div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.95, color: C.ink4, whiteSpace: 'pre-wrap' }}>{a.body}</div>
                  </section>
                ))}
                <p style={{ fontSize: 12.5, color: C.faint3, margin: '20px 0 0' }}>— 이하 생략. 전체 조문은 국가법령정보센터에서 확인하실 수 있어요.</p>
              </div>

              {related.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, margin: '0 0 14px' }}>이 법령과 관련된 판례</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {related.map(c => (
                      <Link key={c.id} to={`/cases/${c.id}`} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 13, padding: '16px 18px', display: 'block' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: C.navy, padding: '2px 8px', borderRadius: 5 }}>판례</span>
                          <span className="mono" style={{ fontSize: 12.5, color: C.faint }}>{c.number}</span>
                          <span style={{ fontSize: 12.5, color: C.faint }}>{c.court} · {c.date}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{c.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <CtaBox cfg={cfg} />
            </article>
          </>
        )}
      </main>
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.faint2, marginBottom: 3 }}>{label}</div>
      <div className={mono ? 'mono' : undefined} style={{ fontSize: 15, fontWeight: 600, color: C.ink3 }}>{value}</div>
    </div>
  );
}
function CtaBox({ cfg }: { cfg: typeof TEAMS['법무'] }) {
  return (
    <div style={{ marginTop: 24, borderRadius: 16, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: cfg.soft, border: `1px solid ${cfg.softBorder}` }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 3 }}>이 법령, 내 상황엔 어떻게 적용될까요?</div>
        <div style={{ fontSize: 13.5, color: C.muted2 }}>{cfg.label}에게 물어보면 내 상황에 맞춰 조문과 판례로 풀어드려요.</div>
      </div>
      <Link to="/consult" style={{ flexShrink: 0, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '11px 20px', borderRadius: 11, background: cfg.accent }}>{cfg.label}에게 질문 →</Link>
    </div>
  );
}
