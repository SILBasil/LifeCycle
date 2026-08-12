# LifeCycle Project Brief

แอปพลิเคชันบริหารจัดการชีวิตประจำวันส่วนบุคคล (Personal Life & Work Management) ที่รวมระบบการทำงาน นัดหมาย และการเงินเข้าไว้ด้วยกันในลูปเดียว เพื่อความราบรื่นและเป็นระเบียบในทุกช่วงเวลา

---

## 1. ภาพรวมโครงการ (App Overview)
* **ชื่อโครงการ:** LifeCycle (work_life_cycle)
* **วัตถุประสงค์:** พัฒนาแอปพลิเคชันสำหรับบันทึกชีวิตส่วนตัว ตารางงาน และการเงินรายเดือนในที่เดียว
* **กลุ่มผู้ใช้งาน:** ใช้งานคนเดียวแบบส่วนตัว (Single User - สำหรับคุณใช้งานคนเดียวเท่านั้น)
* **รูปแบบระบบ:** **Progressive Web App (PWA)** (แอปพลิเคชันเว็บบราวเซอร์ที่สามารถกด "Add to Home Screen" เพื่อติดตั้งลงบนหน้าจอมือถือ/แท็บเล็ต มีโลโก้ไอคอนและเปิดใช้งานได้เสมือนแอปจริงโดยไม่ต้องผ่าน App Store/Play Store)
* **การรักษาความปลอดภัย:** ใช้ระบบ **Supabase Auth** ในการล็อกอิน โดยเมื่อคุณทำการสมัครสมาชิกบัญชีของคุณเองครั้งแรกเสร็จสิ้นแล้ว เราจะเข้าไปปิดระบบรับสมัครสมาชิกสาธารณะ (Disable Public Signup) ในหน้าตั้งค่าของ Supabase ทันที เพื่อป้องกันไม่ให้บุคคลอื่นสามารถแอบมาลงทะเบียนหรือเข้าถึงฐานข้อมูลได้

---

## 2. แนวทางการออกแบบ (UI/UX Aesthetic)
* **สไตล์:** **Hand-drawn / Notebook Sketch (สไตล์จดสมุดบันทึกด้วยมือ)**
  - ใช้ฟอนต์ลายมือภาษาไทย/อังกฤษที่อ่านง่ายและสวยงาม (เช่น *Mali*, *Itim*, หรือ *Patrick Hand* จาก Google Fonts)
  - เส้นขอบ (Borders) และเงา (Shadows) ดีไซน์แบบขีดเขียนด้วยดินสอ/ปากกา (Rough edges & Hand-drawn elements)
  - พื้นหลังสไตล์กระดาษสมุดโน้ต (Grid Paper, Lined Paper, หรือ Dot Grid)
  - ไอคอนเป็นแบบลายเส้นวาดมือ (Sketch Icons)
  - ไมโครอนิเมชันให้ความรู้สึกเหมือนการเปิดหน้ากระดาษสมุด

---

## 3. สแต็กเทคโนโลยี (Technology Stack)
* **Frontend:** Vite + React (TypeScript)
* **Styling:** TailwindCSS (ออกแบบ Custom Utility สำหรับ Hand-drawn เช่น ขอบหยัก, ฟอนต์ลายมือ, ลายกระดาษโน้ต)
* **PWA:** `vite-plugin-pwa` เพื่อเปิดระบบ Service Worker และไฟล์ Manifest สำหรับติดตั้งบนมือถือ
* **Backend & Database:** Supabase (ฐานข้อมูล PostgreSQL, ระบบล็อกอิน Auth, และเรียลไทม์)
* **Hosting & Deployment:** **Vercel** (เชื่อมโยง Git Repository กับ Vercel สำหรับระบบ CI/CD เพื่อ Build และ Deploy อัตโนมัติทุกครั้งที่อัปเดตโค้ด)

### 🔑 ข้อมูลการเชื่อมต่อ Supabase (Supabase Connection Details)
* **Supabase URL:** `https://wukpkztwjgkcmwiflylu.supabase.co`
* **Supabase Publishable Key:** `sb_publishable_-yPJ_XRGL6GMIERJ9shMUg_WchKkIK8`

---

## 4. โครงสร้างฐานข้อมูล (Database Schema - Supabase Tables)

เราจะใช้ตารางหลักๆ ดังนี้ในการเก็บข้อมูล โดยผูกกับระบบสมาชิก (User Auth):

### 1) ตาราง `profiles` (ข้อมูลผู้ใช้)
- `id` (uuid, primary key, references auth.users)
- `updated_at` (timestamp)
- `username` (text)
- `full_name` (text)

### 2) ตาราง `events` (นัดหมาย & ปฏิทิน)
- `id` (uuid, primary key, default: gen_random_uuid())
- `user_id` (uuid, references auth.users)
- `title` (text) - หัวข้อนัดหมาย
- `description` (text) - รายละเอียด
- `start_time` (timestamp with time zone) - เวลาเริ่มต้น
- `end_time` (timestamp with time zone) - เวลาสิ้นสุด
- `is_all_day` (boolean) - เต็มวันหรือไม่
- `created_at` (timestamp)

