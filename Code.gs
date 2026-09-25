// ===== Config.gs =====
/**
 * ระบบแจ้งซ่อมผ่าน LINE OA — ค่าคงที่และโครงสร้างข้อมูล
 * แก้ค่าที่เปลี่ยนบ่อย (ชื่อผู้ลงนาม, SLA, อีเมล ฯลฯ) ได้ในชีต Settings โดยไม่ต้องแก้โค้ด
 * ค่าที่เป็นความลับ (LINE Channel access token) เก็บใน Script Properties เท่านั้น
 */
const APP_VERSION = '1.2.0';
/** Google Sheet ที่เป็นฐานข้อมูลของระบบ (ใช้เมื่อสคริปต์ไม่ได้ผูกกับชีตโดยตรง) */
const SPREADSHEET_ID_DEFAULT = '14EPKByzciXuvzXCVr0gHLHrDjpWGwA_PZXRccW7-aRw';

const SH = {
  REQ: 'Requests',
  LOG: 'StatusLog',
  STAFF: 'Staff',
  USERS: 'ผู้แจ้ง',
  SET: 'Settings',
  LISTS: 'Lists',
  RPT: '_ReportData',
  ERR: '_Errors'
};

const STATUS = {
  NEW: 'รอมอบหมาย',
  ASSIGNED: 'มอบหมายแล้ว',
  PLANNED: 'นัดหมายแล้ว',
  PAUSED: 'พักงาน',
  WAIT_ACCEPT: 'รอตรวจงาน',
  REJECTED: 'ส่งกลับแก้ไข',
  CLOSED: 'ดำเนินการเสร็จสิ้น',
  CANCELLED: 'ยกเลิก'
};
const OPEN_STATUSES = [STATUS.NEW, STATUS.ASSIGNED, STATUS.PLANNED, STATUS.PAUSED, STATUS.WAIT_ACCEPT, STATUS.REJECTED];
/** สถานะที่ช่างกำลังทำงาน (พักงาน/ปิดงานได้) */
const WORKING_STATUSES = [STATUS.ASSIGNED, STATUS.PLANNED, STATUS.REJECTED];

/** ประเภทปัญหาในรายงาน (เรียงตามรายงานเดิม) */
const DEFAULT_CATEGORIES = ['CCTV & Access Control', 'Network', 'Software', 'Hardware'];

/** อาคาร ตามฟอร์ม FM-PPM-2-01 */
const DEFAULT_BUILDINGS = [
  'อาคารจักรพิชัยรณรงค์สงคราม',
  'อาคารเรียนและปฏิบัติการ',
  'อาคารสนับสนุนและอำนวยการ (อาคารจอดรถ)',
  'อาคารเฉลิมพระเกียรติ 6 รอบฯ',
  'อาคารเฉลิมพระเกียรติ 80 พรรษาฯ',
  'อาคารปฏิบัติการกายวิภาคศาสตร์'
];

/**
 * หมวดงานตามฟอร์ม + การจับคู่ประเภทปัญหาอัตโนมัติ (cat)
 * cat = null หมายถึงให้ช่างเลือกตอนปิดงาน
 */
const DEFAULT_GROUPS = [
  { id: 'g1', no: 1, name: 'งานด้านคอมพิวเตอร์และอุปกรณ์ต่อพ่วง (เครื่องพิมพ์, สแกนเนอร์, UPS)', items: [
    { id: 'i1_1', name: 'ย้ายหรือติดตั้ง', cat: 'Hardware' },
    { id: 'i1_2', name: 'ติดตั้งโปรแกรมพื้นฐานหรือโปรแกรมเฉพาะงาน', cat: 'Software' },
    { id: 'i1_3', name: 'ระบบปฏิบัติการ Windows มีปัญหา', cat: 'Software' },
    { id: 'i1_4', name: 'แก้ไข/อัพเดท/ติดตั้ง Antivirus', cat: 'Software' },
    { id: 'i1_5', name: 'อุปกรณ์ชำรุด (คอมพิวเตอร์/เครื่องพิมพ์/สแกนเนอร์/UPS)', cat: 'Hardware' }
  ]},
  { id: 'g2', no: 2, name: 'งานด้านระบบเครือข่ายอินเตอร์เน็ต', items: [
    { id: 'i2_1', name: 'เพิ่มจุด LAN, WiFi', cat: 'Network' },
    { id: 'i2_2', name: 'WiFi มีปัญหา', cat: 'Network' },
    { id: 'i2_3', name: 'ลงทะเบียนการใช้เครือข่าย', cat: 'Network' },
    { id: 'i2_4', name: 'สาย LAN ขาด/เสีย', cat: 'Network' }
  ]},
  { id: 'g3', no: 3, name: 'งานด้านบัตรประจำตัว/บัตรจอดรถ/เครื่องสแกนนิ้ว/ใบหน้า', card: true, items: [
    { id: 'i3_1', name: 'บัตรหาย (แนบใบเสร็จ และเอกสารทำบัตร)', cat: 'CCTV & Access Control' },
    { id: 'i3_2', name: 'เพิ่มประตู', cat: 'CCTV & Access Control' },
    { id: 'i3_3', name: 'สแกนไม่ได้', cat: 'CCTV & Access Control' }
  ]},
  { id: 'g4', no: 4, name: 'อื่นๆ', items: [
    { id: 'i4_1', name: 'อื่นๆ (โปรดระบุสาเหตุ)', cat: null }
  ]}
];

/** คอลัมน์ชีต Requests: key (ใช้ในโค้ด) + label (หัวคอลัมน์ในชีต) */
const REQ_FIELDS = [
  ['no', 'ลำดับรับแจ้ง'],
  ['created_at', 'วันเวลาที่แจ้ง'],
  ['status', 'สถานะ'],
  ['reporter_uid', 'LINE userId ผู้แจ้ง'],
  ['reporter_line_name', 'ชื่อ LINE ผู้แจ้ง'],
  ['reporter_name', 'ชื่อผู้แจ้ง'],
  ['department', 'ภาควิชา/หน่วยงาน'],
  ['phone', 'หมายเลขติดต่อกลับ'],
  ['building', 'อาคาร'],
  ['floor', 'ชั้น'],
  ['room', 'ห้อง'],
  ['group_id', 'หมวดงาน'],
  ['item_ids', 'รายการที่เลือก (id)'],
  ['items_text', 'รายการที่เลือก'],
  ['detail', 'คำรับแจ้ง/สาเหตุการแจ้งซ่อม'],
  ['card_name', 'ชื่อ-นามสกุล (บัตร)'],
  ['card_no', 'เลขหลังบัตร'],
  ['photo_ids', 'รูปแนบ (Drive id)'],
  ['sig_reporter_id', 'ลายเซ็นผู้แจ้ง (Drive id)'],
  ['category_auto', 'ประเภท (อัตโนมัติ)'],
  ['category', 'ประเภทของปัญหา'],
  ['due_date', 'กำหนดแล้วเสร็จ'],
  ['assigned_uid', 'LINE userId ช่าง'],
  ['assigned_name', 'ช่างผู้ปฏิบัติงาน'],
  ['assigned_at', 'วันเวลามอบหมาย'],
  ['appoint_date', 'นัดเข้าทำวันที่'],
  ['appoint_time', 'นัดเข้าทำเวลา'],
  ['plan', 'ผลประเมิน'],
  ['plan_days', 'จำนวนวัน (รออุปกรณ์/บริษัทภายนอก)'],
  ['plan_note', 'หมายเหตุการประเมิน'],
  ['planned_at', 'วันเวลาประเมิน'],
  ['ack_at', 'ผู้แจ้งรับทราบเมื่อ'],
  ['ack_by', 'ผู้แจ้งรับทราบโดย'],
  ['ack_token', '_ack_token'],
  ['cause', 'สาเหตุที่พบ'],
  ['solution', 'แนวทางการแก้ไข'],
  ['advice', 'คำแนะนำแก้ไขเบื้องต้น'],
  ['asset_code', 'รหัสครุภัณฑ์'],
  ['after_photo_ids', 'รูปหลังซ่อม (Drive id)'],
  ['done_at', 'วันที่เสร็จ'],
  ['iso', 'ISO'],
  ['accept_result', 'ผลตรวจรับ'],
  ['accept_reason', 'เหตุผล (ไม่แล้วเสร็จ)'],
  ['rating', 'คะแนนประเมิน (1-5)'],
  ['signer_name', 'ผู้ลงนามตรวจรับ'],
  ['sig_accept_id', 'ลายเซ็นตรวจรับ (Drive id)'],
  ['accept_via', 'ตรวจรับผ่าน'],
  ['accepted_at', 'วันเวลาตรวจรับ'],
  ['reject_count', 'จำนวนครั้งส่งกลับแก้ไข'],
  ['first_done_at', 'เสร็จครั้งแรกเมื่อ'],
  ['pause_reason', 'เหตุผลพักงาน'],
  ['paused_at', 'พักงานเมื่อ'],
  ['pause_from', '_สถานะก่อนพัก'],
  ['pause_days', 'วันพักงาน (งานใหม่)'],
  ['rework_at', 'ส่งกลับแก้ไขเมื่อ'],
  ['rework_due', 'กำหนดเสร็จงานแก้'],
  ['rework_pause_days', 'วันพักงาน (งานแก้)'],
  ['rework_done_at', 'แก้ไขเสร็จเมื่อ'],
  ['rework_iso', 'ISO งานแก้'],
  ['pdf_id', 'ใบแจ้งซ่อม PDF (Drive id)'],
  ['reminded_at', 'แจ้งเตือนตรวจรับล่าสุด'],
  ['remark', 'หมายเหตุ']
];

const LOG_FIELDS = [
  ['ts', 'วันเวลา'],
  ['no', 'ลำดับรับแจ้ง'],
  ['action', 'การดำเนินการ'],
  ['from_status', 'สถานะเดิม'],
  ['to_status', 'สถานะใหม่'],
  ['by_uid', 'ผู้ดำเนินการ (LINE userId / อีเมล)'],
  ['by_name', 'ชื่อผู้ดำเนินการ'],
  ['detail', 'รายละเอียด']
];

const STAFF_FIELDS = [
  ['uid', 'LINE userId'],
  ['name', 'ชื่อ-นามสกุล'],
  ['role', 'บทบาท (admin/tech)'],
  ['active', 'ใช้งาน (TRUE/FALSE)'],
  ['phone', 'เบอร์โทร'],
  ['sig_id', 'ลายเซ็น (Drive id)'],
  ['registered_at', 'ลงทะเบียนเมื่อ']
];

/** ผู้แจ้ง (ลงทะเบียนครั้งแรกครั้งเดียว ผูก LINE กับข้อมูลบุคลากร) */
const USER_FIELDS = [
  ['uid', 'LINE userId'],
  ['line_name', 'ชื่อ LINE'],
  ['name', 'ชื่อ-นามสกุล'],
  ['department', 'ภาควิชา/หน่วยงาน'],
  ['phone', 'หมายเลขติดต่อกลับ'],
  ['building', 'อาคารประจำ'],
  ['floor', 'ชั้น'],
  ['room', 'ห้อง'],
  ['pdpa_at', 'ยินยอม PDPA เมื่อ'],
  ['registered_at', 'ลงทะเบียนเมื่อ'],
  ['updated_at', 'แก้ไขล่าสุด']
];

/** ค่าเริ่มต้นของชีต Settings: [key, value, คำอธิบาย] */
const DEFAULT_SETTINGS = [
  ['ORG_NAME', 'บริษัท เป็นหูเป็นตา จำกัด', 'ชื่อผู้ให้บริการ (แสดงในรายงาน)'],
  ['CLIENT_NAME', 'คณะ...', 'ชื่อหน่วยงานผู้รับบริการ'],
  ['DOC_CODE', 'FM-PPM-2-01', 'รหัสเอกสารใบแจ้งซ่อม (ISO)'],
  ['DOC_REV', 'Revision 04-01/10/26', 'Revision ของใบแจ้งซ่อมฉบับอิเล็กทรอนิกส์ — ให้ตรงกับทะเบียนควบคุมเอกสาร'],
  ['REPORT_DOC_CODE', '', 'รหัสเอกสารรายงานรายเดือน (ถ้ามี)'],
  ['SLA_DAYS', '3', 'เกณฑ์ ISO: ต้องเสร็จภายในกี่วันนับจากวันแจ้ง'],
  ['KPI_ISO_TARGET', '90', 'เป้าหมาย % งานที่เสร็จทันเกณฑ์ (แสดงในรายงาน)'],
  ['ACCEPT_REMIND_DAYS', '2', 'เตือนผู้แจ้งให้ตรวจรับเมื่อค้างกี่วัน'],
  ['NEXT_NO', '332', 'เลขรับแจ้งถัดไป (ต่อจากระบบเดิม)'],
  ['REPORT_TO', 'รองคณบดีฝ่ายกายภาพและทรัพย์สิน', 'เรียน ... (ในรายงานรายเดือน)'],
  ['REPORT_PREPARER', 'นาย ...', 'ผู้จัดทำรายงาน'],
  ['REPORT_PREPARER_POS', '', 'ตำแหน่งผู้จัดทำ'],
  ['REPORT_REVIEWER', 'นาย ...', 'ผู้ตรวจสอบ'],
  ['REPORT_REVIEWER_POS', '', 'ตำแหน่งผู้ตรวจสอบ'],
  ['REPORT_APPROVER', '', 'ผู้จัดการทั่วไป'],
  ['REPORT_APPROVER_POS', 'ผู้จัดการทั่วไป', 'ตำแหน่งผู้อนุมัติ'],
  ['REPORT_EMAILS', 'vetcentral.ku@gmail.com', 'อีเมลรับรายงานรายเดือน (คั่นด้วย ,)'],
  ['NOTIFY_NEW', 'admins', 'แจ้งงานใหม่ไปที่: admins = แอดมินทุกคน, group = กลุ่ม LINE, none = ไม่แจ้ง'],
  ['NOTIFY_GROUP_ID', '', 'ID กลุ่ม LINE (ได้จากคำสั่ง #ผูกกลุ่ม ในกลุ่ม)'],
  ['REGISTER_CODE_TECH', '', 'รหัสลงทะเบียนช่าง (สร้างอัตโนมัติ)'],
  ['REGISTER_CODE_ADMIN', '', 'รหัสลงทะเบียนแอดมิน (สร้างอัตโนมัติ)'],
  ['LIFF_ID', '2011696676-3yqcQBx6', 'LIFF ID'],
  ['LOGIN_CHANNEL_ID', '2011696676', 'Channel ID ของ LINE Login channel (ใช้ตรวจ ID token)'],
  ['WEB_BASE_URL', 'https://anuwatpenhoo-aum.github.io/line-repair/', 'URL ของหน้าเว็บ (GitHub Pages) เช่น https://xxx.github.io/line-repair/'],
  ['RICHMENU_USER_ID', '', 'Rich menu สำหรับผู้ใช้ทั่วไป (สร้างอัตโนมัติ)'],
  ['RICHMENU_STAFF_ID', '', 'Rich menu สำหรับเจ้าหน้าที่ (สร้างอัตโนมัติ)'],
  ['ROOT_FOLDER_ID', '', 'โฟลเดอร์หลักใน Drive (สร้างอัตโนมัติ)'],
  ['TICKET_TEMPLATE_ID', '', 'Google Doc เทมเพลตใบแจ้งซ่อม (สร้างอัตโนมัติ)'],
  ['REPORT_TEMPLATE_ID', '', 'Google Doc เทมเพลตรายงาน (สร้างอัตโนมัติ)'],
  ['RETENTION_YEARS', '3', 'ระยะเวลาจัดเก็บบันทึก (ปี) ตาม procedure'],
  ['PDPA_TEXT', 'ข้าพเจ้ายินยอมให้เก็บชื่อ ข้อมูลติดต่อ บัญชี LINE และลายมือชื่อ เพื่อใช้ในการให้บริการแจ้งซ่อมและจัดทำรายงานเท่านั้น', 'ข้อความยินยอม PDPA บนฟอร์ม']
];

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// ===== Data.gs =====
/** ===== การเข้าถึงข้อมูลในชีต ===== */

function ss_() {
  if (ss_._c) return ss_._c;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || SPREADSHEET_ID_DEFAULT;
  return (ss_._c = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(id));
}
function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบชีต ' + name + ' — กรุณารัน setup()');
  return sh;
}

/** คืน map key -> column index (1-based) โดยจับจาก label ในแถวแรก */
function colMap_(sh, fields) {
  const memo = colMap_._m || (colMap_._m = {});
  const ck = sh.getName();
  if (memo[ck]) return memo[ck];
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const map = {};
  fields.forEach(([key, label]) => {
    const i = header.indexOf(label);
    if (i < 0) throw new Error('ชีต ' + sh.getName() + ' ไม่มีคอลัมน์ "' + label + '"');
    map[key] = i + 1;
  });
  memo[ck] = map;
  return map;
}

function readAll_(shName, fields) {
  const sh = sheet_(shName);
  const map = colMap_(sh, fields);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  return values.map((r, i) => {
    const o = { _row: i + 2 };
    fields.forEach(([k]) => { o[k] = r[map[k] - 1]; });
    return o;
  });
}

function appendObj_(shName, fields, obj) {
  const sh = sheet_(shName);
  const map = colMap_(sh, fields);
  const row = new Array(sh.getLastColumn()).fill('');
  fields.forEach(([k]) => { if (obj[k] !== undefined) row[map[k] - 1] = obj[k]; });
  sh.appendRow(row);
  dropMemo_(shName);
  return sh.getLastRow();
}

function updateObj_(shName, fields, rowNum, patch) {
  const sh = sheet_(shName);
  const map = colMap_(sh, fields);
  const keys = Object.keys(patch).filter(k => map[k]);
  if (!keys.length) return;
  // เขียนทีเดียวเป็นช่วงต่อเนื่อง ลดจำนวนคำสั่งไปยังชีต (เร็วกว่า setValue ทีละช่อง)
  const cols = keys.map(k => map[k]);
  const c1 = Math.min.apply(null, cols), c2 = Math.max.apply(null, cols);
  if (c2 - c1 + 1 <= keys.length * 4) {
    const cur = sh.getRange(rowNum, c1, 1, c2 - c1 + 1).getValues()[0];
    keys.forEach(k => { cur[map[k] - c1] = patch[k]; });
    sh.getRange(rowNum, c1, 1, c2 - c1 + 1).setValues([cur]);
  } else {
    keys.forEach(k => sh.getRange(rowNum, map[k]).setValue(patch[k]));
  }
  dropMemo_(shName);
}

