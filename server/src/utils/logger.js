const info = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[INFO]', ...args);
  }
};

const warn = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[WARN]', ...args);
  }
};

const error = (...args) => {
  console.error('[ERROR]', ...args);
};

module.exports = {
  info,
  warn,
  error
};
