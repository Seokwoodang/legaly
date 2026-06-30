import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// jsdom 미구현 API 스텁
window.scrollTo = () => {};

// crypto.randomUUID 폴백(일부 jsdom 환경)
if (!('randomUUID' in globalThis.crypto)) {
  let n = 0;
  // @ts-expect-error 테스트 환경 폴백
  globalThis.crypto.randomUUID = () => `uuid-${Date.now()}-${n++}`;
}
