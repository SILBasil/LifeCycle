chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchFollowers") {
    fetchFollowerCount(message.url)
      .then(count => sendResponse({ count }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // บอก chrome ว่าจะตอบกลับแบบ asynchronous
  }
});

async function restoreSession(platform) {
  return new Promise((resolve) => {
    let key;
    if (platform === 'instagram') key = 'ig_cookies';
    else if (platform === 'tiktok') key = 'tiktok_cookies';
    else if (platform === 'facebook') key = 'fb_cookies';
    
    chrome.storage.local.get([key], async (data) => {
      const cookies = data[key];
      if (cookies && cookies.length > 0) {
        const promises = cookies.map(cookie => {
          let cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
          
          if (platform === 'instagram' && !cleanDomain.includes('instagram.com')) cleanDomain = 'instagram.com';
          if (platform === 'tiktok' && !cleanDomain.includes('tiktok.com')) cleanDomain = 'tiktok.com';
          if (platform === 'facebook' && !cleanDomain.includes('facebook.com')) cleanDomain = 'facebook.com';

          const url = `https://www.${cleanDomain}${cookie.path}`;
          
          const details = {
            url: url,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly
          };

          if (cookie.expirationDate !== undefined && cookie.expirationDate !== null) {
            details.expirationDate = Math.floor(cookie.expirationDate);
          }
          
          return new Promise((res) => {
            chrome.cookies.set(details, () => {
              if (chrome.runtime.lastError) {
                console.warn(`[Restore] เซ็ตคุกกี้ ${cookie.name} ไม่สำเร็จ: `, chrome.runtime.lastError.message);
              }
              res();
            });
          });
        });
        await Promise.all(promises);
        console.log(`[Restore] กู้คืนคุกกี้เซสชันของ ${platform} สำเร็จ (${cookies.length} ชิ้น)`);
      } else {
        console.log(`[Restore] ไม่มีคุกกี้ของ ${platform} บันทึกไว้ใน storage`);
      }
      resolve();
    });
  });
}

async function fetchFollowerCount(url) {
  console.log(`[Fetcher] เริ่มการดึงข้อมูลผ่านระบบเปิดแท็บ URL: ${url}`);
  
  let platform = '';
  if (url.includes("instagram.com")) platform = 'instagram';
  else if (url.includes("tiktok.com")) platform = 'tiktok';
  else if (url.includes("facebook.com")) platform = 'facebook';

  if (!platform) {
    throw new Error("ไม่รองรับแพลตฟอร์มนี้");
  }

  // 1. กู้คืนคุกกี้เซสชันของแพลตฟอร์มนั้นๆ เพื่อให้มีคุกกี้ล็อกอินที่ใช้งานได้ในเบราว์เซอร์
  await restoreSession(platform);

  // 2. เรียกใช้ระบบจำลองเปิดแท็บเพื่อแกะ DOM
  try {
    const rawResult = await fetchViaTab(url, platform);
    if (rawResult) {
      return parseFollowerNumber(rawResult);
    }
    throw new Error(`ไม่สามารถแกะยอดผู้ติดตามของ ${platform} ได้`);
  } catch (e) {
    throw e;
  }
}

