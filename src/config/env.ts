import dotenv from 'dotenv';

dotenv.config();

const toInt = (value:string|undefined):number|undefined=>{
    if(value===undefined || value.trim()==='') return undefined;
    const n = Number(value);
    return Number.isFinite(n)?n:undefined;
};
const isCI = !!process.env.CI;

/** Single typed source of truth for configuration (process env > .env > defaults). */
export const env = {
    isCI,
    baseUrl:(process.env.BASE_URL?.trim() || "https://eventhub.rahulshettyacademy.com").replace(/\/$/, ''),
    paths: {
    login: process.env.LOGIN_PATH?.trim() || '/login',
    register: process.env.REGISTER_PATH?.trim() || '/register',
    events: process.env.EVENTS_PATH?.trim() || '/events',
    bookings: process.env.BOOKINGS_PATH?.trim() || '/bookings',
  },
  testEmail: process.env.TEST_EMAIL?.trim() ?? '',
  testPassword: process.env.TEST_PASSWORD?.trim() ?? '',
  headless: process.env.HEADED !== 'true',
  retries: toInt(process.env.RETRIES) ?? (isCI ? 1 : 0),
  workers: toInt(process.env.WORKERS) ?? (isCI ? 3 : undefined),
  timeouts: {
    test: 60_000,
    expect: 10_000,
    action: 15_000,
    navigation: 30_000,
  },
  viewport: { width: 1440, height: 900 },
} as const;

/** Builds a RegExp that matches a URL containing the given path fragment. */
export const urlContaining = (fragment: string): RegExp =>
  new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
