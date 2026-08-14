document.addEventListener('DOMContentLoaded', () => {
  updateStatus();

  // Instagram Event Listeners
  document.getElementById('btn-save-ig').addEventListener('click', () => {
    chrome.cookies.getAll({ url: 'https://www.instagram.com' }, (cookies) => {
      if (cookies && cookies.length > 0) {
        const essentialCookies = cookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          expirationDate: c.expirationDate
        }));

        chrome.storage.local.set({ ig_cookies: essentialCookies }, () => {
          const hasSession = essentialCookies.some(c => c.name === 'sessionid');
          if (hasSession) {
            alert(`บันทึกเซสชัน Instagram สำเร็จ (${essentialCookies.length} คุกกี้)!`);
          } else {
            alert(`บันทึกคุกกี้สำเร็จ (${essentialCookies.length} ชิ้น)\n\n⚠️ คำเตือน: ตรวจไม่พบเซสชันการล็อกอิน (sessionid) กรุณาตรวจสอบว่าได้ทำการล็อกอิน Instagram ในเบราว์เซอร์นี้แล้ว เพื่อให้ไม่เกิดการบล็อคดึงข้อมูล`);
          }
          updateStatus();
        });
      } else {
        alert('ไม่พบข้อมูลคุกกี้ Instagram กรุณาเปิดเว็บ Instagram ในเบราว์เซอร์นี้ก่อนกดบันทึก');
      }
    });
  });

  document.getElementById('btn-clear-ig').addEventListener('click', () => {
    chrome.storage.local.remove('ig_cookies', () => {
      alert('ล้างเซสชัน Instagram เรียบร้อยแล้ว');
      updateStatus();
    });
  });

  // TikTok Event Listeners
  document.getElementById('btn-save-tiktok').addEventListener('click', () => {
    chrome.cookies.getAll({ url: 'https://www.tiktok.com' }, (cookies) => {
      if (cookies && cookies.length > 0) {
        const essentialCookies = cookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          expirationDate: c.expirationDate
        }));

        chrome.storage.local.set({ tiktok_cookies: essentialCookies }, () => {
          const hasSession = essentialCookies.some(c => c.name === 'sessionid' || c.name === 'sessionid_ss');
          if (hasSession) {
            alert(`บันทึกเซสชัน TikTok สำเร็จ (${essentialCookies.length} คุกกี้)!`);
          } else {
            alert(`บันทึกคุกกี้สำเร็จ (${essentialCookies.length} ชิ้น)\n\n⚠️ คำเตือน: ตรวจไม่พบเซสชันการล็อกอิน (sessionid) กรุณาตรวจสอบว่าได้ทำการล็อกอิน TikTok ในเบราว์เซอร์นี้แล้ว เพื่อไม่ให้ระบบความปลอดภัยของ TikTok บล็อกยอด`);
          }
          updateStatus();
        });
      } else {
        alert('ไม่พบข้อมูลคุกกี้ TikTok กรุณาเปิดเว็บ TikTok ในเบราว์เซอร์นี้ก่อนกดบันทึก');
      }
    });
  });

  document.getElementById('btn-clear-tiktok').addEventListener('click', () => {
    chrome.storage.local.remove('tiktok_cookies', () => {
      alert('ล้างเซสชัน TikTok เรียบร้อยแล้ว');
      updateStatus();
    });
  });

  // Facebook Event Listeners
  document.getElementById('btn-save-fb').addEventListener('click', () => {
    chrome.cookies.getAll({ url: 'https://www.facebook.com' }, (cookies) => {
      if (cookies && cookies.length > 0) {
        const essentialCookies = cookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          expirationDate: c.expirationDate
        }));

        chrome.storage.local.set({ fb_cookies: essentialCookies }, () => {
          const hasSession = essentialCookies.some(c => c.name === 'c_user' || c.name === 'xs');
          if (hasSession) {
            alert(`บันทึกเซสชัน Facebook สำเร็จ (${essentialCookies.length} คุกกี้)!`);
          } else {
            alert(`บันทึกคุกกี้สำเร็จ (${essentialCookies.length} ชิ้น)\n\n⚠️ คำเตือน: ตรวจไม่พบเซสชันการล็อกอิน (c_user) กรุณาตรวจสอบว่าได้ทำการล็อกอิน Facebook ในเบราว์เซอร์นี้แล้ว เพื่อไม่ให้หน้าเว็บบล็อกข้อมูล`);
          }
          updateStatus();
        });
      } else {
        alert('ไม่พบข้อมูลคุกกี้ Facebook กรุณาเปิดเว็บ Facebook ในเบราว์เซอร์นี้ก่อนกดบันทึก');
      }
    });
  });

  document.getElementById('btn-clear-fb').addEventListener('click', () => {
    chrome.storage.local.remove('fb_cookies', () => {
      alert('ล้างเซสชัน Facebook เรียบร้อยแล้ว');
      updateStatus();
    });
  });
});

function updateStatus() {
  chrome.storage.local.get(['ig_cookies', 'tiktok_cookies', 'fb_cookies'], (data) => {
    // Instagram Status
    const igStatus = document.getElementById('ig-status');
    if (data.ig_cookies && data.ig_cookies.length > 0) {
      const isLoggedIn = data.ig_cookies.some(c => c.name === 'sessionid');
      igStatus.textContent = isLoggedIn ? 'มีเซสชันบันทึกไว้' : 'เซสชัน Guest (ยังไม่ล็อกอิน)';
      igStatus.className = isLoggedIn ? 'status active' : 'status empty';
    } else {
      igStatus.textContent = 'ไม่มีข้อมูล';
      igStatus.className = 'status empty';
    }

    // TikTok Status
    const tiktokStatus = document.getElementById('tiktok-status');
    if (data.tiktok_cookies && data.tiktok_cookies.length > 0) {
      const isLoggedIn = data.tiktok_cookies.some(c => c.name === 'sessionid' || c.name === 'sessionid_ss');
      tiktokStatus.textContent = isLoggedIn ? 'มีเซสชันบันทึกไว้' : 'เซสชัน Guest (ยังไม่ล็อกอิน)';
      tiktokStatus.className = isLoggedIn ? 'status active' : 'status empty';
    } else {
      tiktokStatus.textContent = 'ไม่มีข้อมูล';
      tiktokStatus.className = 'status empty';
    }

    // Facebook Status
    const fbStatus = document.getElementById('fb-status');
    if (data.fb_cookies && data.fb_cookies.length > 0) {
      const isLoggedIn = data.fb_cookies.some(c => c.name === 'c_user' || c.name === 'xs');
      fbStatus.textContent = isLoggedIn ? 'มีเซสชันบันทึกไว้' : 'เซสชัน Guest (ยังไม่ล็อกอิน)';
      fbStatus.className = isLoggedIn ? 'status active' : 'status empty';
    } else {
      fbStatus.textContent = 'ไม่มีข้อมูล';
      fbStatus.className = 'status empty';
    }
  });
}
