import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendKey = Deno.env.get('RESEND_API_KEY')!
const emailTo = Deno.env.get('EMAIL_TO')!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function sendEmail(subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: emailTo,
      subject,
      html,
    }),
  })
}

Deno.serve(async () => {
  try {
    const [
      { data: rlsData },
      { data: indexData },
      { data: rowCounts },
    ] = await Promise.all([
      supabase.rpc('get_rls_status'),
      supabase.rpc('get_indexes'),
      supabase.rpc('get_table_row_counts'),
    ])

    const allTables = (rlsData || []).map((t: any) => t.tablename)
    const noRls = (rlsData || []).filter((t: any) => !t.rls_enabled).map((t: any) => t.tablename)
    const indexedTables = new Set((indexData || []).map((i: any) => i.tablename))
    const noIndexes = allTables.filter((t: string) => !indexedTables.has(t))

    const issues: any[] = []
    noRls.forEach((t: string) => issues.push({ severity: 'high', message: `Table "${t}" has RLS disabled` }))
    noIndexes.forEach((t: string) => issues.push({ severity: 'medium', message: `Table "${t}" has no indexes` }))

    const score = Math.max(0, 100 - (noRls.length * 15) - (noIndexes.length * 5))
    const scoreColor = score >= 80 ? '#3B6D11' : score >= 50 ? '#854F0B' : '#A32D2D'
    const scoreLabel = score >= 80 ? 'Healthy' : score >= 50 ? 'Needs attention' : 'Critical'

    const { data: lastScan } = await supabase
      .from('db_health_scans')
      .select('issues')
      .order('scanned_at', { ascending: false })
      .limit(1)
      .single()

    const lastMessages = new Set((lastScan?.issues || []).map((i: any) => i.message))
    const newIssues = issues.filter(i => !lastMessages.has(i.message))

    await supabase.from('db_health_scans').insert({
      score,
      issue_count: issues.length,
      tables_without_rls: noRls.length,
      tables_without_indexes: noIndexes.length,
      issues,
    })

    const issueRows = issues.map((i: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
          <span style="font-size:11px;padding:2px 8px;border-radius:4px;
            background:${i.severity === 'high' ? '#FCEBEB' : '#FAEEDA'};
            color:${i.severity === 'high' ? '#A32D2D' : '#854F0B'};
            font-weight:500;">${i.severity.toUpperCase()}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">
          ${i.message}
        </td>
      </tr>
    `).join('')

    const newIssueBanner = newIssues.length > 0
      ? `<p style="background:#FCEBEB;color:#A32D2D;padding:10px 16px;border-radius:6px;font-size:13px;">
           ${newIssues.length} new issue(s) detected since last scan
         </p>`
      : `<p style="background:#EAF3DE;color:#3B6D11;padding:10px 16px;border-radius:6px;font-size:13px;">
           No new issues since last scan
         </p>`

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#111;">Database health report</h2>
        <p style="margin:0 0 24px;font-size:13px;color:#888;">
          ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
        </p>
        <div style="display:flex;gap:12px;margin-bottom:20px;">
          <div style="flex:1;background:#f8f8f8;border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;">Health score</p>
            <p style="margin:0;font-size:28px;font-weight:600;color:${scoreColor};">${score}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${scoreColor};">${scoreLabel}</p>
          </div>
          <div style="flex:1;background:#f8f8f8;border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;">Tables</p>
            <p style="margin:0;font-size:28px;font-weight:600;color:#111;">${allTables.length}</p>
          </div>
          <div style="flex:1;background:#f8f8f8;border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;">Open issues</p>
            <p style="margin:0;font-size:28px;font-weight:600;color:#A32D2D;">${issues.length}</p>
          </div>
          <div style="flex:1;background:#f8f8f8;border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#888;">No RLS</p>
            <p style="margin:0;font-size:28px;font-weight:600;color:#854F0B;">${noRls.length}</p>
          </div>
        </div>
        ${newIssueBanner}
        ${issues.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:500;">Severity</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:500;">Issue</th>
              </tr>
            </thead>
            <tbody>${issueRows}</tbody>
          </table>
        ` : '<p style="color:#3B6D11;font-size:14px;">No issues found — database is clean.</p>'}
        <p style="margin-top:32px;font-size:11px;color:#bbb;">
          Sent automatically every hour · EAVI database monitor
        </p>
      </div>
    `

    const subject = `[${score >= 80 ? 'OK' : score >= 50 ? 'WARNING' : 'CRITICAL'}] DB health score: ${score}/100`
    await sendEmail(subject, html)

    return new Response(JSON.stringify({ ok: true, score }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
