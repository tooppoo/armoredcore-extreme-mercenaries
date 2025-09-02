import type { GetOGPStrategy } from './ogp-strategy.server'
import { getOGPStrategy as realGetOGPStrategy } from './ogp-strategy.server'

// Provider to supply a GetOGPStrategy implementation.
// In production it returns the real strategy selector.
// For e2e/dev environments, you can switch to a mock via env.MOCK_OGP.
export function getOgpStrategyProvider(env: Env): GetOGPStrategy {
  if (
    (env as unknown as Record<string, string | undefined>)?.MOCK_OGP === 'true'
  ) {
    // Return a fixed, deterministic strategy that avoids external network calls.
    return () => ({
      name: 'mock-ogp-strategy',
      condition: () => true,
<<<<<<< HEAD
      run: async () => ({
=======
      run: async (_url: URL) => ({
>>>>>>> d3a74cd (Commit changes from coding agent for task attempt 0579d525-2144-48b9-b445-7e8e2289c9c0)
        title: '(test) title',
        description: '(test) description',
        image: 'https://example.com/test.png',
      }),
    })
  }

  return realGetOGPStrategy
}
