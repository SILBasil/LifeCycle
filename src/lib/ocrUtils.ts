import { createWorker } from 'tesseract.js';

export interface OCRResult {
  detectedNumber: number | null;
  rawText: string;
  candidateNumbers: { text: string; value: number; label: string }[];
}

// ฟังก์ชันแปลงข้อความตัวเลขที่มี k, m, ล้าน หรือเครื่องหมายจุลภาค
export function parseOCRNumber(text: string): number | null {
  if (!text) return null;
  let clean = text.replace(/,/g, '').trim().toLowerCase();
  
  // แปลงตัวอักษรที่ OCR อาจจะอ่านผิดบ่อย (เช่น O/o เป็น 0, I/l เป็น 1)
  clean = clean.replace(/\s+/g, '');
  
  if (clean.includes('ล้าน') || clean.endsWith('m')) {
    const num = parseFloat(clean.replace('ล้าน', '').replace('m', ''));
    return isNaN(num) ? null : Math.round(num * 1000000);
  }
  if (clean.includes('พัน') || clean.endsWith('k')) {
    const num = parseFloat(clean.replace('พัน', '').replace('k', ''));
    return isNaN(num) ? null : Math.round(num * 1000);
  }
  
  const num = parseFloat(clean);
  return isNaN(num) ? null : Math.round(num);
}

/**
 * สแกนภาพแคปหน้าจอเพื่อตรวจหายอดผู้ติดตาม หรือยอดไลค์
 * @param imageSource File, Blob, URL หรือ Data URL
 * @param onProgress Callback รายงานเปอร์เซ็นต์ความคืบหน้า (0-100)
 */
export async function recognizeCountFromImage(
  imageSource: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  let worker;
  try {
    onProgress?.(10, 'กำลังโหลดโมเดลอ่านภาพ...');
    worker = await createWorker(['eng', 'tha']);

    onProgress?.(40, 'กำลังประมวลผลและอ่านข้อความในรูปภาพ...');
    const result = await worker.recognize(imageSource);
    const text = result.data.text;

    onProgress?.(80, 'กำลังวิเคราะห์ตัวเลขยอด...');
    await worker.terminate();

    const candidates: { text: string; value: number; label: string }[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // รูปแบบ RegEx สำหรับค้นหาตัวเลขยอด
    const pattern = /([0-9.,]+(?:\s*[kKmM]|พัน|ล้าน)?)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.match(pattern);
      if (matches) {
        for (const m of matches) {
          const val = parseOCRNumber(m);
          if (val !== null && val > 0 && val < 1000000000) {
            let label = line;
            if (label.length > 30) label = label.slice(0, 30) + '...';
            candidates.push({
              text: m,
              value: val,
              label
            });
          }
        }
      }
    }

    // จัดลำดับความน่าจะเป็น: หาตัวเลขที่มีคำว่า followers, ผู้ติดตาม, ถูกใจ, likes อยู่ใกล้ๆ
    let bestMatch: number | null = null;
    
    // ค้นหาคำสำคัญในข้อความทั้งหมด
    const fullText = text.toLowerCase();
    const followMatch = fullText.match(/([0-9.,]+[km]?)\s*(?:followers|ผู้ติดตาม|following|subscribers)/i) ||
                        fullText.match(/(?:followers|ผู้ติดตาม|following)\s*([0-9.,]+[km]?)/i);
    if (followMatch) {
      bestMatch = parseOCRNumber(followMatch[1]);
    }

    const likeMatch = fullText.match(/([0-9.,]+[km]?)\s*(?:likes|ถูกใจ|views|รับชม)/i) ||
                      fullText.match(/(?:likes|ถูกใจ|views)\s*([0-9.,]+[km]?)/i);
    if (!bestMatch && likeMatch) {
      bestMatch = parseOCRNumber(likeMatch[1]);
    }

    // หากยังไม่เจอตัวเลขที่ผูกกับคำสำคัญ ให้เลือกตัวเลขแรกที่ดูสมเหตุสมผล
    if (!bestMatch && candidates.length > 0) {
      bestMatch = candidates[0].value;
    }

    onProgress?.(100, 'ประมวลผลเสร็จสิ้น');

    return {
      detectedNumber: bestMatch,
      rawText: text,
      candidateNumbers: candidates
    };
  } catch (err: any) {
    if (worker) {
      try { await worker.terminate(); } catch (_) {}
    }
    console.error('OCR error:', err);
    throw new Error(err.message || 'เกิดข้อผิดพลาดในการอ่านภาพ');
  }
}
