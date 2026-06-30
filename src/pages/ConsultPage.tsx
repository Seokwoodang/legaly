import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { dataClient } from '../lib/dataClient';
import { peekPendingQ, clearPendingQ } from '../lib/storage';
import { greeting, STARTERS, PLACEHOLDER } from '../lib/sampleData';
import { makeId, summarize, formatSavedDate } from '../lib/format';
import { TEAMS, C } from '../theme';
import type { ChatMessage, Team } from '../types';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';
import Icon from '../components/Icon';
import { useTitle } from '../lib/useTitle';

export default function ConsultPage() {
  useTitle('상담');
  const { team, user, isLoggedIn, login } = useApp();
  const cfg = TEAMS[team];
  const location = useLocation();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [greet()]);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const pendingSaveRef = useRef<{ msg: Extract<ChatMessage, { kind: 'answer' }>; team: Team } | null>(null);
  const pendingAskRef = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const sendTextRef = useRef<(t: string) => void>(() => {});
  const loggedInRef = useRef(isLoggedIn);
  loggedInRef.current = isLoggedIn;

  function greet(): ChatMessage {
    return { id: 'greeting-' + makeId(), role: 'ai', kind: 'greeting', text: greeting(team, user), starters: STARTERS[team] };
  }

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // 팀 전환(및 마운트) 시 대화 리셋
  useEffect(() => {
    setMessages([greet()]);
    setExpanded({}); setSavedIds({}); setDraft(''); setSending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  // 딥링크 pendingQ 자동 전송. 매 네비게이션(location.key)마다 재활성되어 "이어서 상담하기"
  // 2회차 이상에서도 동작. StrictMode 이중 마운트 안전: effect-로컬 fired 가드 + cleanup의
  // clearTimeout(첫 마운트 타이머 취소) + peek/실제 발사 시 clearPendingQ.
  useEffect(() => {
    if (!peekPendingQ()) return;
    const id = setTimeout(() => {
      // 발사 시점 재-peek + 동기 clear: 어떤 타이머가 먼저 터지든 1회만 소비(타이밍 무관 결정적).
      const pq = peekPendingQ();
      if (!pq) return;
      clearPendingQ();
      // AI 상담은 로그인 필수: 비로그인 시 로그인 유도 후 자동 전송.
      if (!loggedInRef.current) { pendingAskRef.current = pq; setAuthOpen(true); return; }
      sendTextRef.current(pq);
    }, 120);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function sendText(text: string) {
    if (!mountedRef.current) return;
    const uid = makeId(), pid = makeId();
    const teamSnap = team;
    setMessages(m => [...m, { id: uid, role: 'user', text }, { id: pid, role: 'ai', kind: 'pending' }]);
    setSending(true);
    try {
      const ans = await dataClient.getAnswer(teamSnap, text);
      if (!mountedRef.current) return;
      setMessages(m => m.map(msg => msg.id === pid ? { id: pid, role: 'ai', kind: 'answer', q: text, text: ans.text, sources: ans.sources, savable: true } : msg));
      setExpanded(e => ({ ...e, [pid]: true }));
    } catch {
      if (mountedRef.current) setMessages(m => m.map(msg => msg.id === pid ? { id: pid, role: 'ai', kind: 'error', q: text } : msg));
    } finally {
      if (mountedRef.current) setSending(false);
    }
  }
  sendTextRef.current = sendText;

  // AI 상담 전송 게이트: 비로그인 시 로그인 유도(질문 보관 후 로그인하면 자동 전송).
  function ask(text: string) {
    if (!isLoggedIn) { pendingAskRef.current = text; setAuthOpen(true); return; }
    setDraft('');
    sendText(text);
  }
  function send() {
    const t = draft.trim();
    if (!t || sending) return;
    ask(t);
  }

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => mountedRef.current && setToast(''), 2600);
  }

  async function doSave(msg: Extract<ChatMessage, { kind: 'answer' }>, teamSnap: Team) {
    const item = { id: makeId(), team: teamSnap, title: msg.q || '상담 기록', summary: summarize(msg.text), date: formatSavedDate(new Date()) };
    try {
      await dataClient.addSaved(item);
      setSavedIds(s => ({ ...s, [msg.id]: true }));
      showToast('보관함에 저장했어요');
    } catch {
      showToast('저장하지 못했어요. 저장 공간을 확인해 주세요.');
    }
  }
  function saveAnswer(msg: Extract<ChatMessage, { kind: 'answer' }>) {
    if (!isLoggedIn) { pendingSaveRef.current = { msg, team }; setAuthOpen(true); return; }
    doSave(msg, team);
  }
  async function onAuthSubmit(id: string, password?: string): Promise<boolean> {
    const u = await login(id, password);
    if (!u) return false; // 실패 시 모달 유지 + 오류 표시(AuthModal)
    const ask = pendingAskRef.current;
    if (ask) { pendingAskRef.current = null; setDraft(''); sendText(ask); }
    const p = pendingSaveRef.current;
    if (p) { pendingSaveRef.current = null; doSave(p.msg, p.team); }
    return true;
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: C.bgChat }}>
      <Header variant="team" active="consult" onOpenAuth={() => setAuthOpen(true)} />

      <main ref={scrollRef} className="chatscroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '26px 24px 36px' }}>
          {messages.map(m => {
            if (m.role === 'user') {
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                  <div style={{ background: C.navy, color: '#fff', borderRadius: '18px 18px 5px 18px', padding: '13px 17px', fontSize: 15, lineHeight: 1.65, maxWidth: 520 }}>{m.text}</div>
                </div>
              );
            }
            return (
              <div key={m.id} style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 9, background: cfg.accent }}><Icon name={team === '법무' ? 'scale' : 'calc'} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.faint, marginBottom: 6 }}>{cfg.label}</div>
                  {m.kind === 'pending' ? (
                    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '5px 16px 16px 16px', padding: '17px 19px', fontSize: 15, color: C.faint }}>답변을 작성하고 있어요…</div>
                  ) : m.kind === 'error' ? (
                    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '5px 16px 16px 16px', padding: '17px 19px', fontSize: 15, color: C.danger }}>답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
                  ) : (
                    <>
                      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: '5px 16px 16px 16px', padding: '17px 19px', fontSize: 15, lineHeight: 1.8, color: C.ink3, whiteSpace: 'pre-wrap', boxShadow: '0 4px 14px -10px rgba(16,42,67,.15)' }}>{m.text}</div>
                      {m.kind === 'greeting' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                          {m.starters.map(s => (
                            <button key={s} disabled={sending} onClick={() => ask(s)} style={{ textAlign: 'left', background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 12, padding: '13px 16px', fontSize: 14.5, fontWeight: 600, color: '#3f4a55', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>{s}<span style={{ color: '#bcb6a8', fontSize: 17 }}>›</span></button>
                          ))}
                        </div>
                      )}
                      {m.kind === 'answer' && answerExtras(m)}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div style={{ flexShrink: 0, background: C.surfaceHeader, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 24px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: '#fff', border: `1px solid ${C.border2}`, borderRadius: 16, padding: '8px 8px 8px 16px' }}>
            <textarea rows={1} disabled={sending} placeholder={PLACEHOLDER[team]} value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              style={{ flex: 1, minWidth: 0, border: 'none', resize: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.5, color: C.ink2, padding: '8px 0', maxHeight: 120 }} />
            <button onClick={send} disabled={sending} style={{ flexShrink: 0, border: 'none', borderRadius: 11, background: cfg.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '11px 22px', cursor: 'pointer', fontFamily: 'inherit', opacity: sending ? 0.6 : 1 }}>전송</button>
          </div>
          <p style={{ margin: '8px 4px 0', fontSize: 11.5, color: C.faint3, textAlign: 'center' }}>AI 답변은 참고용이며 법적 효력이 없습니다. 중요한 결정 전 변호사·세무사 등 전문가와 상담하세요.</p>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', background: C.toastBg, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 20px', borderRadius: 999, boxShadow: '0 12px 30px -10px rgba(0,0,0,.4)', zIndex: 90, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.statusGreen, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>{toast}
        </div>
      )}

      <AuthModal open={authOpen} variant={pendingSaveRef.current ? 'save' : 'generic'} onClose={() => setAuthOpen(false)} onSubmit={onAuthSubmit} />
    </div>
  );

  function answerExtras(msg: Extract<ChatMessage, { kind: 'answer' }>) {
    const open = !!expanded[msg.id];
    const laws = msg.sources.laws, cases = msg.sources.cases;
    const count = laws.length + cases.length;
    const isSaved = !!savedIds[msg.id];
    return (
      <>
        {count > 0 && (
          <>
            <button onClick={() => setExpanded(e => ({ ...e, [msg.id]: !e[msg.id] }))} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: `1px solid ${cfg.softBorder}`, background: cfg.soft, color: cfg.accent, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.accent }} />{open ? '근거 접기' : `근거 ${count}건 펼쳐보기`}
            </button>
            {open && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, padding: 16, background: '#f6f5f2', border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.faint2, letterSpacing: '.04em' }}>근거 법령·예규</div>
                {laws.map((l, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', padding: '2px 8px', borderRadius: 5, background: cfg.accent }}>법령</span>
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{l.title}</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: cfg.accent }}>{l.article}</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.muted2, marginBottom: 10 }}>{l.body}</div>
                    <Link to={`/laws/${l.id}`} style={{ fontSize: 12.5, fontWeight: 700, textDecoration: 'none', color: cfg.accent }}>법령 전문 보기 →</Link>
                  </div>
                ))}
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.faint2, letterSpacing: '.04em', marginTop: 6 }}>참고 판례</div>
                {cases.map((c, i) => (
                  <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: C.navy, padding: '2px 8px', borderRadius: 5 }}>판례</span>
                      <span style={{ fontWeight: 700, fontSize: 14.5, color: C.ink }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 9, fontSize: 12.5, color: '#8a96a3' }}>
                      <span className="mono" style={{ color: '#5a6675', fontWeight: 600 }}>{c.number}</span>
                      <span>{c.court} · {c.date}</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.muted2, marginBottom: 10 }}>{c.summary}</div>
                    <Link to={`/cases/${c.id}`} style={{ fontSize: 12.5, fontWeight: 700, textDecoration: 'none', color: cfg.accent }}>판례 상세 보기 →</Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => !isSaved && saveAnswer(msg)} style={isSaved
            ? { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 10, border: `1px solid ${C.savedBorder}`, background: C.savedBg, color: C.savedText, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'default' }
            : { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 10, border: `1px solid ${cfg.softBorder}`, background: '#fff', color: cfg.accent, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
            {isSaved ? '보관함에 저장됨' : '이 상담 저장하기'}
          </button>
          {!isSaved && <span style={{ fontSize: 12, color: C.faint3 }}>나중에 보관함에서 다시 볼 수 있어요</span>}
        </div>
      </>
    );
  }
}
