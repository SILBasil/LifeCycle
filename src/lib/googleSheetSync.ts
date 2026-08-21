// Google Sheets Sync Helper Utilities

export const GSHEET_WEBHOOK_STORAGE_KEY = 'lifecycle_gsheet_webhook_url';

export const getGoogleSheetWebhookUrl = (): string => {
  return localStorage.getItem(GSHEET_WEBHOOK_STORAGE_KEY) || '';
};

export const setGoogleSheetWebhookUrl = (url: string): void => {
  localStorage.setItem(GSHEET_WEBHOOK_STORAGE_KEY, url.trim());
};

/**
 * Pushes jobs data to the specified Google Apps Script Webhook URL
 */
export const syncJobsToGoogleSheet = async (jobs: any[], channels: any[], customWebhookUrl?: string): Promise<{ success: boolean; message: string }> => {
  const webhookUrl = customWebhookUrl || getGoogleSheetWebhookUrl();

  if (!webhookUrl) {
    return {
      success: false,
      message: 'กรุณาตั้งค่า Google Sheets Webhook URL ในหน้าตั้งค่าหรือปุ่มซิงค์ก่อนใช้งาน'
    };
  }

  try {
    const formattedJobs = jobs.map((job, index) => {
      const channel = channels.find(c => c.id === job.channel_id);
      const channelName = channel ? channel.name : 'ลูกค้าตรง / อื่นๆ';
      
      const startCount = Number(job.start_count) || 0;
      const foreignAdded = Number(job.foreign_added) || 0;
      const foreignGift = Number(job.foreign_gift) || 0;
      const foreignDone = Number(job.foreign_done) || 0;
      const thaiAdded = Number(job.thai_added) || 0;
      const thaiGift = Number(job.thai_gift) || 0;
      const thaiDone = Number(job.thai_done) || 0;
      const price = Number(job.price) || 0;
      const cost = Number(job.cost) || 0;
      const profit = price - cost;

      // Extract Order / Chat ID if available
      let chatOrderId = '';
      if (job.client_chat_url) {
        const match = job.client_chat_url.match(/(\d+)/);
        if (match) chatOrderId = match[1];
      }

      return {
        no: index + 1,
        id: job.id,
        title: job.title || '',
        channel: channelName,
        category: job.category || 'fastwork_smm',
        platform: job.platform || '',
        service_type: job.service_type || '',
        client_name: job.client_name || '',
        account_name: job.account_name ? `@${job.account_name}` : '',
        link: job.link || '',
        client_chat_url: job.client_chat_url || '',
        chat_order_id: chatOrderId,
        status: job.status || '',
        start_count: startCount,
        target_added: foreignAdded + foreignGift + thaiAdded + thaiGift,
        total_target: startCount + foreignAdded + foreignGift + thaiAdded + thaiGift,
        foreign_done: foreignDone,
        thai_done: thaiDone,
        total_done: foreignDone + thaiDone,
        price: price,
        cost: cost,
        profit: profit,
        start_date: job.start_date || '',
        end_date: job.end_date || '',
        notes: job.notes || '',
        provider_info: job.provider_info || '',
        created_at: job.created_at || ''
      };
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script handles text/plain without CORS preflight issues
      },
      body: JSON.stringify({
        action: 'SYNC_JOBS',
        timestamp: new Date().toISOString(),
        total_jobs: formattedJobs.length,
        jobs: formattedJobs
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const resText = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(resText);
    } catch (e) {
      resJson = { status: 'success', text: resText };
    }

    return {
      success: true,
      message: resJson.message || `ซิงค์ข้อมูล ${formattedJobs.length} รายการไปยัง Google Sheet เรียบร้อยแล้ว!`
    };
  } catch (err: any) {
    console.error('Error syncing to Google Sheet:', err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheet: ${err.message || 'ไม่สามารถส่งข้อมูลได้'}`
    };
  }
};

/**
 * Downloads jobs data as a UTF-8 BOM encoded CSV file
 */
export const downloadJobsAsCSV = (jobs: any[], channels: any[]): void => {
  if (!jobs || jobs.length === 0) {
    alert('ไม่มีข้อมูลงานสำหรับส่งออก');
    return;
  }

  const headers = [
    'ลำดับ', 'ชื่องาน', 'ช่องทาง', 'หมวดหมู่', 'บริการ/แพลตฟอร์ม', 'ประเภท',
    'ผู้ว่าจ้าง', 'IG/TikTok Handle', 'ID คำสั่งซื้อ/แชท', 'สถานะ',
    'ยอดเดิม', 'เป้าหมายรวม', 'ทำแล้ว(ต่างชาติ)', 'ทำแล้ว(ไทย)', 'รวมทำแล้ว',
    'ราคาขาย', 'ต้นทุน', 'กำไร', 'วันเริ่ม', 'วันเสร็จ', 'ลิงก์งาน', 'หมายเหตุ'
  ];

  const rows = jobs.map((job, idx) => {
    const chan = channels.find(c => c.id === job.channel_id);
    const channelName = chan ? chan.name : 'ลูกค้าตรง/อื่นๆ';
    const price = Number(job.price) || 0;
    const cost = Number(job.cost) || 0;
    const profit = price - cost;

    let chatOrderId = '';
    if (job.client_chat_url) {
      const match = job.client_chat_url.match(/(\d+)/);
      if (match) chatOrderId = match[1];
    }

    const startCount = Number(job.start_count) || 0;
    const foreignDone = Number(job.foreign_done) || 0;
    const thaiDone = Number(job.thai_done) || 0;
    const targetAdded = (Number(job.foreign_added)||0) + (Number(job.foreign_gift)||0) + (Number(job.thai_added)||0) + (Number(job.thai_gift)||0);

    return [
      idx + 1,
      `"${(job.title || '').replace(/"/g, '""')}"`,
      `"${channelName.replace(/"/g, '""')}"`,
      `"${(job.category || 'fastwork_smm').replace(/"/g, '""')}"`,
      `"${(job.platform || '').replace(/"/g, '""')}"`,
      `"${(job.service_type || '').replace(/"/g, '""')}"`,
      `"${(job.client_name || '').replace(/"/g, '""')}"`,
      `"${(job.account_name || '').replace(/"/g, '""')}"`,
      `"${chatOrderId}"`,
      `"${(job.status || '').replace(/"/g, '""')}"`,
      startCount,
      startCount + targetAdded,
      foreignDone,
      thaiDone,
      foreignDone + thaiDone,
      price,
      cost,
      profit,
      job.start_date || '',
      job.end_date || '',
      `"${(job.link || '').replace(/"/g, '""')}"`,
      `"${(job.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LifeCycle_Freelance_Jobs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Example Google Apps Script template string to show users in modal/settings
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Create Headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ลำดับ", "ชื่องาน", "ช่องทาง", "หมวดหมู่", "บริการ/แพลตฟอร์ม", "ประเภท", 
        "ผู้ว่าจ้าง", "IG/TikTok Handle", "ID คำสั่งซื้อ/แชท", "สถานะ", 
        "ยอดเดิม", "เป้าหมายรวม", "รวมทำแล้ว", "ราคาขาย", "ต้นทุน", "กำไร", 
        "วันเริ่ม", "วันเสร็จ", "ลิงก์งาน", "อัปเดตล่าสุด"
      ]);
    }
    
    // Clear existing data rows (keep header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    // Write new rows
    var jobs = data.jobs || [];
    var rows = [];
    for (var i = 0; i < jobs.length; i++) {
      var j = jobs[i];
      rows.push([
        j.no, j.title, j.channel, j.category, j.platform, j.service_type,
        j.client_name, j.account_name, j.chat_order_id, j.status,
        j.start_count, j.total_target, j.total_done, j.price, j.cost, j.profit,
        j.start_date, j.end_date, j.link, new Date().toLocaleString("th-TH")
      ]);
    }
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "อัปเดตข้อมูล " + rows.length + " รายการสำเร็จ!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
