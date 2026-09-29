// ข้อมูลจำลองสำหรับดูตัวอย่างหน้าจอ (เปิดด้วย ?mock=1&role=user|tech|admin) — ไม่ถูกใช้ในระบบจริง
(function () {
  const role = new URLSearchParams(location.search).get('role') || 'user';
  const BOSS = ['admin', 'viewer'].indexOf(role) >= 0, MGR = role === 'admin';
  const G = [
    { id: 'g1', no: 1, name: 'งานด้านคอมพิวเตอร์และอุปกรณ์ต่อพ่วง (เครื่องพิมพ์, สแกนเนอร์, UPS)', items: [
      { id: 'i1_1', name: 'ย้ายหรือติดตั้ง', cat: 'Hardware' }, { id: 'i1_2', name: 'ติดตั้งโปรแกรมพื้นฐานหรือโปรแกรมเฉพาะงาน', cat: 'Software' }, { id: 'i1_3', name: 'ระบบปฏิบัติการ Windows มีปัญหา', cat: 'Software' },
      { id: 'i1_4', name: 'แก้ไข/อัพเดท/ติดตั้ง Antivirus', cat: 'Software' }, { id: 'i1_5', name: 'อุปกรณ์ชำรุด (คอมพิวเตอร์/เครื่องพิมพ์/สแกนเนอร์/UPS)', cat: 'Hardware' }] },
    { id: 'g2', no: 2, name: 'งานด้านระบบเครือข่ายอินเตอร์เน็ต', items: [
      { id: 'i2_1', name: 'เพิ่มจุด LAN, WiFi', cat: 'Network' }, { id: 'i2_2', name: 'WiFi มีปัญหา', cat: 'Network' }, { id: 'i2_3', name: 'ลงทะเบียนการใช้เครือข่าย', cat: 'Network' }, { id: 'i2_4', name: 'สาย LAN ขาด/เสีย', cat: 'Network' }] },
    { id: 'g3', no: 3, name: 'งานด้านบัตรประจำตัว/บัตรจอดรถ/เครื่องสแกนนิ้ว/ใบหน้า', items: [
      { id: 'i3_1', name: 'บัตรหาย (แนบใบเสร็จ และเอกสารทำบัตร)', cat: 'CCTV & Access Control', card: true }, { id: 'i3_2', name: 'เพิ่มประตู', cat: 'CCTV & Access Control', card: true }, { id: 'i3_3', name: 'สแกนไม่ได้', cat: 'CCTV & Access Control', card: true }] },
    { id: 'g4', no: 4, name: 'อื่นๆ', items: [{ id: 'i4_1', name: 'อื่นๆ (โปรดระบุสาเหตุ)', needDetail: true }] }
  ];
  const TODAY = new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  const T = [
    { no: 336, reporter_check: 'รอตรวจ: ชื่อใกล้เคียง (ต่าง 2 ตัว)', status: 'รอมอบหมาย', created: '21/09/2569 09:12', reporter_name: 'จันติดา ส.', department: 'ภาควิชาพยาธิวิทยา', phone: '2231', building: 'อาคารเฉลิมพระเกียรติ 80 พรรษาฯ', floor: '3', room: '8302', items_text: 'อุปกรณ์ชำรุด (คอมพิวเตอร์/เครื่องพิมพ์/สแกนเนอร์/UPS)', detail: 'เครื่องพิมพ์กระดาษติดบ่อย', category: 'Hardware', due: '24/09/2569' },
    { no: 335, status: 'นัดหมายแล้ว', created: '20/09/2569 14:40', reporter_name: 'สุธิมา ก.', department: 'ภาควิชาสรีรวิทยา', phone: '2215', building: 'อาคารเรียนและปฏิบัติการ', floor: '6', room: '6201', items_text: 'WiFi มีปัญหา', detail: 'WiFi หลุดบ่อยช่วงบ่าย', category: 'Network', assigned_name: 'ช่าง ประเสริฐ', assigned_uid: 'U_tech', due: '23/09/2569', appoint: '22/09/2569', acked: false },
    { no: 334, status: 'รอตรวจงาน', created: '19/09/2569 10:05', reporter_name: 'สุธิมา ก.', department: 'ภาควิชาสรีรวิทยา', phone: '2215', building: 'อาคารเฉลิมพระเกียรติ 6 รอบฯ', floor: '3', room: '312', items_text: 'ระบบปฏิบัติการ Windows มีปัญหา', detail: 'เปิดเครื่องแล้วค้างหน้า Updating', category: 'Software', assigned_name: 'ช่าง ประเสริฐ', assigned_uid: 'U_tech', due: '22/09/2569', done: '20/09/2569', iso: 'ทัน', cause: 'Windows Update ค้าง ไฟล์ระบบเสีย', solution: 'ซ่อมไฟล์ระบบ (DISM/SFC) และติดตั้งอัปเดตใหม่', advice: 'ปิดเครื่องผ่านเมนู Shut down ทุกครั้ง' },
    { no: 333, status: 'ดำเนินการเสร็จสิ้น', created: '15/09/2569 08:50', reporter_name: 'สุธิมา ก.', department: 'ภาควิชาสรีรวิทยา', phone: '2215', building: 'อาคารจักรพิชัยรณรงค์สงคราม', floor: '2', room: '205', items_text: 'เพิ่มจุด LAN, WiFi', category: 'Network', assigned_name: 'ช่าง สมชาย', due: '18/09/2569', done: '16/09/2569', iso: 'ทัน' }
  ];
  T.forEach(t => { if (t.assigned_name === 'ช่าง ประเสริฐ') t.assigned_uid = 'U_tech'; });
  const t335 = T.find(t => t.no === 335); if (t335) Object.assign(t335, { appoint_iso: TODAY, appoint_time: '09:00', appoint: 'วันนี้ เวลา 09:00 น.' });
  T.push({ no: 337, status: 'มอบหมายแล้ว', created: '24/09/2569 13:10', reporter_name: 'วิภา ร.', department: 'สำนักงานเลขานุการ', phone: '2201', building: 'อาคารเรียนและปฏิบัติการ', room: '6105', items_text: 'เครื่องพิมพ์ชำรุด', category: 'Hardware', assigned_name: 'ช่าง ประเสริฐ', assigned_uid: 'U_tech', due: '27/09/2569' });
  // v1.7: รหัสคิว (ทุกใบ) + รหัสแจ้งซ่อม (เฉพาะใบที่นัดหมายแล้ว)
  T.forEach(t => { t.queue_code = 'Q69' + String(t.no - 300).padStart(4, '0'); if (['รอมอบหมาย', 'มอบหมายแล้ว'].indexOf(t.status) < 0) t.code = 'VET-FA-IT-69-' + String(t.no - 320).padStart(3, '0'); });
  const t336 = T.find(t => t.no === 336); if (t336) t336.dispatch = { elapsed: 7, late: false, limit: 5, total: 15, start: '' };
  T.push({ no: 338, queue_code: 'Q690038', status: 'รอมอบหมาย', created: '29/09/2569 10:05', reporter_name: 'วิภา ร.', department: 'สำนักงานเลขานุการ', phone: '2201', building: 'อาคารเฉลิมพระเกียรติ 6 รอบฯ', floor: '2', room: '9216', items_text: 'WiFi มีปัญหา', detail: 'WiFi ห้องประชุมใช้ไม่ได้ทั้งห้อง', category: 'Network', due: '02/10/2569',
    dispatch: { elapsed: 17, late: true, limit: 5, total: 15, start: '' } });
  const full = t => Object.assign({ item_ids: ['i2_2'], asset_code: t.done ? '7440-001-0001' : '', photos: [], after_photos: [], timeline: [
    { ts: t.created, action: 'แจ้งซ่อม', by: 'LINE_' + t.reporter_name },
    t.assigned_name ? { ts: '20/09/2569 15:02', action: 'มอบหมายงาน', by: 'หัวหน้า วิชัย' } : null,
    t.appoint ? { ts: '20/09/2569 16:30', action: 'บันทึกนัดหมาย/ประเมิน', by: t.assigned_name } : null,
    t.done ? { ts: t.done + ' 11:20', action: 'ดำเนินการเสร็จ (รอตรวจงาน)', by: t.assigned_name } : null
  ].filter(Boolean), plan: t.appoint ? 'ซ่อมได้ รอจัดอุปกรณ์' : '', plan_days: t.appoint ? 1 : '' }, t);
  const me = { user: { uid: 'U_user', name: 'สุธิมา ก.', role: 'user', profile: new URLSearchParams(location.search).get('new') ? null : { name: 'สุธิมา ก.', department: 'ภาควิชาสรีรวิทยา', phone: '2215', building: 'อาคารเรียนและปฏิบัติการ', floor: '3', room: '6201', pdpa: true, verify: new URLSearchParams(location.search).get('v') || 'verified', verify_reason: 'หน่วยงานไม่ตรงกับรายชื่อบุคลากร', deny_text: 'บัญชีนี้ไม่มีสิทธิ์แจ้งซ่อม (สำหรับบุคลากรคณะเท่านั้น) หากเป็นบุคลากร กรุณาติดต่อเจ้าหน้าที่ไอทีของคณะ' } }, tech: { uid: 'U_tech', name: 'ช่าง ประเสริฐ', role: 'tech', hasSignature: true }, admin: { uid: 'U_admin', name: 'แอดมิน สมศรี', role: 'admin', hasSignature: true }, viewer: { uid: 'U_exec', name: 'คณบดี ทดสอบ', role: 'viewer', hasSignature: false } }[role];
  if (me.profile) Object.assign(me.profile, { first_name: 'สุธิมา', last_name: 'กิตติ', name: 'สุธิมา กิตติ' });
  window.mockApi = async function (action, d) {
    await new Promise(r => setTimeout(r, 150));
    switch (action) {
      case 'init': return { appointGap: 60, slaDays: 3, workStart: '08:00', workEnd: '17:00', dispatchMin: 5, dispatchTotal: 15, me, lists: { options: { cause: ['อุปกรณ์ชำรุด/เสื่อมสภาพ', 'สายสัญญาณ/สาย LAN หลวมหรือเสียหาย', 'ตั้งค่าระบบ/โปรแกรมผิดพลาด', 'กระดาษติด/หมึกหมด'], solution: ['เปลี่ยนอุปกรณ์/อะไหล่ใหม่', 'เข้าหัว/เปลี่ยนสายสัญญาณ', 'ตั้งค่าระบบใหม่', 'รีสตาร์ทอุปกรณ์/ระบบ'], pause: ['รออะไหล่/อุปกรณ์', 'รอบริษัทภายนอก/เคลมประกัน', 'รออนุมัติจัดซื้อ', 'เข้าพื้นที่ไม่ได้ (ผู้แจ้งไม่สะดวก)'], byCat: { cause: { 'Network': ['สาย LAN หลวม/ขาด/เข้าหัวเสีย', 'พอร์ตสวิตช์เสีย', 'Access Point ค้าง/ไม่จ่ายสัญญาณ', 'สัญญาณ WiFi อ่อน/ไม่ครอบคลุม', 'อุปกรณ์ยังไม่ลงทะเบียนใช้เครือข่าย'], 'Hardware': ['อุปกรณ์ชำรุด/เสื่อมสภาพ', 'กระดาษติด', 'หมึก/ตลับหมึกหมดหรือเสีย'], 'Software': ['Windows เสีย/บูตไม่ขึ้น', 'ไวรัส/มัลแวร์'], '': ['ใช้งานไม่ถูกวิธี'] }, solution: { 'Network': ['เข้าหัว/เปลี่ยนสาย LAN', 'รีสตาร์ท Access Point/สวิตช์', 'ลงทะเบียนเครือข่ายให้อุปกรณ์', 'เพิ่มจุด LAN/WiFi'], 'Hardware': ['เปลี่ยนอะไหล่/อุปกรณ์ใหม่', 'เคลียร์กระดาษติด/ทำความสะอาด'], 'Software': ['ติดตั้ง Windows ใหม่', 'สแกนกำจัดไวรัส/อัปเดต Antivirus'], '': ['รีสตาร์ทอุปกรณ์/ระบบ', 'แนะนำวิธีใช้งานที่ถูกต้อง'] } } }, buildings: ['อาคารจักรพิชัยรณรงค์สงคราม', 'อาคารเรียนและปฏิบัติการ', 'อาคารสนับสนุนและอำนวยการ (อาคารจอดรถ)', 'อาคารเฉลิมพระเกียรติ 6 รอบฯ', 'อาคารเฉลิมพระเกียรติ 80 พรรษาฯ', 'อาคารปฏิบัติการกายวิภาคศาสตร์'], groups: G, depts: [{ v: 'ภาควิชาของคณะสัตวแพทยศาสตร์', p: '' }, { v: 'ภาควิชาสรีรวิทยา', p: 'ภาควิชาของคณะสัตวแพทยศาสตร์' }, { v: 'ภาควิชาพยาธิวิทยา', p: 'ภาควิชาของคณะสัตวแพทยศาสตร์' }, { v: 'รพส.มก', p: '' }, { v: 'แผนกอายุรกรรม', p: 'รพส.มก' }, { v: 'หน่วยหัตถการ', p: 'รพส.มก › แผนกอายุรกรรม' }, { v: 'หน่วยอายุรกรรม', p: 'รพส.มก › แผนกอายุรกรรม' }, { v: 'งานในสังกัด', p: '' }, { v: 'งานกายภาพและทรัพย์สิน', p: 'งานในสังกัด' }, { v: 'หน่วยอาคารและบริหารทรัพย์สิน', p: 'งานในสังกัด › งานกายภาพและทรัพย์สิน' }, { v: 'หน่วยเทคโนโลยีและโสตทัศนูปกรณ์', p: 'งานในสังกัด › งานกายภาพและทรัพย์สิน' }, { v: 'หน่วยซ่อมบำรุง', p: 'งานในสังกัด › งานกายภาพและทรัพย์สิน' }, { v: 'งานคลังและพัสดุ', p: 'งานในสังกัด' }, { v: 'หน่วยพัสดุ', p: 'งานในสังกัด › งานคลังและพัสดุ' }], categories: ['CCTV & Access Control', 'Network', 'Software', 'Hardware'] },
        docCode: 'FM-PPM-2-01', pdpa: 'ข้าพเจ้ายินยอมให้เก็บชื่อ ข้อมูลติดต่อ บัญชี LINE และลายมือชื่อ เพื่อใช้ในการให้บริการแจ้งซ่อมและจัดทำรายงานเท่านั้น', slaDays: 3 };
      case 'myTickets': return { tickets: T.filter(t => t.reporter_name === 'สุธิมา ก.').map(full) };
      case 'getTicket': { const t = T.find(x => String(x.no) === String(d.no)); return { ticket: full(t), isReporter: role === 'user', canWork: role !== 'user' && role !== 'viewer' }; }
      case 'staffTickets': return { tickets: T.map(full).filter(t => BOSS || t.assigned_name === 'ช่าง ประเสริฐ' || t.status === 'รอมอบหมาย'), techs: [{ uid: 'U_tech', name: 'ช่าง ประเสริฐ', role: 'tech' }, { uid: 'U_t2', name: 'ช่าง สมชาย', role: 'tech' }, { uid: 'U_admin', name: 'หัวหน้า วิชัย', role: 'admin' }], me, month: '2026-09', stats: { total: 17, open: 3, isoPct: 94.1, avgRating: 4.6 } };
      case 'photo': return { id: d.id, src: '' };
      case 'reschedule': return { ticket: T[0] };
      case 'kbList': { const all = [
          { id: 'KB0001', title: 'ปริ้นเตอร์กระดาษติด ไฟกระพริบสีส้ม', category: 'ปริ้นเตอร์/สแกนเนอร์', audience: 'all', summary: 'สั่งพิมพ์แล้วไม่ออก มีเสียงดังกึก', photos: 2, views: 41, updated: '24/09/2569' },
          { id: 'KB0002', title: 'WiFi KU-Win เชื่อมต่อแล้วเข้าเว็บไม่ได้', category: 'อินเทอร์เน็ต/WiFi', audience: 'all', summary: 'ขึ้นว่าเชื่อมต่อแล้วแต่ไม่มีอินเทอร์เน็ต', photos: 3, views: 27, updated: '22/09/2569' },
          { id: 'KB0003', title: 'Windows ค้างหน้า Updating', category: 'โปรแกรม/Windows', audience: 'all', summary: 'เปิดเครื่องแล้วค้างที่ 30% นานเกิน 1 ชม.', photos: 0, views: 12, updated: '20/09/2569' },
          { id: 'KB0004', title: 'รีเซ็ตสวิตช์ชั้น 3 (Ruijie)', category: 'อินเทอร์เน็ต/WiFi', audience: 'staff', summary: 'ทั้งชั้นเน็ตหลุด', photos: 1, views: 5, updated: '18/09/2569' }];
        const list = all.filter(k => (role !== 'user' || k.audience === 'all') && (!d.cat || k.category === d.cat) && (!d.q || (k.title + k.summary).includes(d.q)));
        const cats = ['คอมพิวเตอร์', 'ปริ้นเตอร์/สแกนเนอร์', 'อินเทอร์เน็ต/WiFi', 'โปรแกรม/Windows', 'อีเมล/บัญชีผู้ใช้', 'กล้อง CCTV', 'บัตร/สแกนนิ้ว', 'อื่นๆ'];
        return { items: list, total: list.length, canWrite: role !== 'user', categories: cats.map(c => ({ name: c, n: all.filter(k => k.category === c && (role !== 'user' || k.audience === 'all')).length })) }; }
      case 'kbGet': return { item: { id: 'KB0001', title: 'ปริ้นเตอร์กระดาษติด ไฟกระพริบสีส้ม', category: 'ปริ้นเตอร์/สแกนเนอร์', audience: 'all', summary: 'สั่งพิมพ์แล้วไม่ออก มีเสียงดังกึก',
          body: '1. ปิดเครื่องพิมพ์ แล้วถอดปลั๊ก รอ 30 วินาที\n2. เปิดฝาด้านหลัง ดึงกระดาษที่ติดออกช้าๆ ตามทิศทางที่กระดาษวิ่ง (อย่ากระชาก)\n3. เช็คว่าไม่มีเศษกระดาษค้างในลูกยาง\n4. เรียงกระดาษในถาดใหม่ อย่าใส่เกินเส้นที่กำหนด\n5. เสียบปลั๊ก เปิดเครื่อง แล้วลองสั่งพิมพ์ 1 หน้า',
          keywords: 'paper jam', photo_ids: [], views: 42, updated: '24/09/2569', created: '20/09/2569', author: 'ช่าง ประเสริฐ', from_no: '333', canEdit: role !== 'user' } };
      case 'kbSave': return { id: d.id || 'KB0005' };
      case 'kbHide': return { ok: true };
      case 'kbPhoto': return { id: d.pid, src: '' };
      case 'staffList': return { liffId: '2011696676-3yqcQBx6', maxAdmins: 3, codes: { tech: 'T295278', admin: 'A310697', viewer: 'V551204' }, staff: [
        { uid: 'U_admin', name: 'อนุวัฒน์ จันทสุบรรณ์', first_name: 'อนุวัฒน์', last_name: 'จันทสุบรรณ์', role: 'admin', active: true, phone: '0811111111', hasSignature: true, registered: '21/09/2569', me: true, openNow: 0, month: 2 },
        { uid: 'U_a2', name: 'สมศรี ใจงาม', role: 'admin', active: true, phone: '', hasSignature: true, registered: '29/09/2569', openNow: 0, month: 1 },
        { uid: 'U_exec', name: 'คณบดี ทดสอบ', role: 'viewer', active: true, phone: '', hasSignature: false, registered: '29/09/2569', openNow: 0, month: 0 },
        { uid: 'U_tech', name: 'ช่าง ประเสริฐ', first_name: 'ประเสริฐ', last_name: 'ใจดี', role: 'tech', active: true, phone: '0822222222', hasSignature: true, registered: '21/09/2569', openNow: 3, month: 9 },
        { uid: 'U_t2', name: 'wave', role: 'tech', active: true, phone: '', hasSignature: false, registered: '23/09/2569', openNow: 1, month: 2 },
        { uid: 'U_old', name: 'ช่าง สมศักดิ์ (ลาออก)', role: 'tech', active: false, phone: '', hasSignature: true, registered: '01/08/2569', openNow: 0, month: 0 }] };
      case 'staffUpdate': return { ok: true, openNow: 0, changed: ['x'] };
      case 'staffCode': return { kind: d.kind, code: ({ admin: 'A', viewer: 'V' }[d.kind] || 'T') + '123456' };
      case 'search': { const q = String(d.q||'').toLowerCase();
        const hit = T.map(full).filter(t => [t.no,t.asset_code,t.reporter_name,t.room,t.items_text,t.building].some(v => String(v==null?'':v).toLowerCase().includes(q)));
        return { q: d.q, total: hit.length, tickets: hit, assets: [{ code: '7440-001-0001', n: 2 }] }; }
      case 'schedule': {
        const base = d.from ? new Date(d.from + 'T00:00:00+07:00') : new Date();
        const dow = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
        const list = []; const iso = x => x.toISOString().slice(0,10);
        for (let i = 0; i < (d.days||7); i++) { const x = new Date(base); x.setDate(x.getDate()+i);
          list.push({ iso: iso(x), label: ('0'+x.getDate()).slice(-2)+'/'+('0'+(x.getMonth()+1)).slice(-2)+'/'+(x.getFullYear()+543), dow: dow[x.getDay()], jobs: [] }); }
        list[0].jobs.push({ no: 335, time: '09:00', status: 'นัดหมายแล้ว', tech: 'ช่าง ประเสริฐ', tech_uid: 'U_tech', place: 'อาคารเรียนและปฏิบัติการ ห้อง 6201', items: 'WiFi มีปัญหา', reporter: 'สุธิมา ก.', resched: true, resched_when: '28/09/2569 13:30' });
        list[0].jobs.push({ no: 338, time: '13:30', status: 'มอบหมายแล้ว', tech: 'ช่าง สมชาย', tech_uid: 'U_t2', place: 'อาคารจักรพิชัยฯ ห้อง 205', items: 'เพิ่มจุด LAN', reporter: 'จันติดา ส.' });
        if (list[1]) list[1].jobs.push({ no: 339, time: '10:00', status: 'นัดหมายแล้ว', tech: 'ช่าง ประเสริฐ', tech_uid: 'U_tech', place: 'อาคารเฉลิมพระเกียรติ 80 พรรษาฯ ห้อง 8302', items: 'เครื่องพิมพ์ชำรุด', reporter: 'วิภา ร.' });
        if (!BOSS) list.forEach(x => x.jobs = x.jobs.filter(j => j.tech_uid === 'U_tech'));
        return { from: iso(base), days: d.days||7, today: iso(new Date()), list: list, isAdmin: BOSS,
          techs: BOSS ? [{ uid:'U_tech', name:'ช่าง ประเสริฐ', role:'tech' }, { uid:'U_t2', name:'ช่าง สมชาย', role:'tech' }] : [] }; }
      case 'overview': {
        const daily = []; const ins = [2,1,0,3,1,0,0,2,1,1,2,0,0,0,1,2,1,0,1,0,0,2]; const dn = [0,2,0,1,2,1,0,1,2,0,1,2,0,0,0,1,2,1,0,1,0,1];
        for (let i = 1; i <= 30; i++) daily.push({ d: i, in: ins[i - 1] || 0, done: dn[i - 1] || 0 });
        const mk = (no, it, b, tech, due, extra) => Object.assign({ no, items_text: it, building: b, assigned_name: tech, due, ageDays: 5, waitDays: 3 }, extra || {});
        return { dispatchMin: 5, dispatchTotal: 15, role: role, ym: '2026-09', lastDay: 22, label: 'กันยายน 2569', prevLabel: 'สิงหาคม 2569', slaDays: 3, kpiTarget: 90, isAdmin: MGR,
          months: [{ ym: '2026-09', label: 'กันยายน 2569' }, { ym: '2026-08', label: 'สิงหาคม 2569' }, { ym: '2026-07', label: 'กรกฎาคม 2569' }],
          stats: { total: 20, closed: 15, open: 5, isoPct: 88.2, avgRating: 4.6, reworkPct: 100, rejected: 2, paused: 1, dispatchPct: 88.9, dispatchAvgMin: 6.4, dispatchDone: 18, dispatchOk: 16 }, verify: { pending: 3, monthUsers: 4, monthTickets: 5 }, prev: { total: 17, closed: 16, open: 1, isoPct: 94.1, avgRating: 4.5, reworkPct: 50 },
          daily,
          follow: { working: [mk(337, 'เครื่องพิมพ์ชำรุด', 'อาคารเรียนและปฏิบัติการ', 'ช่าง ประเสริฐ', '30/09/2569', { queue_code: 'Q690037' }), mk(335, 'WiFi มีปัญหา', 'อาคารเรียนและปฏิบัติการ', 'ช่าง ประเสริฐ', '30/09/2569', { code: 'VET-FA-IT-69-015' })], overdue: [mk(329, 'อุปกรณ์ชำรุด (เครื่องพิมพ์)', 'อาคารเรียนและปฏิบัติการ', 'ช่าง สมชาย', '19/09/2569', { ageDays: 6 })],
            dueToday: [mk(335, 'WiFi มีปัญหา', 'อาคารเรียนและปฏิบัติการ', 'ช่าง ประเสริฐ', '22/09/2569')],
            unassigned: [mk(338, 'WiFi มีปัญหา', 'อาคารเฉลิมพระเกียรติ 6 รอบฯ', '', '02/10/2569', { queue_code: 'Q690038', created: '29/09/2569 10:05', dispatch: { elapsed: 17, late: true, total: 15 } }), mk(336, 'อุปกรณ์ชำรุด (คอมพิวเตอร์/เครื่องพิมพ์/สแกนเนอร์/UPS)', 'อาคารเฉลิมพระเกียรติ 80 พรรษาฯ', '', '24/09/2569', { queue_code: 'Q690036', created: '29/09/2569 10:14', dispatch: { elapsed: 7, late: false, total: 15 } })],
            waitAccept: [mk(334, 'ระบบปฏิบัติการ Windows มีปัญหา', 'อาคารเฉลิมพระเกียรติ 6 รอบฯ', 'ช่าง ประเสริฐ', '22/09/2569', { waitDays: 2 }), mk(331, 'เพิ่มจุด LAN, WiFi', 'อาคารจักรพิชัยรณรงค์สงคราม', 'ช่าง สมชาย', '20/09/2569', { waitDays: 3 })],
            rejected: [], paused: [mk(330, 'อุปกรณ์ชำรุด (UPS)', 'อาคารจักรพิชัยรณรงค์สงคราม', 'ช่าง สมชาย', '25/09/2569', { pause_reason: 'รออะไหล่/อุปกรณ์', pausedDays: 2 })] },
          categories: [{ name: 'CCTV & Access Control', n: 1, prev: 0 }, { name: 'Network', n: 6, prev: 5 }, { name: 'Software', n: 5, prev: 4 }, { name: 'Hardware', n: 8, prev: 8 }],
          buildings: [['อาคารจักรพิชัยรณรงค์สงคราม', 4], ['อาคารเรียนและปฏิบัติการ', 7], ['อาคารสนับสนุนและอำนวยการ (อาคารจอดรถ)', 1], ['อาคารเฉลิมพระเกียรติ 6 รอบฯ', 5], ['อาคารเฉลิมพระเกียรติ 80 พรรษาฯ', 3], ['อาคารปฏิบัติการกายวิภาคศาสตร์', 0]].map(x => ({ name: x[0], n: x[1] })),
          dispatch: { limit: 5, total: 15, selfTaken: 2, rows: [{ name: 'อนุวัฒน์ จันทสุบรรณ์', done: 12, in5: 11, in15: 12, pct: 91.7, pct15: 100, avgMin: 3.2 }, { name: 'สมศรี ใจงาม', done: 5, in5: 3, in15: 4, pct: 60, pct15: 80, avgMin: 7.1 }] },
          techs: [{ name: 'ช่าง ประเสริฐ', openNow: 2, month: 11, closed: 9, isoPct: 90, reworkPct: 100, rework: 1, rating: 4.7 }, { name: 'ช่าง สมชาย', openNow: 3, month: 9, closed: 6, isoPct: 85.7, rework: 1, rating: 4.4 }],
          topItems: [{ name: 'อุปกรณ์ชำรุด (คอมพิวเตอร์/เครื่องพิมพ์/สแกนเนอร์/UPS)', n: 6 }, { name: 'WiFi มีปัญหา', n: 4 }, { name: 'ระบบปฏิบัติการ Windows มีปัญหา', n: 3 }, { name: 'ย้ายหรือติดตั้ง', n: 2 }, { name: 'เพิ่มจุด LAN, WiFi', n: 2 }],
          reports: [{ name: 'รายงานสรุปงานบริการดูแลระบบ IT และเครือข่ายประจำเดือนสิงหาคม 2569', url: '#', kind: 'Docs', updated: '01/09/2569 07:02' }, { name: 'ภาคผนวก ใบแจ้งซ่อม สิงหาคม 2569.pdf', url: '#', kind: 'PDF', updated: '01/09/2569 07:03' }] };
      }
      case 'dashboard': return { stats: { total: 17, open: 3, isoPct: 94.1, avgRating: 4.6 } };
      case 'saveProfile': return { profile: Object.assign({ pdpa: true }, d) };
      case 'submit': return { no: 339, queue: 'Q690039', code: '', due: '2 ตุลาคม 2569' };
      case 'reclassify': return { ticket: T[0], changed: ['ประเภท'] };
      case 'pulse': return { maxNo: 338, newCount: 2, lateCount: 1, waiting: [{ no: 338, code: 'Q690038', min: 17, late: true }, { no: 336, code: 'Q690036', min: 7, late: false }], at: '10:22:00' };
      case 'verifyList': return { ym: '2026-09', label: 'กันยายน 2569', months: [{ ym: '2026-09', label: 'กันยายน 2569' }, { ym: '2026-08', label: 'สิงหาคม 2569' }], enabled: true, exclude: 'นิสิต|ผู้มาติดต่อ', depts: [{ v: 'ภาควิชาสรีรวิทยา', p: 'ภาควิชาของคณะสัตวแพทยศาสตร์' }, { v: 'หน่วยพัสดุ', p: 'งานในสังกัด › งานคลังและพัสดุ' }],
        roster: { n: 1512, at: '26/09/2569 13:10', by: 'หัวหน้า วิชัย', file: 'ผู้ใช้-2026-09-26.xls', excluded: 629 }, sum: { verified: 184, wait: 3, ok: 1, no: 1 },
        users: [
          { uid: 'U1', st: 'wait', name: 'ณัฐพล มั่นคงดี', dept: 'ภาควิชาเวชศาสตร์คลินิกสัตว์เล็ก', phone: '0812344412', line: 'Nat P.', reg: '03/09/2569', why: ['ไม่พบชื่อในรายชื่อบุคลากร'], sug: null, tks: [{ no: 331, code: 'Q690004', unverified: true }, { no: 330, code: 'Q690011', unverified: true }] },
          { uid: 'U2', st: 'wait', name: 'กิตติศัก วงศ์ไพบูลย์', dept: 'งานอาคารสถานที่', phone: '0912347720', line: 'Kit', reg: '12/09/2569', why: ['ชื่อใกล้เคียง (ต่าง 2 ตัว)'], sug: { name: 'กิตติศักดิ์ วงศ์ไพบูลย์', dept: 'งานอาคารสถานที่', d: 2 }, tks: [{ no: 336, code: 'Q690013', unverified: true }] },
          { uid: 'U3', st: 'wait', name: 'ปิยะนุช ใจเย็น', dept: 'ภาควิชาพยาธิวิทยา', phone: '0812341180', line: 'Piya', reg: '15/09/2569', why: ['ชื่อนี้ผูกกับ LINE บัญชีอื่นแล้ว'], sug: { name: 'ปิยะนุช ใจเย็น', dept: 'ภาควิชาพยาธิวิทยา', d: 0 }, tks: [] },
          { uid: 'U4', st: 'ok', name: 'วรรณา ศรีวงศ์', dept: 'ศูนย์ชันสูตรโรคสัตว์', phone: '0812342207', line: 'Wanna', reg: '02/09/2569', why: ['ไม่พบชื่อในรายชื่อบุคลากร'], tks: [{ no: 333, code: 'Q690002', unverified: true }], by: 'หัวหน้า วิชัย · 05/09/2569', note: '' },
          { uid: 'U5', st: 'no', name: 'บุคคล ภายนอก', dept: '-', phone: '0812349911', line: 'Shop', reg: '10/09/2569', why: ['ไม่พบชื่อในรายชื่อบุคลากร'], tks: [{ no: 329, code: 'Q690009', unverified: true }], by: 'หัวหน้า วิชัย · 11/09/2569', note: 'ไม่ใช่บุคลากร' }],
        rows: [{ code: 'Q690004', created: '03/09/2569 10:00', reporter: 'ณัฐพล มั่นคงดี', dept: 'x', phone: '1', items: 'WiFi มีปัญหา', status: 'รอมอบหมาย', check: 'รอตรวจ: ไม่พบชื่อ', now: 'รอตรวจ' }] };
      case 'verifyDecide': case 'verifyReset': return { ok: true };
      case 'rosterImport': return { n: (d.rows || []).length, verified: 180, pending: 4 };
      case 'rosterSearch': { const all = [['สุธิมา กิตติ', 'ภ.สรีรวิทยา', true], ['สุธิดา แก้วใส', 'หน่วยอายุรกรรม', false], ['สุธี มั่นคง', 'หน่วยพัสดุ', false], ['กิตติศักดิ์ วงศ์ไพบูลย์', 'หน่วยอาคารและบริหารทรัพย์สิน', true]];
        const l = all.filter(x => (x[0] + x[1]).indexOf(d.q) >= 0).map(x => ({ id: x[0] + '|' + x[1], name: x[0], dept: x[1], bound: x[2] })); return { total: 1658, found: l.length, list: l }; }
      case 'rosterAdd': return { added: (d.people || []).length, verified: 1, total: 1660 };
      case 'deptList': return { list: [['งานในสังกัด', 97], ['งานในสังกัด › งานกายภาพและทรัพย์สิน', 31], ['งานในสังกัด › งานกายภาพและทรัพย์สิน › หน่วยเทคโนโลยีและโสตทัศนูปกรณ์', 10], ['งานในสังกัด › งานกายภาพและทรัพย์สิน › หน่วยซ่อมบำรุง', 10], ['งานในสังกัด › งานคลังและพัสดุ', 24], ['รพส.มก', 417], ['รพส.มก › แผนกอายุรกรรม', 97], ['ภาควิชาของคณะสัตวแพทยศาสตร์', 144], ['ภาควิชาของคณะสัตวแพทยศาสตร์ › ภาควิชาสรีรวิทยา', 15], ['Intern 2569', 0, false]]
        .map(x => ({ path: x[0], segs: x[0].split(' › '), n: x[1], on: x[2] !== false })) };
      case 'deptAdd': case 'deptToggle': return { ok: true };
      case 'deptRename': return { roster: 15, users: 2 };
      case 'rosterDelete': return { deleted: (d.ids || []).length, backToPending: 1, total: 1656 };
      default: return {};
    }
  };
})();