async function fetchViaTab(url, platform) {
  return new Promise((resolve, reject) => {
    // เปิดแท็บใหม่ในด้านหน้า (active: true เพื่อหลีกเลี่ยงการโดนเบราว์เซอร์พักการทำงานแท็บเบื้องหลัง)
    chrome.tabs.create({ url: url, active: true }, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error("ไม่สามารถเปิดแท็บเบราว์เซอร์ได้: " + chrome.runtime.lastError.message));
        return;
      }
      
      const tabId = tab.id;
      let isResolved = false;

      // สคริปต์แบบ Asynchronous ที่จะดักรออ่าน DOM ในเบราว์เซอร์จริง
      const scrapeDom = async (platformName) => {
        return new Promise((resolveScrape) => {
          let attempts = 0;
          const maxAttempts = 30; // 30 ครั้ง * 250ms = 7.5 วินาที

          const check = () => {
            attempts++;

            // 1. ดักดึงค่าจาก DOM Element โดยตรง
            if (platformName === 'tiktok') {
              const followersEl = document.querySelector('[data-e2e="followers-count"]');
              if (followersEl && followersEl.textContent && followersEl.textContent.trim() !== "") {
                resolveScrape(followersEl.textContent.trim());
                return;
              }
            }

            // 2. ดักดึงจาก Meta Description
            const metaEl = document.querySelector('meta[name="description"]') || 
                           document.querySelector('meta[property="og:description"]');
            if (metaEl) {
              const desc = metaEl.getAttribute('content');
              if (desc && desc.trim() !== "") {
                if (platformName === 'instagram') {
                  let followersMatch = desc.match(/([0-9.,kKmM]+)\s*Followers/i) || 
                                       desc.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
                  if (followersMatch) {
                    resolveScrape(followersMatch[1]);
                    return;
                  }
                }
                else if (platformName === 'facebook') {
                  let followersMatch = desc.match(/([0-9.,kKmM]+)\s*followers/i) || 
                                       desc.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
                  if (followersMatch) {
                    resolveScrape(followersMatch[1]);
                    return;
                  }
                }
                else if (platformName === 'tiktok') {
                  let followersMatch = desc.match(/([0-9.,kKmM]+)\s*Followers/i) || 
                                       desc.match(/ผู้ติดตาม\s*([0-9.,kKmM]+)\s*คน/i);
                  if (followersMatch) {
                    resolveScrape(followersMatch[1]);
                    return;
                  }
                }
              }
            }

            // 3. ดักดึงผ่านข้อมูล JSON ดิบในสคริปต์เพจ (Fallback)
            const html = document.documentElement.outerHTML;
            if (platformName === 'instagram') {
              const followedMatch = html.match(/"edge_followed_by":\s*\{\s*"count":\s*(\d+)\}/i);
              if (followedMatch && followedMatch[1]) {
                resolveScrape(followedMatch[1]);
                return;
              }
            } 
            else if (platformName === 'tiktok') {
              const jsonMatch = html.match(/"followerCount":\s*(\d+)/i);
              if (jsonMatch && jsonMatch[1]) {
                resolveScrape(jsonMatch[1]);
                return;
              }
            }
            else if (platformName === 'facebook') {
              const jsonMatch = html.match(/"page_followers":\s*(\d+)/i);
              if (jsonMatch && jsonMatch[1]) {
                resolveScrape(jsonMatch[1]);
                return;
              }
            }

            // หากครบจำนวนครั้งที่กำหนดแล้วยังไม่เจอยอดผู้ติดตาม
            if (attempts >= maxAttempts) {
              resolveScrape(null);
              return;
            }

            // วนกลับมาเช็คใหม่ทุกๆ 250ms
            setTimeout(check, 250);
          };

          check();
        });
      };

      const checkTabAndScrape = (tabIdToInspect, changeInfo) => {
        if (changeInfo && changeInfo.status === 'complete') {
          chrome.tabs.get(tabIdToInspect, (currentTab) => {
            if (chrome.runtime.lastError || !currentTab) return;
            
            // ป้องกันการรันสคริปต์ลงหน้าว่างเริ่มต้น (เช่น about:blank หรือ chrome://newtab/)
            const currentUrl = currentTab.url || "";
            if (!currentUrl.includes("instagram.com") && 
                !currentUrl.includes("tiktok.com") && 
                !currentUrl.includes("facebook.com")) {
              console.log(`[Fetcher] ข้ามสแกนเพราะเป็น URL ว่างเริ่มต้น: ${currentUrl}`);
              return;
            }

            console.log(`[Fetcher] เริ่มสแกนเพจบน URL จริง: ${currentUrl}`);

            // ให้หน่วงเวลาเพียง 300ms แล้วเริ่มให้สคริปต์ตรวจเช็ค DOM แบบวนซ้ำในหน้าเว็บจริงทันที
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tabIdToInspect },
                func: scrapeDom,
                args: [platform]
              }, (results) => {
                // ปิดแท็บทันที
                chrome.tabs.remove(tabIdToInspect);
                chrome.tabs.onUpdated.removeListener(listener);

                if (isResolved) return;
                isResolved = true;

                if (chrome.runtime.lastError) {
                  reject(new Error("เกิดข้อผิดพลาดในการรันสคริปต์แกะ DOM: " + chrome.runtime.lastError.message));
                  return;
                }

                if (results && results[0] && results[0].result !== null && results[0].result !== undefined) {
                  resolve(results[0].result);
                } else {
                  reject(new Error(`หาแท็กยอดผู้ติดตามของ ${platform} ในหน้าเพจไม่พบ (รอโหลดจนครบเวลาแล้วยังไม่เรนเดอร์)`));
                }
              });
            }, 300);
          });
        }
      };

      const checkStateAndForce = () => {
        chrome.tabs.get(tabId, (currentTab) => {
          if (chrome.runtime.lastError) return;
          if (currentTab && currentTab.status === 'complete') {
            checkTabAndScrape(tabId, { status: 'complete' });
          }
        });
      };

      const listener = (id, changeInfo) => {
        if (id === tabId) {
          checkTabAndScrape(id, changeInfo);
        }
      };
      
      chrome.tabs.onUpdated.addListener(listener);

      // ทำการเช็คสถานะเบื้องต้นกรณีหน้าเพจโหลดเสร็จเร็วมาก
      checkStateAndForce();

      // ป้องกันกรณีเว็บค้าง ให้ตัดการทำงานภายใน 15 วินาที
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          chrome.tabs.remove(tabId);
          chrome.tabs.onUpdated.removeListener(listener);
          reject(new Error("หมดเวลาการดึงหน้าเว็บ (Timeout)"));
        }
      }, 15000);
    });
  });
}

function parseFollowerNumber(str) {
  if (typeof str === 'number') return str;
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
