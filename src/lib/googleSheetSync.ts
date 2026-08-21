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
 * formatted to match the user's exact CSV template (23 columns)
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
      const foreignRemain = (foreignAdded + foreignGift) - foreignDone;

      const thaiAdded = Number(job.thai_added) || 0;
      const thaiGift = Number(job.thai_gift) || 0;
      const thaiDone = Number(job.thai_done) || 0;
      const thaiRemain = (thaiAdded + thaiGift) - thaiDone;

      const totalTarget = startCount + foreignAdded + foreignGift + thaiAdded + thaiGift;
      const price = Number(job.price) || 0;
      const cost = Number(job.cost) || 0;
      const profit = price - cost;

      // Calculate days taken
      let daysTaken = '';
      if (job.start_date && job.end_date) {
        const start = new Date(job.start_date).getTime();
        const end = new Date(job.end_date).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          daysTaken = String(Math.max(1, diffDays));
        }
      }

      // Link: profile link or job link or chat url
      let link = job.link || '';
      if (!link && job.account_name) {
        link = `https://www.instagram.com/${job.account_name}`;
      }

      return {
        no: index + 1,
        link: link,
        account_name: job.account_name || job.title || '',
        client_chat: job.client_chat_url || job.client_name || '',
        platform: job.platform || '',
        service_type: job.service_type || '',
        price: price,
        start_count: startCount,
        total_target: totalTarget,
        foreign_added: foreignAdded,
        foreign_gift: foreignGift,
        foreign_done: foreignDone,
        foreign_remain: foreignRemain,
        thai_added: thaiAdded,
        thai_gift: thaiGift,
        thai_done: thaiDone,
        thai_remain: thaiRemain,
        start_date: job.start_date || '',
        end_date: job.end_date || '',
        days_taken: daysTaken,
        status: job.status || '',
        notes: job.notes || '',
        provider_info: job.provider_info || '',
        cost: cost,
        profit: profit,
        channel: channelName
      };
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
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
 * Downloads jobs data as a UTF-8 BOM encoded CSV file matching exact 23 columns template
 */
export const downloadJobsAsCSV = (jobs: any[], _channels: any[]): void => {
  if (!jobs || jobs.length === 0) {
    alert('ไม่มีข้อมูลงานสำหรับส่งออก');
    return;
  }

  const headers = [
    'Link', 'ชื่อ', 'ผู้ว่าจ้าง', 'แฟลตฟอร์ม', 'บริการ', 'ราคา',
    'ยอดเดิม', 'ยอดรวม', 'เพิ่มฟอลต่างาชาติ', 'แถม', 'ทำไปแล้ว', 'คงเหลือต่างชาติ',
    'เพิ่มฟอลไทย', 'แถม', 'ทำไปแล้ว', 'คงเหลือไทย', 'วันที่เริ่ม', 'วันที่สิ้นสุด',
    'เวลาที่ใช้ไป', 'สถานะ', 'หมายเหตุ', 'ลิงก์สั่งซื้อ SMM', 'ค่าใช่จ่าย'
  ];

  const rows = jobs.map((job) => {
    const price = Number(job.price) || 0;
    const cost = Number(job.cost) || 0;
    const startCount = Number(job.start_count) || 0;
    const foreignAdded = Number(job.foreign_added) || 0;
    const foreignGift = Number(job.foreign_gift) || 0;
    const foreignDone = Number(job.foreign_done) || 0;
    const foreignRemain = (foreignAdded + foreignGift) - foreignDone;

    const thaiAdded = Number(job.thai_added) || 0;
    const thaiGift = Number(job.thai_gift) || 0;
    const thaiDone = Number(job.thai_done) || 0;
    const thaiRemain = (thaiAdded + thaiGift) - thaiDone;

    const totalTarget = startCount + foreignAdded + foreignGift + thaiAdded + thaiGift;

    let daysTaken = '';
    if (job.start_date && job.end_date) {
      const start = new Date(job.start_date).getTime();
      const end = new Date(job.end_date).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        daysTaken = String(Math.max(1, diffDays));
      }
    }

    let link = job.link || '';
    if (!link && job.account_name) {
      link = `https://www.instagram.com/${job.account_name}`;
    }

    return [
      `"${(link).replace(/"/g, '""')}"`,
      `"${(job.account_name || job.title || '').replace(/"/g, '""')}"`,
      `"${(job.client_chat_url || job.client_name || '').replace(/"/g, '""')}"`,
      `"${(job.platform || '').replace(/"/g, '""')}"`,
      `"${(job.service_type || '').replace(/"/g, '""')}"`,
      price,
      startCount,
      totalTarget,
      foreignAdded,
      foreignGift,
      foreignDone,
      foreignRemain,
      thaiAdded,
      thaiGift,
      thaiDone,
      thaiRemain,
      job.start_date || '',
      job.end_date || '',
      daysTaken,
      `"${(job.status || '').replace(/"/g, '""')}"`,
      `"${(job.notes || '').replace(/"/g, '""')}"`,
      `"${(job.provider_info || '').replace(/"/g, '""')}"`,
      cost
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
 * Google Apps Script code matching the exact 23 columns structure of user's sheet
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // ตั้งค่าหัวตาราง (Header 23 คอลัมน์ ตรงตามโครงสร้างชีทเดิมของคุณ)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Link", "ชื่อ", "ผู้ว่าจ้าง", "แฟลตฟอร์ม", "บริการ", "ราคา",
        "ยอดเดิม", "ยอดรวม", "เพิ่มฟอลต่างาชาติ", "แถม", "ทำไปแล้ว", "คงเหลือต่างชาติ",
        "เพิ่มฟอลไทย", "แถม", "ทำไปแล้ว", "คงเหลือไทย", "วันที่เริ่ม", "วันที่สิ้นสุด",
        "เวลาที่ใช้ไป", "สถานะ", "หมายเหตุ", "ลิงก์สั่งซื้อ SMM", "ค่าใช่จ่าย"
      ]);
    }
    
    // เคลียร์ข้อมูลเดิม (เว้นบรรทัดหัวตารางไว้)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    // เขียนข้อมูลแถวใหม่ทั้งหมด
    var jobs = data.jobs || [];
    var rows = [];
    for (var i = 0; i < jobs.length; i++) {
      var j = jobs[i];
      rows.push([
        j.link || "",
        j.account_name || "",
        j.client_chat || "",
        j.platform || "",
        j.service_type || "",
        j.price || 0,
        j.start_count || 0,
        j.total_target || 0,
        j.foreign_added || 0,
        j.foreign_gift || 0,
        j.foreign_done || 0,
        j.foreign_remain || 0,
        j.thai_added || 0,
        j.thai_gift || 0,
        j.thai_done || 0,
        j.thai_remain || 0,
        j.start_date || "",
        j.end_date || "",
        j.days_taken || "",
        j.status || "",
        j.notes || "",
        j.provider_info || "",
        j.cost || 0
      ]);
    }
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "อัปเดตข้อมูล " + rows.length + " รายการเข้า Google Sheet เรียบร้อยแล้ว!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
