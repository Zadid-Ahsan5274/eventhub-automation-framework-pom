export interface TestUser {
    name: string;
    email: string;
    password: string;
}

export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';