import client from './client';

/**
 * Reports & Analytics API Client (T052)
 */
const reportsApi = {
  /**
   * GET /api/reports/dashboard
   * Returns full dashboard summary: KPIs, 6-month trend, category breakdown,
   * recent transactions, and budget alerts.
   */
  async getDashboardSummary() {
    const response = await client.get('/reports/dashboard');
    return response.data;
  },

  /**
   * GET /api/reports/summary?startDate=&endDate=&accountId=&categoryId=
   * Financial summary, category breakdown, monthly trends, and transactions.
   */
  async getSummary(params = {}) {
    const response = await client.get('/reports/summary', { params });
    return response.data;
  },

  /**
   * GET /api/reports/export?format=csv|pdf&startDate=&endDate=&accountId=&categoryId=
   * Downloads binary CSV or PDF report attachment.
   */
  async exportReport(format = 'csv', params = {}) {
    const response = await client.get('/reports/export', {
      params: { ...params, format },
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header if available
    let filename = `finora-report-${new Date().toISOString().slice(0, 10)}.${format}`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    // Trigger browser file download
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  },
};

export default reportsApi;
