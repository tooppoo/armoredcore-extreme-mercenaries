module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:8788/',
        'http://localhost:8788/rule',
        'http://localhost:8788/penalties',
        'http://localhost:8788/updates',
        'http://localhost:8788/updates/b4c4b1e4-3e1b-1c3b-0f3d-3d1e2b4c1b4e',
        'http://localhost:8788/archives',
        'http://localhost:8788/archives/video',
        'http://localhost:8788/archives/challenge',
      ],
      startServerCommand: 'pnpm run build && pnpm run preview',
      numberOfRuns: 1,
    },
    assertions: {
      preset: 'lighthouse:recommended',
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
