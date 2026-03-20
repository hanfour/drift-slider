module.exports = {
  ci: {
    collect: {
      staticDistDir: './docs',
      url: [
        'http://localhost/index.html',
        'http://localhost/demos.html',
        'http://localhost/getting-started.html',
      ],
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
