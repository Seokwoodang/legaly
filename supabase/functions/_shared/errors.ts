export type ErrCode =
  | 'UNAUTHENTICATED' | 'VALIDATION' | 'NOT_FOUND' | 'RATE_LIMITED'
  | 'UPSTREAM_TIMEOUT' | 'UPSTREAM_ERROR' | 'INTERNAL';

const STATUS: Record<ErrCode, number> = {
  UNAUTHENTICATED: 401, VALIDATION: 400, NOT_FOUND: 404, RATE_LIMITED: 429,
  UPSTREAM_TIMEOUT: 504, UPSTREAM_ERROR: 502, INTERNAL: 500,
};

export function statusFor(code: ErrCode): number { return STATUS[code]; }
export function errorBody(code: ErrCode, message: string) { return { error: { code, message } }; }

export class ApiError extends Error {
  code: ErrCode;
  constructor(code: ErrCode, message: string) { super(message); this.code = code; }
}
