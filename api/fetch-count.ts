import type { VercelRequest, VercelResponse } from '@vercel/node';

// ฟังก์ชันแปลงหน่วย k, m, ล้าน เป็นตัวเลขจริง
function parseSocialNumber(str: string | number | undefined | null): number | null {
  if (str === undefined || str === null) return null;
  if (typeof str === 'number') return str;
  
  let cleanStr = str.toString().replace(/,/g, '').trim().toLowerCase();
  
  // จัดการภาษาไทย เช่น 15.4พัน หรือ 1.2ล้าน
  if (cleanStr.includes('ล้าน') || cleanStr.endsWith('m')) {
    cleanStr = cleanStr.replace('ล้าน', '').replace('m', '').trim();
    return Math.round(parseFloat(cleanStr) * 1000000);
  }
  if (cleanStr.includes('พัน') || cleanStr.endsWith('k')) {
    cleanStr = cleanStr.replace('พัน', '').replace('k', '').trim();
    return Math.round(parseFloat(cleanStr) * 1000);
  }
  
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? null : Math.round(parsed);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'กรุณาระบุ URL ที่ต้องการดึงข้อมูล' });
  }

  const cleanUrl = url.trim();
  let platform = 'unknown';

  try {
    if (cleanUrl.includes('tiktok.com')) {
      platform = 'tiktok';
      const count = await fetchTikTokCount(cleanUrl);
      if (count !== null) {
        return res.status(200).json({ success: true, count, platform });
      }
    } else if (cleanUrl.includes('instagram.com')) {
      platform = 'instagram';
      const count = await fetchInstagramCount(cleanUrl);
      if (count !== null) {
        return res.status(200).json({ success: true, count, platform });
      }
    } else if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch') || cleanUrl.includes('fb.me')) {
      platform = 'facebook';
      const count = await fetchFacebookCount(cleanUrl);
      if (count !== null) {
        return res.status(200).json({ success: true, count, platform });
      }
    } else {
      return res.status(400).json({ success: false, error: 'ยังไม่รองรับแพลตฟอร์มนี้' });
    }

    return res.status(404).json({
      success: false,
      error: `ไม่สามารถแกะยอดจากลิงก์ ${platform} นี้ได้โดยตรง (อาจเป็นบัญชีส่วนตัวหรือติดหน้าล็อกอิน) แนะนำให้ใช้ปุ่มเปิดแอปหรือสแกนภาพแคปหน้าจอ`,
      platform
    });
  } catch (err: any) {
    console.error('Fetch count error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากแพลตฟอร์ม',
      platform
    });
  }
}

// ---------------------- TIKTOK FETCHER ----------------------
async function fetchTikTokCount(url: string): Promise<number | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  const response = await fetch(url, { headers });
  if (!response.ok) return null;
  const html = await response.text();

  // 1. ตรวจสอบ followerCount / diggCount ใน Universal Data หรือ JSON สคริปต์
  const followerMatch = html.match(/"followerCount":\s*(\d+)/i);
  if (followerMatch && followerMatch[1]) {
    return parseInt(followerMatch[1], 10);
  }

  const diggMatch = html.match(/"diggCount":\s*(\d+)/i) || html.match(/"likeCount":\s*(\d+)/i);
  if (diggMatch && diggMatch[1]) {
    return parseInt(diggMatch[1], 10);
  }

  // 2. ตรวจสอบ Meta Tags
  const metaMatch = html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i) ||
                     html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                     html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
  if (metaMatch && metaMatch[1]) {
    const desc = metaMatch[1];
    const followMatch = desc.match(/([0-9.,kKmM]+)\s*Followers/i) || desc.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
    if (followMatch) return parseSocialNumber(followMatch[1]);

    const likesMatch = desc.match(/([0-9.,kKmM]+)\s*Likes/i) || desc.match(/ถูกใจ\s*([0-9.,kKmM]+)\s*ครั้ง/i);
    if (likesMatch) return parseSocialNumber(likesMatch[1]);
  }

  return null;
}

// ---------------------- INSTAGRAM FETCHER ----------------------
async function fetchInstagramCount(url: string): Promise<number | null> {
  // ดึง Username หรือ Shortcode จาก URL
  const usernameMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?(?:\?.*)?$/i);
  const username = usernameMatch && !['p', 'reel', 'stories', 'explore'].includes(usernameMatch[1]) ? usernameMatch[1] : null;

  // วิธีที่ 1: ลองยิง GraphQL Web Profile Info Endpoint ของ Instagram โดยตรง
  if (username) {
    try {
      const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'X-IG-App-ID': '936619743392459',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Sec-Fetch-Site': 'same-origin',
        }
      });
      if (apiRes.ok) {
        const data: any = await apiRes.json();
        const user = data?.data?.user;
        if (user && user.edge_followed_by && typeof user.edge_followed_by.count === 'number') {
          return user.edge_followed_by.count;
        }
      }
    } catch (e) {
      console.warn('IG Web Profile Info error:', e);
    }
  }

  // วิธีที่ 2: ดึงผ่าน Googlebot / Desktop View เพื่อแกะ Meta Tag
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const metaMatch = html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i) ||
                         html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                         html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
      
      if (metaMatch && metaMatch[1]) {
        const desc = metaMatch[1]; // เช่น "10.5K Followers, 300 Following, 120 Posts..." หรือ "1,520 Likes, 45 Comments..."
        const followersMatch = desc.match(/([0-9.,kKmM]+)\s*Followers/i) || desc.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
        if (followersMatch) return parseSocialNumber(followersMatch[1]);

        const likesMatch = desc.match(/([0-9.,kKmM]+)\s*Likes/i) || desc.match(/ถูกใจ\s*([0-9.,kKmM]+)\s*คน/i);
        if (likesMatch) return parseSocialNumber(likesMatch[1]);
      }
    }
  } catch (e) {
    console.warn('IG HTML scrape error:', e);
  }

  return null;
}

// ---------------------- FACEBOOK FETCHER ----------------------
async function fetchFacebookCount(url: string): Promise<number | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const html = await response.text();

    // 1. ตรวจสอบ page_followers / reaction count ใน script
    const followersMatch = html.match(/"page_followers":\s*(\d+)/i) || 
                           html.match(/"follower_count":\s*(\d+)/i) ||
                           html.match(/([0-9.,kKmM]+)\s*followers/i) ||
                           html.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
    if (followersMatch && followersMatch[1]) {
      return parseSocialNumber(followersMatch[1]);
    }

    const likesMatch = html.match(/"page_likes":\s*(\d+)/i) || 
                       html.match(/"like_count":\s*(\d+)/i) ||
                       html.match(/([0-9.,kKmM]+)\s*likes/i) ||
                       html.match(/ถูกใจ\s*([0-9.,kKmM]+)\s*คน/i);
    if (likesMatch && likesMatch[1]) {
      return parseSocialNumber(likesMatch[1]);
    }
  } catch (e) {
    console.warn('FB scrape error:', e);
  }

  return null;
}
