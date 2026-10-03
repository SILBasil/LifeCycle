// ==========================================
// 💻 Dev / Programming job details (Web, Dashboard, Database, API ...)
// Stored inside `freelance_jobs.notes` as a [DEVINFO]{json}[/DEVINFO] block
// (same approach as [MULTILINKS]) so no database migration is required.
// ==========================================

export interface DevMilestone {
  id: string;
  title: string;
  amount: number;   // มูลค่างวดนี้ (บาท)
  done: boolean;    // ส่งมอบงานงวดนี้แล้ว
  paid: boolean;    // ได้รับเงินงวดนี้แล้ว
}

export type DevPricingModel = 'fixed' | 'hourly' | 'retainer';

export interface DevJobInfo {
  pricingModel: DevPricingModel;
  hours: number;          // ชั่วโมงที่ประเมิน (กรณีคิดรายชั่วโมง)
  hourlyRate: number;     // เรทต่อชั่วโมง
  techStack: string[];    // เทคโนโลยีที่ใช้
  scope: string;          // ขอบเขตงาน / Requirement หลัก
  outOfScope: string;     // สิ่งที่ไม่รวมในราคา
  dueDate: string;        // กำหนดส่ง (Deadline) yyyy-mm-dd
  milestones: DevMilestone[];
  paidAmount: number;     // รับเงินแล้ว (ใช้เมื่อไม่ได้แบ่งงวด)
  revisionsIncluded: number;
  revisionsUsed: number;
  warrantyDays: number;   // ระยะประกัน / ดูแลหลังส่งมอบ
  hostingBy: 'client' | 'me' | 'none';
  repoUrl: string;
  stagingUrl: string;
  productionUrl: string;
  docsUrl: string;        // Figma / Requirement doc / TOR
  clientContact: string;  // อีเมล / เบอร์ / LINE ID
  handover: Record<string, boolean>;
}

export const DEV_PROJECT_TYPES = [
  '🌐 เว็บไซต์ (Landing / Company)',
  '🧩 Web Application',
  '📊 Dashboard / Report',
  '🗄️ ฐานข้อมูล (ออกแบบ / ย้ายข้อมูล)',
  '🔌 API / Backend',
  '🤖 Automation / Script / Bot',
  '📱 Mobile App',
  '🛠️ แก้บั๊ก / ดูแลระบบ (MA)',
  '🎨 UI/UX / ดีไซน์',
];

export const DEV_TECH_PRESETS = [
  'React', 'Next.js', 'Vue', 'Tailwind', 'Node.js', 'Express', 'Python',
  'Django/FastAPI', 'PHP/Laravel', 'PostgreSQL', 'MySQL', 'MongoDB',
  'Supabase', 'Firebase', 'Power BI', 'Looker Studio', 'Google Sheets / Apps Script',
  'WordPress', 'Docker', 'Vercel',
];

export const DEV_HANDOVER_ITEMS: { key: string; label: string }[] = [
  { key: 'source', label: 'ส่ง Source Code / Repo' },
  { key: 'deploy', label: 'Deploy ขึ้นระบบจริง' },
  { key: 'credentials', label: 'ส่งรหัส / .env / บัญชีต่างๆ' },
  { key: 'docs', label: 'เอกสาร / คู่มือการใช้งาน' },
  { key: 'training', label: 'สอนใช้งาน / ส่งมอบลูกค้า' },
  { key: 'accepted', label: 'ลูกค้าตรวจรับงานแล้ว' },
];

export const createEmptyDevInfo = (): DevJobInfo => ({
  pricingModel: 'fixed',
  hours: 0,
  hourlyRate: 0,
  techStack: [],
  scope: '',
  outOfScope: '',
  dueDate: '',
  milestones: [],
  paidAmount: 0,
  revisionsIncluded: 2,
  revisionsUsed: 0,
  warrantyDays: 30,
  hostingBy: 'client',
  repoUrl: '',
  stagingUrl: '',
  productionUrl: '',
  docsUrl: '',
  clientContact: '',
  handover: {},
});

