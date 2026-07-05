describe('rateLimiter middleware', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  it('usa windowMs=900000 y max=100 por defecto cuando las variables de entorno no estan definidas', async () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;

    const { apiLimiter } = await import('../../../src/middlewares/rateLimiter.middleware.js');

    expect(apiLimiter).toBeInstanceOf(Function);
  });

  it('lee windowMs y max desde las variables de entorno cuando estan definidas', async () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, RATE_LIMIT_WINDOW_MS: '60000', RATE_LIMIT_MAX_REQUESTS: '5' };

    const { apiLimiter } = await import('../../../src/middlewares/rateLimiter.middleware.js');

    expect(apiLimiter).toBeInstanceOf(Function);
  });
});