### 3) ตาราง `tasks` (งาน & ติดตามสถานะ)
- `id` (uuid, primary key, default: gen_random_uuid())
- `user_id` (uuid, references auth.users)
- `title` (text) - ชื่องาน
- `description` (text) - รายละเอียด
- `status` (text) - สถานะ (`todo`, `doing`, `done`)
- `priority` (text) - ความสำคัญ (`low`, `medium`, `high`)
- `project_name` (text) - ชื่อโปรเจกต์/หมวดหมู่
- `due_date` (timestamp) - กำหนดส่ง
- `created_at` (timestamp)

### 4) ตาราง `monthly_budgets` (งบประมาณรายเดือน)
- `id` (uuid, primary key, default: gen_random_uuid())
- `user_id` (uuid, references auth.users)
- `month_year` (text) - ปี-เดือน เช่น `"2026-08"`
- `monthly_income` (numeric) - รายรับรวมประจำเดือนนี้
- `budget_limit` (numeric) - งบประมาณควบคุมรายจ่ายเดือนนี้
- `created_at` (timestamp)

### 5) ตาราง `monthly_expenses` (ค่าใช้จ่ายประจำเดือน)
- `id` (uuid, primary key, default: gen_random_uuid())
- `user_id` (uuid, references auth.users)
- `month_year` (text) - ปี-เดือน เช่น `"2026-08"`
- `title` (text) - รายการค่าใช้จ่าย (เช่น ค่าเน็ต, Netflix, ค่าเช่าห้อง)
- `amount` (numeric) - จำนวนเงิน
- `category` (text) - หมวดหมู่ (`bill`, `subscription`, `fixed`, `other`)
- `is_paid` (boolean) - จ่ายเงินแล้วหรือยัง (สำหรับติดตาม Bills & Subscriptions)
- `due_day` (integer) - วันที่ครบกำหนดจ่ายในแต่ละเดือน (1-31)
- `created_at` (timestamp)

---

## 5. แผนการดำเนินงานและสถานะ (Implementation Roadmap & Status)

### 🟩 ระยะที่ 1: ตั้งค่าโปรเจกต์และสภาพแวดล้อม (Project Setup)
- [ ] ตั้งค่า Vite React Project (TypeScript + TailwindCSS + PWA)
- [ ] ตั้งค่าการเชื่อมต่อ Supabase Client ในโค้ด
- [ ] เตรียมธีม Hand-drawn (ฟอนต์ Mali/Itim, ลายเส้นสมุดจด)
- [ ] สร้าง Schema ตารางข้อมูลใน Supabase (รันคำสั่ง SQL ใน Supabase Editor)

### 🟩 ระยะที่ 2: ระบบยืนยันตัวตนและโครงสร้างเมนู (Auth & Shell)
- [ ] พัฒนาหน้า Login / Signup ในดีไซน์ Hand-drawn Notebook
- [ ] พัฒนา Main Navigation & Layout (Sidebar / Bottom Navbar สำหรับมือถือ)

### 🟩 ระยะที่ 3: พัฒนาฟีเจอร์หลัก (Core Features Development)
- [ ] **Dashboard:** แสดงตารางงานวันนี้ นัดหมายวันนี้ และสรุปยอดเงินรายเดือน
- [ ] **Calendar:** ปฏิทินแสดงนัดหมายและเดดไลน์งานในมุมมองรายเดือน/รายสัปดาห์
- [ ] **Tasks / Work:** ระบบจัดการโปรเจกต์ ลำดับความสำคัญ และสถานะงาน
- [ ] **Monthly Expenses:** ระบบบันทึกรายรับ สรุปยอด และค่าใช้จ่ายคงที่รายเดือน (Bills/Subscriptions)

### 🟩 ระยะที่ 4: ความเป็น PWA และตรวจสอบความเรียบร้อย (PWA & Polishing)
- [ ] ทำไอคอนแอปและตั้งค่า Manifest/Service Worker เพื่อให้ติดตั้งบนมือถือได้สมบูรณ์
- [ ] ตรวจทานความสวยงามและสัมผัสความรู้สึกลายเส้นแฮนด์เมด

---

## 6. บันทึกคำถามและการตัดสินใจ (Decisions Log)
* **2026-08-12:** 
  - สรุปทำเป็น Web App ในรูปแบบ PWA (Progressive Web App) เพื่อกดติดตั้งบนมือถือได้
  - เลือกใช้ Vite + React + Tailwind + Supabase
  - เลือกสไตล์ UI เป็นแบบ **Hand-drawn / Notebook Sketch** (จดในสมุด)
  - นำข้อมูลเชื่อมต่อ Supabase ใส่ลงในการวางแผนโครงการ
