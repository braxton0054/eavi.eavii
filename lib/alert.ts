// Auto alert when critical errors happen
export async function sendErrorAlert(error: any, module: string, metadata?: any) {
  try {
    const alertPayload = {
      alerts: [{
        log_type: 'error',
        module,
        message: error?.message || String(error),
        created_at: new Date().toISOString(),
      }],
      alertType: 'critical',
      systemInfo: {
        campus: metadata?.campus || 'all',
        adminEmail: 'braxtonkipchumba7@gmail.com',
      },
    };

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-alert-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload),
    });
  } catch (e) {
    console.error('Failed to send alert:', e);
  }
}
