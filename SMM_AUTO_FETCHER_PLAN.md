# 📘 แผนงานการพัฒนาระบบดึงยอดผู้ติดตามอัตโนมัติ (SMM Auto-Fetcher Extension)

เอกสารนี้จัดทำขึ้นเพื่อบันทึกโครงสร้าง สถาปัตยกรรม และขั้นตอนการติดตั้งระบบดึงยอดผู้ติดตาม Instagram และ TikTok อัตโนมัติด้วย Chrome Extension เพื่อรองรับการพัฒนาต่อในอนาคต

---

## 🏗️ แผนภาพสถาปัตยกรรม (Architecture Overview)

```
[หน้าเว็บ React / LifeCycle] 
        │  (1) ส่ง Event "SMM_FETCH_REQUEST" พร้อม Profile URL 
        ▼
[Content Script (content.js)] - ทำหน้าที่เป็นสะพานเชื่อม
        │  (2) ส่งต่อข้อความผ่าน chrome.runtime.sendMessage
        ▼
[Service Worker (background.js)] - รันเบื้องหลังเบราว์เซอร์
        │  (3) ทำการ Fetch หน้าเว็บโปรไฟล์ (Instagram/TikTok) ด้วย IP & คุกกี้จริงของคุณ
        ▼
[Instagram / TikTok Profiles]
        │  (4) ตอบกลับด้วย HTML โค้ดหน้าเว็บ
        ▼
[Service Worker (background.js)]
        │  (5) ใช้ Regular Expression (RegEx) แกะจำนวนผู้ติดตาม
        │  (6) ส่งค่ากลับผ่าน Content Script -> หน้าเว็บ React
        ▼
[หน้าเว็บ React] ➔ อัปเดตข้อมูลลงฐานข้อมูล Supabase อัตโนมัติ
```

---

## 📁 ไฟล์ของ Chrome Extension (สามารถนำไปบันทึกใส่โฟลเดอร์แยก เช่น `smm-extension`)

เมื่อต้องการเริ่มทำ ให้สร้างโฟลเดอร์ชื่อ `smm-extension` ไว้ในโปรเจกต์นี้ และสร้างไฟล์ทั้ง 3 ไฟล์ดังนี้:

### 1. `manifest.json` (ไฟล์ตั้งค่าสิทธิ์ของ Extension)
```json
{
  "manifest_version": 3,
  "name": "LifeCycle SMM Auto-Fetcher",
  "version": "1.0",
  "description": "ดึงยอดผู้ติดตาม Instagram และ TikTok อัตโนมัติสำหรับระบบ LifeCycle",
  "permissions": [
    "activeTab"
  ],
  "host_permissions": [
    "https://www.instagram.com/*",
    "https://*.instagram.com/*",
    "https://www.tiktok.com/*",
    "https://*.tiktok.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["http://localhost/*", "http://127.0.0.1/*", "https://*.supabase.co/*"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ]
}
```

### 2. `content.js` (ไฟล์เชื่อมต่อกับหน้าเว็บ React)
```javascript
// รับ Event ส่งมาจากหน้าเว็บ React
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.type === "SMM_EXTENSION_REQUEST") {
    const { url } = event.data;
    
    // ส่งข้อมูลไปให้ background.js ยิงดึงข้อมูลเบื้องหลัง
    chrome.runtime.sendMessage({ action: "fetchFollowers", url }, (response) => {
      // ส่งข้อมูลยอดที่ได้กลับไปหาหน้าเว็บ React
      window.postMessage({
        type: "SMM_EXTENSION_RESPONSE",
        url: url,
        count: response?.count || null,
        error: response?.error || null
      }, "*");
    });
  }
});
```

