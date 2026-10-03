import React, { useState } from 'react';
import { Plus, X, Code2, ClipboardList, Wallet, Link as LinkIcon, CheckSquare } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import {
  type DevJobInfo,
  type DevMilestone,
  DEV_PROJECT_TYPES,
  DEV_TECH_PRESETS,
  DEV_HANDOVER_ITEMS,
  getMilestoneProgress,
  getPaidAmount,
  getDaysUntilDue,
} from '../lib/devJobInfo';

interface DevJobFieldsProps {
  info: DevJobInfo;
  onChange: (info: DevJobInfo) => void;
  projectType: string;
  setProjectType: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  cost: string;
  setCost: (v: string) => void;
  progress: string;
  setProgress: (v: string) => void;
}

const inputCls = 'w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand placeholder:text-pencil-muted focus:outline-none focus:ring-2 focus:ring-indigo-300';
const labelCls = 'block text-xs font-bold mb-1 font-hand';
const sectionCls = 'p-3 bg-indigo-50/30 dark:bg-indigo-950/20 border border-dashed border-indigo-300 dark:border-indigo-800 rounded space-y-3';
const sectionTitleCls = 'text-xs font-extrabold font-hand text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5';

const CUSTOM_TYPE = '__custom__';

export const DevJobFields: React.FC<DevJobFieldsProps> = ({
  info, onChange, projectType, setProjectType, price, setPrice, cost, setCost, progress, setProgress,
}) => {
  const [techInput, setTechInput] = useState('');
  const isPresetType = DEV_PROJECT_TYPES.includes(projectType);
  const [customTypeMode, setCustomTypeMode] = useState(!!projectType && !isPresetType);

  const update = (patch: Partial<DevJobInfo>) => onChange({ ...info, ...patch });

  const priceNum = Number(price) || 0;
  const costNum = Number(cost) || 0;
  const estimatedProfit = priceNum - costNum;
  const milestoneProgress = getMilestoneProgress(info);
  const paid = getPaidAmount(info);
  const outstanding = Math.max(0, priceNum - paid);
  const msTotal = info.milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const hasMilestoneAmounts = info.milestones.some(m => Number(m.amount) > 0);
  const daysLeft = getDaysUntilDue(info.dueDate);

  // ---------- Tech stack ----------
  const addTech = (t: string) => {
    const v = t.trim();
    if (!v || info.techStack.includes(v)) return;
    update({ techStack: [...info.techStack, v] });
  };
  const removeTech = (t: string) => update({ techStack: info.techStack.filter(x => x !== t) });

  // ---------- Milestones ----------
  const setMilestones = (milestones: DevMilestone[]) => {
    const next = { ...info, milestones };
    onChange(next);
    const p = getMilestoneProgress(next);
    if (p !== null) setProgress(String(p));
  };
  const updateMilestone = (id: string, patch: Partial<DevMilestone>) =>
    setMilestones(info.milestones.map(m => (m.id === id ? { ...m, ...patch } : m)));
  const addMilestone = (title = '', amount = 0) =>
    setMilestones([
      ...info.milestones,
      { id: Math.random().toString(36).slice(2, 9), title, amount, done: false, paid: false },
    ]);
  const applyMilestoneTemplate = (split: number[], titles: string[]) => {
    if (info.milestones.length > 0 && !window.confirm('แทนที่งวดงานเดิมทั้งหมดด้วยเทมเพลตนี้?')) return;
    let remaining = priceNum;
    const ms = split.map((pct, i) => {
      const amt = i === split.length - 1 ? remaining : Math.round((priceNum * pct) / 100);
      remaining -= amt;
      return { id: Math.random().toString(36).slice(2, 9), title: titles[i], amount: priceNum > 0 ? amt : 0, done: false, paid: false };
    });
    setMilestones(ms);
  };

  // ---------- Hourly pricing ----------
  const updateHourly = (hours: number, rate: number) => {
    update({ hours, hourlyRate: rate });
    if (hours > 0 && rate > 0) setPrice(String(Math.round(hours * rate)));
  };

  return (
    <div className="space-y-4">
      {/* 1. ประเภทโปรเจกต์ & Tech Stack */}
      <div className={sectionCls}>
        <span className={sectionTitleCls}><Code2 className="w-3.5 h-3.5" /> ประเภทโปรเจกต์ & เทคโนโลยี</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>ประเภทโปรเจกต์: <span className="text-rose-500">*</span></label>
            <CustomSelect
              value={customTypeMode ? CUSTOM_TYPE : projectType}
              onChange={(v) => {
                if (v === CUSTOM_TYPE) {
                  setCustomTypeMode(true);
                  setProjectType('');
                } else {
                  setCustomTypeMode(false);
                  setProjectType(v);
                }
              }}
              placeholder="-- เลือกประเภทงาน --"
              options={[
                ...DEV_PROJECT_TYPES.map(t => ({ value: t, label: t })),
                { value: CUSTOM_TYPE, label: '✏️ อื่นๆ (พิมพ์เอง)' },
              ]}
            />
            {customTypeMode && (
              <input
                type="text"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="เช่น ระบบจองคิว, Chrome Extension"
                className={`${inputCls} mt-2`}
              />
            )}
          </div>
          <div>
            <label className={labelCls}>Tech Stack ที่ใช้:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTech(techInput);
                    setTechInput('');
                  }
                }}
                placeholder="พิมพ์แล้วกด Enter"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => { addTech(techInput); setTechInput(''); }}
                className="px-3 bg-paper border-2 border-pencil rounded-md hover:bg-indigo-50 shadow-sketch-sm"
                title="เพิ่ม"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {info.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {info.techStack.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-indigo-100 text-indigo-900 border border-pencil rounded text-[10px] font-hand font-bold flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => removeTech(t)} className="hover:text-rose-600"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {DEV_TECH_PRESETS.filter(t => !info.techStack.includes(t)).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => addTech(t)}
              className="px-2 py-0.5 bg-control/60 hover:bg-indigo-100 text-pencil text-[10px] font-hand rounded border border-neutral-300 transition-colors"
            >
              + {t}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ขอบเขตงาน & เงื่อนไข */}
      <div className={sectionCls}>
        <span className={sectionTitleCls}><ClipboardList className="w-3.5 h-3.5" /> ขอบเขตงาน & เงื่อนไข</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>ขอบเขตงาน / ฟีเจอร์ที่ต้องทำ (Scope): <span className="text-rose-500">*</span></label>
            <textarea
              value={info.scope}
              onChange={(e) => update({ scope: e.target.value })}
              rows={4}
              placeholder={'- หน้า Login / สมัครสมาชิก\n- Dashboard สรุปยอดขายรายวัน\n- Export Excel\n- รองรับมือถือ'}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>ไม่รวมในราคา (Out of scope):</label>
            <textarea
              value={info.outOfScope}
              onChange={(e) => update({ outOfScope: e.target.value })}
              rows={4}
              placeholder={'- ค่า Hosting / Domain\n- เนื้อหา รูปภาพ\n- ฟีเจอร์ที่เพิ่มภายหลัง (คิดแยก)'}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={labelCls}>กำหนดส่ง (Deadline):</label>
            <input
              type="date"
              value={info.dueDate}
              onChange={(e) => update({ dueDate: e.target.value })}
              className={inputCls}
            />
            {daysLeft !== null && (
              <span className={`text-[10px] font-hand font-bold ${daysLeft < 0 ? 'text-rose-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {daysLeft < 0 ? `⚠️ เลยกำหนด ${Math.abs(daysLeft)} วัน` : daysLeft === 0 ? '⏰ ครบกำหนดวันนี้' : `เหลือ ${daysLeft} วัน`}
              </span>
            )}
          </div>
          <div>
            <label className={labelCls}>แก้ไขฟรี (รอบ):</label>
            <input
              type="number"
              min="0"
              value={info.revisionsIncluded}
              onChange={(e) => update({ revisionsIncluded: Math.max(0, Number(e.target.value) || 0) })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>แก้ไปแล้ว (รอบ):</label>
            <input
              type="number"
              min="0"
              value={info.revisionsUsed}
              onChange={(e) => update({ revisionsUsed: Math.max(0, Number(e.target.value) || 0) })}
              className={`${inputCls} ${info.revisionsUsed > info.revisionsIncluded ? 'text-rose-600 font-extrabold' : ''}`}
            />
            {info.revisionsUsed > info.revisionsIncluded && (
              <span className="text-[10px] font-hand font-bold text-rose-600">เกินโควต้า ควรคิดค่าแก้เพิ่ม</span>
            )}
          </div>
          <div>
            <label className={labelCls}>ประกัน/ดูแลหลังส่ง (วัน):</label>
            <input
              type="number"
              min="0"
              value={info.warrantyDays}
              onChange={(e) => update({ warrantyDays: Math.max(0, Number(e.target.value) || 0) })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Hosting / Domain ใครดูแล:</label>
            <CustomSelect
              value={info.hostingBy}
              onChange={(v) => update({ hostingBy: v as DevJobInfo['hostingBy'] })}
              options={[
                { value: 'client', label: '👤 ลูกค้าจ่าย/ถือบัญชีเอง' },
                { value: 'me', label: '🧑‍💻 เราดูแลให้ (คิดรวมต้นทุน)' },
                { value: 'none', label: '➖ ไม่เกี่ยวข้อง' },
              ]}
            />
          </div>
          <div>
            <label className={labelCls}>ช่องทางติดต่อลูกค้า (อีเมล / เบอร์ / LINE):</label>
            <input
              type="text"
              value={info.clientContact}
              onChange={(e) => update({ clientContact: e.target.value })}
              placeholder="เช่น somchai@mail.com, 08x-xxx-xxxx"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* 3. ราคา & งวดงาน */}
      <div className={sectionCls}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={sectionTitleCls}><Wallet className="w-3.5 h-3.5" /> รูปแบบราคา & งวดชำระเงิน</span>
          <div className="flex gap-1 text-[10px] font-hand font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-400">รับแล้ว ฿{paid.toLocaleString()}</span>
            <span className={`px-2 py-0.5 rounded border ${outstanding > 0 ? 'bg-amber-100 text-amber-800 border-amber-400' : 'bg-neutral-100 text-neutral-600 border-neutral-300'}`}>ค้างรับ ฿{outstanding.toLocaleString()}</span>
          </div>
        </div>

        {/* Pricing inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>รูปแบบการคิดราคา:</label>
            <CustomSelect
              value={info.pricingModel}
              onChange={(v) => update({ pricingModel: v as DevJobInfo['pricingModel'] })}
              options={[
                { value: 'fixed', label: '📦 เหมาจ่ายทั้งโปรเจกต์' },
                { value: 'hourly', label: '⏱️ คิดรายชั่วโมง' },
                { value: 'retainer', label: '🔁 รายเดือน (MA / Retainer)' },
              ]}
            />
          </div>
          <div>
            <label className={labelCls}>ราคางานรวม (บาท): <span className="text-rose-500">*</span></label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="เช่น 15000"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>ต้นทุนโปรเจกต์ (ถ้ามี):</label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="เช่น ค่า Server / API / Theme"
              className={inputCls}
            />
          </div>
        </div>

        {/* Hourly helper if hourly model selected */}
        {info.pricingModel === 'hourly' && (
          <div className="p-2.5 bg-paper/60 rounded border border-indigo-200 dark:border-indigo-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ชั่วโมงที่ประเมิน (Hours):</label>
              <input type="number" min="0" value={info.hours || ''} onChange={(e) => updateHourly(Number(e.target.value) || 0, info.hourlyRate)} placeholder="เช่น 40" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>เรท (บาท/ชม.) → ปรับราคารวมให้อัตโนมัติ:</label>
              <input type="number" min="0" value={info.hourlyRate || ''} onChange={(e) => updateHourly(info.hours, Number(e.target.value) || 0)} placeholder="เช่น 500" className={inputCls} />
            </div>
          </div>
        )}

        {/* Live Financial Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-paper/80 rounded border border-neutral-300 dark:border-neutral-700 text-xs font-hand">
          <div className="flex items-center gap-3">
            <span>กำไรสุทธิคาดการณ์: <strong className={estimatedProfit >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-600'}>฿{estimatedProfit.toLocaleString()}</strong></span>
            <span className="text-pencil-muted">|</span>
            <span>รับเงินแล้ว: <strong className="text-emerald-700">฿{paid.toLocaleString()}</strong></span>
            {outstanding > 0 && (
              <>
                <span className="text-pencil-muted">|</span>
                <span>ค้างรับ: <strong className="text-amber-700">฿{outstanding.toLocaleString()}</strong></span>
              </>
            )}
          </div>
          {!hasMilestoneAmounts && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold">บันทึกรับเงินแล้ว (มัดจำ/บางส่วน):</span>
              <input
                type="number"
                min="0"
                value={info.paidAmount || ''}
                onChange={(e) => update({ paidAmount: Math.max(0, Number(e.target.value) || 0) })}
                placeholder="฿ 0"
                className="w-24 p-1 text-right bg-transparent border border-pencil rounded text-xs font-hand font-bold"
              />
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold font-hand text-pencil">งวดงาน / Milestones ({info.milestones.length})</span>
              <span className="text-[10px] text-pencil-muted font-hand ml-1.5">(ระบบจะคำนวณ % ความคืบหน้าและยอดรับเงินให้อัตโนมัติ)</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => applyMilestoneTemplate([50, 50], ['งวดที่ 1: มัดจำเริ่มงาน (50%)', 'งวดที่ 2: ส่งมอบงาน & Deploy (50%)'])} className="px-2 py-0.5 bg-paper border border-pencil rounded text-[10px] font-hand font-bold hover:bg-indigo-50" title="มัดจำ 50% / ปิดงาน 50%">50/50</button>
              <button type="button" onClick={() => applyMilestoneTemplate([30, 40, 30], ['งวดที่ 1: มัดจำ / ออกแบบ UI (30%)', 'งวดที่ 2: พัฒนาระบบ & Demo (40%)', 'งวดที่ 3: ส่งมอบ & ขึ้นระบบจริง (30%)'])} className="px-2 py-0.5 bg-paper border border-pencil rounded text-[10px] font-hand font-bold hover:bg-indigo-50" title="3 งวดมาตรฐาน">30/40/30</button>
              <button type="button" onClick={() => applyMilestoneTemplate([100], ['ชำระเต็มจำนวน 100% หลังส่งมอบ'])} className="px-2 py-0.5 bg-paper border border-pencil rounded text-[10px] font-hand font-bold hover:bg-indigo-50" title="ก้อนเดียวเต็มจำนวน">100%</button>
              <button type="button" onClick={() => addMilestone()} className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-hand font-bold flex items-center gap-0.5 hover:bg-indigo-700 shadow-sketch-sm">
                <Plus className="w-3 h-3" /> เพิ่มงวด
              </button>
            </div>
          </div>

          {info.milestones.length === 0 ? (
            <p className="text-[10px] font-hand text-pencil-muted">ยังไม่มีงวดงาน — แนะนำให้แบ่งงวด (เช่น มัดจำ 50% ก่อนเริ่ม) เพื่อลดความเสี่ยงโดนเท</p>
          ) : (
            <div className="space-y-1.5">
              {info.milestones.map((m, idx) => (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-paper border-2 border-pencil rounded-md shadow-sketch-sm">
                  <span className="col-span-1 text-[10px] font-hand font-extrabold text-center">#{idx + 1}</span>
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                    placeholder="ชื่องวด เช่น ส่ง Prototype"
                    className="col-span-11 sm:col-span-5 p-1.5 bg-transparent border border-pencil rounded text-xs font-hand"
                  />
                  <input
                    type="number"
                    min="0"
                    value={m.amount || ''}
                    onChange={(e) => updateMilestone(m.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="฿ จำนวน"
                    className="col-span-4 sm:col-span-2 p-1.5 bg-transparent border border-pencil rounded text-xs font-hand text-right"
                  />
                  <label className="col-span-3 sm:col-span-2 flex items-center gap-1 text-[10px] font-hand font-bold cursor-pointer">
                    <input type="checkbox" checked={m.done} onChange={(e) => updateMilestone(m.id, { done: e.target.checked })} className="accent-indigo-600" />
                    ส่งงานแล้ว
                  </label>
                  <label className="col-span-4 sm:col-span-1 flex items-center gap-1 text-[10px] font-hand font-bold cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={m.paid} onChange={(e) => updateMilestone(m.id, { paid: e.target.checked })} className="accent-emerald-600" />
                    รับเงิน
                  </label>
                  <button
                    type="button"
                    onClick={() => setMilestones(info.milestones.filter(x => x.id !== m.id))}
                    className="col-span-1 text-rose-500 hover:bg-rose-100/50 rounded p-1 justify-self-end"
                    title="ลบงวด"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {hasMilestoneAmounts && priceNum > 0 && msTotal !== priceNum && (
                <p className="text-[10px] font-hand font-bold text-rose-600">
                  ⚠️ ยอดรวมงวด ฿{msTotal.toLocaleString()} ≠ ราคางาน ฿{priceNum.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. ลิงก์โปรเจกต์ */}
      <div className={sectionCls}>
        <span className={sectionTitleCls}><LinkIcon className="w-3.5 h-3.5" /> ลิงก์โปรเจกต์</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Git Repository:</label>
            <input type="url" value={info.repoUrl} onChange={(e) => update({ repoUrl: e.target.value })} placeholder="https://github.com/..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Requirement / Figma / เอกสาร TOR:</label>
            <input type="url" value={info.docsUrl} onChange={(e) => update({ docsUrl: e.target.value })} placeholder="https://figma.com/... หรือ Google Docs" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>เว็บทดสอบ (Staging / Demo):</label>
            <input type="url" value={info.stagingUrl} onChange={(e) => update({ stagingUrl: e.target.value })} placeholder="https://xxx.vercel.app" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>เว็บจริง (Production):</label>
            <input type="url" value={info.productionUrl} onChange={(e) => update({ productionUrl: e.target.value })} placeholder="https://www.client.com" className={inputCls} />
          </div>
        </div>
      </div>

      {/* 5. ความคืบหน้า & Checklist ส่งมอบ */}
      <div className={sectionCls}>
        <span className={sectionTitleCls}><CheckSquare className="w-3.5 h-3.5" /> ความคืบหน้า & Checklist ส่งมอบงาน</span>
        <div>
          <label className={labelCls}>
            ความคืบหน้าของงาน (0 - 100%)
            {milestoneProgress !== null && <span className="text-indigo-600"> — คำนวณอัตโนมัติจากงวดที่ส่งแล้ว</span>}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={Number(progress) || 0}
              disabled={milestoneProgress !== null}
              onChange={(e) => setProgress(e.target.value)}
              className="flex-grow accent-indigo-600 disabled:opacity-60"
            />
            <span className="font-hand font-extrabold text-sm w-12 text-right">{Number(progress) || 0}%</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEV_HANDOVER_ITEMS.map(item => (
            <label key={item.key} className="flex items-center gap-1.5 text-xs font-hand cursor-pointer">
              <input
                type="checkbox"
                checked={!!info.handover[item.key]}
                onChange={(e) => update({ handover: { ...info.handover, [item.key]: e.target.checked } })}
                className="accent-emerald-600"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
