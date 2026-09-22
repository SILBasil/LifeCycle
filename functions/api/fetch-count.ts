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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request }: { request: Request }) {
  try {
    const body: any = await request.json();
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'กรุณาระบุ URL ที่ต้องการดึงข้อมูล' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanUrl = url.trim();
    let platform = 'unknown';

    if (cleanUrl.includes('tiktok.com')) {
      platform = 'tiktok';
      const count = await fetchTikTokCount(cleanUrl);
      if (count !== null) {
        return new Response(JSON.stringify({ success: true, count, platform }), { status: 200, headers: corsHeaders });
      }
    } else if (cleanUrl.includes('instagram.com')) {
      platform = 'instagram';
      const count = await fetchInstagramCount(cleanUrl);
      if (count !== null) {
        return new Response(JSON.stringify({ success: true, count, platform }), { status: 200, headers: corsHeaders });
      }
    } else if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch') || cleanUrl.includes('fb.me')) {
      platform = 'facebook';
      const count = await fetchFacebookCount(cleanUrl);
      if (count !== null) {
        return new Response(JSON.stringify({ success: true, count, platform }), { status: 200, headers: corsHeaders });
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'ยังไม่รองรับแพลตฟอร์มนี้' }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: `ไม่สามารถแกะยอดจากลิงก์ ${platform} นี้ได้โดยตรง (อาจเป็นบัญชีส่วนตัวหรือติดหน้าล็อกอิน)`,
        platform
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากแพลตฟอร์ม',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// ---------------------- TIKTOK FETCHER ----------------------
async function fetchTikTokCount(url: string): Promise<number | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const html = await response.text();

    const followerMatch = html.match(/"followerCount":\s*(\d+)/);
    if (followerMatch && followerMatch[1]) return parseInt(followerMatch[1], 10);

    const diggMatch = html.match(/"diggCount":\s*(\d+)/);
    if (diggMatch && diggMatch[1]) return parseInt(diggMatch[1], 10);

    const metaMatch = html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i) ||
                       html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    if (metaMatch && metaMatch[1]) {
      const desc = metaMatch[1];
      const m = desc.match(/([0-9.,kKmM]+)\s*(?:Followers|ผู้ติดตาม|Likes|ถูกใจ)/i);
      if (m && m[1]) return parseSocialNumber(m[1]);
    }
  } catch (_) {}

  return null;
}

// ---------------------- INSTAGRAM FETCHER (MULTI-FALLBACK) ----------------------
async function fetchInstagramCount(url: string): Promise<number | null> {
  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
  const usernameMatch = cleanUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?$/i);
  const username = usernameMatch && !['p', 'reel', 'reels', 'stories', 'explore', 'tv', 'share'].includes(usernameMatch[1]) 
    ? usernameMatch[1] 
    : null;

  if (username) {
    try {
      const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'X-IG-App-ID': '936619743392459',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Sec-Fetch-Site': 'same-origin',
        }
      });
      if (apiRes.ok) {
        const data: any = await apiRes.json();
        const user = data?.data?.user;
        if (user?.edge_followed_by && typeof user.edge_followed_by.count === 'number') {
          return user.edge_followed_by.count;
        }
      }
    } catch (_) {}
  }

  const crawlerHeaders = [
    { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.html)', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    { 'User-Agent': 'Twitterbot/1.0', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
  ];

  for (const headers of crawlerHeaders) {
    try {
      const pageRes = await fetch(cleanUrl, { headers });
      if (pageRes.ok) {
        const html = await pageRes.text();

        const jsonLikeMatch = html.match(/"edge_media_preview_like":\s*\{\s*"count":\s*(\d+)/i) ||
                              html.match(/"edge_liked_by":\s*\{\s*"count":\s*(\d+)/i) ||
                              html.match(/"like_count":\s*(\d+)/i) ||
                              html.match(/"edge_followed_by":\s*\{\s*"count":\s*(\d+)/i);
        if (jsonLikeMatch && jsonLikeMatch[1]) {
          return parseInt(jsonLikeMatch[1], 10);
        }

        const metaMatch = html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i) ||
                          html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                          html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);
        
        if (metaMatch && metaMatch[1]) {
          const desc = metaMatch[1];
          const followersMatch = desc.match(/([0-9.,kKmM]+)\s*Followers/i) || desc.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
          if (followersMatch) return parseSocialNumber(followersMatch[1]);

          const likesMatch = desc.match(/([0-9.,kKmM]+)\s*Likes/i) || desc.match(/ถูกใจ\s*([0-9.,kKmM]+)\s*คน/i) || desc.match(/ถูกใจ\s*([0-9.,kKmM]+)\s*ครั้ง/i);
          if (likesMatch) return parseSocialNumber(likesMatch[1]);
        }
      }
    } catch (_) {}
  }

  try {
    const embedUrl = `${cleanUrl}/embed/captioned/`;
    const embedRes = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    if (embedRes.ok) {
      const embedHtml = await embedRes.text();
      const countMatch = embedHtml.match(/class="[^"]*LikesAndComments[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                         embedHtml.match(/([0-9.,kKmM]+)\s*(?:likes|ถูกใจ|followers|ผู้ติดตาม)/i);
      if (countMatch && countMatch[1]) {
        const parsed = parseSocialNumber(countMatch[1]);
        if (parsed !== null) return parsed;
      }
    }
  } catch (_) {}

  return null;
}

// ---------------------- FACEBOOK FETCHER ----------------------
async function fetchFacebookCount(url: string): Promise<number | null> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const html = await response.text();

    const metaMatch = html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i) ||
                       html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) ||
                       html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i);

    if (metaMatch && metaMatch[1]) {
      const desc = metaMatch[1];
      const likesMatch = desc.match(/([0-9.,kKmM]+)\s*(?:likes|คนถูกใจสิ่งนี้|likes\.)/i) ||
                         desc.match(/([0-9.,kKmM]+)\s*(?:followers|ผู้ติดตาม)/i);
      if (likesMatch && likesMatch[1]) return parseSocialNumber(likesMatch[1]);
    }
  } catch (_) {}

  return null;
}