### 3. `background.js` (ไฟล์ยิงดึงยอดและแกะข้อมูล)
```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchFollowers") {
    fetchFollowerCount(message.url)
      .then(count => sendResponse({ count }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // บอก chrome ว่าจะตอบกลับแบบ asynchronous
  }
});

async function fetchFollowerCount(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  
  if (!response.ok) throw new Error("ไม่สามารถเชื่อมต่อกับหน้าเว็บได้");
  const html = await response.text();

  if (url.includes("instagram.com")) {
    // 📸 แกะยอดของ Instagram จากแท็ก <meta name="description">
    const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
    if (metaMatch && metaMatch[1]) {
      const desc = metaMatch[1]; // เช่น "10k Followers, 500 Following..."
      const followersMatch = desc.match(/([0-9.,kKmM]+)\s*Followers/i);
      if (followersMatch) {
        return parseFollowerNumber(followersMatch[1]);
      }
    }
    throw new Error("หาแท็กยอดผู้ติดตามของ Instagram ไม่พบ");
  } 
  else if (url.includes("tiktok.com")) {
    // 🎵 แกะยอดของ TikTok จาก JSON script ในหน้าเว็บ
    const jsonMatch = html.match(/"followerCount":\s*(\d+)/i);
    if (jsonMatch && jsonMatch[1]) {
      return parseInt(jsonMatch[1], 10);
    }
    throw new Error("หาค่า followerCount ของ TikTok ไม่พบ");
  }

  throw new Error("ไม่รองรับแพลตฟอร์มนี้");
}

// ฟังก์ชันแปลงหน่วยอักษรย่อ k, m เป็นตัวเลขจริง
function parseFollowerNumber(str) {
  let cleanStr = str.replace(/,/g, "").trim().toLowerCase();
  let multiplier = 1;
  
  if (cleanStr.endsWith("k")) {
    multiplier = 1000;
    cleanStr = cleanStr.slice(0, -1);
  } else if (cleanStr.endsWith("m")) {
    multiplier = 1000000;
    cleanStr = cleanStr.slice(0, -1);
  }
  
  return Math.round(parseFloat(cleanStr) * multiplier);
}
```

---

## 💻 วิธีการติดตั้ง Extension บนเบราว์เซอร์ Chrome

1. เปิดเบราว์เซอร์ Google Chrome ไปที่ลิงก์ `chrome://extensions/`
2. เปิดโหมดนักพัฒนาซอฟต์แวร์ (**Developer mode**) ที่มุมขวาบนของหน้าจอ
3. คลิกปุ่ม **Load unpacked** (โหลดส่วนขยายที่คลายซิปแล้ว) ที่มุมซ้ายบน
4. เลือกโฟลเดอร์ `smm-extension` ที่เราได้สร้างไว้
5. เรียบร้อย! Extension จะเปิดทำงานและเชื่อมต่อกับเว็บที่รันจาก localhost ของเราอัตโนมัติ

---

## 🔄 โค้ดฝั่งเว็บ React (เมื่อพร้อมใช้งาน)

ฝั่งเว็บ `TasksView.tsx` จะมีปุ่มสั่งการทำงานของบอต โดยสามารถเขียนฟังก์ชันเชื่อมโยงได้แบบนี้:

```typescript
const handleAutoFetchCount = (jobId: string, profileUrl: string) => {
  if (!profileUrl) return;

  // 1. ตั้ง Event Listener รอรับคำตอบจาก Extension
  const onResponse = (event: MessageEvent) => {
    if (event.data && event.data.type === "SMM_EXTENSION_RESPONSE" && event.data.url === profileUrl) {
      window.removeEventListener("message", onResponse);
      
      if (event.data.error) {
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + event.data.error);
        return;
      }

      const freshCount = event.data.count;
      if (freshCount !== null && freshCount !== undefined) {
        // 2. เรียกใช้ฟังก์ชันอัปเดตยอดลงฐานข้อมูล Supabase ที่มีอยู่แล้ว
        handleUpdateCurrentCount(jobId, freshCount);
        alert(`ดึงยอดผู้ติดตามปัจจุบันสำเร็จ: ${freshCount.toLocaleString()} คน!`);
      }
    }
  };

  window.addEventListener("message", onResponse);

  // 2. ส่งคำสั่งให้ Extension ดึงยอด
  window.postMessage({ type: "SMM_EXTENSION_REQUEST", url: profileUrl }, "*");
};
```
