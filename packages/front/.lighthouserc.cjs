module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/rule',
        'http://localhost:5173/penalties',
        'http://localhost:5173/updates',
        'http://localhost:5173/updates/b4c4b1e4-3e1b-1c3b-0f3d-3d1e2b4c1b4e',
        'http://localhost:5173/archives',
        'http://localhost:5173/archives/video',
        'http://localhost:5173/archives/challenge',
      ],
      startServerCommand: 'npm run dev',
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
