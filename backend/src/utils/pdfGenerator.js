/**
 * PDF Report Generator (T050)
 * Uses PDFKit to stream formatted audit-ready financial statements.
 */

const PDFDocument = require('pdfkit');

function streamPdfReport(data, res) {
  const { summary = {}, transactions = [], user = {}, dateRange = {} } = data;
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `finora-statement-${dateStr}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  // Design Tokens
  const primaryColor = '#0045e4';
  const darkTextColor = '#0e193e';
  const grayTextColor = '#747687';
  const lightBgColor = '#f3f2ff';
  const greenColor = '#10B981';
  const redColor = '#b71945';

  // 1. Header Banner Box
  doc.rect(40, 40, 515, 64).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('FINORA FINANCE OS', 55, 52);
  doc.fontSize(9.5).font('Helvetica').text('Statement of Financial Position & Formal Cashflow Audit', 55, 78);

  // Metadata block on right
  const startStr = dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString('en-IN') : 'Start';
  const endStr = dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString('en-IN') : 'Present';
  doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica');
  doc.text(`Window: ${startStr} - ${endStr}`, 320, 50, { align: 'right', width: 220 });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 320, 64, { align: 'right', width: 220 });
  doc.text(`Holder: ${user.name || 'Valued Member'}`, 320, 78, { align: 'right', width: 220 });

  // 2. Executive Financial Summary Cards (4 KPI Cards)
  const boxTop = 118;
  const boxWidth = 120;
  const boxHeight = 50;
  const gap = 11.5;

  drawKpiBox(doc, 40, boxTop, boxWidth, boxHeight, 'TOTAL INFLOW', `₹${(summary.totalIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, greenColor, lightBgColor);
  drawKpiBox(doc, 40 + boxWidth + gap, boxTop, boxWidth, boxHeight, 'TOTAL OUTFLOW', `₹${(summary.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, redColor, lightBgColor);
  drawKpiBox(doc, 40 + (boxWidth + gap) * 2, boxTop, boxWidth, boxHeight, 'NET SURPLUS', `₹${(summary.netSavings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, primaryColor, '#dde1ff');
  drawKpiBox(doc, 40 + (boxWidth + gap) * 3, boxTop, boxWidth, boxHeight, 'SAVINGS RATE', `${(summary.savingsRate || 0)}%`, darkTextColor, lightBgColor);

  // 3. Category Spending Breakdown Summary
  let currentY = 182;
  doc.fillColor(darkTextColor).fontSize(11).font('Helvetica-Bold').text('1. Category Distribution Breakdown', 40, currentY);
  currentY += 16;

  if (summary.categoryBreakdown && summary.categoryBreakdown.length > 0) {
    // Table Header
    doc.rect(40, currentY, 515, 18).fill('#ecedff');
    doc.fillColor(darkTextColor).fontSize(8.5).font('Helvetica-Bold');
    doc.text('Category', 50, currentY + 4);
    doc.text('Type', 210, currentY + 4);
    doc.text('Amount (₹)', 330, currentY + 4, { width: 90, align: 'right' });
    doc.text('Share (%)', 440, currentY + 4, { width: 90, align: 'right' });
    currentY += 20;

    doc.font('Helvetica').fontSize(8.5);
    for (const cat of summary.categoryBreakdown.slice(0, 6)) {
      doc.fillColor(darkTextColor);
      doc.text(cat.category || cat.name || 'Uncategorized', 50, currentY);
      doc.text(cat.type || 'EXPENSE', 210, currentY);
      doc.text(`₹${parseFloat(cat.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 330, currentY, { width: 90, align: 'right' });
      doc.text(`${cat.percentage}%`, 440, currentY, { width: 90, align: 'right' });
      currentY += 14;
    }
  }

  currentY += 14;

  // 4. Itemized Transactions Ledger
  doc.fillColor(darkTextColor).fontSize(11).font('Helvetica-Bold').text('2. Itemized Audit Transaction Ledger', 40, currentY);
  currentY += 16;

  // Ledger Table Header
  doc.rect(40, currentY, 515, 18).fill('#242e55');
  doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
  doc.text('Date', 50, currentY + 4);
  doc.text('Description / Notes', 120, currentY + 4);
  doc.text('Category', 280, currentY + 4);
  doc.text('Account', 380, currentY + 4);
  doc.text('Amount (₹)', 460, currentY + 4, { width: 85, align: 'right' });
  currentY += 20;

  doc.font('Helvetica').fontSize(8);
  let rowCount = 0;
  for (const tx of transactions) {
    if (currentY > 740) {
      doc.addPage();
      currentY = 40;
      doc.rect(40, currentY, 515, 18).fill('#242e55');
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('Date', 50, currentY + 4);
      doc.text('Description / Notes', 120, currentY + 4);
      doc.text('Category', 280, currentY + 4);
      doc.text('Account', 380, currentY + 4);
      doc.text('Amount (₹)', 460, currentY + 4, { width: 85, align: 'right' });
      currentY += 20;
      doc.font('Helvetica').fontSize(8);
    }

    if (rowCount % 2 === 0) {
      doc.rect(40, currentY - 2, 515, 14).fill('#fbf8ff');
    }

    const txDate = new Date(tx.date).toLocaleDateString('en-IN');
    const isIncome = tx.type === 'INCOME';
    const amountStr = `${isIncome ? '+' : '-'}₹${parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    doc.fillColor(darkTextColor);
    doc.text(txDate, 50, currentY);
    doc.text((tx.notes || 'Transaction').slice(0, 28), 120, currentY);
    doc.text((tx.category?.name || '—').slice(0, 16), 280, currentY);
    doc.text((tx.account?.name || '—').slice(0, 14), 380, currentY);

    doc.fillColor(isIncome ? greenColor : redColor).font('Helvetica-Bold');
    doc.text(amountStr, 460, currentY, { width: 85, align: 'right' });
    doc.font('Helvetica');

    currentY += 14;
    rowCount++;
  }

  // Footer stamp on final page
  doc.fontSize(7.5).fillColor(grayTextColor).text(
    'Finora Finance OS — Formal Financial Statement • RBI AA Compliant 256-bit Certified Ledger',
    40,
    792,
    { align: 'center', width: 515 }
  );

  doc.end();
}

function drawKpiBox(doc, x, y, w, h, label, value, valColor, bgColor) {
  doc.rect(x, y, w, h).fill(bgColor);
  doc.fillColor('#747687').fontSize(7).font('Helvetica-Bold').text(label, x + 8, y + 8);
  doc.fillColor(valColor).fontSize(10.5).font('Helvetica-Bold').text(value, x + 8, y + 24);
}

module.exports = { streamPdfReport };
