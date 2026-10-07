import type { Severity } from '../types';

interface MetaOptions {
  story: string;
  severity?: Severity;
  /** Also tag the test as @smoke (every test is always @regression). */
  smoke?: boolean;
}

/**
 * Compact helper that returns Playwright "test details": tags for --grep filtering
 * and annotations that the allure fixture converts into Allure story/severity labels.
 */
export const meta = ({ story, severity = 'normal', smoke = false }: MetaOptions) => ({
  tag: smoke ? ['@smoke', '@regression'] : ['@regression'],
  annotation: [
    { type: 'story', description: story },
    { type: 'severity', description: severity },
  ],
});