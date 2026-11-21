/**
 * CSV Report Streaming Generator (T049)
 * Generates and streams RFC 4180 compliant CSV files with UTF-8 BOM.
 */

function streamCsvReport(transactions, res, meta = {}) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `finora-statement-${dateStr}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Write UTF-8 Byte Order Mark (BOM) for Excel compatibility
  res.write('\ufeff');

  // Header row
  const headers = [
    'Transaction ID',
    'Date',
    'Type',
    'Category',
    'Account',
    'Amount',
    'Currency',
    'Notes',
    'Recurring',
  ];
  res.write(headers.map(escapeCsv).join(',') + '\r\n');

  // Stream rows
  for (const t of transactions) {
    const row = [
      t.id,
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.category ? t.category.name : 'Uncategorized',
      t.account ? t.account.name : 'Unknown Account',
      parseFloat(t.amount).toFixed(2),
      t.account?.currency || 'INR',
      t.notes || '',
      t.isRecurring ? 'Yes' : 'No',
    ];
    res.write(row.map(escapeCsv).join(',') + '\r\n');
  }

  res.end();
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

module.exports = { streamCsvReport };
