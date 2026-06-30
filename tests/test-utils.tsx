import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../src/context/AppContext';
import App from '../src/App';

/** 전체 앱을 주어진 라우트로 렌더(라우터+컨텍스트 포함). 링크 내비게이션 동작. */
export function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        <App />
      </AppProvider>
    </MemoryRouter>,
  );
}

export function seedUser(name = '김리걸') {
  localStorage.setItem('legaly.user', JSON.stringify({ name }));
}
export function seedTeam(team: '법무' | '세무') {
  localStorage.setItem('legaly.team', team);
}
export function seedSaved(items: unknown[]) {
  localStorage.setItem('legaly.saved', JSON.stringify(items));
}
