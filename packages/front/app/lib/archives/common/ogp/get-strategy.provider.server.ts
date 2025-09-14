import type { GetOGPStrategy } from './ogp-strategy.server'
import { getOGPStrategy as realGetOGPStrategy } from './ogp-strategy.server'

// Provider to supply a GetOGPStrategy implementation.
// In production it returns the real strategy selector.
// For e2e/dev environments, you can switch to a mock via env.MOCK_OGP.
export function getOgpStrategyProvider(env: Env): GetOGPStrategy {
  if (
    (env as unknown as Record<string, string | undefined>)?.MOCK_OGP === 'true'
  ) {
    // Return a strategy selector that uses real URL validation but returns mock OGP data.
    // This ensures invalid URLs still return 400 errors even in test environments.
    return (url, strategies) => {
      // Use the real strategy selection logic to validate URLs
      for (const strategy of strategies) {
        if (strategy.condition(url)) {
          // Return a mock strategy that reuses the original condition but provides test data
          return {
            name: `mock-${strategy.name}`,
            condition: strategy.condition,
            run: async () => ({
              title: '(test) title',
              description: '(test) description',
              image: 'https://example.com/test.png',
            }),
          }
        }
      }

      // No strategy found - throw the same error as the real implementation
      throw {
        code: 'unsupported-url',
        message: `${url.toString()} is not supported`,
        detail: {
          url: url.toString(),
        },
      }
    }
  }

  return realGetOGPStrategy
}
