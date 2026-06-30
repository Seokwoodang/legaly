import { C } from '../theme';

export default function Footer({ simple }: { simple?: boolean }) {
  if (simple) {
    return (
      <footer style={{ background: C.footBg, color: '#9fb4c7' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px', fontSize: 12.5, color: '#7e93a6', lineHeight: 1.7 }}>
          저장된 상담은 이 브라우저에만 보관됩니다. 리걸리의 답변은 참고용이며 구체적 사건의 법률·세무 자문이 아닙니다.
        </div>
      </footer>
    );
  }
  return (
    <footer style={{ background: C.footBg, color: '#9fb4c7' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '34px 24px', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: '#1c3d5a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>法</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>리걸리</span>
        </div>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, margin: 0, maxWidth: 520, color: '#7e93a6' }}>리걸리는 법령·판례 정보 제공 및 참고용 AI 안내 서비스로, 구체적 사건에 대한 법률·세무 자문이 아닙니다. 중요한 결정은 변호사·세무사 등 전문가와 상담하세요.</p>
      </div>
    </footer>
  );
}
