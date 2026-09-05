const PDFDocument = require('pdfkit');
const Payslip = require('../models/Payslip');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Generates a clean, professional PDF buffer for a Payslip using PDFKit.
 * 
 * @param {string} payslipId 
 * @returns {Promise<Buffer>}
 */
const generatePayslipPDF = async (payslipId) => {
  const payslip = await Payslip.findById(payslipId)
    .populate('employee')
    .populate('contract')
    .populate('salaryStructure')
    .populate('payrun');

  if (!payslip) {
    throw new AppError('Payslip not found for PDF generation', 404);
  }

  const { employee, contract, salaryStructure, metrics, payrollPeriod } = payslip;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fillColor('#1E293B').fontSize(20).font('Helvetica-Bold').text('PeoplePay360 – HR & Payroll', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('Operations Platform | Official Salary Slip', { align: 'center' });
      doc.moveDown(1);

      // Divider
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      const periodStr = `${new Date(payrollPeriod.start).toISOString().split('T')[0]} to ${new Date(payrollPeriod.end).toISOString().split('T')[0]}`;
      
      // Top Info Grid
      const topY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('EMPLOYEE DETAILS', 40, topY);
      doc.font('Helvetica').fillColor('#334155');
      doc.text(`Name: ${employee.firstName} ${employee.lastName}`, 40, topY + 16);
      doc.text(`Employee ID: ${employee.employeeId}`, 40, topY + 30);
      doc.text(`Department: ${employee.department}`, 40, topY + 44);
      doc.text(`Position: ${employee.jobPosition}`, 40, topY + 58);

      doc.font('Helvetica-Bold').fillColor('#0F172A').text('PAYROLL PERIOD & SUMMARY', 320, topY);
      doc.font('Helvetica').fillColor('#334155');
      doc.text(`Period: ${periodStr}`, 320, topY + 16);
      doc.text(`Structure: ${salaryStructure?.name || 'Standard'}`, 320, topY + 30);
      doc.text(`Worked Days: ${metrics?.workedDays || 0} days`, 320, topY + 44);
      doc.text(`Bank A/C: ${employee.bankAccount?.accountNumber ? '••••' + employee.bankAccount.accountNumber.slice(-4) : 'N/A'}`, 320, topY + 58);

      doc.y = topY + 80;
      doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // Table Header
      const tableTop = doc.y;
      doc.rect(40, tableTop, 515, 20).fill('#F1F5F9');
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text('RULE / COMPONENT', 50, tableTop + 5);
      doc.text('CATEGORY', 250, tableTop + 5);
      doc.text('CALCULATION TYPE', 360, tableTop + 5);
      doc.text('AMOUNT ($)', 480, tableTop + 5, { align: 'right', width: 65 });

      let currentY = tableTop + 24;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');

      // Earnings & Deductions Breakdown
      (payslip.ruleBreakdown || []).forEach((rule) => {
        doc.text(rule.name || rule.code, 50, currentY);
        doc.text(rule.category, 250, currentY);
        doc.text(rule.calculationType, 360, currentY);
        doc.text(rule.amount.toFixed(2), 480, currentY, { align: 'right', width: 65 });
        currentY += 18;
      });

      doc.y = currentY + 10;
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(1);

      // Financial Totals Summary
      const summaryY = doc.y;
      doc.rect(300, summaryY, 255, 100).fill('#F8FAFC');
      doc.rect(300, summaryY, 255, 100).strokeColor('#CBD5E1').lineWidth(1).stroke();

      doc.fillColor('#334155').fontSize(9).font('Helvetica');
      doc.text('Basic Pay:', 315, summaryY + 10);
      doc.text(`$${payslip.basic.toFixed(2)}`, 450, summaryY + 10, { align: 'right', width: 90 });

      doc.text('Total Allowances:', 315, summaryY + 26);
      doc.text(`$${payslip.allowances.toFixed(2)}`, 450, summaryY + 26, { align: 'right', width: 90 });

      doc.text('Gross Earnings:', 315, summaryY + 42);
      doc.text(`$${payslip.gross.toFixed(2)}`, 450, summaryY + 42, { align: 'right', width: 90 });

      doc.text('Total Deductions:', 315, summaryY + 58);
      doc.text(`-$${payslip.deductions.toFixed(2)}`, 450, summaryY + 58, { align: 'right', width: 90 });

      doc.rect(300, summaryY + 74, 255, 26).fill('#0284C7');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
      doc.text('NET PAYABLE:', 315, summaryY + 82);
      doc.text(`$${payslip.net.toFixed(2)}`, 450, summaryY + 82, { align: 'right', width: 90 });

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(
        'This is a system-generated document from PeoplePay360 HR & Payroll. No physical signature required.',
        40,
        750,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePayslipPDF
};
