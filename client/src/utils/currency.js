/**
 * Utility functions for Indian Rupee (INR - ₹) formatting.
 */

export const formatINR = (amount, options = {}) => {
  const num = Number(amount) || 0;
  const { decimals = 2, compact = false } = options;
  
  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
  }

  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const formatCurrency = formatINR;