const DEVINFO_REGEX = /\[DEVINFO\]([\s\S]*?)\[\/DEVINFO\]/;
const DEVINFO_REGEX_G = /\[DEVINFO\][\s\S]*?\[\/DEVINFO\]/g;
const MULTILINKS_REGEX_G = /\[MULTILINKS\][\s\S]*?\[\/MULTILINKS\]/g;

export function parseDevInfo(notes: string | null | undefined): DevJobInfo | null {
  if (!notes) return null;
  const match = notes.match(DEVINFO_REGEX);
  if (!match || !match[1]) return null;
  try {
    return { ...createEmptyDevInfo(), ...JSON.parse(match[1]) };
  } catch (_) {
    return null;
  }
}

/** Remove all machine-readable blocks, leaving only the human notes. */
export function stripMetaBlocks(notes: string | null | undefined): string {
  return (notes || '').replace(DEVINFO_REGEX_G, '').replace(MULTILINKS_REGEX_G, '').trim();
}

export function serializeDevInfo(notesWithoutDevInfo: string, info: DevJobInfo): string {
  const base = (notesWithoutDevInfo || '').replace(DEVINFO_REGEX_G, '').trim();
  return `${base}\n\n[DEVINFO]${JSON.stringify(info)}[/DEVINFO]`.trim();
}

/** Progress (%) computed from milestones; null when there are no milestones. */
export function getMilestoneProgress(info: DevJobInfo): number | null {
  const ms = info.milestones || [];
  if (ms.length === 0) return null;
  const totalAmount = ms.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  if (totalAmount > 0) {
    const doneAmount = ms.filter(m => m.done).reduce((s, m) => s + (Number(m.amount) || 0), 0);
    return Math.round((doneAmount / totalAmount) * 100);
  }
  return Math.round((ms.filter(m => m.done).length / ms.length) * 100);
}

/** Money received so far: sum of paid milestones, or manual paidAmount. */
export function getPaidAmount(info: DevJobInfo): number {
  const ms = info.milestones || [];
  if (ms.length > 0 && ms.some(m => Number(m.amount) > 0)) {
    return ms.filter(m => m.paid).reduce((s, m) => s + (Number(m.amount) || 0), 0);
  }
  return Number(info.paidAmount) || 0;
}

/** Days until deadline (negative = overdue); null if no deadline. */
export function getDaysUntilDue(dueDate: string): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate + 'T23:59:59').getTime();
  if (isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / (24 * 60 * 60 * 1000));
}

/** Validation messages for the dev form (empty array = OK). */
export function validateDevInfo(
  info: DevJobInfo,
  opts: { projectType: string; price: number; startDate: string; status: string }
): string[] {
  const errors: string[] = [];
  if (!opts.projectType.trim()) errors.push('กรุณาเลือก/ระบุประเภทโปรเจกต์');
  if (!info.scope.trim()) errors.push('กรุณาระบุขอบเขตงาน (Scope) อย่างน้อยสั้นๆ เพื่อกันงานงอก');
  if (!opts.price || opts.price <= 0) errors.push('กรุณาระบุราคางาน (รายได้) ที่ตกลงกับลูกค้า');
  if (info.dueDate && opts.startDate && info.dueDate < opts.startDate) {
    errors.push('กำหนดส่งต้องไม่ก่อนวันที่เริ่มงาน');
  }
  const msTotal = (info.milestones || []).reduce((s, m) => s + (Number(m.amount) || 0), 0);
  if (msTotal > 0 && opts.price > 0 && msTotal !== opts.price) {
    errors.push(`ยอดรวมงวดเงิน (${msTotal.toLocaleString()}) ไม่เท่ากับราคางาน (${opts.price.toLocaleString()})`);
  }
  if ((info.milestones || []).some(m => !m.title.trim())) {
    errors.push('มีงวดงานที่ยังไม่ได้ตั้งชื่อ');
  }
  if (getPaidAmount(info) > opts.price && opts.price > 0) {
    errors.push('ยอดรับเงินแล้วมากกว่าราคางาน');
  }
  return errors;
}
