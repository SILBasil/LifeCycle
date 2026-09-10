export interface JobLinkItem {
  id: string;
  url: string;
  start_count: number;
  target_count: number;
  current_count: number;
  done: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface FetchResult {
  success: boolean;
  count?: number;
  platform?: string;
  error?: string;
}

/**
 * เรียกใช้งาน API หลังบ้าน Vercel Serverless (/api/fetch-count)
 */
export async function fetchSocialCount(url: string): Promise<FetchResult> {
  if (!url || typeof url !== 'string') {
    return { success: false, error: 'กรุณาระบุ URL' };
  }

  try {
    const response = await fetch('/api/fetch-count', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'ไม่สามารถดึงยอดจาก URL นี้ได้',
        platform: data.platform
      };
    }

    return {
      success: true,
      count: data.count,
      platform: data.platform
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อหลังบ้าน',
    };
  }
}

/**
 * สร้าง Deep Link เพื่อเปิดแอปพลิเคชันบนมือถือ (Instagram / TikTok / Facebook)
 */
export function getAppDeepLink(url: string): string {
  if (!url) return '';
  
  if (url.includes('instagram.com')) {
    // แยก username หรือ post ID
    const usernameMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?(?:\?.*)?$/i);
    if (usernameMatch && !['p', 'reel', 'stories', 'explore'].includes(usernameMatch[1])) {
      return `instagram://user?username=${usernameMatch[1]}`;
    }
    // กรณีเป็นโพสต์
    return url;
  }
  
  if (url.includes('tiktok.com')) {
    return url;
  }
  
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return url;
  }

  return url;
}