/** ===== memo ต่อ 1 รอบการทำงาน (กันอ่านชีตซ้ำหลายรอบใน request เดียว) ===== */
function dropMemo_(shName) {
  if (shName === SH.REQ) allTickets_._m = null;
  if (shName === SH.STAFF) allStaff_._m = null;
  if (shName === SH.USERS) allUsers_._m = null;
}

/** ===== Tickets ===== */
function allTickets_() {
  if (allTickets_._m) return allTickets_._m;
  return (allTickets_._m = readAll_(SH.REQ, REQ_FIELDS).filter(t => t.no !== '' && t.no !== null));
}
function getTicket_(no) {
  no = Number(no);
  const t = allTickets_().find(x => Number(x.no) === no);
  if (!t) throw new Error('ไม่พบใบแจ้งซ่อมเลขที่ ' + no);
  return t;
}
function updateTicket_(t, patch, action, by, detail) {
  const from = t.status;
  updateObj_(SH.REQ, REQ_FIELDS, t._row, patch);
  Object.assign(t, patch);
  log_(t.no, action, from, patch.status || from, by, detail);
  return t;
}

/** ===== Audit trail ===== */
function log_(no, action, fromStatus, toStatus, by, detail) {
  appendObj_(SH.LOG, LOG_FIELDS, {
    ts: new Date(), no: no, action: action,
    from_status: fromStatus || '', to_status: toStatus || '',
    by_uid: (by && by.uid) || '', by_name: (by && by.name) || '',
    detail: typeof detail === 'string' ? detail : (detail ? JSON.stringify(detail) : '')
  });
}

function logError_(err, ctx) {
  try {
    const sh = ss_().getSheetByName(SH.ERR);
    if (sh) sh.appendRow([new Date(), ctx || '', String(err && err.stack || err)]);
  } catch (e) { /* ignore */ }
  console.error(ctx, err);
}

/** ===== Staff ===== */
function allStaff_() {
  if (allStaff_._m) return allStaff_._m;
  return (allStaff_._m = readAll_(SH.STAFF, STAFF_FIELDS).filter(s => s.uid));
}
function staffByUid_(uid) {
  return allStaff_().find(s => s.uid === uid && (s.active === true || String(s.active).toUpperCase() === 'TRUE')) || null;
}
function activeStaff_(role) {
  return allStaff_().filter(s => (s.active === true || String(s.active).toUpperCase() === 'TRUE') && (!role || s.role === role));
}

/** ===== ผู้แจ้ง (ลงทะเบียน) ===== */
function allUsers_() {
  if (allUsers_._m) return allUsers_._m;
  if (!ss_().getSheetByName(SH.USERS)) return [];
  return (allUsers_._m = readAll_(SH.USERS, USER_FIELDS));
}
function userByUid_(uid) {
  if (!uid) return null;
  return allUsers_().find(u => u.uid === uid) || null;
}

/** ===== Settings ===== */
function settings_() {
  if (settings_._cache) return settings_._cache;
  const sh = sheet_(SH.SET);
  const vals = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 2).getValues();
  const o = {};
  vals.forEach(([k, v]) => { if (k) o[String(k).trim()] = v; });
  settings_._cache = o;
  return o;
}
function setting_(key, dflt) {
  const v = settings_()[key];
  return (v === undefined || v === '') ? dflt : v;
}
function setSetting_(key, value) {
  const sh = sheet_(SH.SET);
  const keys = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(r => String(r[0]));
  const i = keys.indexOf(key);
  if (i >= 0) sh.getRange(i + 2, 2).setValue(value);
  else sh.appendRow([key, value, '']);
  settings_._cache = null;
}
function secret_(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('ยังไม่ได้ตั้งค่า ' + key + ' ใน Script Properties');
  return v;
}

/** ===== วันที่ ===== */
const TZ = 'Asia/Bangkok';
function fmt_(d, pattern) { return d ? Utilities.formatDate(new Date(d), TZ, pattern) : ''; }
function beYear_(d) { return Number(fmt_(d, 'yyyy')) + 543; }
/** 21 กันยายน 2569 */
function thaiDate_(d) {
  if (!d) return '';
  d = new Date(d);
  return Number(fmt_(d, 'd')) + ' ' + TH_MONTHS[Number(fmt_(d, 'M')) - 1] + ' ' + beYear_(d);
}
/** 21/09/2569 */
function thaiShort_(d) { return d ? fmt_(d, 'dd/MM/') + beYear_(d) : ''; }
/** 21/09/2569 14:05 */
function thaiDateTime_(d) { return d ? thaiShort_(d) + ' ' + fmt_(d, 'HH:mm') : ''; }
/** เที่ยงคืนของวันนั้น (เวลาไทย) */
function dayStart_(d) { const s = fmt_(d, 'yyyy-MM-dd'); return new Date(s + 'T00:00:00+07:00'); }
function daysBetween_(a, b) { return Math.round((dayStart_(b) - dayStart_(a)) / 86400000); }
function addDays_(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function parseDateInput_(s) { return s ? new Date(String(s).slice(0, 10) + 'T00:00:00+07:00') : ''; }

/** ===== อื่นๆ ===== */

/** จับคู่ประเภทปัญหาอัตโนมัติจากรายการที่เลือก (ใช้ประเภทที่ถูกเลือกมากที่สุด เสมอกันใช้รายการแรก) */
function autoCategory_(itemIds) {
  const count = {};
  let first = '';
  (itemIds || []).forEach(id => {
    const it = itemById_(id);
    if (it && it.cat) { count[it.cat] = (count[it.cat] || 0) + 1; if (!first) first = it.cat; }
  });
  let best = first, n = 0;
  Object.keys(count).forEach(c => { if (count[c] > n) { best = c; n = count[c]; } });
  return best;
}

/** ทัน/ไม่ทัน: จำนวนวันจากเริ่มถึงเสร็จ หักวันที่พักงาน (รออะไหล่ ฯลฯ) ต้องไม่เกิน SLA */
function isoResult_(startAt, doneAt, pauseDays) {
  if (!startAt || !doneAt) return '';
  return netDays_(startAt, doneAt, pauseDays) <= Number(setting_('SLA_DAYS', 3)) ? 'ทัน' : 'ไม่ทัน';
}
function netDays_(startAt, doneAt, pauseDays) { return Math.max(0, daysBetween_(startAt, doneAt) - Number(pauseDays || 0)); }
function isRework_(t) { return Number(t.reject_count || 0) > 0 && !!t.rework_at; }
/** กำหนดเสร็จของรอบปัจจุบัน (งานใหม่ หรือ งานแก้) */
function curDue_(t) { return isRework_(t) && t.rework_due ? t.rework_due : t.due_date; }
function isOverdue_(t) {
  const due = curDue_(t);
  return [STATUS.ASSIGNED, STATUS.PLANNED, STATUS.REJECTED, STATUS.NEW].indexOf(t.status) >= 0 && !!due && dayStart_(new Date()) > dayStart_(due);
}

function randToken_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function str_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function clip_(v, n) { return str_(v).slice(0, n || 500); }

// ===== Lists.gs =====
/** ===== รายการที่แก้เองได้ในชีต: อาคาร / รายการแจ้งซ่อม / ประเภทปัญหา =====
 * แก้ในชีตได้เลย ไม่ต้องแก้โค้ด — เพิ่มแถวใหม่ หรือติ๊ก "ใช้งาน" ออกเพื่อซ่อน (ข้อมูลเก่ายังอ้างอิงได้)
 */
const SH_BLD = 'อาคาร', SH_ITEMS = 'รายการแจ้งซ่อม', SH_CATS = 'ประเภทปัญหา', SH_OPTS = 'ตัวเลือกช่าง';
const LIST_SHEETS = [SH_BLD, SH_ITEMS, SH_CATS, SH_OPTS];
/** ตัวเลือก Dropdown สำหรับช่าง: [ชนิด, ข้อความ] — แก้/เพิ่มได้ในชีต "ตัวเลือกช่าง" */
const OPT_KIND = { cause: 'สาเหตุที่พบ', solution: 'แนวทางการแก้ไข', pause: 'เหตุผลพักงาน' };
const DEFAULT_OPTIONS = {
  cause: ['อุปกรณ์ชำรุด/เสื่อมสภาพ', 'สายสัญญาณ/สาย LAN หลวมหรือเสียหาย', 'ตั้งค่าระบบ/โปรแกรมผิดพลาด', 'ไดรเวอร์/อัปเดตไม่สมบูรณ์', 'ไวรัส/มัลแวร์',
    'กระดาษติด/หมึกหมด', 'ไม่มีไฟเลี้ยง/ปลั๊กหลุด', 'บัญชีผู้ใช้/รหัสผ่านถูกล็อก', 'ระบบเครือข่ายภายนอกขัดข้อง', 'ใช้งานไม่ถูกวิธี'],
  solution: ['เปลี่ยนอุปกรณ์/อะไหล่ใหม่', 'เข้าหัว/เปลี่ยนสายสัญญาณ', 'ตั้งค่าระบบใหม่', 'ติดตั้ง/อัปเดตโปรแกรมหรือไดรเวอร์', 'สแกนและกำจัดไวรัส',
    'เคลียร์กระดาษติด/เปลี่ยนหมึก/ทำความสะอาด', 'รีเซ็ตรหัสผ่าน/ปลดล็อกบัญชี', 'รีสตาร์ทอุปกรณ์/ระบบ', 'แนะนำวิธีใช้งานที่ถูกต้อง', 'ส่งซ่อมบริษัทภายนอก'],
  pause: ['รออะไหล่/อุปกรณ์', 'รอบริษัทภายนอก/เคลมประกัน', 'รออนุมัติจัดซื้อ', 'เข้าพื้นที่ไม่ได้ (ผู้แจ้งไม่สะดวก)']
};
const DEFAULT_CAT_COLORS = { 'CCTV & Access Control': '#7048E8', 'Network': '#F08C00', 'Software': '#2F9E44', 'Hardware': '#1C7ED6' };
/** รายการที่มีช่องติ๊กอยู่ในเทมเพลตใบแจ้งซ่อม (รายการใหม่จะแสดงในบรรทัด "อื่นๆ") */
const TEMPLATE_ITEM_IDS = ['i1_1', 'i1_2', 'i1_3', 'i1_4', 'i1_5', 'i2_1', 'i2_2', 'i2_3', 'i2_4', 'i3_1', 'i3_2', 'i3_3', 'i4_1'];

function isOn_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

function lists_() {
  if (lists_._memo) return lists_._memo;
  const cache = CacheService.getScriptCache();
  const hit = cache.get('lists_v1');
  if (hit) return (lists_._memo = JSON.parse(hit));
  const ss = ss_();
  const out = { buildings: [], categories: [], colors: {}, groups: [], items: {}, options: { cause: [], solution: [], pause: [] } };

  const b = ss.getSheetByName(SH_BLD);
  if (b && b.getLastRow() > 1) b.getRange(2, 1, b.getLastRow() - 1, 3).getValues()
    .filter(r => str_(r[1]) && isOn_(r[2])).sort((x, y) => Number(x[0]) - Number(y[0])).forEach(r => out.buildings.push(str_(r[1])));
  else out.buildings = DEFAULT_BUILDINGS.slice();

  const c = ss.getSheetByName(SH_CATS);
  if (c && c.getLastRow() > 1) c.getRange(2, 1, c.getLastRow() - 1, 4).getValues()
    .filter(r => str_(r[1])).sort((x, y) => Number(x[0]) - Number(y[0])).forEach(r => {
      out.colors[str_(r[1])] = str_(r[2]) || '#868E96';
      if (isOn_(r[3])) out.categories.push(str_(r[1]));
    });
  else { out.categories = DEFAULT_CATEGORIES.slice(); out.colors = Object.assign({}, DEFAULT_CAT_COLORS); }

  const it = ss.getSheetByName(SH_ITEMS);
  if (it && it.getLastRow() > 1) {
    const vals = it.getRange(2, 1, it.getLastRow() - 1, 8).getValues();
    const gmap = {};
    vals.forEach((r, i) => {
      if (!str_(r[3])) return;
      let id = str_(r[2]);
      if (!id) { id = 'x' + Date.now().toString(36) + i; it.getRange(i + 2, 3).setValue(id); } // สร้างรหัสให้รายการใหม่อัตโนมัติ
      const gno = Number(r[0]) || 9;
      const item = { id: id, name: str_(r[3]), cat: str_(r[4]) || null, card: isOn_(r[5]), needDetail: isOn_(r[6]), active: isOn_(r[7]), gno: gno, gname: str_(r[1]) };
      out.items[id] = item;
      if (!item.active) return;
      if (!gmap[gno]) gmap[gno] = { id: 'g' + gno, no: gno, name: item.gname || ('หมวด ' + gno), items: [] };
      if (!gmap[gno].name && item.gname) gmap[gno].name = item.gname;
      gmap[gno].items.push({ id: id, name: item.name, cat: item.cat, card: item.card, needDetail: item.needDetail });
    });
    out.groups = Object.keys(gmap).map(Number).sort((a, b2) => a - b2).map(k => gmap[k]);
  } else {
    DEFAULT_GROUPS.forEach(g => {
      out.groups.push({ id: g.id, no: g.no, name: g.name, items: g.items.map(x => ({ id: x.id, name: x.name, cat: x.cat, card: !!g.card, needDetail: x.id === 'i4_1' })) });
      g.items.forEach(x => { out.items[x.id] = { id: x.id, name: x.name, cat: x.cat, card: !!g.card, needDetail: x.id === 'i4_1', active: true, gno: g.no, gname: g.name }; });
    });
  }
  const o = ss.getSheetByName(SH_OPTS);
  const kindOf = {}; Object.keys(OPT_KIND).forEach(k => { kindOf[OPT_KIND[k]] = k; });
  if (o && o.getLastRow() > 1) o.getRange(2, 1, o.getLastRow() - 1, 3).getValues()
    .forEach(r => { const k = kindOf[str_(r[0])]; if (k && str_(r[1]) && isOn_(r[2])) out.options[k].push(str_(r[1])); });
  else out.options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  try { cache.put('lists_v1', JSON.stringify(out), 600); } catch (e) { /* ใหญ่เกิน cache */ }
  return (lists_._memo = out);
}
function clearListsCache_() { lists_._memo = null; try { CacheService.getScriptCache().remove('lists_v1'); } catch (e) { /* ignore */ } }

function buildings_() { return lists_().buildings; }
function options_() { return lists_().options; }
function categories_() { return lists_().categories; }
function groups_() { return lists_().groups; }
function catColor_(name) { return lists_().colors[name] || DEFAULT_CAT_COLORS[name] || '#868E96'; }
/** หา item จากรหัส (รวมรายการที่ปิดใช้งานแล้ว เพื่ออ้างอิงข้อมูลเก่า) */
function itemById_(id) {
  const x = lists_().items[id];
  return x ? Object.assign({ group: { no: x.gno, name: x.gname } }, x) : null;
}
function groupById_(id) { return groups_().find(g => g.id === id) || null; }

/** สร้าง/เติมชีตรายการ (เรียกจาก setup) — ไม่ทับข้อมูลที่แก้ไว้ */
function ensureListSheets_() {
  const ss = ss_();
  let b = ss.getSheetByName(SH_BLD);
  if (!b) {
    b = ss.insertSheet(SH_BLD);
    b.getRange(1, 1, 1, 3).setValues([['ลำดับ', 'ชื่ออาคาร', 'ใช้งาน']]);
    b.getRange(2, 1, DEFAULT_BUILDINGS.length, 3).setValues(DEFAULT_BUILDINGS.map((n, i) => [i + 1, n, true]));
    b.getRange(2, 3, 200, 1).insertCheckboxes();
    styleListSheet_(b, [60, 360, 80], 'เพิ่มอาคารใหม่: เพิ่มแถวด้านล่าง · ซ่อน: เอาติ๊ก "ใช้งาน" ออก · ลำดับ = ลำดับที่แสดงในฟอร์ม');
  }
  let c = ss.getSheetByName(SH_CATS);
  if (!c) {
    c = ss.insertSheet(SH_CATS);
    c.getRange(1, 1, 1, 4).setValues([['ลำดับ', 'ประเภทปัญหา (ในรายงาน)', 'สีในกราฟ', 'ใช้งาน']]);
    c.getRange(2, 1, DEFAULT_CATEGORIES.length, 4).setValues(DEFAULT_CATEGORIES.map((n, i) => [i + 1, n, DEFAULT_CAT_COLORS[n], true]));
    c.getRange(2, 4, 50, 1).insertCheckboxes();
    styleListSheet_(c, [60, 260, 110, 80], 'สีใส่เป็นรหัสสี เช่น #1C7ED6 · เปลี่ยนชื่อประเภทจะมีผลกับงานใหม่เท่านั้น');
  }
  let it = ss.getSheetByName(SH_ITEMS);
  if (!it) {
    it = ss.insertSheet(SH_ITEMS);
    it.getRange(1, 1, 1, 8).setValues([['หมวด (เลข)', 'ชื่อหมวด', 'รหัส (ระบบสร้างให้)', 'รายการในฟอร์ม', 'ประเภทในรายงาน', 'ต้องระบุบัตร', 'ต้องกรอกรายละเอียด', 'ใช้งาน']]);
    const rows = [];
    DEFAULT_GROUPS.forEach(g => g.items.forEach(x => rows.push([g.no, g.name, x.id, x.name, x.cat || '', !!g.card, x.id === 'i4_1', true])));
    it.getRange(2, 1, rows.length, 8).setValues(rows);
    it.getRange(2, 6, 300, 3).insertCheckboxes();
    styleListSheet_(it, [80, 300, 120, 340, 180, 90, 110, 70], 'เพิ่มรายการ: เพิ่มแถว (เว้นช่องรหัสว่างไว้) · ประเภทว่าง = ให้ช่างเลือกตอนปิดงาน · ห้ามแก้รหัสของรายการเดิม');
  }
  let o = ss.getSheetByName(SH_OPTS);
  if (!o) {
    o = ss.insertSheet(SH_OPTS);
    o.getRange(1, 1, 1, 3).setValues([['ชนิด', 'ข้อความในตัวเลือก', 'ใช้งาน']]);
    const rows = [];
    Object.keys(DEFAULT_OPTIONS).forEach(k => DEFAULT_OPTIONS[k].forEach(x => rows.push([OPT_KIND[k], x, true])));
    o.getRange(2, 1, rows.length, 3).setValues(rows);
    o.getRange(2, 3, 300, 1).insertCheckboxes();
    o.getRange(2, 1, 300, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(OPT_KIND).map(k => OPT_KIND[k]), true).build());
    styleListSheet_(o, [140, 360, 70], 'ตัวเลือก Dropdown ในฟอร์มปิดงาน/พักงานของช่าง · เพิ่มแถวได้ · ช่างเลือก "อื่นๆ" แล้วพิมพ์เองได้เสมอ');
  }
  // dropdown ประเภทในรายงาน อ้างอิงชีตประเภทปัญหา
  const rule = SpreadsheetApp.newDataValidation().requireValueInRange(c.getRange('B2:B50'), true).setAllowInvalid(true).build();
  it.getRange(2, 5, 300, 1).setDataValidation(rule);
  clearListsCache_();
}

