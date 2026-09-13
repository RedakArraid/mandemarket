const app = require('../app');

describe('Backend Application Sanity & Health Checks', () => {
  test('L application Express est correctement initialisée et exportée', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
  });

  test('La configuration de l application contient les routes essentielles', () => {
    const routes = app._router.stack
      .filter((layer) => layer.route || (layer.name === 'router' && layer.regexp))
      .map((layer) => layer.route ? layer.route.path : layer.regexp.toString());

    expect(routes.length).toBeGreaterThan(5);
  });
});
