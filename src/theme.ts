import type { Team } from './types';

export const TEAMS: Record<Team, {
  accent: string; soft: string; softBorder: string; shadow: string;
  label: string; glyph: string;
}> = {
  법무: { accent: '#1b4f8a', soft: '#eaf1f8', softBorder: '#cfe0f1', shadow: 'rgba(27,79,138,.5)', label: '법무팀', glyph: '法' },
  세무: { accent: '#157a57', soft: '#e7f3ec', softBorder: '#c5e3d3', shadow: 'rgba(21,122,87,.5)', label: '세무팀', glyph: '稅' },
};

export const C = {
  navy: '#102a43', footBg: '#0e2438', ink: '#1b2530', ink2: '#22272e', ink3: '#2d3540',
  ink4: '#3a424c', muted: '#6b7480', muted2: '#5b636d', faint: '#8a8579', faint2: '#9b958a',
  faint3: '#a59f93', faint4: '#b0a99c', bg: '#f5f4f1', bgChat: '#f1efea', surface: '#fff',
  surfaceHeader: '#fbfaf8', surfaceSoft: '#faf9f7', border: '#ece9e3', border2: '#e3ded4',
  border3: '#dcd7cd', borderDashed: '#ddd8ce', segTrack: '#efece6', danger: '#b04a3e',
  savedText: '#1b7a52', savedBg: '#eef6f1', savedBorder: '#d6e8dd', statusGreen: '#2bb673',
  toastBg: '#1b2530',
};

export const FIELD_CHIP_ACTIVE = C.navy; // 디자인 코드: 활성 분야 칩은 네이비