function styleListSheet_(sh, widths, note) {
  sh.getRange(1, 1, 1, widths.length).setFontWeight('bold').setBackground('#0B7285').setFontColor('#FFFFFF').setWrap(true);
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setFrozenRows(1);
  sh.getRange(1, 1).setNote(note);
  sh.setTabColor('#0B7285');
}

// ===== Drive.gs =====
/** ===== จัดเก็บไฟล์ใน Google Drive =====
 * ระบบแจ้งซ่อม LINE/
 *   ใบแจ้งซ่อม/2026-09/332/  (รูป, ลายเซ็น)
 *   ใบแจ้งซ่อม/2026-09/FM-PPM-2-01_332.pdf
 *   รายงานรายเดือน/2026/
 *   สำรองข้อมูล/
 *   เทมเพลต/
 */
function rootFolder_() {
  const id = setting_('ROOT_FOLDER_ID', '');
  if (!id) throw new Error('ยังไม่ได้ตั้ง ROOT_FOLDER_ID — กรุณารัน setup()');
  return DriveApp.getFolderById(id);
}
function subFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function monthFolder_(d) { return subFolder_(subFolder_(rootFolder_(), 'ใบแจ้งซ่อม'), fmt_(d, 'yyyy-MM')); }
function ticketFolder_(t) { return subFolder_(monthFolder_(t.created_at), String(t.no)); }

/** บันทึก dataURL (base64) เป็นไฟล์ คืน file id */
function saveDataUrl_(dataUrl, folder, name) {
  const m = String(dataUrl || '').match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
  if (!m) throw new Error('รูปแบบไฟล์รูปไม่ถูกต้อง');
  const bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > 4 * 1024 * 1024) throw new Error('ไฟล์รูปใหญ่เกิน 4 MB');
  const ext = m[2] === 'jpeg' || m[2] === 'jpg' ? 'jpg' : m[2];
  const blob = Utilities.newBlob(bytes, m[1], name + '.' + ext);
  return folder.createFile(blob).getId();
}

function fileToDataUrl_(id) {
  if (!id) return '';
  try {
    const b = DriveApp.getFileById(id).getBlob();
    return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
  } catch (e) { return ''; }
}
function idsOf_(v) { return str_(v) ? str_(v).split(',').map(s => s.trim()).filter(Boolean) : []; }
function fileUrl_(id) { return id ? 'https://drive.google.com/file/d/' + id + '/view' : ''; }

// ===== Line.gs =====
/** ===== LINE Messaging API / LIFF ===== */

function lineApi_(path, payload, method) {
  const res = UrlFetchApp.fetch('https://api.line.me' + path, {
    method: method || 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + secret_('LINE_CHANNEL_ACCESS_TOKEN') },
    payload: payload ? JSON.stringify(payload) : undefined,
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  if (code >= 300) throw new Error('LINE API ' + path + ' ' + code + ': ' + res.getContentText());
  const txt = res.getContentText();
  return txt ? JSON.parse(txt) : {};
}

/** reply ไม่นับโควตาข้อความ */
function reply_(replyToken, messages) {
  if (!replyToken) return;
  try { lineApi_('/v2/bot/message/reply', { replyToken: replyToken, messages: [].concat(messages) }); }
  catch (e) { logError_(e, 'reply'); }
}

/** push นับโควตา — ใช้เฉพาะที่จำเป็น */
function push_(to, messages) {
  if (!to) return false;
  try { lineApi_('/v2/bot/message/push', { to: to, messages: [].concat(messages) }); return true; }
  catch (e) { logError_(e, 'push ' + to); return false; }
}

function pushAdmins_(messages) { activeStaff_('admin').forEach(s => push_(s.uid, messages)); }

function notifyNewTicket_(t) {
  const mode = setting_('NOTIFY_NEW', 'admins');
  const msg = ticketFlex_(t, 'งานแจ้งซ่อมใหม่', '#E8590C', [{ label: 'เปิดดู / มอบหมายงาน', uri: liffUrl_('staff', t.no) }]);
  if (mode === 'group' && setting_('NOTIFY_GROUP_ID', '')) push_(setting_('NOTIFY_GROUP_ID'), msg);
  else if (mode !== 'none') pushAdmins_(msg);
}

/** ตรวจสอบ LIFF ID token กับ LINE → ได้ userId ที่เชื่อถือได้ */
function verifyIdToken_(idToken) {
  if (!idToken) throw new Error('กรุณาเปิดจากแอป LINE');
  const cache = CacheService.getScriptCache();
  const key = 'idt_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken));
  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  const res = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: { id_token: idToken, client_id: String(setting_('LOGIN_CHANNEL_ID', '')) },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('SESSION_EXPIRED');
  const j = JSON.parse(res.getContentText());
  const user = { uid: j.sub, name: j.name || '', picture: j.picture || '' };
  const ttl = Math.max(60, Math.min(3000, (j.exp || 0) - Math.floor(Date.now() / 1000) - 60));
  cache.put(key, JSON.stringify(user), ttl);
  return user;
}

function liffUrl_(page, no) {
  const id = setting_('LIFF_ID', '');
  let q = '?p=' + encodeURIComponent(page);
  if (no) q += '&no=' + encodeURIComponent(no);
  return 'https://liff.line.me/' + id + q;
}

/** ===== Flex message ===== */
function ticketFlex_(t, title, color, buttons, extraRows) {
  const row = (k, v) => ({
    type: 'box', layout: 'baseline', spacing: 'sm', contents: [
      { type: 'text', text: k, size: 'sm', color: '#8C8C8C', flex: 3 },
      { type: 'text', text: str_(v) || '-', size: 'sm', color: '#262626', flex: 7, wrap: true }
    ]
  });
  const rows = [
    row('เลขที่', '#' + t.no),
    row('ผู้แจ้ง', t.reporter_name + (t.department ? ' (' + t.department + ')' : '')),
    row('สถานที่', [t.building, t.floor ? 'ชั้น ' + t.floor : '', t.room ? 'ห้อง ' + t.room : ''].filter(Boolean).join(' ')),
    row('รายการ', clip_(t.items_text || t.detail, 120)),
    row('สถานะ', t.status)
  ].concat((extraRows || []).map(r => row(r[0], r[1])));
  const bubble = {
    type: 'bubble',
    header: { type: 'box', layout: 'vertical', backgroundColor: color || '#1C7ED6', paddingAll: '14px', contents: [
      { type: 'text', text: title, color: '#FFFFFF', weight: 'bold', size: 'md' }
    ]},
    body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: rows }
  };
  if (buttons && buttons.length) {
    bubble.footer = { type: 'box', layout: 'vertical', spacing: 'sm', contents: buttons.map((b, i) => ({
      type: 'button', style: i === 0 ? 'primary' : 'secondary', height: 'sm', color: i === 0 ? (color || '#1C7ED6') : undefined,
      action: b.uri ? { type: 'uri', label: b.label, uri: b.uri } : { type: 'postback', label: b.label, data: b.data, displayText: b.displayText || b.label }
    }))};
  }
  return { type: 'flex', altText: title + ' #' + t.no, contents: bubble };
}

function text_(s) { return { type: 'text', text: s }; }

/** ตรวจโควตาข้อความเดือนนี้ (รันจากเมนู) */
function checkMessageQuota() {
  const q = lineApi_('/v2/bot/message/quota', null, 'get');
  const c = lineApi_('/v2/bot/message/quota/consumption', null, 'get');
  const msg = 'โควตาข้อความเดือนนี้: ใช้ไป ' + c.totalUsage + ' / ' + (q.type === 'limited' ? q.value : 'ไม่จำกัด');
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
  return msg;
}

// ===== Api.gs =====
/** ===== Web app entry: LINE webhook + API สำหรับหน้า LIFF ===== */

