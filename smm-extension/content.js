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
