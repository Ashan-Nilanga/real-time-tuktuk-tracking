// Vercel CommonJS entry point workaround for ES Module bugs
// This dynamically imports the ES Module Express app to bypass Vercel's strict ESM parsing issues.
module.exports = async (req, res) => {
  const app = (await import('../src/app.js')).default;
  return app(req, res);
};