function doGet() {
  return ContentService.createTextOutput('LINE Repair API v' + APP_VERSION + ' OK');
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { body = {}; }
  if (body.events) {
    try { handleWebhook_(body); } catch (err) { logError_(err, 'webhook'); }
    return json_({ ok: true });
  }
  try {
    return json_(Object.assign({ ok: true }, handleApi_(body)));
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (msg !== 'SESSION_EXPIRED' && !/^(กรุณา|ไม่|เฉพาะ|รหัส|งาน|ช่าง|อาคาร|ใบแจ้ง)/.test(msg)) logError_(err, 'api ' + body.action);
    return json_({ ok: false, error: msg });
  }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function handleApi_(req) {
  const me = verifyIdToken_(req.idToken);
  const staff = staffByUid_(me.uid);
  me.role = staff ? staff.role : 'user';
  me.staff = staff;
  if (staff) me.name = staff.name || me.name;
  const d = req.data || {};
  switch (req.action) {
    case 'init': return apiInit_(me);
    case 'submit': return apiSubmit_(me, d);
    case 'myTickets': return apiMyTickets_(me);
    case 'getTicket': return apiGetTicket_(me, d.no);
    case 'photo': return apiPhoto_(me, d);
    case 'ack': return apiAck_(me, d.no);
    case 'accept': return apiAccept_(me, d);
    case 'register': return apiRegister_(me, d);
    case 'saveProfile': return apiSaveProfile_(me, d);
    // เจ้าหน้าที่
    case 'staffTickets': return apiStaffTickets_(me);
    case 'assign': return apiAssign_(me, d);
    case 'take': return apiTake_(me, d.no);
    case 'plan': return apiPlan_(me, d);
    case 'pause': return apiPause_(me, d);
    case 'resume': return apiResume_(me, d);
    case 'complete': return apiComplete_(me, d);
    case 'requestAccept': return apiRequestAccept_(me, d.no);
    case 'cancel': return apiCancel_(me, d);
    case 'saveSignature': return apiSaveSignature_(me, d);
    case 'dashboard': return apiDashboard_(me, d);
    case 'overview': return apiOverview_(me, d);
    case 'generateReport': return apiGenerateReport_(me, d);
    default: throw new Error('ไม่รู้จักคำสั่ง ' + req.action);
  }
}

/* ---------- สิทธิ์ ---------- */
function requireStaff_(me) { if (!me.staff) throw new Error('เฉพาะเจ้าหน้าที่'); }
function requireAdmin_(me) { if (me.role !== 'admin') throw new Error('เฉพาะหัวหน้างาน/แอดมิน'); }
function canWork_(me, t) { return me.role === 'admin' || (me.staff && t.assigned_uid === me.uid); }
function canView_(me, t) { return !!me.staff || t.reporter_uid === me.uid; }

/* ---------- ข้อมูลที่ส่งให้หน้าเว็บ ---------- */
function toClient_(t, full, withTimeline) {
  const o = {
    no: t.no, status: t.status, created: thaiDateTime_(t.created_at),
    reporter_name: t.reporter_name, department: t.department, phone: t.phone,
    building: t.building, floor: t.floor, room: t.room,
    items_text: t.items_text, detail: t.detail, category: t.category || t.category_auto,
    assigned_name: t.assigned_name, assigned_uid: t.assigned_uid,
    due: thaiShort_(curDue_(t)), appoint: thaiShort_(t.appoint_date) + (t.appoint_time ? ' ' + t.appoint_time + ' น.' : ''),
    appoint_iso: t.appoint_date ? fmt_(t.appoint_date, 'yyyy-MM-dd') : '', appoint_time: str_(t.appoint_time),
    done: thaiShort_(t.done_at), iso: t.iso, acked: !!t.ack_at,
    overdue: isOverdue_(t), rework: isRework_(t), reject_count: Number(t.reject_count || 0),
    pause_reason: t.status === STATUS.PAUSED ? t.pause_reason : '', paused: t.status === STATUS.PAUSED ? thaiShort_(t.paused_at) : ''
  };
  if (full) Object.assign(o, {
    item_ids: idsOf_(t.item_ids), card_name: t.card_name, card_no: t.card_no,
    plan: t.plan, plan_days: t.plan_days, plan_note: t.plan_note,
    ack: t.ack_at ? (t.ack_by + ' ' + thaiDateTime_(t.ack_at)) : '',
    cause: t.cause, solution: t.solution, advice: t.advice, asset_code: t.asset_code,
    accept_result: t.accept_result, accept_reason: t.accept_reason, rating: t.rating,
    signer_name: t.signer_name, accepted: thaiDateTime_(t.accepted_at),
    pause_days: Number(t.pause_days || 0) + Number(t.rework_pause_days || 0), rework_iso: t.rework_iso,
    // ส่งเฉพาะ id ของรูป หน้าเว็บจะทยอยโหลดทีหลัง (action 'photo') — หน้าจึงขึ้นทันที
    photos: idsOf_(t.photo_ids).slice(0, 4),
    after_photos: idsOf_(t.after_photo_ids).slice(0, 4),
    pdf_url: t.pdf_id ? fileUrl_(t.pdf_id) : ''
  });
  if (full && withTimeline) o.timeline = readAll_(SH.LOG, LOG_FIELDS).filter(l => Number(l.no) === Number(t.no))
    .map(l => ({ ts: thaiDateTime_(l.ts), action: l.action, by: l.by_name, to: l.to_status }));
  return o;
}

/* ---------- ผู้ใช้ทั่วไป ---------- */
function profileOut_(u) {
  return u ? { name: u.name, department: u.department, phone: u.phone, building: u.building, floor: u.floor, room: u.room, pdpa: !!u.pdpa_at } : null;
}

function apiInit_(me) {
  return {
    me: { uid: me.uid, name: me.name, role: me.role, hasSignature: !!(me.staff && me.staff.sig_id), profile: profileOut_(userByUid_(me.uid)) },
    lists: { buildings: buildings_(), groups: groups_(), categories: categories_(), colors: lists_().colors, options: options_() },
    org: setting_('ORG_NAME', ''), client: setting_('CLIENT_NAME', ''),
    docCode: setting_('DOC_CODE', ''), docRev: setting_('DOC_REV', ''),
    pdpa: setting_('PDPA_TEXT', ''), slaDays: Number(setting_('SLA_DAYS', 3))
  };
}

function apiSubmit_(me, d) {
  const cache = CacheService.getScriptCache();
  if (d.reqId) { const dup = cache.get('sub_' + d.reqId); if (dup) return { no: Number(dup), duplicate: true }; }

  const itemIds = (d.item_ids || []).filter(id => { const x = itemById_(id); return x && x.active !== false; });
  const need = { reporter_name: 'ชื่อผู้แจ้ง', department: 'ภาควิชา/หน่วยงาน', phone: 'หมายเลขติดต่อกลับ', building: 'อาคาร' };
  Object.keys(need).forEach(k => { if (!str_(d[k])) throw new Error('กรุณากรอก ' + need[k]); });
  if (buildings_().indexOf(d.building) < 0) throw new Error('อาคารไม่ถูกต้อง');
  if (!itemIds.length) throw new Error('กรุณาเลือกรายการที่ต้องการแจ้งซ่อมอย่างน้อย 1 รายการ');
  if (itemIds.some(id => itemById_(id).needDetail) && !str_(d.detail)) throw new Error('กรุณาระบุรายละเอียด/สาเหตุการแจ้งซ่อม');
  if (itemIds.some(id => itemById_(id).card) && !str_(d.card_name)) throw new Error('กรุณาระบุชื่อ-นามสกุลเจ้าของบัตร');
  const profile = userByUid_(me.uid);
  if (!profile) throw new Error('กรุณาลงทะเบียนผู้แจ้งก่อนแจ้งซ่อม');
  if (!d.pdpa && !profile.pdpa_at) throw new Error('กรุณายอมรับเงื่อนไขการเก็บข้อมูล');
  if (!d.signature) throw new Error('กรุณาลงลายมือชื่อ');

  const now = new Date();
  const groupsSel = groups_().filter(g => g.items.some(it => itemIds.indexOf(it.id) >= 0)).map(g => g.no);
  const t = {
    created_at: now, status: STATUS.NEW,
    reporter_uid: me.uid, reporter_line_name: me.name,
    reporter_name: clip_(d.reporter_name, 100), department: clip_(d.department, 150), phone: clip_(d.phone, 30),
    building: d.building, floor: clip_(d.floor, 10), room: clip_(d.room, 30),
    group_id: groupsSel.join(','), item_ids: itemIds.join(','),
    items_text: itemIds.map(id => itemById_(id).name).join(', '),
    detail: clip_(d.detail, 1000), card_name: clip_(d.card_name, 100), card_no: clip_(d.card_no, 50),
    category_auto: autoCategory_(itemIds), category: autoCategory_(itemIds),
    due_date: addDays_(dayStart_(now), Number(setting_('SLA_DAYS', 3))), reject_count: 0
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    settings_._cache = null;
    t.no = Number(setting_('NEXT_NO', 1));
    setSetting_('NEXT_NO', t.no + 1);
    t._row = appendObj_(SH.REQ, REQ_FIELDS, t);
  } finally { lock.releaseLock(); }
  if (d.reqId) cache.put('sub_' + d.reqId, String(t.no), 3600);

  const folder = ticketFolder_(t);
  const patch = { sig_reporter_id: saveDataUrl_(d.signature, folder, 'sig_reporter') };
  patch.photo_ids = (d.photos || []).slice(0, 4).map((p, i) => saveDataUrl_(p, folder, 'photo_' + (i + 1))).join(',');
  updateObj_(SH.REQ, REQ_FIELDS, t._row, patch);
  Object.assign(t, patch);
  log_(t.no, 'แจ้งซ่อม', '', STATUS.NEW, me, t.items_text);
  notifyNewTicket_(t);
  return { no: t.no, due: thaiShort_(t.due_date) };
}

function apiMyTickets_(me) {
  const list = allTickets_().filter(t => t.reporter_uid === me.uid)
    .sort((a, b) => b.no - a.no).slice(0, 30)
    .map((t, i) => toClient_(t, i < 10));   // 10 ใบล่าสุดส่งรายละเอียดเต็ม กดดูได้ทันที
  return { tickets: list };
}

function apiGetTicket_(me, no) {
  const t = getTicket_(no);
  if (!canView_(me, t)) throw new Error('ไม่มีสิทธิ์ดูใบแจ้งซ่อมนี้');
  return { ticket: toClient_(t, true, !!me.staff), canWork: canWork_(me, t), isReporter: t.reporter_uid === me.uid };
}

/** โหลดรูปทีละใบ (หน้าเว็บเรียกหลังวาดหน้าเสร็จ) */
function apiPhoto_(me, d) {
  const t = getTicket_(d.no);
  if (!canView_(me, t)) throw new Error('ไม่มีสิทธิ์ดูใบแจ้งซ่อมนี้');
  const id = str_(d.id);
  const own = idsOf_(t.photo_ids).concat(idsOf_(t.after_photo_ids));
  if (own.indexOf(id) < 0) throw new Error('ไม่พบรูปนี้ในใบแจ้งซ่อม');
  return { id: id, src: fileToDataUrl_(id) };
}

function apiAck_(me, no) {
  const t = getTicket_(no);
  if (t.reporter_uid !== me.uid) throw new Error('เฉพาะผู้แจ้ง');
  if (!t.ack_at) updateTicket_(t, { ack_at: new Date(), ack_by: t.reporter_name || me.name }, 'ผู้แจ้งรับทราบนัดหมาย', me, 'ผ่านหน้าเว็บ');
  return { ticket: toClient_(t, false) };
}

/** ตรวจรับงาน — ผู้แจ้งทาง LINE หรือคนหน้างานเซ็นบนเครื่องช่าง (onsite) */
function apiAccept_(me, d) {
  const t = getTicket_(d.no);
  const onsite = !!d.onsite;
  if (onsite) { if (!canWork_(me, t)) throw new Error('ไม่มีสิทธิ์'); }
  else if (t.reporter_uid !== me.uid) throw new Error('เฉพาะผู้แจ้ง');
  if (t.status !== STATUS.WAIT_ACCEPT) throw new Error('ใบแจ้งซ่อมนี้ไม่อยู่ในสถานะรอตรวจรับ (' + t.status + ')');
  const pass = d.result === 'pass';
  const rating = Number(d.rating);
  if (!(rating >= 1 && rating <= 5)) throw new Error('กรุณาให้คะแนนประเมิน');
  if (!pass && !str_(d.reason)) throw new Error('กรุณาระบุสิ่งที่ต้องแก้ไข');
  if (!str_(d.signer_name)) throw new Error('กรุณาระบุชื่อผู้ลงนาม');
  if (!d.signature) throw new Error('กรุณาลงลายมือชื่อ');

  const now = new Date();
  const sigId = saveDataUrl_(d.signature, ticketFolder_(t), 'sig_accept_' + fmt_(now, 'yyyyMMdd_HHmmss'));
  const via = onsite ? ('เซ็นหน้างานบนเครื่องช่าง (' + me.name + ')') : 'LINE ผู้แจ้ง';
  const patch = {
    accept_result: pass ? 'แล้วเสร็จ' : 'ไม่แล้วเสร็จ', accept_reason: clip_(d.reason, 500), rating: rating,
    signer_name: clip_(d.signer_name, 100), sig_accept_id: sigId, accept_via: via, accepted_at: now
  };
  if (pass) {
    patch.status = STATUS.CLOSED;
    updateTicket_(t, patch, 'ตรวจงาน: ผ่าน', me, via + ' | คะแนน ' + rating);
    try { generateTicketPdf_(t); } catch (e) { logError_(e, 'pdf ' + t.no); }
    notifyClosed_(t, rating);
  } else {
    // งานแก้ (Rework): เริ่มนับ SLA ใหม่จากวันที่ส่งกลับแก้ไข
    patch.status = STATUS.REJECTED;
    patch.reject_count = Number(t.reject_count || 0) + 1;
    patch.rework_at = now;
    patch.rework_due = addDays_(dayStart_(now), Number(setting_('SLA_DAYS', 3)));
    patch.rework_pause_days = 0;
    updateTicket_(t, patch, 'ตรวจงาน: ส่งกลับแก้ไข (ครั้งที่ ' + patch.reject_count + ')', me, via + ' | ' + patch.accept_reason);
    const msg = ticketFlex_(t, 'ผู้แจ้งส่งกลับแก้ไข', '#C92A2A', [{ label: 'เปิดงาน', uri: liffUrl_('staff', t.no) }],
      [['สิ่งที่ต้องแก้ไข', patch.accept_reason], ['กำหนดแก้เสร็จ', thaiShort_(patch.rework_due)]]);
    if (t.assigned_uid) push_(t.assigned_uid, msg);
    activeStaff_('admin').filter(s => s.uid !== t.assigned_uid).forEach(s => push_(s.uid, msg));
  }
  return { ticket: toClient_(t, false) };
}

/** ลงทะเบียน/แก้ไขข้อมูลผู้แจ้ง (ผูก LINE กับข้อมูลบุคลากร) */
function apiSaveProfile_(me, d) {
  const need = { name: 'ชื่อ-นามสกุล', department: 'ภาควิชา/หน่วยงาน', phone: 'หมายเลขติดต่อกลับ' };
  Object.keys(need).forEach(k => { if (!str_(d[k])) throw new Error('กรุณากรอก ' + need[k]); });
  if (d.building && buildings_().indexOf(d.building) < 0) throw new Error('อาคารไม่ถูกต้อง');
  if (!str_(d.building) && !str_(d.floor) && !str_(d.room)) throw new Error('กรุณาระบุสถานที่ทำงานประจำ อย่างน้อย 1 ช่อง (อาคาร ชั้น หรือห้อง)');
  const ex = userByUid_(me.uid);
  if (!d.pdpa && !(ex && ex.pdpa_at)) throw new Error('กรุณายอมรับเงื่อนไขการเก็บข้อมูล');
  const now = new Date();
  const patch = { uid: me.uid, line_name: clip_(me.name, 100), name: clip_(d.name, 100), department: clip_(d.department, 150), phone: clip_(d.phone, 30),
    building: str_(d.building), floor: clip_(d.floor, 10), room: clip_(d.room, 30), updated_at: now };
  if (ex) {
    updateObj_(SH.USERS, USER_FIELDS, ex._row, patch);
    log_('', 'แก้ไขข้อมูลผู้แจ้ง', '', '', { uid: me.uid, name: patch.name }, patch.department);
  } else {
    appendObj_(SH.USERS, USER_FIELDS, Object.assign(patch, { pdpa_at: now, registered_at: now }));
    log_('', 'ลงทะเบียนผู้แจ้ง', '', '', { uid: me.uid, name: patch.name }, patch.department + ' | ยินยอม PDPA');
  }
  return { profile: profileOut_(userByUid_(me.uid)) };
}

/** พักงาน (รออะไหล่/บริษัทภายนอก) — หยุดนับเวลา KPI จนกว่าจะกด "ทำงานต่อ" */
function apiPause_(me, d) {
  const t = getTicket_(d.no);
  if (!canWork_(me, t)) throw new Error('ไม่มีสิทธิ์');
  if (WORKING_STATUSES.indexOf(t.status) < 0) throw new Error('ไม่สามารถพักงานในสถานะ ' + t.status);
  const reason = clip_(d.reason, 300);
  if (!reason) throw new Error('กรุณาระบุเหตุผลการพักงาน');
  updateTicket_(t, { status: STATUS.PAUSED, pause_from: t.status, paused_at: new Date(), pause_reason: reason }, 'พักงาน (หยุดนับเวลา)', me, reason);
  push_(t.reporter_uid, ticketFlex_(t, 'งานพักชั่วคราว', '#E67700', [{ label: 'ดูรายละเอียด', uri: liffUrl_('ticket', t.no) }],
    [['เหตุผล', reason], ['ช่าง', t.assigned_name]]));
  return { ticket: toClient_(t, false) };
}

function apiResume_(me, d) {
  const t = getTicket_(d.no);
  if (!canWork_(me, t)) throw new Error('ไม่มีสิทธิ์');
  if (t.status !== STATUS.PAUSED) throw new Error('งานนี้ไม่ได้พักอยู่');
  resumeTicket_(t, me);
  return { ticket: toClient_(t, false) };
}

/** กลับมาทำงานต่อ: บวกวันที่พักเข้าไปในกำหนดเสร็จของรอบปัจจุบัน */
function resumeTicket_(t, me) {
  const days = Math.max(0, daysBetween_(t.paused_at || new Date(), new Date()));
  const patch = { status: t.pause_from && WORKING_STATUSES.indexOf(t.pause_from) >= 0 ? t.pause_from : STATUS.ASSIGNED, paused_at: '', pause_from: '' };
  if (isRework_(t)) {
    patch.rework_pause_days = Number(t.rework_pause_days || 0) + days;
    if (t.rework_due) patch.rework_due = addDays_(t.rework_due, days);
  } else {
    patch.pause_days = Number(t.pause_days || 0) + days;
    if (t.due_date) patch.due_date = addDays_(t.due_date, days);
  }
  updateTicket_(t, patch, 'ทำงานต่อ (พัก ' + days + ' วัน)', me, t.pause_reason + ' | กำหนดเสร็จใหม่ ' + thaiShort_(curDue_(Object.assign({}, t, patch))));
  return t;
}

/** ตอบรายการงานที่ยังไม่มีคนรับ + งานเกินกำหนด (ข้อความตอบกลับ ไม่เสียโควตา) */
function replyPending_(replyToken, withLink) {
  const all = allTickets_();
  const now = new Date();
  const wait = all.filter(t => t.status === STATUS.NEW).sort((a, b) => a.no - b.no);
  const late = all.filter(t => t.status !== STATUS.NEW && isOverdue_(t)).sort((a, b) => a.no - b.no);
  if (!wait.length && !late.length) {
    reply_(replyToken, text_('ไม่มีงานค้างรอมอบหมาย และไม่มีงานเกินกำหนด 👍' + (withLink ? '\n\nดูภาพรวมทั้งหมด: ' + liffUrl_('dash') : '')));
    return;
  }
  const msgs = [];
  let head = '📋 สรุป ณ ' + thaiDateTime_(now);
  head += '\n• รอมอบหมาย ' + wait.length + ' ใบ';
  if (late.length) head += '\n• เกินกำหนด ' + late.length + ' ใบ: ' + late.slice(0, 10).map(t => '#' + t.no + ' (' + (t.assigned_name || 'ยังไม่มอบหมาย') + ')').join(', ');
  if (withLink) head += '\nภาพรวมทั้งหมด: ' + liffUrl_('dash');
  msgs.push(text_(head));
  if (wait.length) {
    msgs.push({ type: 'flex', altText: 'งานรอมอบหมาย ' + wait.length + ' ใบ', contents: { type: 'carousel',
      contents: wait.slice(0, 10).map(t => ticketFlex_(t, 'รอมอบหมาย · แจ้งมา ' + daysBetween_(t.created_at, now) + ' วัน', '#E8590C',
        [{ label: 'เปิดดู / มอบหมายงาน', uri: liffUrl_('staff', t.no) }], [['กำหนดเสร็จ', thaiShort_(curDue_(t))]]).contents) } });
  }
  reply_(replyToken, msgs);
}

/** แจ้งกลุ่ม (หรือแอดมิน) ว่างานปิดจบแล้ว พร้อมคะแนนที่ผู้แจ้งให้ */
function notifyClosed_(t, rating) {
  try {
    const stars = '★'.repeat(Number(rating) || 0) + '☆'.repeat(5 - (Number(rating) || 0));
    const msg = ticketFlex_(t, 'ปิดงานเรียบร้อย · ตรวจรับแล้ว', '#2B8A3E', [], [
      ['ช่าง', t.assigned_name],
      ['วันที่เสร็จ', thaiShort_(t.done_at)],
      ['ผู้ตรวจรับ', t.signer_name],
      ['คะแนน', stars + ' (' + rating + '/5)'],
      ['ผลตามเกณฑ์', t.iso + (t.rework_iso ? ' / งานแก้: ' + t.rework_iso : '')]
    ]);
    const gid = str_(setting_('NOTIFY_GROUP_ID', ''));
    if (setting_('NOTIFY_NEW', 'admins') === 'group' && gid) push_(gid, msg);
    else pushAdmins_(msg);
  } catch (e) { logError_(e, 'notifyClosed ' + t.no); }
}

function apiRegister_(me, d) {
  const code = str_(d.code);
  let role = '';
  if (code && code === str_(setting_('REGISTER_CODE_ADMIN', ''))) role = 'admin';
  else if (code && code === str_(setting_('REGISTER_CODE_TECH', ''))) role = 'tech';
  if (!role) throw new Error('รหัสลงทะเบียนไม่ถูกต้อง');
  if (!str_(d.name)) throw new Error('กรุณากรอกชื่อ-นามสกุล');
  const existing = allStaff_().find(s => s.uid === me.uid);
  const patch = { uid: me.uid, name: clip_(d.name, 100), role: role, active: true, phone: clip_(d.phone, 30) };
  if (existing) updateObj_(SH.STAFF, STAFF_FIELDS, existing._row, patch);
  else appendObj_(SH.STAFF, STAFF_FIELDS, Object.assign(patch, { registered_at: new Date() }));
  log_('', 'ลงทะเบียนเจ้าหน้าที่ (' + role + ')', '', '', { uid: me.uid, name: patch.name }, '');
  const staffMenu = setting_('RICHMENU_STAFF_ID', '');
  if (staffMenu) { try { lineApi_('/v2/bot/user/' + me.uid + '/richmenu/' + staffMenu, null); } catch (e) { logError_(e, 'link richmenu'); } }
  return { role: role };
}

/* ---------- เจ้าหน้าที่ ---------- */
function apiStaffTickets_(me) {
  requireStaff_(me);
  const cutoff = addDays_(new Date(), -45);
  const all = allTickets_();
  let list;
  if (me.role === 'admin') list = all.filter(t => OPEN_STATUSES.indexOf(t.status) >= 0 || new Date(t.created_at) >= cutoff);
  else list = all.filter(t => (t.assigned_uid === me.uid && (OPEN_STATUSES.indexOf(t.status) >= 0 || new Date(t.created_at) >= cutoff)) || t.status === STATUS.NEW);
  list.sort((a, b) => b.no - a.no);
  const month = fmt_(new Date(), 'yyyy-MM');
  return {
    // งานที่ยังไม่ปิด ส่งรายละเอียดเต็มมาเลย (ไม่รวมประวัติ) หน้าเว็บจะเปิดใบงานได้ทันทีโดยไม่ต้องยิงใหม่
    tickets: list.map(t => toClient_(t, OPEN_STATUSES.indexOf(t.status) >= 0)),
    techs: activeStaff_().map(s => ({ uid: s.uid, name: s.name, role: s.role })),
    me: { uid: me.uid, name: me.name, role: me.role, hasSignature: !!me.staff.sig_id },
    month: month, stats: monthStats_(month)   // รวมมาในครั้งเดียว ไม่ต้องยิง dashboard ซ้ำ
  };
}

function apiAssign_(me, d) {
  requireAdmin_(me);
  const t = getTicket_(d.no);
  if (OPEN_STATUSES.indexOf(t.status) < 0) throw new Error('งานนี้ปิดแล้ว');
  const tech = staffByUid_(d.uid);
  if (!tech) throw new Error('ไม่พบเจ้าหน้าที่');
  const reassign = !!t.assigned_uid && t.assigned_uid !== tech.uid;
  const patch = { assigned_uid: tech.uid, assigned_name: tech.name, assigned_at: new Date() };
  if (t.status === STATUS.NEW) patch.status = STATUS.ASSIGNED;
  updateTicket_(t, patch, reassign ? 'เปลี่ยนผู้รับผิดชอบ' : 'มอบหมายงาน', me, 'ให้ ' + tech.name);
  if (tech.uid !== me.uid) push_(tech.uid, ticketFlex_(t, 'คุณได้รับมอบหมายงาน', '#1C7ED6', [{ label: 'เปิดงาน', uri: liffUrl_('staff', t.no) }], [['กำหนดเสร็จ', thaiShort_(t.due_date)]]));
  return { ticket: toClient_(t, false) };
}

function apiTake_(me, no) {
  requireStaff_(me);
  const t = getTicket_(no);
  if (t.status !== STATUS.NEW) throw new Error('งานนี้มีผู้รับผิดชอบแล้ว');
  updateTicket_(t, { status: STATUS.ASSIGNED, assigned_uid: me.uid, assigned_name: me.name, assigned_at: new Date() }, 'รับงานเอง', me, '');
  return { ticket: toClient_(t, false) };
}

const PLAN_LABEL = { now: 'ซ่อมได้', wait: 'ซ่อมได้ รอจัดอุปกรณ์', external: 'ซ่อมไม่ได้ ติดต่อบริษัทภายนอก' };

function apiPlan_(me, d) {
  const t = getTicket_(d.no);
  if (!canWork_(me, t)) throw new Error('ไม่มีสิทธิ์');
  if ([STATUS.ASSIGNED, STATUS.PLANNED].indexOf(t.status) < 0) throw new Error('ไม่สามารถนัดหมายในสถานะ ' + t.status);
  if (!PLAN_LABEL[d.plan]) throw new Error('กรุณาเลือกผลการประเมิน');
  if (!d.appoint_date) throw new Error('กรุณาระบุวันนัดเข้าทำ');
  if (!/^\d{1,2}:\d{2}$/.test(str_(d.appoint_time))) throw new Error('กรุณาระบุเวลานัดเข้าทำ');
  const patch = {
    status: STATUS.PLANNED, appoint_date: parseDateInput_(d.appoint_date), appoint_time: str_(d.appoint_time), plan: PLAN_LABEL[d.plan],
    plan_days: d.plan === 'now' ? '' : Number(d.plan_days || 0), plan_note: clip_(d.plan_note, 500),
    planned_at: new Date(), ack_at: '', ack_by: '', ack_token: randToken_()
  };
  updateTicket_(t, patch, 'บันทึกนัดหมาย/ประเมิน', me, patch.plan + (patch.plan_days ? ' ' + patch.plan_days + ' วัน' : '') + ' นัด ' + thaiShort_(patch.appoint_date) + ' ' + patch.appoint_time + ' น.');
  const extra = [['นัดเข้าทำ', thaiDate_(t.appoint_date) + ' เวลา ' + t.appoint_time + ' น.'], ['ผลประเมิน', t.plan + (t.plan_days ? ' ภายใน ' + t.plan_days + ' วัน' : '')], ['ช่าง', t.assigned_name]];
  if (t.plan_note) extra.push(['หมายเหตุ', t.plan_note]);
  push_(t.reporter_uid, ticketFlex_(t, 'นัดหมายเข้าดำเนินการ', '#1C7ED6', [
    { label: 'รับทราบ', data: 'act=ack&no=' + t.no + '&t=' + t.ack_token, displayText: 'รับทราบนัดหมาย #' + t.no },
    { label: 'ดูรายละเอียด', uri: liffUrl_('ticket', t.no) }
  ], extra));
  return { ticket: toClient_(t, false) };
}

function apiComplete_(me, d) {
  const t = getTicket_(d.no);
  if (t.status === STATUS.NEW && me.staff) {
    updateTicket_(t, { status: STATUS.ASSIGNED, assigned_uid: me.uid, assigned_name: me.name, assigned_at: new Date() }, 'รับงานเอง', me, '');
  }
  if (!canWork_(me, t)) throw new Error('ไม่มีสิทธิ์');
  if (t.status === STATUS.PAUSED) resumeTicket_(t, me);
  if (WORKING_STATUSES.indexOf(t.status) < 0) throw new Error('ไม่สามารถปิดงานในสถานะ ' + t.status);
  if (!str_(d.cause)) throw new Error('กรุณากรอกสาเหตุที่พบ');
  if (!str_(d.solution)) throw new Error('กรุณากรอกแนวทางการแก้ไข');
  if (categories_().indexOf(d.category) < 0) throw new Error('กรุณาเลือกประเภทของปัญหา');
  const staffRec = staffByUid_(t.assigned_uid);
  if (!staffRec || !staffRec.sig_id) throw new Error('ช่างผู้ปฏิบัติงานยังไม่ได้บันทึกลายเซ็น (เมนู "ลายเซ็นของฉัน")');
  const now = new Date();
  const folder = ticketFolder_(t);
  const afterIds = (d.after_photos || []).slice(0, 4).map((p, i) => saveDataUrl_(p, folder, 'after_' + fmt_(now, 'HHmmss') + '_' + (i + 1)));
  const patch = {
    status: STATUS.WAIT_ACCEPT, cause: clip_(d.cause, 500), solution: clip_(d.solution, 500), advice: clip_(d.advice, 500),
    asset_code: clip_(d.asset_code, 80), category: d.category, done_at: now,
    accept_result: '', accept_reason: '', reminded_at: ''
  };
  const rework = isRework_(t);
  let isoTxt;
  if (!rework) {
    // KPI งานใหม่: นับจากวันแจ้ง หักวันพักงาน
    patch.iso = isoResult_(t.created_at, now, t.pause_days);
    if (!t.first_done_at) patch.first_done_at = now;
    isoTxt = 'ISO งานใหม่: ' + patch.iso;
  } else {
    // KPI งานแก้: นับจากวันที่ส่งกลับแก้ไข หักวันพักงานรอบนี้ (ถ้าเคยไม่ทันในรอบก่อน คงผลไม่ทัน)
    const r = isoResult_(t.rework_at, now, t.rework_pause_days);
    patch.rework_iso = t.rework_iso === 'ไม่ทัน' ? 'ไม่ทัน' : r;
    patch.rework_done_at = now;
    isoTxt = 'ISO งานแก้: ' + r;
  }
  if (afterIds.length) patch.after_photo_ids = afterIds.join(',');
  const detail = (patch.category !== t.category_auto ? 'แก้ประเภทจาก "' + (t.category_auto || '-') + '" เป็น "' + patch.category + '" | ' : '') + isoTxt;
  updateTicket_(t, patch, rework ? 'แก้ไขงานเสร็จ (รอตรวจงาน)' : 'ดำเนินการเสร็จ (รอตรวจงาน)', me, detail);
  if (!d.onsite) sendAcceptRequest_(t);
  return { ticket: toClient_(t, false) };
}

function sendAcceptRequest_(t) {
  return push_(t.reporter_uid, ticketFlex_(t, 'ดำเนินการเสร็จแล้ว กรุณาตรวจงาน', '#2B8A3E',
    [{ label: 'ตรวจงาน (ผ่าน / แก้ไข)', uri: liffUrl_('accept', t.no) }],
    [['สาเหตุที่พบ', t.cause], ['การแก้ไข', t.solution], ['ช่าง', t.assigned_name]]));
}

function apiRequestAccept_(me, no) {
  const t = getTicket_(no);
  if (!canWork_(me, t)) throw new Error('ไม่มีสิทธิ์');
  if (t.status !== STATUS.WAIT_ACCEPT) throw new Error('งานไม่อยู่ในสถานะรอตรวจงาน');
  sendAcceptRequest_(t);
  log_(t.no, 'ส่งคำขอตรวจงานทาง LINE', t.status, t.status, me, '');
  return { sent: true };
}

function apiCancel_(me, d) {
  requireAdmin_(me);
  const t = getTicket_(d.no);
  if (!str_(d.reason)) throw new Error('กรุณาระบุเหตุผลการยกเลิก');
  if (OPEN_STATUSES.indexOf(t.status) < 0) throw new Error('งานนี้ปิดแล้ว');
  updateTicket_(t, { status: STATUS.CANCELLED, remark: 'ยกเลิก: ' + clip_(d.reason, 300) }, 'ยกเลิกใบแจ้งซ่อม', me, d.reason);
  return { ticket: toClient_(t, false) };
}

function apiSaveSignature_(me, d) {
  requireStaff_(me);
  if (!d.signature) throw new Error('กรุณาลงลายมือชื่อ');
  const folder = subFolder_(rootFolder_(), 'ลายเซ็นเจ้าหน้าที่');
  const id = saveDataUrl_(d.signature, folder, me.uid + '_' + fmt_(new Date(), 'yyyyMMdd_HHmmss'));
  updateObj_(SH.STAFF, STAFF_FIELDS, me.staff._row, { sig_id: id });
  log_('', 'บันทึกลายเซ็นเจ้าหน้าที่', '', '', me, '');
  return { saved: true };
}

function apiDashboard_(me, d) {
  requireStaff_(me);
  const month = d.month || fmt_(new Date(), 'yyyy-MM');
  return { month: month, stats: monthStats_(month) };
}

/* ---------- LINE webhook ---------- */
function handleWebhook_(body) {
  (body.events || []).forEach(ev => {
    try { handleEvent_(ev); } catch (e) { logError_(e, 'event ' + ev.type); }
  });
}

function handleEvent_(ev) {
  const uid = ev.source && ev.source.userId;
  if (ev.type === 'follow') {
    reply_(ev.replyToken, text_('ยินดีต้อนรับสู่ระบบแจ้งซ่อม 🛠️\nกดปุ่ม "แจ้งซ่อม" ที่เมนูด้านล่างเพื่อแจ้งปัญหา หรือ "ติดตามงาน" เพื่อดูสถานะ'));
    return;
  }
  if (ev.type === 'postback') {
    const p = {};
    String(ev.postback.data || '').split('&').forEach(kv => { const [k, v] = kv.split('='); p[k] = decodeURIComponent(v || ''); });
    if (p.act === 'ack') {
      const t = getTicket_(p.no);
      if (t.reporter_uid !== uid || !t.ack_token || t.ack_token !== p.t) { reply_(ev.replyToken, text_('ลิงก์รับทราบนี้หมดอายุแล้ว')); return; }
      if (!t.ack_at) updateTicket_(t, { ack_at: new Date(), ack_by: t.reporter_name }, 'ผู้แจ้งรับทราบนัดหมาย', { uid: uid, name: t.reporter_name }, 'ผ่านปุ่มใน LINE');
      reply_(ev.replyToken, text_('รับทราบนัดหมายใบแจ้งซ่อม #' + t.no + ' เรียบร้อย ✅\nนัดเข้าทำ: ' + thaiDate_(t.appoint_date) + ' เวลา ' + t.appoint_time + ' น.'));
    }
    return;
  }
  if (ev.type !== 'message' || ev.message.type !== 'text') return;
  const txt = String(ev.message.text || '').trim();

  const m = txt.match(/^(แจ้งซ่อม|ตรวจรับงาน|ตรวจงาน)\s*#(\d+)/);
  if (m) {
    let t; try { t = getTicket_(m[2]); } catch (e) { return; }
    if (t.reporter_uid !== uid) return;
    if (m[1] === 'แจ้งซ่อม') {
      reply_(ev.replyToken, ticketFlex_(t, 'รับเรื่องแจ้งซ่อมแล้ว', '#E8590C', [{ label: 'ติดตามสถานะ', uri: liffUrl_('ticket', t.no) }], [['กำหนดเสร็จ', thaiDate_(t.due_date)]]));
    } else {
      reply_(ev.replyToken, text_(t.status === STATUS.CLOSED
        ? 'ขอบคุณที่ตรวจงาน #' + t.no + ' 🙏 ใบแจ้งซ่อมปิดเรียบร้อยแล้ว'
        : 'ส่งกลับแก้ไข #' + t.no + ' แล้ว ช่างจะดำเนินการแก้ไขภายใน ' + setting_('SLA_DAYS', 3) + ' วัน'));
    }
    return;
  }
  if (/^(ติดตามงาน|สถานะงาน|สถานะ)$/.test(txt)) {
    const mine = allTickets_().filter(t => t.reporter_uid === uid && OPEN_STATUSES.indexOf(t.status) >= 0).sort((a, b) => b.no - a.no).slice(0, 10);
    if (!mine.length) { reply_(ev.replyToken, text_('ไม่มีงานแจ้งซ่อมที่ค้างอยู่ค่ะ')); return; }
    reply_(ev.replyToken, { type: 'flex', altText: 'งานแจ้งซ่อมของคุณ', contents: { type: 'carousel',
      contents: mine.map(t => ticketFlex_(t, 'ใบแจ้งซ่อม #' + t.no, '#1C7ED6', [{ label: 'ดูรายละเอียด', uri: liffUrl_('ticket', t.no) }]).contents) } });
    return;
  }
  // "งานค้าง" — ตอบรายการงานที่ยังไม่มีคนรับ (ใช้ได้ในกลุ่มที่ผูกไว้ หรือแชตส่วนตัวของเจ้าหน้าที่)
  if (/^(งานค้าง|งานคงค้าง|งานรอมอบหมาย)$/.test(txt)) {
    const inGroup = ev.source.type === 'group' || ev.source.type === 'room';
    const groupId = str_(setting_('NOTIFY_GROUP_ID', ''));
    const okGroup = inGroup && groupId && (ev.source.groupId === groupId || ev.source.roomId === groupId);
    if (!okGroup && !(!inGroup && staffByUid_(uid))) return;
    replyPending_(ev.replyToken, !inGroup);
    return;
  }
  const g = txt.match(/^#(ผูกกลุ่ม|เลิกผูกกลุ่ม)\s*(\S*)/);
  if (g && (ev.source.type === 'group' || ev.source.type === 'room')) {
    // เฉพาะแอดมินที่ลงทะเบียนแล้วเท่านั้น (ตรวจจากบัญชี LINE ของผู้พิมพ์ ไม่ใช่แค่รหัส)
    const me = uid ? staffByUid_(uid) : null;
    if (!me || me.role !== 'admin') {
      reply_(ev.replyToken, text_('เฉพาะหัวหน้างาน/แอดมินที่ลงทะเบียนในระบบแล้วเท่านั้นที่ผูกกลุ่มได้'));
      return;
    }
    const gid = ev.source.groupId || ev.source.roomId;
    const by = { uid: uid, name: me.name };
    if (g[1] === 'ผูกกลุ่ม') {
      setSetting_('NOTIFY_GROUP_ID', gid);
      setSetting_('NOTIFY_NEW', 'group');
      log_('', 'ผูกกลุ่มแจ้งเตือน', '', '', by, gid);
      reply_(ev.replyToken, text_('ผูกกลุ่มนี้สำหรับแจ้งเตือนงานใหม่เรียบร้อย ✅ (โดย ' + me.name + ')\n\nพิมพ์ "งานค้าง" ในกลุ่มนี้เพื่อดูงานที่ยังไม่มีคนรับได้ตลอด'));
    } else {
      if (str_(setting_('NOTIFY_GROUP_ID', '')) !== gid) { reply_(ev.replyToken, text_('กลุ่มนี้ไม่ได้ถูกผูกไว้อยู่แล้ว')); return; }
      setSetting_('NOTIFY_GROUP_ID', '');
      setSetting_('NOTIFY_NEW', 'admins');
      log_('', 'เลิกผูกกลุ่มแจ้งเตือน', '', '', by, gid);
      reply_(ev.replyToken, text_('เลิกผูกกลุ่มนี้แล้ว ✅ (โดย ' + me.name + ')\nงานใหม่จะส่งแจ้งเตือนไปที่แชตของแอดมินแต่ละคนแทน'));
    }
  }
}

// ===== Docs.gs =====
/** ===== สร้าง PDF ใบแจ้งซ่อม (FM-PPM-2-01) จากเทมเพลต Google Docs ===== */

const CHK = '☑', UNCHK = '☐';

function generateTicketPdf_(t) {
  const tplId = setting_('TICKET_TEMPLATE_ID', '');
  if (!tplId) throw new Error('ยังไม่มีเทมเพลตใบแจ้งซ่อม (TICKET_TEMPLATE_ID)');
  const folder = monthFolder_(t.created_at);
  const docCode = setting_('DOC_CODE', 'FM-PPM-2-01');
  const copy = DriveApp.getFileById(tplId).makeCopy('_tmp_' + docCode + '_' + t.no, folder);
  try {
    const doc = DocumentApp.openById(copy.getId());
    const parts = [doc.getBody()];
    if (doc.getHeader()) parts.push(doc.getHeader());
    if (doc.getFooter()) parts.push(doc.getFooter());

    const vals = ticketPlaceholders_(t);
    parts.forEach(p => Object.keys(vals).forEach(k => p.replaceText('\\{\\{' + k + '\\}\\}', escRepl_(vals[k]))));

    const tech = allStaff_().find(s => s.uid === t.assigned_uid);
    const imgs = {
      SIG_REPORTER: t.sig_reporter_id,
      SIG_TECH: tech && tech.sig_id,
      SIG_ACCEPT: t.sig_accept_id
    };
    Object.keys(imgs).forEach(k => parts.forEach(p => replaceWithImage_(p, k, imgs[k], 110, 34)));
    doc.saveAndClose();

    const pdf = copy.getAs(MimeType.PDF).setName(docCode + '_' + t.no + '.pdf');
    if (t.pdf_id) { try { DriveApp.getFileById(t.pdf_id).setTrashed(true); } catch (e) { /* ignore */ } }
    const file = folder.createFile(pdf);
    updateObj_(SH.REQ, REQ_FIELDS, t._row, { pdf_id: file.getId() });
    t.pdf_id = file.getId();
    return file;
  } finally {
    copy.setTrashed(true);
  }
}

function escRepl_(s) { return String(s === null || s === undefined ? '' : s).replace(/\$/g, '$$$$'); }
function dots_(s, n) { s = str_(s); return s || '.'.repeat(n || 20); }
function ck_(b) { return b ? CHK : UNCHK; }

function ticketPlaceholders_(t) {
  const items = idsOf_(t.item_ids);
  const c = new Date(t.created_at);
  const v = {
    NO: t.no,
    DATE_D: fmt_(c, 'd'), DATE_M: TH_MONTHS[Number(fmt_(c, 'M')) - 1], DATE_Y: beYear_(c),
    DEPT: dots_(t.department, 30), PHONE: dots_(t.phone, 15), FLOOR: dots_(t.floor, 6), ROOM: dots_(t.room, 12),
    DETAIL: dots_(t.detail, 60), CARD_NAME: dots_(t.card_name, 30), CARD_NO: dots_(t.card_no, 25),
    REPORTER_NAME: t.reporter_name, REPORT_DATE: thaiShort_(t.created_at),
    DUE: thaiShort_(t.due_date), APPOINT: dots_(thaiShort_(t.appoint_date), 20), APPOINT_TIME: dots_(t.appoint_time, 6),
    P_WAIT: ck_(t.plan === PLAN_LABEL.now || t.plan === PLAN_LABEL.wait),
    P_WAIT_DAYS: t.plan === PLAN_LABEL.wait ? t.plan_days : (t.plan === PLAN_LABEL.now ? '0' : '......'),
    P_EXT: ck_(t.plan === PLAN_LABEL.external),
    P_EXT_DAYS: t.plan === PLAN_LABEL.external ? t.plan_days : '......',
    PLAN_NOTE: str_(t.plan_note) || '-',
    CAUSE: dots_(t.cause, 40), SOLUTION: dots_(t.solution, 40), ADVICE: str_(t.advice) || '-',
    ASSET: str_(t.asset_code) || '-', CATEGORY: t.category || t.category_auto || '-',
    DONE: thaiShort_(t.done_at), ISO: t.iso || '-',
    ACK: t.ack_at ? 'รับทราบผ่าน LINE: ' + t.ack_by : '(ไม่ได้นัดหมายล่วงหน้า)',
    ACK_DATE: t.ack_at ? thaiDateTime_(t.ack_at) : '',
    TECH_NAME: t.assigned_name || '', TECH_DATE: thaiShort_(t.done_at),
    A_PASS: ck_(t.accept_result === 'แล้วเสร็จ'), A_FAIL: ck_(t.accept_result === 'ไม่แล้วเสร็จ'),
    ACCEPT_DATE: t.accept_result === 'แล้วเสร็จ' ? thaiShort_(t.accepted_at) : '..................',
    REASON: str_(t.accept_reason) || '..........................',
    SIGNER: t.signer_name || '', SIGN_DATE: thaiDateTime_(t.accepted_at), ACCEPT_VIA: t.accept_via || '',
    DOC_CODE: setting_('DOC_CODE', ''), DOC_REV: setting_('DOC_REV', ''),
    GEN: thaiDateTime_(new Date()),
    REF: 'ใบแจ้งซ่อมอิเล็กทรอนิกส์ #' + t.no + ' | ผู้แจ้ง LINE: ' + (t.reporter_line_name || '-') + ' (' + String(t.reporter_uid || '').slice(-6) + ')'
  };
  const tplB = DEFAULT_BUILDINGS;
  tplB.forEach((b, i) => { v['B' + (i + 1)] = ck_(t.building === b); });
  v.BUILDING_OTHER = tplB.indexOf(t.building) < 0 && t.building ? '☑ ' + t.building : '';
  TEMPLATE_ITEM_IDS.forEach(id => { v[id.toUpperCase()] = ck_(items.indexOf(id) >= 0); });
  const other = items.filter(id => TEMPLATE_ITEM_IDS.indexOf(id) < 0).map(id => { const x = itemById_(id); return x ? x.name : id; });
  v.ITEMS_OTHER = other.length ? '☑ ' + other.join(', ') : '';
  if (other.length) v.I4_1 = CHK;
  for (let r = 1; r <= 5; r++) v['R' + r] = ck_(Number(t.rating) === r);
  return v;
}

/** แทนที่ {{KEY}} ด้วยรูปจาก Drive (ปรับขนาดให้พอดีกรอบ maxW x maxH pt) */
function replaceWithImage_(container, key, fileId, maxW, maxH) {
  const pattern = '\\{\\{' + key + '\\}\\}';
  let r = container.findText(pattern);
  while (r) {
    const el = r.getElement().asText();
    const par = el.getParent();
    el.deleteText(r.getStartOffset(), r.getEndOffsetInclusive());
    if (fileId) {
      try {
        const blob = DriveApp.getFileById(fileId).getBlob();
        const img = par.insertInlineImage(par.getChildIndex(el), blob);
        const w = img.getWidth(), h = img.getHeight();
        const s = Math.min(maxW / w, maxH / h, 1);
        img.setWidth(Math.round(w * s)).setHeight(Math.round(h * s));
      } catch (e) { logError_(e, 'insert image ' + key); }
    }
    r = container.findText(pattern);
  }
}

/** เมนู: สร้าง PDF ใบแจ้งซ่อมใหม่ */
function menuRegeneratePdf() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('สร้าง PDF ใบแจ้งซ่อมใหม่', 'ระบุเลขรับแจ้ง', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const t = getTicket_(r.getResponseText());
  const f = generateTicketPdf_(t);
  log_(t.no, 'สร้าง PDF ใบแจ้งซ่อมใหม่', t.status, t.status, { uid: Session.getActiveUser().getEmail(), name: 'ผู้ดูแลระบบ' }, f.getName());
  ui.alert('สร้างแล้ว: ' + f.getUrl());
}

// ===== Report.gs =====
/** ===== สถิติ รายงานรายเดือน งานตั้งเวลา และสำรองข้อมูล ===== */


function ticketsOfMonth_(ym) {
  return allTickets_().filter(t => t.status !== STATUS.CANCELLED && fmt_(t.created_at, 'yyyy-MM') === ym);
}
function catOf_(t) { return t.category || t.category_auto || 'ไม่ระบุ'; }
function round1_(x) { return Math.round(x * 10) / 10; }

function monthStats_(ym) {
  const list = ticketsOfMonth_(ym);
  const s = { ym: ym, total: list.length, byCat: {}, byStatus: {}, byBuilding: {}, byItem: {},
    closed: 0, open: 0, done: 0, isoOk: 0, isoPct: null, avgDays: null, avgResponseH: null,
    rejected: 0, avgRating: null, rated: 0,
    rework: 0, reworkOk: 0, reworkPct: null, paused: 0, pauseDays: 0 };
  categories_().forEach(c => { s.byCat[c] = 0; });
  let sumDays = 0, sumResp = 0, nResp = 0, sumRating = 0;
  list.forEach(t => {
    const c = catOf_(t);
    s.byCat[c] = (s.byCat[c] || 0) + 1;
    s.byStatus[t.status] = (s.byStatus[t.status] || 0) + 1;
    s.byBuilding[t.building] = s.byBuilding[t.building] || { total: 0 };
    s.byBuilding[t.building].total++;
    s.byBuilding[t.building][c] = (s.byBuilding[t.building][c] || 0) + 1;
    idsOf_(t.item_ids).forEach(id => { const it = itemById_(id); if (it) s.byItem[it.name] = (s.byItem[it.name] || 0) + 1; });
    if (t.status === STATUS.CLOSED) s.closed++; else s.open++;
    // KPI งานใหม่: ผลครั้งแรกที่ช่างปิดงาน (หักวันพักงาน)
    const firstDone = t.first_done_at || t.done_at;
    if (firstDone && t.iso) { s.done++; sumDays += netDays_(t.created_at, firstDone, t.pause_days); if (t.iso === 'ทัน') s.isoOk++; }
    // KPI งานแก้ (Rework): นับใหม่จากวันที่ผู้แจ้งส่งกลับแก้ไข
    if (t.rework_iso) { s.rework++; if (t.rework_iso === 'ทัน') s.reworkOk++; }
    const pd = Number(t.pause_days || 0) + Number(t.rework_pause_days || 0);
    if (pd > 0 || t.status === STATUS.PAUSED) { s.paused++; s.pauseDays += pd; }
    const firstAct = t.assigned_at || t.planned_at;
    if (firstAct) { sumResp += (new Date(firstAct) - new Date(t.created_at)) / 3600000; nResp++; }
    if (Number(t.reject_count) > 0) s.rejected++;
    if (Number(t.rating) > 0) { sumRating += Number(t.rating); s.rated++; }
  });
  if (s.done) { s.isoPct = round1_(s.isoOk * 100 / s.done); s.avgDays = round1_(sumDays / s.done); }
  if (s.rework) s.reworkPct = round1_(s.reworkOk * 100 / s.rework);
  if (nResp) s.avgResponseH = round1_(sumResp / nResp);
  if (s.rated) s.avgRating = round1_(sumRating / s.rated);
  return s;
}

function ymShift_(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}
function ymThai_(ym) { const [y, m] = ym.split('-').map(Number); return TH_MONTHS[m - 1] + ' ' + (y + 543); }
function ymThaiShort_(ym) { const [y, m] = ym.split('-').map(Number); return TH_MONTHS_SHORT[m - 1] + ' ' + String(y + 543).slice(-2); }

/* ---------- งานตั้งเวลา ---------- */

/** ทุกวันที่ 1 เวลา 07:00 — รายงานของเดือนที่แล้ว + สำรองข้อมูล */
function monthlyJob() {
  const ym = ymShift_(fmt_(new Date(), 'yyyy-MM'), -1);
  try { generateMonthlyReport(ym); } catch (e) { logError_(e, 'monthly report'); }
  try { backupSpreadsheet_(); } catch (e) { logError_(e, 'backup'); }
}

/** ทุกวัน 08:00 — เตือนตรวจรับ + สรุปงานใกล้/เกินกำหนดให้หัวหน้างาน */
function dailyJob() {
  const now = new Date();
  const remindDays = Number(setting_('ACCEPT_REMIND_DAYS', 2));
  const all = allTickets_();
  all.filter(t => t.status === STATUS.WAIT_ACCEPT && t.done_at && daysBetween_(t.done_at, now) >= remindDays && !t.reminded_at)
    .forEach(t => {
      push_(t.reporter_uid, ticketFlex_(t, 'เตือน: กรุณาตรวจงาน', '#E67700', [{ label: 'ตรวจงาน (ผ่าน / แก้ไข)', uri: liffUrl_('accept', t.no) }], [['เสร็จเมื่อ', thaiShort_(t.done_at)]]));
      updateTicket_(t, { reminded_at: now }, 'แจ้งเตือนผู้แจ้งให้ตรวจรับ', { uid: 'system', name: 'ระบบ' }, '');
    });
  const open = all.filter(t => [STATUS.NEW, STATUS.ASSIGNED, STATUS.PLANNED, STATUS.REJECTED].indexOf(t.status) >= 0 && curDue_(t));
  const today = dayStart_(now).getTime();
  const overdue = open.filter(t => dayStart_(curDue_(t)).getTime() < today);
  const dueToday = open.filter(t => dayStart_(curDue_(t)).getTime() === today);
  const pausedLong = all.filter(t => t.status === STATUS.PAUSED && t.paused_at && daysBetween_(t.paused_at, now) >= 7);
  const waitLong = all.filter(t => t.status === STATUS.WAIT_ACCEPT && t.reminded_at && daysBetween_(t.reminded_at, now) >= 2);
  if (overdue.length || dueToday.length || waitLong.length || pausedLong.length) {
    const fmtList = l => l.map(t => '#' + t.no + ' ' + (t.assigned_name || 'ยังไม่มอบหมาย')).join('\n');
    let msg = '📋 สรุปงานประจำวัน ' + thaiShort_(now);
    if (overdue.length) msg += '\n\n⛔ เกินกำหนด ' + setting_('SLA_DAYS', 3) + ' วัน (' + overdue.length + ')\n' + fmtList(overdue);
    if (dueToday.length) msg += '\n\n⚠️ ครบกำหนดวันนี้ (' + dueToday.length + ')\n' + fmtList(dueToday);
    if (waitLong.length) msg += '\n\n✍️ ผู้แจ้งยังไม่ตรวจงาน (' + waitLong.length + ')\n' + fmtList(waitLong);
    if (pausedLong.length) msg += '\n\n⏸ พักงานเกิน 7 วัน (' + pausedLong.length + ')\n' + pausedLong.map(t => '#' + t.no + ' ' + t.pause_reason).join('\n');
    msg += '\n\nเปิดภาพรวม: ' + liffUrl_('dash');
    pushAdmins_(text_(msg));
  }
}

function backupSpreadsheet_() {
  const folder = subFolder_(rootFolder_(), 'สำรองข้อมูล');
  const f = DriveApp.getFileById(ss_().getId()).makeCopy('Backup_ระบบแจ้งซ่อม_' + fmt_(new Date(), 'yyyy-MM-dd'), folder);
  log_('', 'สำรองข้อมูลรายเดือน', '', '', { uid: 'system', name: 'ระบบ' }, f.getName());
}

/** เมนู: สร้างรายงานเดือนที่เลือก */
function menuMonthlyReport() {
  const ui = SpreadsheetApp.getUi();
  const dflt = ymShift_(fmt_(new Date(), 'yyyy-MM'), -1);
  const r = ui.prompt('สร้างรายงานประจำเดือน', 'ระบุเดือนแบบ ค.ศ. ปปปป-ดด (เช่น ' + dflt + ') เว้นว่าง = ' + dflt, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const ym = str_(r.getResponseText()) || dflt;
  if (!/^\d{4}-\d{2}$/.test(ym)) { ui.alert('รูปแบบเดือนไม่ถูกต้อง'); return; }
  const out = generateMonthlyReport(ym);
  ui.alert('สร้างรายงานแล้ว\n\nรายงาน (แก้ไขได้): ' + out.docUrl + '\nภาคผนวก: ' + out.appendixUrl);
}

/* ---------- รายงานรายเดือน ---------- */

function generateMonthlyReport(ym, opts) {
  opts = opts || {};
  const s = monthStats_(ym);
  const prevYm = ymShift_(ym, -1);
  const prev = monthStats_(prevYm);
  const list = ticketsOfMonth_(ym).sort((a, b) => a.no - b.no);
  const [y, m] = ym.split('-').map(Number);
  const year = String(y);
  const reportFolder = subFolder_(subFolder_(rootFolder_(), 'รายงานรายเดือน'), year);
  const title = 'รายงานสรุปงานบริการดูแลระบบ IT และเครือข่ายประจำเดือน' + ymThai_(ym);

  // เดือนที่ใช้เทียบในกราฟเส้น (ย้อนหลังสูงสุด 6 เดือนที่มีข้อมูล)
  const trendMonths = [];
  for (let i = 5; i >= 0; i--) { const k = ymShift_(ym, -i); if (i === 0 || ticketsOfMonth_(k).length) trendMonths.push(k); }
  const trend = trendMonths.map(k => (k === ym ? s : monthStats_(k)));

  const charts = buildCharts_(s, trendMonths, trend);

  const tpl = setting_('REPORT_TEMPLATE_ID', '');
  const docFile = tpl ? DriveApp.getFileById(tpl).makeCopy(title, reportFolder) : DriveApp.getFileById(DocumentApp.create(title).getId());
  if (!tpl) docFile.moveTo(reportFolder);
  const doc = DocumentApp.openById(docFile.getId());
  const body = doc.getBody();
  body.clear();
  const reportDate = new Date(y, m, 1) > new Date() ? new Date() : new Date(y, m, 1);

  const P = (text, opt) => {
    opt = opt || {};
    const p = body.appendParagraph(text || '');
    p.setFontFamily('Sarabun').setFontSize(opt.size || 12).setBold(!!opt.bold).setLineSpacing(1.15).setSpacingAfter(opt.after === undefined ? 4 : opt.after);
    if (opt.align) p.setAlignment(opt.align);
    if (opt.indent) p.setIndentFirstLine(opt.indent);
    if (opt.underline) p.editAsText().setUnderline(true);
    if (opt.highlight) p.editAsText().setBackgroundColor('#FFF3BF');
    return p;
  };
  const B = (text, highlight) => {
    const li = body.appendListItem(text);
    li.setGlyphType(DocumentApp.GlyphType.BULLET).setFontFamily('Sarabun').setFontSize(12).setBold(false).setSpacingAfter(2);
    if (highlight) li.editAsText().setBackgroundColor('#FFF3BF');
    return li;
  };
  const center = DocumentApp.HorizontalAlignment.CENTER;
  const pct = n => s.total ? Math.round(n * 100 / s.total) : 0;
  const diffTxt = (a, b) => a > b ? 'เพิ่มขึ้น ' + (a - b) + ' งาน' : a < b ? 'ลดลง ' + (b - a) + ' งาน' : 'เท่าเดิม';

  P('วันที่ ' + thaiDate_(reportDate), { align: DocumentApp.HorizontalAlignment.RIGHT });
  P(title.replace('ประจำเดือน', ' ประจำเดือน'), { bold: true, align: center, size: 14, after: 8 });
  P('เรียน  ' + setting_('REPORT_TO', ''), { bold: true });
  P('ตามที่ได้ดำเนินการ ดูแลระบบงาน IT และเครือข่าย ในช่วงเดือน' + ymThai_(ym) + ' ที่ผ่านมา ขอสรุปรายละเอียด และลักษณะงานดังนี้', { indent: 36 });
  P('จำนวนใบแจ้งซ่อม ทั้งหมด ' + s.total + ' ใบงาน โดยสรุป และเปรียบเทียบกับเดือนที่ผ่านมาตามลักษณะงาน ดังนี้', { bold: true, underline: true, after: 6 });

  if (s.total) {
    const pc = body.appendParagraph(''); pc.setAlignment(center); pc.appendInlineImage(charts.pie).setWidth(330).setHeight(206);
  }
  if (trend.length > 1) {
    const lc = body.appendParagraph(''); lc.setAlignment(center); lc.appendInlineImage(charts.line).setWidth(450).setHeight(225);
  }

  // รายละเอียดตามประเภท (เรียงจากมากไปน้อย)
  const cats = Object.keys(s.byCat).filter(c => s.byCat[c] > 0).sort((a, b) => s.byCat[b] - s.byCat[a]);
  cats.forEach((c, i) => {
    const n = s.byCat[c];
    P((i + 1) + '.  ' + c + '  จำนวน ' + n + ' งาน (' + pct(n) + '%)', { bold: true, after: 2 });
    const inCat = list.filter(t => catOf_(t) === c);
    const itemCount = {};
    inCat.forEach(t => idsOf_(t.item_ids).forEach(id => { const it = itemById_(id); if (it) itemCount[it.name] = (itemCount[it.name] || 0) + 1; }));
    const topItems = Object.keys(itemCount).sort((a, b) => itemCount[b] - itemCount[a]).slice(0, 3).map(k => k + ' (' + itemCount[k] + ' งาน)');
    P('ปริมาณงาน' + diffTxt(n, prev.byCat[c] || 0) + ' เมื่อเทียบกับเดือน' + ymThai_(prevYm) + ' (' + (prev.byCat[c] || 0) + ' งาน)' +
      (topItems.length ? ' ส่วนใหญ่เป็นงาน ' + topItems.join(', ') : ''), { indent: 36 });
    inCat.slice(0, 3).forEach(t => B('#' + t.no + ' ' + t.building + (t.room ? ' ห้อง ' + t.room : '') + ' — ' +
      clip_(t.detail || t.items_text, 80) + (t.solution ? ' → ' + clip_(t.solution, 80) : '')));
    P('ข้อเสนอแนะ:', { bold: true, after: 2 });
    B('[กรอกข้อเสนอแนะ]', true);
  });

  // สรุปภาพรวม
  const topCat = cats[0];
  P('');
  P('สรุปในเดือน' + ymThai_(ym) + ' ปริมาณงานเมื่อเทียบกับเดือน' + ymThai_(prevYm) + ' ' + diffTxt(s.total, prev.total) +
    ' (จาก ' + prev.total + ' เป็น ' + s.total + ' ใบงาน)' + (topCat ? ' ประเภทงานที่มากที่สุดคือ ' + topCat + ' ' + s.byCat[topCat] + ' งาน' : '') +
    (s.isoPct !== null ? ' ดำเนินการแล้วเสร็จตามเกณฑ์ ' + setting_('SLA_DAYS', 3) + ' วัน ร้อยละ ' + s.isoPct : '') +
    (s.avgRating !== null ? ' ความพึงพอใจเฉลี่ย ' + s.avgRating + ' จาก 5' : ''), { indent: 36 });
  P('[กรอกบทสรุป/แนวทางปรับปรุงเพิ่มเติม]', { indent: 36, highlight: true });

  // ลงนาม
  P('');
  const sig = body.appendTable([
    ['ผู้จัดทำรายงาน', 'ขอแสดงความนับถือ'],
    ['\n\n' + setting_('REPORT_PREPARER', '') + (setting_('REPORT_PREPARER_POS', '') ? '\n(' + setting_('REPORT_PREPARER_POS') + ')' : ''),
     '\n\n(' + (setting_('REPORT_APPROVER', '') || '..............................') + ')\n' + setting_('REPORT_APPROVER_POS', '')],
    ['ผู้ตรวจสอบ', setting_('ORG_NAME', '')],
    ['\n\n' + setting_('REPORT_REVIEWER', '') + (setting_('REPORT_REVIEWER_POS', '') ? '\n(' + setting_('REPORT_REVIEWER_POS') + ')' : ''), '']
  ]);
  sig.setBorderWidth(0);
  for (let r = 0; r < sig.getNumRows(); r++) for (let c2 = 0; c2 < 2; c2++) {
    const cell = sig.getCell(r, c2);
    cell.editAsText().setFontFamily('Sarabun').setFontSize(12);
    cell.getChild(0).asParagraph().setAlignment(c2 === 1 ? center : DocumentApp.HorizontalAlignment.LEFT);
  }

  // หน้า 2: แยกตามอาคาร / รายการที่แจ้งบ่อย / งานคงค้าง
  body.appendPageBreak();
  // KPI สำหรับ ISO 9001 / Management Review
  P('ตัวชี้วัดคุณภาพการให้บริการ (ISO 9001)', { bold: true, size: 14, align: center, after: 6 });
  const target = Number(setting_('KPI_ISO_TARGET', 90));
  const kpiRows = [
    ['ตัวชี้วัด', 'ผลเดือนนี้', 'เดือนก่อน', 'เป้าหมาย'],
    ['จำนวนใบแจ้งซ่อมทั้งหมด (ใบ)', String(s.total), String(prev.total), '-'],
    ['ปิดงานแล้ว / คงค้าง (ใบ)', s.closed + ' / ' + s.open, prev.closed + ' / ' + prev.open, '-'],
    ['KPI งานใหม่: เสร็จภายใน ' + setting_('SLA_DAYS', 3) + ' วัน (%)', s.isoPct === null ? '-' : s.isoPct + '%', prev.isoPct === null ? '-' : prev.isoPct + '%', '≥ ' + target + '%'],
    ['KPI งานแก้: แก้เสร็จภายใน ' + setting_('SLA_DAYS', 3) + ' วัน (%)', s.reworkPct === null ? '-' : s.reworkPct + '% (' + s.reworkOk + '/' + s.rework + ')', prev.reworkPct === null ? '-' : prev.reworkPct + '%', '≥ ' + target + '%'],
    ['เวลาตอบสนองเฉลี่ย (ชั่วโมง)', s.avgResponseH === null ? '-' : String(s.avgResponseH), prev.avgResponseH === null ? '-' : String(prev.avgResponseH), '-'],
    ['ระยะเวลาดำเนินการเฉลี่ย (วัน)', s.avgDays === null ? '-' : String(s.avgDays), prev.avgDays === null ? '-' : String(prev.avgDays), '≤ ' + setting_('SLA_DAYS', 3)],
    ['งานที่ผู้แจ้งส่งกลับแก้ไข (ใบ)', String(s.rejected), String(prev.rejected), '0'],
    ['งานที่พักรออะไหล่/ภายนอก (ใบ / วันรวม)', s.paused + ' / ' + s.pauseDays, prev.paused + ' / ' + prev.pauseDays, '-'],
    ['ความพึงพอใจเฉลี่ย (เต็ม 5)', s.avgRating === null ? '-' : String(s.avgRating), prev.avgRating === null ? '-' : String(prev.avgRating), '≥ 4.0']
  ];
  styleTable_(body.appendTable(kpiRows), [210, 80, 80, 70]);

  P('');
  P('สรุปงานแจ้งซ่อมแยกตามอาคาร', { bold: true, size: 14, align: center, after: 2 });
  P('(ประจำเดือน' + ymThai_(ym) + ')', { align: center, after: 8 });
  const bRows = [['อาคาร', 'ทั้งหมด'].concat(categories_())];
  buildings_().forEach(b => { const x = s.byBuilding[b] || { total: 0 }; bRows.push([b, String(x.total)].concat(categories_().map(c => String(x[c] || 0)))); });
  bRows.push(['รวมทั้งหมด', String(s.total)].concat(categories_().map(c => String(s.byCat[c] || 0))));
  styleTable_(body.appendTable(bRows), [150, 50, 70, 55, 55, 60], true);

  P('');
  P('รายการที่แจ้งซ่อมบ่อย', { bold: true, after: 4 });
  const iRows = [['รายการ', 'จำนวนใบ']];
  Object.keys(s.byItem).sort((a, b) => s.byItem[b] - s.byItem[a]).forEach(k => iRows.push([k, String(s.byItem[k])]));
  if (iRows.length === 1) iRows.push(['-', '0']);
  styleTable_(body.appendTable(iRows), [360, 80]);

  const pending = list.filter(t => OPEN_STATUSES.indexOf(t.status) >= 0);
  if (pending.length) {
    P('');
    P('งานคงค้าง ณ วันที่จัดทำรายงาน', { bold: true, after: 4 });
    const pRows = [['เลขที่', 'วันที่แจ้ง', 'สถานที่', 'รายการ', 'สถานะ', 'ผู้รับผิดชอบ']];
    pending.forEach(t => pRows.push([String(t.no), thaiShort_(t.created_at), t.building, clip_(t.detail || t.items_text, 50), t.status, t.assigned_name || '-']));
    styleTable_(body.appendTable(pRows), [40, 60, 110, 130, 60, 60]);
  }
  P('');
  P('ภาคผนวก: รายละเอียดใบแจ้งซ่อมทั้งหมด ' + s.total + ' รายการ (ไฟล์ "ภาคผนวก ใบแจ้งซ่อม ' + ymThai_(ym) + '") และใบแจ้งซ่อมฉบับลงนาม (PDF) จัดเก็บในโฟลเดอร์ ใบแจ้งซ่อม/' + ym, { size: 11 });
  if (setting_('REPORT_DOC_CODE', '')) P(setting_('REPORT_DOC_CODE', ''), { size: 9, align: DocumentApp.HorizontalAlignment.RIGHT });
  doc.saveAndClose();

  const appendix = buildAppendix_(ym, list, reportFolder);
  log_('', 'สร้างรายงานประจำเดือน ' + ym, '', '', { uid: 'system', name: 'ระบบ' }, docFile.getUrl());

  const out = { docUrl: docFile.getUrl(), appendixUrl: appendix.pdf.getUrl(), appendixSheetUrl: appendix.sheet.getUrl() };
  const emails = opts.silent ? '' : str_(setting_('REPORT_EMAILS', ''));
  if (emails) {
    MailApp.sendEmail({
      to: emails, subject: title + ' (ร่าง)',
      htmlBody: 'รายงานประจำเดือน' + ymThai_(ym) + ' สร้างอัตโนมัติแล้ว<br>จำนวนใบแจ้งซ่อม ' + s.total + ' ใบ | ทันตามเกณฑ์ ' + (s.isoPct === null ? '-' : s.isoPct + '%') +
        '<br><br>กรุณาตรวจทานและกรอกข้อเสนอแนะ (ช่องสีเหลือง) ก่อนลงนาม<br><a href="' + out.docUrl + '">เปิดรายงาน (Google Docs)</a><br><a href="' + out.appendixUrl + '">ภาคผนวก (PDF)</a>',
      attachments: [docFile.getAs(MimeType.PDF).setName(title + ' (ร่าง).pdf'), appendix.pdf.getBlob()]
    });
  }
  if (!opts.silent) pushAdmins_(text_('📊 ' + title + ' สร้างแล้ว (ร่าง)\nใบแจ้งซ่อม ' + s.total + ' ใบ | ทันตามเกณฑ์ ' + (s.isoPct === null ? '-' : s.isoPct + '%') + '\nตรวจทาน/กรอกข้อเสนอแนะ: ' + out.docUrl));
  return out;
}

function styleTable_(table, widths, boldLast) {
  table.setBorderColor('#8C8C8C');
  const n = table.getNumRows();
  for (let r = 0; r < n; r++) {
    const row = table.getRow(r);
    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);
      cell.setPaddingTop(2).setPaddingBottom(2).setPaddingLeft(4).setPaddingRight(4);
      cell.editAsText().setFontFamily('Sarabun').setFontSize(10.5).setBold(r === 0 || (boldLast && r === n - 1));
      if (widths && widths[c]) cell.setWidth(widths[c]);
      if (r === 0) { cell.setBackgroundColor('#1F3864'); cell.editAsText().setForegroundColor('#FFFFFF'); }
      else if (boldLast && r === n - 1) cell.setBackgroundColor('#FBE4D5');
      else if (r % 2 === 0) cell.setBackgroundColor('#DEEAF6');
      if (c > 0) cell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
  }
  return table;
}

/** สร้างกราฟวงกลม + กราฟเส้นในชีตซ่อน แล้วดึงเป็นรูป */
function buildCharts_(s, trendMonths, trend) {
  const ss = ss_();
  let sh = ss.getSheetByName(SH.RPT);
  if (!sh) { sh = ss.insertSheet(SH.RPT); sh.hideSheet(); }
  sh.clear();
  sh.getCharts().forEach(c => sh.removeChart(c));

  const pieData = [['ประเภท', 'จำนวน']].concat(categories_().map(c => [c, s.byCat[c] || 0]));
  if (s.byCat['ไม่ระบุ']) pieData.push(['ไม่ระบุ', s.byCat['ไม่ระบุ']]);
  sh.getRange(1, 1, pieData.length, 2).setValues(pieData);
  const slices = {};
  pieData.slice(1).forEach((r, i) => { slices[i] = { color: r[0] === 'ไม่ระบุ' ? '#ADB5BD' : catColor_(r[0]) }; });
  const pie = sh.newChart().setChartType(Charts.ChartType.PIE).addRange(sh.getRange(1, 1, pieData.length, 2))
    .setPosition(1, 5, 0, 0).setOption('title', 'สัดส่วนงานแจ้งซ่อม ' + ymThai_(s.ym) + ' (ทั้งหมด ' + s.total + ' ใบงาน)')
    .setOption('pieSliceText', 'value-and-percentage').setOption('legend', { position: 'right' }).setOption('slices', slices)
    .setOption('width', 660).setOption('height', 412).setOption('fontName', 'Sarabun').build();
  sh.insertChart(pie);

  const lineData = [['ประเภท'].concat(trendMonths.map(ymThaiShort_))].concat(categories_().map(c => [c].concat(trend.map(t => t.byCat[c] || 0))));
  sh.getRange(10, 1, lineData.length, lineData[0].length).setValues(lineData);
  const line = sh.newChart().setChartType(Charts.ChartType.LINE).addRange(sh.getRange(10, 1, lineData.length, lineData[0].length))
    .setPosition(25, 5, 0, 0).setOption('title', 'ข้อมูลงานซ่อมแยกตามประเภท (เทียบรายเดือน)').setOption('legend', { position: 'bottom' })
    .setOption('pointSize', 6).setOption('width', 900).setOption('height', 450).setOption('fontName', 'Sarabun')
    .setOption('useFirstColumnAsDomain', true).build();
  sh.insertChart(line);
  SpreadsheetApp.flush();

  const charts = sh.getCharts();
  const out = { pie: charts[0].getBlob().setName('pie.png'), line: charts[1].getBlob().setName('line.png') };
  charts.forEach(c => sh.removeChart(c));
  return out;
}

/** ภาคผนวก: ตารางใบแจ้งซ่อม (คอลัมน์เหมือนรายงานเดิม) เป็น Google Sheet + PDF แนวนอน */
function buildAppendix_(ym, list, folder) {
  const name = 'ภาคผนวก ใบแจ้งซ่อม ' + ymThai_(ym);
  const old = folder.getFilesByName(name); while (old.hasNext()) old.next().setTrashed(true);
  const oldPdf = folder.getFilesByName(name + '.pdf'); while (oldPdf.hasNext()) oldPdf.next().setTrashed(true);
  const ss = SpreadsheetApp.create(name);
  const file = DriveApp.getFileById(ss.getId()); file.moveTo(folder);
  const sh = ss.getSheets()[0]; sh.setName('ใบแจ้งซ่อม');
  const head = ['ลำดับ', 'วันที่แจ้ง', 'ลำดับรับแจ้ง', 'ชื่อผู้แจ้ง', 'สถานที่', 'ชั้น', 'คำรับแจ้ง', 'สถานะ', 'สาเหตุที่พบ', 'แนวทางการแก้ไข',
    'คำแนะนำแก้ไขเบื้องต้น', 'รหัสครุภัณฑ์', 'วันที่เสร็จ', 'ประเภทของปัญหา', 'ISO', 'ผู้ตรวจรับ/คะแนน', 'หมายเหตุ'];
  const rows = list.map((t, i) => [i + 1, fmt_(t.created_at, 'd/M/yyyy'), t.no, t.reporter_name, t.building + (t.room ? ' ห้อง ' + t.room : ''), t.floor,
    t.detail ? t.items_text + ' — ' + t.detail : t.items_text, t.status, t.cause, t.solution, t.advice, t.asset_code,
    fmt_(t.done_at, 'd/M/yyyy'), catOf_(t), t.iso + (t.rework_iso ? ' / แก้: ' + t.rework_iso : ''), t.signer_name ? t.signer_name + ' (' + t.rating + '/5)' : '', t.remark]);
  sh.getRange(1, 1).setValue('ใบแจ้งซ่อม ประจำเดือน' + ymThai_(ym)).setFontWeight('bold').setFontSize(12);
  sh.getRange(2, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#D9D9D9').setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
  if (rows.length) sh.getRange(3, 1, rows.length, head.length).setValues(rows).setWrap(true).setVerticalAlignment('top');
  const all = sh.getRange(2, 1, rows.length + 1, head.length);
  all.setBorder(true, true, true, true, true, true).setFontFamily('Sarabun').setFontSize(8);
  [35, 60, 45, 70, 120, 30, 150, 80, 110, 120, 90, 110, 60, 75, 35, 80, 60].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setFrozenRows(2);
  SpreadsheetApp.flush();
  const url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf&gid=' + sh.getSheetId() +
    '&size=A4&portrait=false&fitw=true&gridlines=false&printtitle=false&sheetnames=false&pagenum=CENTER&fzr=true' +
    '&top_margin=0.4&bottom_margin=0.4&left_margin=0.3&right_margin=0.3';
  const blob = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob().setName(name + '.pdf');
  const pdf = folder.createFile(blob);
  return { sheet: file, pdf: pdf };
}

// ===== Dashboard.gs =====
/** ===== หน้าภาพรวม (Dashboard) สำหรับเจ้าหน้าที่ — รวมทุกอย่างไว้จุดเดียว ===== */

function apiOverview_(me, d) {
  requireStaff_(me);
  const nowYm = fmt_(new Date(), 'yyyy-MM');
  const ym = /^\d{4}-\d{2}$/.test(str_(d.month)) ? d.month : nowYm;
  const all = allTickets_();
  const s = monthStats_(ym), prev = monthStats_(ymShift_(ym, -1));
  const [y, m] = ym.split('-').map(Number);
  const nDays = new Date(y, m, 0).getDate();

  // งานรายวัน: แจ้งเข้า / ทำเสร็จ
  const daily = [];
  for (let i = 1; i <= nDays; i++) daily.push({ d: i, in: 0, done: 0 });
  all.forEach(t => {
    if (t.status === STATUS.CANCELLED) return;
    if (fmt_(t.created_at, 'yyyy-MM') === ym) daily[Number(fmt_(t.created_at, 'd')) - 1].in++;
    if (t.done_at && fmt_(t.done_at, 'yyyy-MM') === ym) daily[Number(fmt_(t.done_at, 'd')) - 1].done++;
  });

  // ตามช่าง
  const monthList = ticketsOfMonth_(ym);
  const techs = activeStaff_().map(st => {
    const mine = monthList.filter(t => t.assigned_uid === st.uid);
    const done = mine.filter(t => t.done_at);
    const rated = mine.filter(t => Number(t.rating) > 0);
    return {
      name: st.name, role: st.role,
      openNow: all.filter(t => t.assigned_uid === st.uid && OPEN_STATUSES.indexOf(t.status) >= 0).length,
      month: mine.length,
      closed: mine.filter(t => t.status === STATUS.CLOSED).length,
      isoPct: done.filter(t => t.iso).length ? round1_(done.filter(t => t.iso === 'ทัน').length * 100 / done.filter(t => t.iso).length) : null,
      rework: mine.filter(t => Number(t.reject_count) > 0).length,
      rating: rated.length ? round1_(rated.reduce((a, t) => a + Number(t.rating), 0) / rated.length) : null
    };
  }).filter(x => x.month || x.openNow || x.role === 'tech');

  // งานที่ต้องติดตาม (ทุกเดือน ณ ปัจจุบัน)
  const today = dayStart_(new Date()).getTime();
  const open = all.filter(t => OPEN_STATUSES.indexOf(t.status) >= 0);
  const row = t => Object.assign(toClient_(t, false), {
    waitDays: t.done_at ? daysBetween_(t.done_at, new Date()) : null,
    ageDays: daysBetween_(t.created_at, new Date())
  });
  const working = open.filter(t => [STATUS.NEW, STATUS.ASSIGNED, STATUS.PLANNED, STATUS.REJECTED].indexOf(t.status) >= 0 && curDue_(t));
  const follow = {
    overdue: working.filter(t => dayStart_(curDue_(t)).getTime() < today).map(row),
    dueToday: working.filter(t => dayStart_(curDue_(t)).getTime() === today).map(row),
    paused: open.filter(t => t.status === STATUS.PAUSED).map(t => Object.assign(row(t), { pausedDays: daysBetween_(t.paused_at, new Date()) })),
    unassigned: open.filter(t => t.status === STATUS.NEW).map(row),
    waitAccept: open.filter(t => t.status === STATUS.WAIT_ACCEPT).map(row),
    rejected: open.filter(t => t.status === STATUS.REJECTED).map(row)
  };

  // เดือนที่มีข้อมูล (ให้เลือกดู)
  const months = {};
  all.forEach(t => { months[fmt_(t.created_at, 'yyyy-MM')] = 1; });
  months[nowYm] = 1;

  return {
    ym: ym, label: ymThai_(ym), lastDay: ym === nowYm ? Number(fmt_(new Date(), 'd')) : 0, prevLabel: ymThai_(ymShift_(ym, -1)), slaDays: Number(setting_('SLA_DAYS', 3)),
    months: Object.keys(months).sort().reverse().slice(0, 24).map(k => ({ ym: k, label: ymThai_(k) })),
    stats: s, prev: prev, daily: daily, techs: techs, follow: follow,
    buildings: buildings_().map(b => ({ name: b, n: (s.byBuilding[b] || { total: 0 }).total })),
    categories: categories_().map(c => ({ name: c, color: catColor_(c), n: s.byCat[c] || 0, prev: prev.byCat[c] || 0 })),
    topItems: Object.keys(s.byItem).sort((a, b) => s.byItem[b] - s.byItem[a]).slice(0, 5).map(k => ({ name: k, n: s.byItem[k] })),
    reports: listReports_(),
    isAdmin: me.role === 'admin',
    kpiTarget: Number(setting_('KPI_ISO_TARGET', 90))
  };
}

/** รายงานที่สร้างแล้ว (ล่าสุดก่อน) */
function listReports_() {
  const out = [];
  try {
    const base = subFolder_(rootFolder_(), 'รายงานรายเดือน');
    const years = base.getFolders();
    while (years.hasNext()) {
      const f = years.next().getFiles();
      while (f.hasNext()) {
        const x = f.next();
        const mt = x.getMimeType();
        if (mt !== MimeType.GOOGLE_DOCS && mt !== MimeType.PDF) continue;
        out.push({ name: x.getName(), url: x.getUrl(), kind: mt === MimeType.PDF ? 'PDF' : 'Docs', updated: thaiDateTime_(x.getLastUpdated()), t: x.getLastUpdated().getTime() });
      }
    }
  } catch (e) { logError_(e, 'listReports'); }
  return out.sort((a, b) => b.t - a.t).slice(0, 8);
}

/** สร้างรายงานจากหน้า Dashboard (ไม่ส่งอีเมล/แจ้งเตือน) */
function apiGenerateReport_(me, d) {
  requireAdmin_(me);
  const ym = /^\d{4}-\d{2}$/.test(str_(d.month)) ? d.month : fmt_(new Date(), 'yyyy-MM');
  const out = generateMonthlyReport(ym, { silent: true });
  log_('', 'สร้างรายงานจากหน้าภาพรวม ' + ym, '', '', me, out.docUrl);
  return out;
}

// ===== Setup.gs =====
/** ===== ติดตั้งระบบ / เมนู / Trigger / Rich menu / ย้ายบัญชี ===== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('ระบบแจ้งซ่อม')
    .addItem('สร้างรายงานประจำเดือน...', 'menuMonthlyReport')
    .addItem('สร้าง PDF ใบแจ้งซ่อมใหม่...', 'menuRegeneratePdf')
    .addItem('ตรวจโควตาข้อความ LINE', 'checkMessageQuota')
    .addSeparator()
    .addItem('1) ตั้งค่าเริ่มต้น (setup)', 'setup')
    .addItem('2) ติดตั้งงานตั้งเวลา (triggers)', 'installTriggers')
    .addItem('3) สร้าง Rich menu', 'setupRichMenu')
    .addItem('ทดสอบการเชื่อมต่อ LINE', 'testLine')
    .addToUi();
}

function setup() {
  const ss = ss_();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone(TZ);
  if (/^(สเปรดชีตไม่มีชื่อ|Untitled)/.test(ss.getName())) ss.rename('ระบบแจ้งซ่อม LINE');

  ensureSheet_(SH.REQ, REQ_FIELDS, '#1F3864');
  ensureSheet_(SH.LOG, LOG_FIELDS, '#5C3D2E');
  ensureSheet_(SH.STAFF, STAFF_FIELDS, '#2B8A3E');
  ensureSheet_(SH.USERS, USER_FIELDS, '#1864AB');

  // Settings: เพิ่มเฉพาะ key ที่ยังไม่มี (ไม่ทับค่าที่ตั้งไว้)
  let set = ss.getSheetByName(SH.SET);
  if (!set) {
    set = ss.insertSheet(SH.SET);
    set.getRange(1, 1, 1, 3).setValues([['key', 'value', 'คำอธิบาย']]).setFontWeight('bold').setBackground('#495057').setFontColor('#FFFFFF');
    set.setFrozenRows(1); set.setColumnWidth(1, 200); set.setColumnWidth(2, 320); set.setColumnWidth(3, 420);
  }
  const have = set.getLastRow() > 1 ? set.getRange(2, 1, set.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : [];
  DEFAULT_SETTINGS.filter(r => have.indexOf(r[0]) < 0).forEach(r => set.appendRow(r));
  settings_._cache = null;
  // key ที่มีอยู่แต่ยังว่าง ให้เติมค่าเริ่มต้น (ถ้ามี)
  DEFAULT_SETTINGS.forEach(r => { if (r[1] !== '' && setting_(r[0], '') === '') setSetting_(r[0], r[1]); });
  if (!setting_('REGISTER_CODE_TECH', '')) setSetting_('REGISTER_CODE_TECH', 'T' + Math.floor(100000 + Math.random() * 900000));
  if (!setting_('REGISTER_CODE_ADMIN', '')) setSetting_('REGISTER_CODE_ADMIN', 'A' + Math.floor(100000 + Math.random() * 900000));

  // รายการที่แก้เองได้: อาคาร / รายการแจ้งซ่อม / ประเภทปัญหา
  ensureListSheets_();
  const oldLists = ss.getSheetByName(SH.LISTS); if (oldLists) ss.deleteSheet(oldLists);

  if (!ss.getSheetByName(SH.ERR)) { const e = ss.insertSheet(SH.ERR); e.appendRow(['วันเวลา', 'ที่มา', 'ข้อผิดพลาด']); }
  const s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (s1 && ss.getSheets().length > 1 && s1.getLastRow() === 0) ss.deleteSheet(s1);

  // Drive
  if (!setting_('ROOT_FOLDER_ID', '')) {
    const root = DriveApp.createFolder('ระบบแจ้งซ่อม LINE');
    DriveApp.getFileById(ss.getId()).moveTo(root);
    setSetting_('ROOT_FOLDER_ID', root.getId());
  }
  ['ใบแจ้งซ่อม', 'รายงานรายเดือน', 'สำรองข้อมูล', 'เทมเพลต', 'ลายเซ็นเจ้าหน้าที่'].forEach(n => subFolder_(rootFolder_(), n));

  let tplMsg = '';
  if (setting_('WEB_BASE_URL', '') && (!setting_('TICKET_TEMPLATE_ID', '') || !setting_('REPORT_TEMPLATE_ID', ''))) {
    try { importTemplates_(); tplMsg = '\nนำเข้าเทมเพลตเอกสารแล้ว'; }
    catch (e) { tplMsg = '\n(ยังนำเข้าเทมเพลตไม่ได้: ตรวจว่าหน้าเว็บ GitHub Pages เปิดได้แล้ว แล้วรัน setup อีกครั้ง)'; logError_(e, 'importTemplates'); }
  } else if (!setting_('WEB_BASE_URL', '')) tplMsg = '\n(ยังไม่ได้นำเข้าเทมเพลต: กรอก WEB_BASE_URL แล้วรัน setup อีกครั้ง)';

  protectSheets_();
  const msg = 'ตั้งค่าเสร็จ' + tplMsg + '\nรหัสลงทะเบียนช่าง: ' + setting_('REGISTER_CODE_TECH') + '\nรหัสลงทะเบียนแอดมิน: ' + setting_('REGISTER_CODE_ADMIN');
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
}

function ensureSheet_(name, fields, color) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const labels = fields.map(f => f[1]);
  const lastCol = sh.getLastColumn();
  const cur = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  if (!cur.filter(Boolean).length) {
    sh.getRange(1, 1, 1, labels.length).setValues([labels]);
  } else {
    labels.filter(l => cur.indexOf(l) < 0).forEach(l => sh.getRange(1, sh.getLastColumn() + 1).setValue(l)); // เพิ่มคอลัมน์ใหม่ต่อท้าย
  }
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground(color).setFontColor('#FFFFFF').setWrap(true).setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  if (name === SH.REQ) sh.setFrozenColumns(3);
  colMap_._m = null; allTickets_._m = null; allStaff_._m = null; allUsers_._m = null;
  return sh;
}

/** ป้องกันการแก้ไขข้อมูลโดยตรง — แก้ได้เฉพาะเจ้าของไฟล์ (ระบบ) ; ผู้ที่ได้รับแชร์ดูได้อย่างเดียว */
function protectSheets_() {
  [SH.REQ, SH.LOG, SH.STAFF, SH.USERS, SH.SET].concat(LIST_SHEETS).forEach(n => {
    const sh = ss_().getSheetByName(n);
    if (!sh) return;
    sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
    const p = sh.protect().setDescription('ระบบแจ้งซ่อม: ห้ามแก้ไขโดยตรง (ISO record control)');
    p.getEditors().forEach(u => { try { p.removeEditor(u); } catch (e) { /* owner */ } });
    if (p.canDomainEdit()) p.setDomainEdit(false);
  });
}

/** บันทึกการแก้ไขด้วยมือทุกครั้งลง StatusLog (audit trail) */
function onEditAudit(e) {
  try {
    const sh = e.range.getSheet();
    if (LIST_SHEETS.indexOf(sh.getName()) >= 0) clearListsCache_();
    if ([SH.REQ, SH.STAFF, SH.SET].concat(LIST_SHEETS).indexOf(sh.getName()) < 0 || e.range.getRow() === 1) return;
    let no = '';
    if (sh.getName() === SH.REQ) no = sh.getRange(e.range.getRow(), 1).getValue();
    const header = sh.getRange(1, e.range.getColumn()).getValue();
    appendObj_(SH.LOG, LOG_FIELDS, {
      ts: new Date(), no: no, action: 'แก้ไขข้อมูลในชีตโดยตรง', from_status: '', to_status: '',
      by_uid: (e.user && e.user.getEmail && e.user.getEmail()) || Session.getActiveUser().getEmail(), by_name: 'ผู้ดูแลระบบ',
      detail: sh.getName() + '!' + e.range.getA1Notation() + ' [' + header + '] "' + (e.oldValue === undefined ? '' : e.oldValue) + '" → "' + (e.value === undefined ? '(หลายเซลล์)' : e.value) + '"'
    });
  } catch (err) { logError_(err, 'onEditAudit'); }
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyJob').timeBased().atHour(8).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger('monthlyJob').timeBased().onMonthDay(1).atHour(7).inTimezone(TZ).create();
  ScriptApp.newTrigger('onEditAudit').forSpreadsheet(ss_()).onEdit().create();
  try { SpreadsheetApp.getUi().alert('ติดตั้งงานตั้งเวลาแล้ว\n- สรุปงาน/เตือนตรวจรับ ทุกวัน 08:00\n- รายงานรายเดือน + สำรองข้อมูล ทุกวันที่ 1 เวลา 07:00\n- บันทึกการแก้ไขชีตด้วยมือ'); } catch (e) { /* no ui */ }
}

/** นำเข้าเทมเพลต .docx จากเว็บ แล้วแปลงเป็น Google Docs (ต้องเปิด Advanced Service: Drive API) */
function importTemplates_() {
  const base = String(setting_('WEB_BASE_URL', '')).replace(/\/?$/, '/');
  const folder = subFolder_(rootFolder_(), 'เทมเพลต');
  const imp = (file, name, key) => {
    const blob = UrlFetchApp.fetch(base + file).getBlob().setName(file);
    const f = Drive.Files.create({ name: name, mimeType: MimeType.GOOGLE_DOCS, parents: [folder.getId()] }, blob);
    setSetting_(key, f.id);
  };
  imp('ticket_template.docx', 'เทมเพลต ' + setting_('DOC_CODE', 'FM-PPM-2-01') + ' ใบแจ้งซ่อม', 'TICKET_TEMPLATE_ID');
  imp('report_template.docx', 'เทมเพลต รายงานประจำเดือน (หัวกระดาษ)', 'REPORT_TEMPLATE_ID');
}

/** สร้าง Rich menu 2 แบบ: ผู้ใช้ทั่วไป (แจ้งซ่อม | ติดตามงาน) และเจ้าหน้าที่ (+ งานของฉัน) */
function setupRichMenu() {
  const base = String(setting_('WEB_BASE_URL', '')).replace(/\/?$/, '/');
  if (!base || !setting_('LIFF_ID', '')) throw new Error('กรุณากรอก WEB_BASE_URL และ LIFF_ID ก่อน');
  ['RICHMENU_USER_ID', 'RICHMENU_STAFF_ID'].forEach(k => {
    const old = setting_(k, '');
    if (old) { try { lineApi_('/v2/bot/richmenu/' + old, null, 'delete'); } catch (e) { /* ignore */ } }
  });
  const area = (x, w, uri, label) => ({ bounds: { x: x, y: 0, width: w, height: 843 }, action: { type: 'uri', uri: uri, label: label } });
  const make = (name, areas, img) => {
    const r = lineApi_('/v2/bot/richmenu', { size: { width: 2500, height: 843 }, selected: true, name: name, chatBarText: 'เมนูแจ้งซ่อม', areas: areas });
    const png = UrlFetchApp.fetch(base + img).getBlob();
    const up = UrlFetchApp.fetch('https://api-data.line.me/v2/bot/richmenu/' + r.richMenuId + '/content', {
      method: 'post', contentType: 'image/png', payload: png.getBytes(),
      headers: { Authorization: 'Bearer ' + secret_('LINE_CHANNEL_ACCESS_TOKEN') }, muteHttpExceptions: true
    });
    if (up.getResponseCode() >= 300) throw new Error('อัปโหลดรูป rich menu ไม่สำเร็จ: ' + up.getContentText());
    return r.richMenuId;
  };
  const userId = make('ผู้ใช้ทั่วไป', [area(0, 1250, liffUrl_('form'), 'แจ้งซ่อม'), area(1250, 1250, liffUrl_('mine'), 'ติดตามงาน')], 'richmenu_user.png');
  const staffId = make('เจ้าหน้าที่', [area(0, 834, liffUrl_('form'), 'แจ้งซ่อม'), area(834, 833, liffUrl_('mine'), 'ติดตามงาน'), area(1667, 833, liffUrl_('dash'), 'ภาพรวมงาน')], 'richmenu_staff.png');
  lineApi_('/v2/bot/user/all/richmenu/' + userId, null);
  setSetting_('RICHMENU_USER_ID', userId);
  setSetting_('RICHMENU_STAFF_ID', staffId);
  activeStaff_().forEach(s => { try { lineApi_('/v2/bot/user/' + s.uid + '/richmenu/' + staffId, null); } catch (e) { logError_(e, 'link menu'); } });
  try { SpreadsheetApp.getUi().alert('สร้าง Rich menu แล้ว'); } catch (e) { /* no ui */ }
}

function testLine() {
  const info = lineApi_('/v2/bot/info', null, 'get');
  const msg = 'เชื่อมต่อ LINE สำเร็จ: ' + info.displayName + ' (' + info.basicId + ')';
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { console.log(msg); }
}

/* =====================================================================
 * ย้ายไปบัญชี Google ใหม่ (เช่น Gmail → Workspace)
 * 1) บัญชีเดิม: แชร์โฟลเดอร์ "ระบบแจ้งซ่อม LINE" ให้บัญชีใหม่ (ผู้แก้ไข)
 * 2) บัญชีใหม่: ทำสำเนา Spreadsheet (โค้ดติดมาด้วย) → เปิด Apps Script → รัน migrateFromOldRoot()
 *    โดยใส่ ID โฟลเดอร์เดิมใน Script Properties ชื่อ OLD_ROOT_FOLDER_ID
 * 3) Deploy web app ใหม่ → เปลี่ยน URL ใน LINE Webhook และไฟล์ config.js ของหน้าเว็บ
 * ===================================================================== */
function migrateFromOldRoot() {
  const oldRootId = secret_('OLD_ROOT_FOLDER_ID');
  const oldRoot = DriveApp.getFolderById(oldRootId);
  const newRoot = DriveApp.createFolder('ระบบแจ้งซ่อม LINE');
  const map = {};
  const copyRec = (src, dst) => {
    const files = src.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      if (f.getMimeType() === MimeType.GOOGLE_SHEETS && f.getName().indexOf('Backup_') !== 0 && f.getName().indexOf('ภาคผนวก') !== 0) continue; // ไม่คัดลอกไฟล์ระบบตัวเดิม
      map[f.getId()] = f.makeCopy(f.getName(), dst).getId();
    }
    const subs = src.getFolders();
    while (subs.hasNext()) { const s = subs.next(); copyRec(s, dst.createFolder(s.getName())); }
  };
  copyRec(oldRoot, newRoot);
  DriveApp.getFileById(ss_().getId()).moveTo(newRoot);
  const remap = v => idsOf_(v).map(id => map[id] || id).join(',');
  readAll_(SH.REQ, REQ_FIELDS).forEach(t => updateObj_(SH.REQ, REQ_FIELDS, t._row, {
    photo_ids: remap(t.photo_ids), sig_reporter_id: remap(t.sig_reporter_id), after_photo_ids: remap(t.after_photo_ids),
    sig_accept_id: remap(t.sig_accept_id), pdf_id: remap(t.pdf_id)
  }));
  readAll_(SH.STAFF, STAFF_FIELDS).forEach(s => updateObj_(SH.STAFF, STAFF_FIELDS, s._row, { sig_id: remap(s.sig_id) }));
  setSetting_('ROOT_FOLDER_ID', newRoot.getId());
  ['TICKET_TEMPLATE_ID', 'REPORT_TEMPLATE_ID'].forEach(k => setSetting_(k, map[setting_(k, '')] || ''));
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss_().getId());
  log_('', 'ย้ายข้อมูลไปบัญชีใหม่', '', '', { uid: Session.getActiveUser().getEmail(), name: 'ผู้ดูแลระบบ' }, Object.keys(map).length + ' ไฟล์');
  console.log('ย้ายแล้ว ' + Object.keys(map).length + ' ไฟล์ → ' + newRoot.getUrl());
}
