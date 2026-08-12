const { evaluateRequest } = require('../../server/intake-contract.cjs');

module.exports = async function handler(req, res) {
  let rawBody = '';

  try {
    if (typeof req.body === 'string') rawBody = req.body;
    else if (req.body != null) rawBody = JSON.stringify(req.body);

    const result = evaluateRequest({
      method: req.method,
      headers: req.headers || {},
      rawBody,
      parsedBody: req.body,
      env: process.env,
    });

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (result.status === 200) {
      return res.status(503).json({
        error: 'runtime_dependencies_not_bound',
        message: 'Secure intake is not available yet.',
      });
    }

    return res.status(result.status).json(result.body);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({
      error: 'internal_error',
      message: 'Secure intake is temporarily unavailable.',
    });
  }
};
