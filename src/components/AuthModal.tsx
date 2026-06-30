import { useEffect, useRef, useState } from 'react';
import type { AuthVariant } from '../types';
import { C } from '../theme';
import { useSupabase } from '../lib/supabaseClient';

interface Props {
  open: boolean;
  variant: AuthVariant;
  onClose: () => void;
  /** 성공 true면 모달 닫힘, false면 오류 표시. (데모 모드는 항상 true) */
  onSubmit: (id: string, password?: string) => boolean | Promise<boolean>;
}

const COPY = {
  generic: { h2: '리걸리 시작하기', body: '이름을 알려주시면 전담 법무팀·세무팀이 맞이할게요. 상담 내용도 안전하게 보관됩니다.' },
  save: { h2: '상담을 저장하려면 로그인해 주세요', body: '이름을 알려주시면 전담 팀이 맞이하고, 상담 내용을 보관함에 안전하게 저장해 드려요.' },
};

export default function AuthModal({ open, variant, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    setErr('');
    const ok = await onSubmit(name, pw);
    if (ok) onClose();
    else setErr(useSupabase ? '아이디 또는 비밀번호가 올바르지 않아요.' : '로그인에 실패했어요.');
  };
  const cardRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      setName(''); setPw(''); setErr('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const f = cardRef.current?.querySelectorAll<HTMLElement>('input,button');
        if (!f || f.length === 0) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const copy = COPY[variant];

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(16,28,40,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100, overflowY: 'auto' }}>
      <div ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, padding: 'clamp(28px,4vw,40px)', maxWidth: 400, width: '100%', boxShadow: '0 30px 70px -20px rgba(0,0,0,.5)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 700, marginBottom: 18 }}>法</div>
        <h2 id="auth-title" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.02em', margin: '0 0 8px', color: C.ink }}>{copy.h2}</h2>
        <p style={{ fontSize: 14, color: C.muted, margin: '0 0 22px', lineHeight: 1.6 }}>{copy.body}</p>
        <label htmlFor="auth-name" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.faint, marginBottom: 7 }}>{useSupabase ? '아이디' : '이름 또는 닉네임'}</label>
        <input id="auth-name" ref={inputRef} type="text" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder={useSupabase ? '예) swoo1427' : '예) 김리걸'}
          style={{ width: '100%', border: `1px solid ${C.border3}`, borderRadius: 11, padding: '13px 15px', fontSize: 15, fontFamily: 'inherit', color: C.ink, background: C.surfaceSoft, marginBottom: useSupabase ? 12 : 18 }} />
        {useSupabase && (<>
          <label htmlFor="auth-password" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.faint, marginBottom: 7 }}>비밀번호</label>
          <input id="auth-password" type="password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="비밀번호"
            style={{ width: '100%', border: `1px solid ${C.border3}`, borderRadius: 11, padding: '13px 15px', fontSize: 15, fontFamily: 'inherit', color: C.ink, background: C.surfaceSoft, marginBottom: 18 }} />
        </>)}
        {err && <p role="alert" style={{ fontSize: 13, color: C.danger, margin: '0 0 14px' }}>{err}</p>}
        <button onClick={submit} style={{ width: '100%', border: 'none', borderRadius: 11, background: C.navy, color: '#fff', fontSize: 15.5, fontWeight: 700, padding: 14, fontFamily: 'inherit', cursor: 'pointer' }}>시작하기</button>
        <p style={{ fontSize: 11.5, color: C.faint3, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.5 }}>{useSupabase ? '아이디·비밀번호로 로그인합니다.' : '데모용 로그인입니다. 입력 정보는 이 브라우저에만 저장됩니다.'}</p>
      </div>
    </div>
  );
}
