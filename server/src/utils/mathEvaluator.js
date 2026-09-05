const { compile } = require('mathjs');

/**
 * Safely evaluates a math formula using mathjs within a restricted variable scope.
 * 
 * @param {string} formula - e.g. "BASIC * 0.12", "(CONTRACT_WAGE / 30) * WORKED_DAYS"
 * @param {Object} scope - e.g. { BASIC: 50000, CONTRACT_WAGE: 50000, WORKED_DAYS: 30 }
 * @returns {number} evaluated result rounded to 2 decimal places
 */
const evaluateFormula = (formula, scope = {}) => {
  if (!formula || typeof formula !== 'string') {
    throw new Error('Invalid formula string provided');
  }

  try {
    const compiled = compile(formula);
    const result = compiled.evaluate(scope);
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error(`Formula evaluation did not produce a valid finite number. Result: ${result}`);
    }

    return Math.round((result + Number.EPSILON) * 100) / 100;
  } catch (err) {
    throw new Error(`Error evaluating formula "${formula}": ${err.message}`);
  }
};

module.exports = {
  evaluateFormula
};
