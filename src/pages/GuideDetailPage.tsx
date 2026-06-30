import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { FIELD_TINT, type Guide } from '../lib/guidesData';
import * as storage from '../lib/storage';
import { TEAMS, C } from '../theme';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import Icon from '../components/Icon';
import { useTitle } from '../lib/useTitle';

export default function GuideDetailPage() {
  const { id = '' } = useParams();
  const { team, login } = useApp();
  const navigate = useNavigate();
  const prevTeamRef = useRef(team);
  const [guide, setGuide] = useState<Guide | null | undefined>(undefined); // undefined=로딩
  const [authOpen, setAuthOpen] = useState(false);
  useTitle('절차 가이드');

  useEffect(() => {
    if (prevTeamRef.current !== team) {
      prevTeamRef.current = team;
      navigate('/guides', { replace: true });
      return;
    }
    let alive = true;
    dataClient.getGuide(team, id).then(g => { if (alive) setGuide(g); });
    return () => { alive = false; };
  }, [team, id, navigate]);

  const cfg = TEAMS[team];

  if (guide === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
        <Header variant="team" active="guides" onOpenAuth={() => setAuthOpen(true)} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', color: C.faint2, fontSize: 15 }}>가이드를 불러오는 중…</div>
        <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
      </div>
    );
  }
  if (!guide) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
        <Header variant="team" active="guides" onOpenAuth={() => setAuthOpen(true)} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', color: C.faint2, fontSize: 15 }}>가이드를 찾을 수 없어요.</div>
        <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
      </div>
    );
  }

  const t = FIELD_TINT[guide.field] || { bg: cfg.soft, fg: cfg.accent, icon: 'file' as const };
  const askAboutGuide = () => storage.setPendingQ(`${guide.title} 절차가 제 상황에도 그대로 적용되나요?`);
  const sectionTitle = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
      <span style={{ width: 4, height: 18, borderRadius: 2, background: cfg.accent }} />
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: 0 }}>{label}</h2>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header variant="team" active="guides" onOpenAuth={() => setAuthOpen(true)} />

      <div style={{ background: t.bg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(26px,3.5vw,42px) 24px' }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
            <Link to="/guides" style={{ color: C.muted, textDecoration: 'none' }}>{cfg.label} 절차 가이드</Link> <span style={{ opacity: .5 }}>/</span> {guide.field}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ width: 58, height: 58, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#fff', color: t.fg, flexShrink: 0 }}><Icon name={t.icon} /></span>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h1 style={{ fontSize: 'clamp(25px,3.6vw,36px)', fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 10px', color: C.ink, lineHeight: 1.3 }}>{guide.title}</h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: '#46505a', margin: 0, maxWidth: 640 }}>{guide.intro}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <MetaCard label="예상 기간" value={guide.duration} />
            <MetaCard label="난이도" value={guide.difficulty} />
            <MetaCard label="단계" value={`${guide.steps.length}단계`} />
          </div>
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto', padding: 'clamp(26px,4vw,38px) 24px clamp(48px,7vw,72px)', display: 'flex', gap: 'clamp(24px,4vw,40px)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <aside style={{ flex: '1 1 230px', maxWidth: 300, position: 'sticky', top: 128, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.faint2, letterSpacing: '.04em', marginBottom: 13 }}>필요 서류</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {guide.documents.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: '#3f4a55', lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: 5, background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, marginTop: 1 }}>✓</span>{d}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.faint2, letterSpacing: '.04em', marginBottom: 13 }}>기한·주의</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {guide.deadlines.map((dl, i) => (
                <div key={i}><div style={{ fontSize: 12, color: '#a08a86', fontWeight: 600, marginBottom: 2 }}>{dl.k}</div><div style={{ fontSize: 14, fontWeight: 700, color: C.danger }}>{dl.v}</div></div>
              ))}
            </div>
          </div>
          {guide.costs && guide.costs.length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.faint2, letterSpacing: '.04em', marginBottom: 13 }}>비용</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {guide.costs.map((co, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13.5 }}><span style={{ color: C.muted }}>{co.k}</span><span style={{ fontWeight: 700, color: C.ink }}>{co.v}</span></div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <article style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,34px)' }}>
            {sectionTitle('단계별 절차')}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {guide.steps.map((s, i) => {
                const last = i === guide.steps.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }}>{i + 1}</span>
                      {!last && <span style={{ flex: 1, width: 2, background: t.bg, margin: '6px 0', minHeight: 24 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 26 }}>
                      <div style={{ fontSize: 16.5, fontWeight: 800, color: C.ink, marginBottom: 6, letterSpacing: '-.01em' }}>{s.t}</div>
                      <p style={{ fontSize: 14.5, lineHeight: 1.75, color: '#4a535d', margin: 0 }}>{s.d}</p>
                      {s.tip && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 8, background: t.bg, borderRadius: 10, padding: '10px 13px', fontSize: 13, lineHeight: 1.6, color: t.fg }}>
                          <span style={{ fontWeight: 800, flexShrink: 0 }}>팁</span><span>{s.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,34px)' }}>
            {sectionTitle('근거 법령')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guide.laws.map((l, i) => (
                <Link key={i} to={`/laws/${l.lawId}`} style={{ textDecoration: 'none', background: C.surfaceSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '15px 17px', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', padding: '2px 8px', borderRadius: 5, background: cfg.accent }}>법령</span>
                    <span style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{l.title}</span>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: cfg.accent }}>{l.article}</span>
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: C.muted2 }}>{l.note}</div>
                </Link>
              ))}
            </div>
          </section>

          {guide.cases && guide.cases.length > 0 && (
            <section style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 'clamp(22px,3.5vw,34px)' }}>
              {sectionTitle('참고 판례')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {guide.cases.map((c, i) => (
                  <Link key={i} to={`/cases/${c.caseId}`} style={{ textDecoration: 'none', background: C.surfaceSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: C.navy, padding: '2px 8px', borderRadius: 5 }}>판례</span>
                    <span style={{ flex: 1, minWidth: 160, fontWeight: 700, fontSize: 14.5, color: C.ink }}>{c.name}</span>
                    <span className="mono" style={{ fontSize: 12.5, color: C.faint }}>{c.number}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div style={{ borderRadius: 16, padding: '22px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: t.bg, border: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, marginBottom: 3 }}>내 상황에 맞는지 확인하고 싶다면</div>
              <div style={{ fontSize: 13.5, color: C.muted2 }}>{cfg.label}에게 물어보면 이 절차가 내 사정에 어떻게 적용되는지 알려드려요.</div>
            </div>
            <Link to="/consult" onClick={askAboutGuide} style={{ flexShrink: 0, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '12px 20px', borderRadius: 11, background: cfg.accent }}>{cfg.label}에게 질문 →</Link>
          </div>

          <Link to="/guides" style={{ textDecoration: 'none', textAlign: 'center', background: '#fff', border: `1px solid ${C.border3}`, borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, color: '#3f4a55' }}>← 가이드 목록으로</Link>
        </article>
      </main>
      <AuthModal open={authOpen} variant="generic" onClose={() => setAuthOpen(false)} onSubmit={(n, p) => login(n, p).then(u => !!u)} />
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 11, padding: '10px 16px' }}>
      <div style={{ fontSize: 11, color: C.faint2, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
  );
}
