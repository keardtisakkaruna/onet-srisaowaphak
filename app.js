/* ========================================================================
   * 1. GLOBAL STATE, GLASS CUSTOMIZER & GOOGLE APPS SCRIPT RPC WRAPPER
   * ======================================================================== */
  const STATE = {
    activeTab: 'STUDENT',
    config: {},
    schools: [],
    teachers: [],
    students: [],
    blueprint: [],
    examStructure: [],
    studentListCache: {},
    currentStudent: null,
    studentPortalData: null,
    currentTeacher: null,
    authToken: '',
    currentAnswers: {},
    gradingSavedByStudent: {},
    gradingDirty: false,
    gradingLastStudentId: '',
    focusedItemNo: 1,
    preCheckState: { passed: false, summary: '', fileBase64: '', fileName: '', mimeType: '' },
    preCheckSlots: { STUDENT: null, TEACHER: null },
    companionPdf: { fileBase64: '', fileName: '' },
    companionPdfSlots: { STUDENT: null, TEACHER: null },
    parsedRosterPreview: [],
    rosterCache: [],
    stuMatFilter: 'ALL',
    instructorSubFilter: 'ALL',
    instMatCatFilter: 'ALL',
    acadSubFilter: 'ALL',
    acadCatFilter: 'ALL',
    committeeSubFilter: 'ALL',
    practiceBankItems: [],
    instructorPracticeCache: null,
    lastAnalyticsPayload: null,
    studentPracticeMode: 'ALL',
    studentStepIdx: 0,
    studentSubFilter: 'ALL',
    practiceAttempts: {},
    cachedSubmissions: [],
    adminData: null,
    iocCurrentData: null,
    iocDraftScores: {},
    iocDraftComments: {},
    iocSubjectInitialized: false,
    adminIocCurrentData: null
  };

  const GLASS_STORAGE_KEY = 'SRISAOWAPHAK69_GLASS_V2';
  const GLASS_FAV_KEY = 'SRISAOWAPHAK69_FAV_GLASS';
  const STAFF_CRED_KEY = 'SRISAOWAPHAK69_REMEMBER_STAFF';
  const ROLE_CRED_KEYS = {
    ADMIN: 'SRISAOWAPHAK69_CRED_ADMIN',
    ACADEMIC: 'SRISAOWAPHAK69_CRED_ACAD',
    INSTRUCTOR: 'SRISAOWAPHAK69_CRED_INST',
    COMMITTEE: 'SRISAOWAPHAK69_CRED_COMM'
  };
  const STUDENT_CRED_KEY = 'SRISAOWAPHAK69_REMEMBER_STU';
  const ACTIVE_SESSION_KEY = 'SRISAOWAPHAK69_ACTIVE_SESSION';

  const GLASS_DEFAULTS = {
    blur: 31,
    opacity: 0.90,
    saturation: 1.45,
    edge: 0.60,
    tint: '#eadbc7',
    theme: 'light',
    fontScale: 1.10,
    wallpaper: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80'
  };

  let glassState = { ...GLASS_DEFAULTS };

  const VIEW_META = {
    STUDENT: {
      title: '1. ห้องเรียนติว & ฝึกข้อสอบ O-NET นักเรียน ป.6',
      greeting: 'พื้นที่การเรียนรู้ร่วมกัน 8 โรงเรียน | กลุ่มโรงเรียนศรีเสาวภาค'
    },
    COMMITTEE: {
      title: '2. ส่งไฟล์ต้นฉบับเอกสารติวยกระดับ O-NET (.docx)',
      greeting: 'สำหรับคณะกรรมการจัดทำเอกสารทั้ง 15 สาระ'
    },
    INSTRUCTOR: {
      title: '3. พื้นที่ครูผู้สอนชั้น ป.6 (เอกสารติว & ติดตามพัฒนาการเด็ก)',
      greeting: 'สำหรับครูผู้สอนชั้น ป.6 ทั้ง 8 โรงเรียนในกลุ่มศรีเสาวภาค'
    },
    ACADEMIC: {
      title: '4. ตรวจกระดาษคำตอบ & วิเคราะห์ผล Pre / Post O-NET',
      greeting: 'สำหรับครูวิชาการประจำโรงเรียน (8 โรงเรียน)'
    },
    ADMIN: {
      title: '5. แดชบอร์ดบริหารกลางกลุ่มโรงเรียนศรีเสาวภาค',
      greeting: 'สำหรับผู้ดูแลระบบกลุ่มฯ (ครูเกียรติศักดิ์ กรุณา)'
    }
  };

  const ROLE_LABELS_TH = {
    SUPER_ADMIN: 'ผู้ดูแลกลุ่มฯ',
    SCHOOL_ACADEMIC: 'ครูวิชาการ',
    SUBJECT_TEACHER: 'ครูผู้สอน ป.6',
    COMMITTEE_TEACHER: 'คณะกรรมการจัดทำเอกสาร'
  };

  const ROLE_UI_MAP = {
    COMMITTEE: {
      roleCode: 'COMMITTEE_TEACHER',
      loginForm: 'commLoginForm', regForm: 'commRegForm',
      btnLogin: 'btnCommModeLogin', btnReg: 'btnCommModeReg',
      loginSubmitBtn: 'btnCommLoginSubmit', regSubmitBtn: 'btnCommRegSubmit',
      filterSchool: 'commFilterSchool', selectTeacher: 'commSelectTeacher',
      chipsWrap: 'commQuickChipsWrap', chipsBox: 'commQuickChips',
      emptyHint: 'commEmptyHint', passBox: 'commPassBox',
      loginPass: 'commLoginPass', chkRemember: 'chkRememberComm', clearBtn: 'btnClearSavedComm',
      regSchool: 'commRegSchool', regName: 'commRegName', regPass: 'commRegPass', regSubject: 'commRegSubject'
    },
    INSTRUCTOR: {
      roleCode: 'SUBJECT_TEACHER',
      loginForm: 'instLoginForm', regForm: 'instRegForm',
      btnLogin: 'btnInstModeLogin', btnReg: 'btnInstModeReg',
      loginSubmitBtn: 'btnInstLoginSubmit', regSubmitBtn: 'btnInstRegSubmit',
      filterSchool: 'instFilterSchool', selectTeacher: 'instSelectTeacher',
      chipsWrap: 'instQuickChipsWrap', chipsBox: 'instQuickChips',
      emptyHint: 'instEmptyHint', passBox: 'instPassBox',
      loginPass: 'instLoginPass', chkRemember: 'chkRememberInst', clearBtn: 'btnClearSavedInst',
      regSchool: 'instRegSchool', regName: 'instRegName', regPass: 'instRegPass', regSubject: 'instRegSubject'
    },
    ACADEMIC: {
      roleCode: 'SCHOOL_ACADEMIC',
      loginForm: 'acadLoginForm', regForm: 'acadRegForm',
      btnLogin: 'btnAcadModeLogin', btnReg: 'btnAcadModeReg',
      loginSubmitBtn: 'btnAcadLoginSubmit', regSubmitBtn: 'btnAcadRegSubmit',
      filterSchool: 'acadFilterSchool', selectTeacher: 'acadSelectTeacher',
      chipsWrap: 'acadQuickChipsWrap', chipsBox: 'acadQuickChips',
      emptyHint: 'acadEmptyHint', passBox: 'acadPassBox',
      loginPass: 'acadLoginPass', chkRemember: 'chkRememberAcad', clearBtn: 'btnClearSavedAcad',
      regSchool: 'acadRegSchool', regName: 'acadRegName', regPass: 'acadRegPass', regSubject: null
    }
  };

  const SUBJECT_NAMES = {
    '61': 'ภาษาไทย',
    '64': 'คณิตศาสตร์',
    '65': 'วิทยาศาสตร์และเทคโนโลยี',
    '63': 'ภาษาอังกฤษ'
  };

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  function refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      document.querySelectorAll('svg.lucide').forEach((svg) => {
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
      });
    }
  }

  function runGlassRevealAnimation(scopeEl) {
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targetRoot = scopeEl || document.getElementById('mainScrollContainer');
    if (!targetRoot) return;
    const panels = targetRoot.querySelectorAll('.gw-reveal');
    if (!panels.length) return;
    gsap.killTweensOf(panels);
    gsap.fromTo(
      panels,
      { y: 8, opacity: 0.72 },
      {
        y: 0,
        opacity: 1,
        duration: 0.22,
        stagger: 0.03,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'transform,opacity'
      }
    );
  }

  function clampFontScale(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return GLASS_DEFAULTS.fontScale;
    return Math.round(Math.min(1.45, Math.max(0.85, num)) * 100) / 100;
  }

  function loadSavedGlassSettings() {
    try {
      const raw = localStorage.getItem(GLASS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        glassState = { ...GLASS_DEFAULTS, ...parsed };
      }
    } catch (e) {}
    glassState.fontScale = clampFontScale(glassState.fontScale);
    syncGlassDom();
  }

  function saveGlassSettings() {
    try {
      localStorage.setItem(GLASS_STORAGE_KEY, JSON.stringify(glassState));
    } catch (e) {}
  }

  function syncGlassDom() {
    const shell = document.getElementById('appShell');
    if (!shell) return;
    const fScale = clampFontScale(glassState.fontScale);
    glassState.fontScale = fScale;
    document.documentElement.style.setProperty('--gw-font-scale', String(fScale));

    shell.setAttribute('data-theme', glassState.theme === 'dark' ? 'dark' : 'light');
    shell.style.setProperty('--gw-blur', `${glassState.blur}px`);
    shell.style.setProperty('--gw-opacity', String(glassState.opacity));
    shell.style.setProperty('--gw-saturation', String(glassState.saturation));
    shell.style.setProperty('--gw-edge', String(glassState.edge));
    shell.style.setProperty('--gw-tint', glassState.tint);

    const bg = document.getElementById('gwRoomBg');
    if (bg && glassState.wallpaper && bg.src !== glassState.wallpaper) {
      bg.style.opacity = '1';
      bg.src = glassState.wallpaper;
    }
    const sampleBg = document.getElementById('gwSampleBg');
    if (sampleBg && glassState.wallpaper && sampleBg.src !== glassState.wallpaper) {
      sampleBg.src = glassState.wallpaper;
    }

    const blurHint = document.getElementById('blurOpacityHint');
    if (blurHint) {
      blurHint.textContent = glassState.opacity >= 0.86
        ? `* ตอนนี้ความทึบแสงอยู่ที่ ${Math.round(glassState.opacity * 100)}% (เนื้อทึบ) หากลดความทึบแสงลงมาที่ 25%–70% จะเห็นความเบลอทะลุกระจกชัดขึ้นมากครับ`
        : '';
    }

    const favBtn = document.getElementById('btnPresetFav');
    if (favBtn) {
      let hasFav = false;
      try { hasFav = Boolean(localStorage.getItem(GLASS_FAV_KEY)); } catch (e) {}
      favBtn.textContent = hasFav ? '⭐ เรียกค่าที่ชอบ' : '⭐ สไตล์ที่ฉันชอบ';
    }

    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const pctText = `${Math.round(fScale * 100)}%`;
    setVal('rngFontScale', fScale);
    setTxt('outFontScale', pctText);
    setTxt('lblFontTop', pctText);

    setVal('rngBlur', glassState.blur);
    setTxt('outBlur', `${Math.round(glassState.blur)} px`);
    setVal('rngOpacity', glassState.opacity);
    setTxt('outOpacity', `${Math.round(glassState.opacity * 100)}%`);
    setVal('rngSaturation', glassState.saturation);
    setTxt('outSaturation', `${Math.round(glassState.saturation * 100)}%`);
    setVal('rngEdge', glassState.edge);
    setTxt('outEdge', `${Math.round(glassState.edge * 100)}%`);
    setVal('inpTint', glassState.tint);
    setVal('selWallpaper', glassState.wallpaper);
  }

  function stepFontScale(delta) {
    glassState.fontScale = clampFontScale((glassState.fontScale || GLASS_DEFAULTS.fontScale) + Number(delta));
    syncGlassDom();
    saveGlassSettings();
  }

  function updateGlassSetting(key, rawValue) {
    if (key === 'tint' || key === 'wallpaper') {
      glassState[key] = String(rawValue);
    } else if (key === 'fontScale') {
      glassState.fontScale = clampFontScale(rawValue);
    } else {
      glassState[key] = Number(rawValue);
    }
    syncGlassDom();
    saveGlassSettings();
  }

  function applyGlassPreset(presetName) {
    if (presetName === 'clear') {
      glassState = { ...glassState, blur: 12, opacity: 0.42, saturation: 1.25, edge: 0.80 };
    } else if (presetName === 'frosted') {
      glassState = { ...glassState, blur: 24, opacity: 0.65, saturation: 1.35, edge: 0.65 };
    } else {
      glassState = {
        ...glassState,
        blur: GLASS_DEFAULTS.blur,
        opacity: GLASS_DEFAULTS.opacity,
        saturation: GLASS_DEFAULTS.saturation,
        edge: GLASS_DEFAULTS.edge,
        tint: GLASS_DEFAULTS.tint
      };
    }
    syncGlassDom();
    saveGlassSettings();
  }

  function saveMyFavoriteGlass() {
    try {
      localStorage.setItem(GLASS_FAV_KEY, JSON.stringify(glassState));
      localStorage.setItem(GLASS_STORAGE_KEY, JSON.stringify(glassState));
    } catch (e) {}
    syncGlassDom();
    const statusEl = document.getElementById('favSavedStatus');
    if (statusEl) {
      statusEl.textContent = '✓ บันทึกสไตล์ที่ชอบไว้ประจำเครื่องนี้เรียบร้อยแล้ว!';
      statusEl.classList.remove('hidden');
    }
    showToast('บันทึกสไตล์กระจกและขนาดตัวอักษรที่ชอบไว้ประจำเครื่องนี้เรียบร้อยแล้วครับ!', 'success');
  }

  function applyFavoriteGlass() {
    try {
      const raw = localStorage.getItem(GLASS_FAV_KEY);
      if (!raw) {
        saveMyFavoriteGlass();
        return;
      }
      const parsed = JSON.parse(raw);
      glassState = { ...GLASS_DEFAULTS, ...parsed };
      glassState.fontScale = clampFontScale(glassState.fontScale);
      syncGlassDom();
      saveGlassSettings();
      showToast('เรียกใช้สไตล์ที่บันทึกไว้ประจำเครื่องนี้แล้วครับ', 'info');
    } catch (e) {}
  }

  function resetDefaultGlass() {
    glassState = { ...GLASS_DEFAULTS };
    syncGlassDom();
    saveGlassSettings();
    const statusEl = document.getElementById('favSavedStatus');
    if (statusEl) statusEl.classList.add('hidden');
    showToast('รีเซ็ตกลับค่าเริ่มต้นของระบบเรียบร้อยแล้วครับ', 'info');
  }

  function toggleWorkspaceTheme() {
    glassState.theme = glassState.theme === 'dark' ? 'light' : 'dark';
    syncGlassDom();
    saveGlassSettings();
  }

  function toggleGlassPanel(forceState) {
    const panel = document.getElementById('gwMaterialPanel');
    const notif = document.getElementById('gwNotificationsPanel');
    if (notif) notif.classList.add('hidden');
    if (!panel) return;
    const nextOpen = typeof forceState === 'boolean' ? forceState : panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !nextOpen);
  }

  function toggleNotificationsPanel(forceState) {
    const notif = document.getElementById('gwNotificationsPanel');
    const panel = document.getElementById('gwMaterialPanel');
    if (panel) panel.classList.add('hidden');
    if (!notif) return;
    const nextOpen = typeof forceState === 'boolean' ? forceState : notif.classList.contains('hidden');
    if (nextOpen) renderNotificationsPopover();
    notif.classList.toggle('hidden', !nextOpen);
  }

  function renderNotificationsPopover() {
    const box = document.getElementById('gwNotificationsList');
    if (!box) return;
    const examCe = normalizeIsoDateBEtoCE(STATE.config && STATE.config.EXAM_DATE_CE ? STATE.config.EXAM_DATE_CE : '2027-01-30');
    const daysLeft = Math.max(0, Math.ceil((new Date(examCe + 'T08:30:00') - new Date()) / 86400000));
    const subs = STATE.cachedSubmissions || [];
    const validSubs = subs.filter(s => s.reviewStatus !== 'ส่งแก้');
    const uniqueStrands = new Set(validSubs.map(s => `${s.subjectCode}_${s.strandNo}`)).size;
    const approvedStrands = new Set(subs.filter(s => s.reviewStatus === 'ผ่านพร้อมรวมเล่ม').map(s => `${s.subjectCode}_${s.strandNo}`)).size;
    const pendingTeachers = (STATE.teachers || []).filter(t => t.status !== 'APPROVED').length;
    const hasDrive = !!(STATE.config && STATE.config.DRIVE_ROOT_FOLDER_ID);

    const cards = [
      `<div class="gw-subcard py-2 px-3">
        <div class="font-bold">กำหนดสอบ O-NET ป.6 จริง (30 ม.ค. 2570)</div>
        <div class="gw-tabular" style="color: var(--gw-accent);">คงเหลือเวลาอีก ${daysLeft} วันก่อนวันสอบจริง</div>
      </div>`,
      `<div class="gw-subcard py-2 px-3">
        <div class="font-bold">ความคืบหน้าคลังเอกสารติว 15 สาระ</div>
        <div class="gw-tabular" style="color: var(--gw-muted);">ส่งเข้าแล้ว ${uniqueStrands}/15 สาระ | ผ่านพร้อมสอน ${approvedStrands} สาระ</div>
      </div>`
    ];
    if (STATE.currentTeacher && STATE.currentTeacher.role === 'SUPER_ADMIN' && pendingTeachers > 0) {
      cards.push(`<div class="gw-alert-warn py-2 px-3">
        <div class="font-bold">มีบัญชีครูรออนุมัติสิทธิ์ ${pendingTeachers} รายการ</div>
        <div>สามารถตรวจสอบและกดอนุมัติได้ที่แท็บ 5. ผู้ดูแลกลุ่มฯ</div>
      </div>`);
    }
    cards.push(`<div class="gw-subcard py-2 px-3">
      <div class="font-bold" style="color: var(--gw-accent);">${hasDrive ? '✓ เชื่อมต่อ Google Drive แล้ว' : 'สถานะ Google Drive'}</div>
      <div style="color: var(--gw-muted);">โฟลเดอร์รับงาน wkha@saraburi2.go.th (ครบ 4 วิชา)</div>
    </div>`);
    box.innerHTML = cards.join('');
  }

  let _modalConfirmHandler = null;
  function openCustomModal(opts) {
    const o = opts || {};
    const modal = document.getElementById('customActionModal');
    const titleEl = document.getElementById('customModalTitle');
    const subEl = document.getElementById('customModalSubtitle');
    const bodyEl = document.getElementById('customModalBody');
    const confirmBtn = document.getElementById('customModalConfirmBtn');
    const cancelBtn = document.getElementById('customModalCancelBtn');
    if (!modal || !titleEl || !bodyEl || !confirmBtn) return;

    titleEl.textContent = o.title || 'ยืนยันการดำเนินการ';
    if (subEl) {
      subEl.textContent = o.subtitle || '';
      subEl.classList.toggle('hidden', !o.subtitle);
    }
    bodyEl.innerHTML = o.bodyHtml || '';
    confirmBtn.textContent = o.confirmText || 'ยืนยัน';
    if (cancelBtn) {
      cancelBtn.textContent = o.cancelText || 'ยกเลิก';
      cancelBtn.classList.toggle('hidden', !!o.hideCancel);
    }
    confirmBtn.className = o.danger
      ? 'px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer'
      : 'gw-btn-primary text-xs';

    _modalConfirmHandler = typeof o.onConfirm === 'function' ? o.onConfirm : null;
    confirmBtn.onclick = async () => {
      if (!_modalConfirmHandler) { closeCustomModal(); return; }
      const keepOpen = await _modalConfirmHandler(modal);
      if (keepOpen !== false) closeCustomModal();
    };
    modal.classList.remove('hidden');
    refreshIcons();
    const firstInput = modal.querySelector('input, select, textarea');
    setTimeout(() => { if (firstInput) firstInput.focus(); else confirmBtn.focus(); }, 30);
  }

  function closeCustomModal() {
    const modal = document.getElementById('customActionModal');
    if (modal) modal.classList.add('hidden');
    _modalConfirmHandler = null;
  }

  function copyDeveloperPhone(phone) {
    const num = String(phone || '0861314054');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(num).then(
        () => showToast(`คัดลอกเบอร์ติดต่อ ${num} เรียบร้อยแล้ว`, 'success'),
        () => showToast(`เบอร์ติดต่อผู้พัฒนาระบบ: ${num}`, 'info')
      );
    } else {
      showToast(`เบอร์ติดต่อผู้พัฒนาระบบ: ${num}`, 'info');
    }
  }

  function openDeveloperAboutModal() {
    openCustomModal({
      title: 'ผู้พัฒนาระบบ / เกี่ยวกับระบบ',
      subtitle: 'โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET) ชั้น ป.6 ปีการศึกษา 2569',
      hideCancel: true,
      confirmText: 'ปิดหน้าต่าง',
      bodyHtml: `
        <div class="gw-subcard p-3.5 space-y-2.5">
          <div class="flex items-start gap-3">
            <span class="gw-profile-avatar shrink-0">
              <i data-lucide="user-check" class="w-5 h-5"></i>
            </span>
            <div class="space-y-0.5">
              <div class="text-sm font-bold" style="color: var(--gw-ink);">นายเกียรติศักดิ์ กรุณา</div>
              <div class="text-xs font-semibold" style="color: var(--gw-accent);">ผู้คิดค้น ออกแบบ และพัฒนาระบบ | โรงเรียนวัดคลองห้า</div>
              <div class="text-xs" style="color: var(--gw-muted);">กลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2 (8 โรงเรียน)</div>
            </div>
          </div>
          <div class="pt-2 border-t text-xs space-y-1 leading-relaxed" style="border-color: var(--gw-line); color: var(--gw-ink);">
            <div><span class="font-bold">ขอบข่ายระบบ:</span> พัฒนาขึ้นเพื่อเป็นระบบกลางร่วมกันของทั้ง 8 โรงเรียน สำหรับให้นักเรียน ป.6 ติวและฝึกทำข้อสอบออนไลน์ คณะกรรมการส่งตรวจต้นฉบับ (.docx) ครูผู้สอนติดตามคลังติว และครูวิชาการตรวจกระดาษคำตอบและวิเคราะห์ผล Pre / Post Test ครบ 4 วิชา 108 ตัวชี้วัด สทศ. 2569</div>
          </div>
        </div>
        <div class="gw-subcard p-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <div class="text-xs font-bold" style="color: var(--gw-ink);">ช่องทางติดต่อแจ้งปัญหาการใช้งาน / รีเซ็ตรหัสผ่าน</div>
            <div class="text-sm font-bold mt-0.5 tabular-nums" style="color: var(--gw-accent);">โทร. 086-131-4054</div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="copyDeveloperPhone('0861314054')" class="gw-btn-soft text-xs inline-flex items-center gap-1.5">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>คัดลอกเบอร์</span>
            </button>
            <a href="tel:0861314054" class="gw-btn-primary text-xs inline-flex items-center gap-1.5 no-underline">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i>
              <span>โทรออก</span>
            </a>
          </div>
        </div>
      `
    });
  }

  function getIndicatorDesc(code) {
    const row = (STATE.blueprint || []).find(r => String(r.indicatorCode || '').trim() === String(code || '').trim());
    return row ? String(row.indicatorDesc || '').trim() : '';
  }

  let _countdownTimer = null;
  let _countdownTargetIso = '2027-01-30';

  function addCalendarMonthsClamped(baseDate, monthsToAdd) {
    const d = new Date(baseDate.getTime());
    const origDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthsToAdd);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(origDay, maxDay));
    return d;
  }

  function computeDetailedCountdown(now, target) {
    if (!(now instanceof Date) || !(target instanceof Date) || now.getTime() >= target.getTime()) {
      return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0 };
    }
    let months = 0;
    while (months < 120) {
      const nextAnchor = addCalendarMonthsClamped(now, months + 1);
      if (nextAnchor.getTime() <= target.getTime()) months++;
      else break;
    }
    const anchor = addCalendarMonthsClamped(now, months);
    const remSec = Math.max(0, Math.floor((target.getTime() - anchor.getTime()) / 1000));
    const remDaysTotal = Math.floor(remSec / 86400);
    const weeks = Math.floor(remDaysTotal / 7);
    const days = remDaysTotal % 7;
    const hours = Math.floor((remSec % 86400) / 3600);
    const minutes = Math.floor((remSec % 3600) / 60);
    const seconds = remSec % 60;
    const totalDays = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
    return { months, weeks, days, hours, minutes, seconds, totalDays };
  }

  function renderCountdownTick() {
    const target = new Date(_countdownTargetIso + 'T08:30:00+07:00');
    const now = new Date();
    const cd = computeDetailedCountdown(now, target);
    const pad2 = (n) => String(n).padStart(2, '0');

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== val) el.textContent = val;
    };

    setTxt('cdMonths', pad2(cd.months));
    setTxt('cdWeeks', pad2(cd.weeks));
    setTxt('cdDays', pad2(cd.days));
    setTxt('cdHours', pad2(cd.hours));
    setTxt('cdMinutes', pad2(cd.minutes));

    const secEl = document.getElementById('cdSeconds');
    const secStr = pad2(cd.seconds);
    if (secEl && secEl.textContent !== secStr) {
      secEl.textContent = secStr;
      secEl.classList.remove('gw-sec-tick');
      void secEl.offsetWidth;
      secEl.classList.add('gw-sec-tick');
    }

    setTxt('heroDaysLeft', String(cd.totalDays));
    const badgeLbl = document.getElementById('gwCountdownLabel');
    if (badgeLbl) {
      badgeLbl.textContent = `อีก ${cd.totalDays} วัน (${pad2(cd.hours)}:${pad2(cd.minutes)}:${secStr}) | ครบ 4 วิชา 108 ตัวชี้วัด`;
    }
  }

  function updateExamCountdown(examDateIso) {
    _countdownTargetIso = normalizeIsoDateBEtoCE(examDateIso || '2027-01-30');
    renderCountdownTick();
    if (!_countdownTimer) {
      _countdownTimer = setInterval(renderCountdownTick, 1000);
    }
  }

  const DEFAULT_GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwG-eaNeRsZ9wmCWvcGfKNpzxHgUFJPckdbfNL3b7MamTFjrWexwkCFYR_ApLfqGtQG/exec';
  const BOOTSTRAP_SWR_KEY = 'onet2569_bootstrap_swr_v1';

  async function callGasViaFetch_(fnName, payload, hasPayload) {
    const apiUrl = String(window.ONET_GAS_API_URL || DEFAULT_GAS_API_URL || '').trim();
    if (!apiUrl) {
      throw new Error('ยังไม่ได้กำหนดลิงก์เชื่อมต่อหลังบ้าน (ONET_GAS_API_URL)');
    }
    let resp;
    if (fnName === 'apiGetBootstrapData' && !hasPayload) {
      const sep = apiUrl.includes('?') ? '&' : '?';
      resp = await fetch(apiUrl + sep + 'apiAction=apiGetBootstrapData&_ts=' + Date.now(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-store'
      });
    } else {
      resp = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: fnName,
          payload: hasPayload ? payload : null,
          hasPayload: Boolean(hasPayload)
        })
      });
    }
    const rawText = await resp.text();
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      throw new Error('ระบบหลังบ้านกำลังรอกดอัปเดตเวอร์ชัน (Deploy -> New version ใน Google Apps Script 1 ครั้ง)');
    }
    if (parsed && parsed.__rpcEnvelope === 1) {
      if (!parsed.ok) throw new Error(parsed.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
      return parsed.result;
    }
    return parsed;
  }

  function callGas(fnName, payload) {
    const hasPayload = arguments.length >= 2 && payload !== undefined;
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        const runner = google.script.run
          .withSuccessHandler(res => resolve(res))
          .withFailureHandler(err => reject(err));
        if (!hasPayload) runner[fnName]();
        else runner[fnName](payload);
      });
    }
    return callGasViaFetch_(fnName, payload, hasPayload);
  }

  let _toastTimer = null;
  function showToast(msg, type = 'info') {
    const el = document.getElementById('statusToast');
    if (!el) return;
    el.className = 'gw-toast ';
    if (type === 'error') el.style.background = '#be123c', el.style.color = '#ffffff';
    else if (type === 'success') el.style.background = '#15803d', el.style.color = '#ffffff';
    else el.style.background = '', el.style.color = '';
    el.textContent = msg;
    el.classList.remove('hidden');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.add('hidden'), 6000);
  }

  function escHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hasFiniteNumber(val) {
    if (val === null || val === undefined || val === '' || typeof val === 'boolean') return false;
    const n = Number(val);
    return Number.isFinite(n);
  }

  function fmtFixed(val, digits = 2, fallback = '-') {
    return hasFiniteNumber(val) ? Number(val).toFixed(digits) : fallback;
  }

  async function withButtonBusy(btnOrId, busyLabel, fn) {
    const btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
    if (!btn) return fn();
    if (btn.dataset.gwBusy === '1') return;
    const origHtml = btn.innerHTML;
    const origDisabled = btn.disabled;
    btn.dataset.gwBusy = '1';
    btn.disabled = true;
    btn.classList.add('gw-btn-busy');
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="gw-spin-ring" aria-hidden="true"></span><span>${escHtml(busyLabel || 'กำลังดำเนินการ...')}</span>`;
    try {
      return await fn();
    } finally {
      btn.dataset.gwBusy = '';
      btn.disabled = origDisabled;
      btn.classList.remove('gw-btn-busy');
      btn.removeAttribute('aria-busy');
      btn.innerHTML = origHtml;
      refreshIcons();
    }
  }

  /* ========================================================================
   * 2. THAI DATE BE/CE AUTO-CONVERSION & TRUE THAI DISTRIBUTED JUSTIFICATION
   * ======================================================================== */
  function normalizeIsoDateBEtoCE(rawDate) {
    const s = String(rawDate ?? '').trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return s;
    let y = parseInt(m[1], 10);
    while (y >= 2400) y -= 543;
    return `${String(y).padStart(4, '0')}-${m[2]}-${m[3]}`;
  }

  function formatThaiDateFull(rawDate) {
    const iso = normalizeIsoDateBEtoCE(rawDate);
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(rawDate ?? '');
    const ceYear = parseInt(m[1], 10);
    const mIdx = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    if (mIdx < 0 || mIdx > 11) return iso;
    return `${day} ${THAI_MONTHS[mIdx]} พ.ศ. ${ceYear + 543}`;
  }

  let _thaiWordSegmenter = null;
  let _thaiGraphemeSegmenter = null;

  function splitThaiOrthoClusters(word) {
    if (!_thaiGraphemeSegmenter && typeof Intl !== 'undefined' && Intl.Segmenter) {
      _thaiGraphemeSegmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
    }
    if (!_thaiGraphemeSegmenter) return [word];
    const gs = Array.from(_thaiGraphemeSegmenter.segment(word)).map(x => x.segment);
    const out = [];
    for (let i = 0; i < gs.length; i++) {
      const c = gs[i];
      if (/^[\u0E40-\u0E44]$/.test(c) && i + 1 < gs.length) out.push(c + gs[++i]);
      else if (out.length > 0 && /^[\u0E30\u0E32\u0E33\u0E45\u0E46]$/.test(c)) out[out.length - 1] += c;
      else out.push(c);
    }
    return out;
  }

  function thaiDistributeHtml(rawText) {
    if (!rawText) return '';
    const text = escHtml(rawText)
      .replace(/([\u0E00-\u0E7F])([A-Za-z])/g, '$1 $2')
      .replace(/([A-Za-z])([\u0E00-\u0E7F])/g, '$1 $2')
      .replace(/[ \t]{2,}/g, ' ');
    if (!_thaiWordSegmenter && typeof Intl !== 'undefined' && Intl.Segmenter) {
      _thaiWordSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
    }
    if (!_thaiWordSegmenter) return text;
    const tokens = Array.from(_thaiWordSegmenter.segment(text)).map(s => s.segment);
    const thaiRegex = /[\u0E00-\u0E7F]/;
    let html = '';
    for (let i = 0; i < tokens.length; i++) {
      const curr = tokens[i];
      const next = i + 1 < tokens.length ? tokens[i + 1] : '';
      if (/^\s+$/.test(curr)) html += ' ';
      else if (thaiRegex.test(curr)) {
        const clusters = splitThaiOrthoClusters(curr);
        html += '<span class="th-word">' + clusters.join('<span class="th-cj"> </span>') + '</span>';
        if (thaiRegex.test(next)) html += '<span class="th-wj"> </span>';
      } else html += curr;
    }
    return html;
  }

  /* ========================================================================
   * 3. CLIENT-SIDE .DOCX XML EXTRACTOR & VALIDATOR (JSZIP + NATIVE FALLBACK)
   * ======================================================================== */
  function validateDocxXmlContent(documentXml = '', stylesXml = '', expectedIndicators = [], options = {}) {
    const docCategory = String((options && options.docCategory) || 'TUTORING_STRAND').toUpperCase();
    const targetAudience = String((options && options.targetAudience) || 'COMBINED').toUpperCase();

    const extractFonts = (xmlStr) => {
      const list = [];
      const rx = /w:(?:ascii|hAnsi|cs)=["']([^"']+)["']/g;
      let match;
      while ((match = rx.exec(String(xmlStr || ''))) !== null) {
        const f = match[1].trim();
        if (f && !list.includes(f)) list.push(f);
      }
      return list;
    };

    const docFonts = extractFonts(documentXml);
    const styleFonts = extractFonts(stylesXml);
    const fontMatches = docFonts.length > 0 ? docFonts : styleFonts;
    const hasSarabunFont = fontMatches.some(f => f.toLowerCase() === 'th sarabunpsk');
    const otherFonts = fontMatches.filter(f => f.toLowerCase() !== 'th sarabunpsk');

    const plainText = String(documentXml || '')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tab\s*\/>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
    const compactText = plainText.replace(/\s+/g, '');

    const missingIndicators = [];
    const skipIndicatorCheck = docCategory === 'PREPOST_EXAM' && targetAudience === 'STUDENT';
    if (!skipIndicatorCheck) {
      for (const ind of expectedIndicators) {
        const compactInd = String(ind).replace(/\s+/g, '');
        if (compactInd && !compactText.includes(compactInd)) missingIndicators.push(ind);
      }
    }

    let hasAnswerLeak = false;
    const answerLeakSnippets = [];
    if (targetAudience === 'STUDENT') {
      const leakRegex = /เฉลย|ตารางคำตอบ|ตารางสรุปเฉลย|ผังเฉลย|แนวคำตอบ|คำตอบที่ถูก\s*[:คือ=]|(?:^|[\s:])ตอบ\s*ข้อ\s*[1-4๑-๔ก-ง](?![0-9๑-๙.])|ฉบับครู|ลับเฉพาะครู/g;
      let m;
      while ((m = leakRegex.exec(plainText)) !== null) {
        hasAnswerLeak = true;
        if (answerLeakSnippets.length < 3) {
          const start = Math.max(0, m.index - 15);
          const end = Math.min(plainText.length, m.index + m[0].length + 25);
          answerLeakSnippets.push(plainText.slice(start, end).replace(/\s+/g, ' ').trim());
        }
      }
    }

    const missingSections = [];
    if (docCategory === 'PREPOST_EXAM') {
      if (targetAudience === 'STUDENT') {
        if (!/ข้อสอบ|แบบทดสอบ|คำชี้แจง/.test(plainText)) {
          missingSections.push('หัวข้อแบบทดสอบ / คำชี้แจงสำหรับนักเรียน');
        }
        if (!/คำสั่ง|คำชี้แจง|จงเลือก|จงตอบ|ข้อ\s*[\d๑-๙]+/.test(plainText)) {
          missingSections.push('ตัวข้อสอบรายข้อสำหรับนักเรียน');
        }
      } else if (targetAudience === 'TEACHER') {
        if (!/ฉบับครู|สำหรับครู|ลับเฉพาะครู|คู่มือครู/.test(plainText)) {
          missingSections.push('ป้ายระบุฉบับครู (ลับเฉพาะครูผู้สอน)');
        }
        if (!/ผังข้อสอบ|ตารางสรุปเฉลย|ตารางเฉลย|ตารางวิเคราะห์/.test(plainText)) {
          missingSections.push('ตารางผังข้อสอบ / สรุปเฉลยรายข้อ');
        }
        if (!/เฉลย/.test(plainText)) {
          missingSections.push('ส่วนที่ 2: เฉลยและวิธีคิดละเอียดรายข้อ');
        }
        if (!/วิธีคิด|คำอธิบาย|เหตุผล|แนวคิด|เกณฑ์การให้คะแนน/.test(plainText)) {
          missingSections.push('คำอธิบายเหตุผล / วิธีคิดละเอียดรายข้อ');
        }
      } else {
        if (!/ข้อสอบ|แบบทดสอบ/.test(plainText)) missingSections.push('ส่วนที่ 1: ตัวข้อสอบคู่ขนาน Pre-Post');
        if (!/เฉลย/.test(plainText)) missingSections.push('ส่วนที่ 2: เฉลยและวิธีคิดละเอียด');
      }
    } else {
      if (targetAudience === 'STUDENT') {
        if (!/สรุปความรู้|สรุปเนื้อหา|ใบความรู้/.test(plainText)) {
          missingSections.push('ส่วนที่ 1: สรุปความรู้ตรงจุดออกสอบ');
        }
        if (!/ข้อสอบ|แบบฝึก|ใบงาน/.test(plainText)) {
          missingSections.push('ส่วนที่ 2: แบบฝึกทักษะ/ใบงานนักเรียน');
        }
      } else if (targetAudience === 'TEACHER') {
        if (!/ฉบับครู|สำหรับครู|จุดเน้นการสอน|คู่มือครู|แนวการสอน/.test(plainText)) {
          missingSections.push('ป้ายระบุฉบับครู / จุดเน้นการสอน');
        }
        if (!/สรุปความรู้|สรุปเนื้อหา|ใบความรู้/.test(plainText)) {
          missingSections.push('ส่วนที่ 1: สรุปความรู้และจุดเน้นการสอน');
        }
        if (!/ข้อสอบ|แบบฝึก|ใบงาน/.test(plainText)) {
          missingSections.push('ส่วนที่ 2: แบบฝึกทักษะ/ข้อสอบประจำตัวชี้วัด');
        }
        if (!/เฉลย/.test(plainText)) {
          missingSections.push('ส่วนที่ 3: เฉลยและวิธีคิดละเอียด');
        }
        if (!/วิธีคิด|คำอธิบาย|เหตุผล|แนวคิด/.test(plainText)) {
          missingSections.push('คำอธิบายวิธีคิดละเอียดรายข้อ');
        }
      } else {
        if (!/สรุปความรู้|สรุปเนื้อหา/.test(plainText)) missingSections.push('ส่วนที่ 1: สรุปความรู้ตรงจุดออกสอบ');
        if (!/ข้อสอบ|แบบฝึก/.test(plainText)) missingSections.push('ส่วนที่ 2: แบบฝึกทักษะ/ข้อสอบประจำตัวชี้วัด');
        if (!/เฉลย/.test(plainText)) missingSections.push('ส่วนที่ 3: เฉลยและวิธีคิดละเอียด');
      }
    }

    /* Anti-Shift Layout Guard checks (Page size A4, Floating Anchors, Floating TextBoxes) */
    const layoutWarnings = [];
    let isA4Page = true;
    const pgSzMatch = String(documentXml || '').match(/<w:pgSz[^>]*w:w=["'](\d+)["'][^>]*w:h=["'](\d+)["']/);
    if (pgSzMatch) {
      const w = parseInt(pgSzMatch[1], 10);
      const h = parseInt(pgSzMatch[2], 10);
      if (Math.abs(w - 11906) > 220 || Math.abs(h - 16838) > 250) {
        isA4Page = false;
        layoutWarnings.push('ขนาดหน้ากระดาษไม่ใช่ A4 มาตรฐาน (อาจตั้งเป็น Letter ทำให้ตัดหน้าเพี้ยน)');
      }
    }
    const floatingCount = (String(documentXml || '').match(/<wp:anchor\b/g) || []).length;
    if (floatingCount > 0) {
      layoutWarnings.push(`พบรูปภาพ/วัตถุแบบลอย (Floating) ${floatingCount} จุด เสี่ยงเคลื่อนเมื่อรวมเล่ม (แนะนำตั้งเป็น "บรรทัดเดียวกับข้อความ / In Line with Text" หรือวางในตาราง)`);
    }
    const textBoxCount = (String(documentXml || '').match(/<w:txbxContent\b/g) || []).length;
    if (textBoxCount > 0) {
      layoutWarnings.push(`พบกล่องข้อความลอย (TextBox) ${textBoxCount} จุด แนะนำใช้ตารางล็อกช่องแทนเพื่อไม่ให้ขยับ`);
    }

    const passed = hasSarabunFont && otherFonts.length === 0 && missingIndicators.length === 0 && missingSections.length === 0 && !hasAnswerLeak;
    return { passed, docCategory, targetAudience, hasSarabunFont, otherFonts, missingIndicators, missingSections, hasAnswerLeak, answerLeakSnippets, isA4Page, floatingCount, textBoxCount, layoutWarnings };
  }

  const REPORT_DOCX_SKELETON_B64 = [
    'UEsDBBQAAAAIAAlBb13UmUC5EAEAACIFAAAcAAAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVs',
    'c7WUy07DMBBFfyXynjgJUAqq2w1C6haFD3DtyUPED9lTRP8ei7RNiiqLhbuca_veo9GMV5tvNWRf',
    '4HxvNCNlXpAMtDCy1y0jH_Xb3ZJs1qt3GDiGG77rrc_CE-0Z6RDtC6VedKC4z40FHU4a4xTHULqW',
    'Wi4-eQu0KooFdXMPcumZbSUjbitLktUHC__xNk3TC3g1Yq9A45UI6vEwgA-O3LWAjIx1HnwIvR5f',
    'pYzXe7UDF_o4EZylGMR9SojGGNQG5204SzGIh5QQoOUfhpMSQ3hMOguAGPo-n4ajEkNYpETogEtw',
    'E8BYl7H8p9vnV7H8Zcp8DG9hiv8tRzHag-e066Cx5rsB5utwlE4Q9OKzW_8AUEsDBBQAAAAIAAlB',
    'b12wLL33NwEAAIMCAAARAAAAZG9jUHJvcHMvY29yZS54bWylkl1vwiAUhv9Kw31LqR8xpMVkW7ya',
    'yZJptuyOwFHJCiXArP770apVM-92Ce_Dk_ectpwfdJ3swXnVmAqRLEcJGNFIZbYVWq8W6QwlPnAj',
    'ed0YqNARPJqzUlgqGgdvrrHgggKfRI_xVNgK7UKwFGMvdqC5zyJhYrhpnOYhHt0WWy6--RZwkedT',
    'rCFwyQPHnTC1gxGdlVIMSvvj6l4gBYYaNJjgMckIvrIBnPYPH_TJDalVOFp4iF7CgT54NYBt22bt',
    'qEdjf4I_l6_v_aipMt2mBCBWSkGFAx4ax9YmNVyDLPHNZbfAmvuwjJveKJBPxxvub9bhDvaq-0qM',
    '9MRwLM9Dn9wgk1iWnka7JB-j55fVArEiL6YpISkZr8iYkgmdjLNZkX911e4cV6k-l_iX9SJhffP7',
    'H4f9AlBLAwQUAAAACAAJQW9dH6OSluYAAADOAgAACwAAAF9yZWxzLy5yZWxzrZLPSgMxEIdfJcy9',
    'O9tWRKRpL1LoTaQ-QEhmd4PNHyZTrW9vKIpW6tpDj5n85ss3QxarQ9ipV-LiU9QwbVpQFG1yPvYa',
    'nrfryR2slosn2hmpiTL4XFRtiUXDIJLvEYsdKJjSpEyx3nSJg5F65B6zsS-mJ5y17S3yTwacMtXG',
    'aeCNm4Lavme6hJ26zlt6SHYfKMqZJ34lKtlwT6LhLbFD91luKhbwvM3scpu_J8VAYpwRgzYxTTLX',
    'bhZP5VuoujzWcjkmxoTm11wPHYSiIzeuZHIeM7q5ppHdF0nhnxUdM19KePIxlx9QSwMEFAAAAAgA',
    'CUFvXdJ3_LdtAAAAewAAABsAAAB3b3JkL19yZWxzL2hlYWRlcjEueG1sLnJlbHNNjEEOAiEMRa9C',
    'uneKLowxw8xuDmD0AA1WIA6FUGI8vixd_rz3_rx-824-3DQVcXCcLBgWX55JgoPHfTtcYF3mG-_U',
    'h6ExVTUjEXUQe69XRPWRM-lUKssgr9Iy9TFbwEr-TYHxZO0Z2_8H4PIDUEsDBBQAAAAIAAlBb13S',
    'd_y3bQAAAHsAAAAbAAAAd29yZC9fcmVscy9oZWFkZXIyLnhtbC5yZWxzTYxBDgIhDEWvQrp3ii6M',
    'McPMbg5g9AANViAOhVBiPL4sXf689_68fvNuPtw0FXFwnCwYFl-eSYKDx307XGBd5hvv1IehMVU1',
    'IxF1EHuvV0T1kTPpVCrLIK_SMvUxW8BK_k2B8WTtGdv_B-DyA1BLAwQUAAAACAAJQW9d-179skkC',
    'AACRCwAAEAAAAHdvcmQvaGVhZGVyMS54bWzdlt1yojAUx1-Fyb1GsHVdRu107Lbd2Rtn6j5ADAGy',
    'JR-TRNB9-g3IhyttB_DOGxKSc37nf3JO0MXDgSVOSpSmgi-BO54Ah3AsAsqjJfi9fR7NwcNqkflx',
    'oBxryrWfSbwEsTHSh1DjmDCkx4xiJbQIzRgLBkUYUkxgJlQAvYk7KWZSCUy0ttw14inSoMSxNk1I',
    'wu1mKBRDxr6qCDKk3vdyZOkSGbqjCTVHy57MKoxYgr3ifokY1YJyF_8kqBwqD9Ul7snlSeA9I9wU',
    'EaEiidUguI6pbNIYSrObcQVJv0oiZQmoS-DeXVeDJ4UyOzTALvKDkxNLTsq_JrqTDhXJEbVHFwn_',
    'x6yUMER5E3jQ0ZwdrnvfD-BdAmR0XXFelNjLhkavo_3k7zWLk16sssjnqenrxLzFSNY3EB-6wcq-',
    'y3l3EMdIGXJoGG5vyD38DudtkDcAZBP03DZq2hs1g7mqFqhjL1-ArKoWqWNTX5I-SG42jOS1Sd-G',
    'kaZt0nwYqdVOmTvDNOjX49UlgdbzjKP73TXbTCVGH5kVlP_oyuKxUfnwBzuZn6JkCRSNYgPgagHr',
    'zdOjnD8LbrQ1RhpT--3YvjpvSKHdnm_efgG7jvUHi_Ej1y1jmPO42CghwmKu_1Yiph4oV9b6cg3r',
    'YkgQj6otE4-2r3mcHQ1o9XpKoZQdJsHa1sKpZ9ujtCe4I5H9tpeWN5Iq5dqoLTmYvFl8LRG2iUpF',
    'NFEpAavN48uP3Lo2u6nkP6mzJtLqMeTGSv1JtoQHTaKwuOiw-I-9-gdQSwMEFAAAAAgACUFvXScA',
    '3pD2AQAAewgAABAAAAB3b3JkL2hlYWRlcjIueG1spZbbbqMwEIZfBfk-MZA2m0Wl1apVt6u9iZTs',
    'AzjGBKv4INtAuk-_hhjIhqoCcsPgw3zzDzMGHp5OLPdKojQVPAbB0gce4VgklB9j8Gf_utiAp8eH',
    'KsoS5dmtXEeVxDHIjJERhBpnhCG9ZBQroUVqllgwKNKUYgIroRIY-oHf3EklMNHacp8RL5EGDseG',
    'NCEJt4upUAwZO1RHyJB6L-TC0iUy9EBzaj4s21-3GBGDQvHIIRadoNolOgtypvVQY-KeXV4ELhjh',
    'pokIFcmtBsF1RmWfxlyaXcxaSPlVEiXLQVeC4O62GrwoVFnTA8fIT85OLD8r_5oY-CMqUiM6jzES',
    '_o_ZKmGI8j7wrEdz8XCD-2mA8Bogj7cV56cShexp9DbaL_7esTiZxHJFvkxN3yZmlyHZnUB8Ggdz',
    'fVfz7iDOkDLk1DOCyZB7-B1uhqBwBsgmGAZD1Goyag1rVQPQyF6-AllVA9LIpr4mfZLceh4pHJK-',
    'zSOthqTNPNKgnapgjWkyrcfbQwKt5wVHTztrtpkcRn8wK6j-6MrmslW1Uc68Cm60V0VIY2rfDPs3',
    'b4cUOhR8u_sN7DzWn0xmP7gebIY1j4utEiJt7vVfu7VEeQxWIXAzz_p6DuvG5Igf2yWTLfZvdZwD',
    'TWg7tLugkw1dFrBJCTZ_E4__AFBLAwQUAAAACAAJQW9dWHnbIpIAAADkAAAAEwAAAGRvY1Byb3Bz',
    'L2N1c3RvbS54bWydzkEKwjAQheGrlNnbVBcipWk34tpFdR_SaRtoZkImLfb2RgQP4PLxw8drupdf',
    'ig2jOCYNx7KCAsny4GjS8OhvhwsUkgwNZmFCDTsKdG1zjxwwJodSZIBEw5xSqJUSO6M3UuZMuYwc',
    'vUl5xknxODqLV7arR0rqVFVnZVdJ7A_hx8HXq7f0Lzmw_byTZ7-H7Kn2DVBLAwQUAAAACAAJQW9d',
    '4vyd2pMAAADmAAAAEAAAAGRvY1Byb3BzL2FwcC54bWydzkEKwjAQheGrhOxtqguR0rQbce2iug_J',
    'tA00MyETS3t7I4IHcPn44eO1_RYWsUJiT6jlsaqlALTkPE5aPobb4SIFZ4POLISg5Q4s-669J4qQ',
    'sgcWBUDWcs45NkqxnSEYrkrGUkZKweQy06RoHL2FK9lXAMzqVNdnBVsGdOAO8QfKr9is-V_Ukf38',
    '4-ewx-Kp7g1QSwMEFAAAAAgACUFvXZyJyZHOAQAArQYAABIAAAB3b3JkL2Zvb3Rub3Rlcy54bWzV',
    'lM1O4zAQx18l8r11UgFaRU05gEDcEN19AOM4jYXtsWwnoW-_k8RNuiyqCj1xib9mfvOfmdjr23et',
    'klY4L8EUJFumJBGGQynNriB_fj8sfpHEB2ZKpsCIguyFJ7ebdZdXAMFAED5BgvF5Z3lB6hBsTqnn',
    'tdDML7XkDjxUYclBU6gqyQXtwJV0lWbpMLMOuPAew90x0zJPIk7_TwMrDB5W4DQLuHQ7qpl7a-wC',
    '6ZYF-SqVDHtkpzcHDBSkcSaPiMUkqHfJR0FxOHi4c-KOLvfAGy1MGCJSJxRqAONraec0vkvDw_oA',
    'aU8l0WpFphZkV5f14N6xDocZeI78cnTSalR-mpilZ3SkR0we50j4N-ZBiWbSzIG_VZqj4mbXXwOs',
    'PgLs7rLmPDpo7EyTl9GezNvE6i_2F1ixycep-cvEbGtm8QZqnj_tDDj2qlARtizBqif9b02On5yk',
    'y8PeooUXljkWwBHckmVBFtlgaIfPs-sHbxnHCGjAqiDwdqe9sZJ9zqurafHS9CFZE4DQzZpO7uMn',
    'zrdhr_roLVMFeYhqXkQlHL6ZIjpG42o-jvsTbpI9HdBBM529Pk2XgwnSNMMrs_2YevoTMv80g1NV',
    'OFr4zV9QSwMEFAAAAAgACUFvXdJ3_LdtAAAAewAAAB0AAAB3b3JkL19yZWxzL2Zvb3Rub3Rlcy54',
    'bWwucmVsc02MQQ4CIQxFr0K6d4oujDHDzG4OYPQADVYgDoVQYjy-LF3-vPf-vH7zbj7cNBVxcJws',
    'GBZfnkmCg8d9O1xgXeYb79SHoTFVNSMRdRB7r1dE9ZEz6VQqyyCv0jL1MVvASv5NgfFk7Rnb_wfg',
    '8gNQSwMEFAAAAAgACUFvXT9Kjo3BAQAAkgYAABEAAAB3b3JkL2VuZG5vdGVzLnhtbM2U227jIBCG',
    'X8XiPsGOutXKitOLHla9q5rdB6AYx6jAIMD25u13fAjOtlWUNje9MaeZb_6ZMaxv_mqVtMJ5CaYg',
    '2TIliTAcSml2Bfnz-2Hxk9xs1l0uTGkgCJ-gvfF5Z3lB6hBsTqnntdDML7XkDjxUYclBU6gqyQXt',
    'wJV0lWbpMLMOuPAe4bfMtMyTCaff08AKg4cVOM0CLt2OauZeG7tAumVBvkglwx7Z6fUBAwVpnMkn',
    'xCIK6l3yUdA0HDzcOXFHlzvgjRYmDBGpEwo1gPG1tHMaX6XhYX2AtKeSaLUisQXZ1WU9uHOsw2EG',
    'niO_HJ20GpWfJmbpGR3pEdHjHAn_xzwo0UyaOfCXSnNU3OzH5wCrtwC7u6w5vxw0dqbJy2iP5jWy',
    'jPgUa2rycWr-MjHbmlm8gZrnjzsDjr0oVIQtS7DqSf9bk6MXJ-nysLdo4IVljgVwBLdkWZBFNtjZ',
    '4fPk-sFbxjEAGrAqCLzcaW-sZJ_y6iounps-ImsCELpZ0-g-fqb5NuxVH71lqiD3o5hnUQmH76OY',
    '_CZbEU-n7QiLouMBHRTT6PRRqhxMkKYZHpjt27TT75_1h_pPVGCe-80_UEsDBBQAAAAIAAlBb13S',
    'd_y3bQAAAHsAAAAcAAAAd29yZC9fcmVscy9lbmRub3Rlcy54bWwucmVsc02MQQ4CIQxFr0K6d4ou',
    'jDHDzG4OYPQADVYgDoVQYjy-LF3-vPf-vH7zbj7cNBVxcJwsGBZfnkmCg8d9O1xgXeYb79SHoTFV',
    'NSMRdRB7r1dE9ZEz6VQqyyCv0jL1MVvASv5NgfFk7Rnb_wfg8gNQSwMEFAAAAAgACUFvXWPtXtYd',
    'AQAAQwMAABIAAAB3b3JkL2ZvbnRUYWJsZS54bWyd0d1uwiAUB_BXIdwrtZmNaazeLEt2vz0AArVE',
    'Dqfh4NS3H622a-KN3RUQ8v_lfGz3V3DsxwSy6Cu-WmacGa9QW3-s-PfXx2LDGUXptXToTcVvhvh-',
    't72UNfpILKU9laAq3sTYlkKQagxIWmJrfPqsMYCM6RmOAmQ4nduFQmhltAfrbLyJPMsK_mDCKwrW',
    'tVXmHdUZjI99XgTjkoieGtvSoF1e0S4YdBtQGaLUMbi7B9L6kVm9PUFgVUDCOi5TM4-KeirFV1l_',
    'A_cHrOcB-RNQKHOdZ2wehkjJqWP1PKcYHasnzv-KmQCko25mKfkwV9FlZZSNpGYqmnlFrUfuBt2M',
    'QJWfR49BHlyS0tZZWhzrYXafXHew-zLY0AIXu19QSwMEFAAAAAgACUFvXdJ3_LdtAAAAewAAAB0A',
    'AAB3b3JkL19yZWxzL2ZvbnRUYWJsZS54bWwucmVsc02MQQ4CIQxFr0K6d4oujDHDzG4OYPQADVYg',
    'DoVQYjy-LF3-vPf-vH7zbj7cNBVxcJwsGBZfnkmCg8d9O1xgXeYb79SHoTFVNSMRdRB7r1dE9ZEz',
    '6VQqyyCv0jL1MVvASv5NgfFk7Rnb_wfg8gNQSwMEFAAAAAgACUFvXdRtP2z5BQAAyh8AABUAAAB3',
    'b3JkL3RoZW1lL3RoZW1lMS54bWztWU1v20YQ_SsE742-JcuIEtj6iJvYiRErKXIcUStyrSWX2F3a',
    '0a1ITr0UKJAWPTRAbz0URQM0QINe-mMMJGjTH9EhKUu70jKxE7sIUMuAzV2-mX2cmZ19pq7ffBwy',
    '54gISXnUcSvXyq5DIo-PaeR33AfDwWcbriMVRGNgPCIdd0ake_PGddhUAQmJg9aR3ISOGygVb5ZK',
    '0sNpkNd4TCK8N-EiBIVD4ZfGAo7Ra8hK1XK5WQqBRq4TQYhO700m1CPOMHXpLpz3Gf6KlEwnPCYO',
    'vGxF3SLDjqeV9I-cyS4TzhGwjovrjPnxkDxWrsNAKrzRccvZxy3duF5aGDFVYKvZDbLP3G5uMJ5W',
    'MzvhjxaG9Xqj3txa-K_m_tdx_Va_2W8u_GUA8Dx80orFZ6varc-xGii_tPjutXq1ioHX_NfW8FuN',
    '9MfA15b4-hp-MOguY6iB8svGGr6x3d7umf4bS3xzDd8qb_XqLQOfgQJGo-kautxo1rqnT7uATDjb',
    'scLbjfqgVZ3Dl6iSVl25faSKai2EQy4GCMiSC4pGjprFZAIe4rrA6EhQZ5f6ARZeDBGXOF2ulgfl',
    'Gv5Of-rZVZZR2CSgWedTnlybSvk40hM0Vh33Nnp1NcjrV69Onrw8efL7ydOnJ09-na-9brcDka_b',
    'vf3pm3-ef-n8_duPb599a8dLHf_ml6_e_PHnu9wrg9Z3L968fPH6-6__-vmZBb4lYKTDhzQk0rlL',
    'jp37PMQHtCxARuJ8FsMAqG6xFfkSIkhtLOi-Cgz03RkwsOC2iRnHhwLbhQ14Kzk0CB8EIlHUArwT',
    'hAZwj3O2zYX1me6ka-lRSCLfvrhIdNx9gCPb2t2VLPeTGOue2lx2A2LQ3GeYcvBJRJST3uNTQixm',
    'jyg14rpHPcElnyjnEXW2gVpDMqQjZTfaoSHmZWYjiPk2YrP30NnmzOa-R45MJO4NYDaXhBlhvAWJ',
    'gtDKGEKmI3dBBTaSBzPhGQGXCjPtE8ad_phIabO5J2YG3TvYZuxp32Oz0EQKRac25C5wriN7fNoN',
    'IIytnGkU6NjP5RRLFJx9rqwkuLlD0jHmAaLCdD-kRJ1vbz_ANmQvkPROImxbgnBzP87YBIjN-ZYI',
    'jRa7Jai1OrYT3yjtXUIYHMOYEOfB5zY8j7md9O0Au8oOscXmNpi1mo4jIlErpeLGklgqjZI9ID4v',
    '4LM3W2k8M4hCEEWe707NkunjURda65V5U6OVUpFuWjuJezKEM3ndD8Aoq3Qs7fU6E9F59xjaHH6A',
    'DTm3DTb2M8dmCIzYC2YIqDJs7RZNErtJup0ys8RqNzE37TINpRXRE9LovQpoRfs0Lk_7oMJ4_cPz',
    'S9M7F690iprJqr4pwq2qmi4XY_rpi5oeJNE-wXPkStNcaZr_o6Yp2s9XSuZKyVwpmf9MySzFS0l_',
    '0ZN5CQvf-kwoYwdqxsiuzGSPxL0_HuBkNsiMFi-Z4gAv58sZOF9Adu0Irr6gKjgIIMZllEjyRXw5',
    '9-5LJ-YStZNb6D7TXkm4x8f5bKVy-moTDUAt51F7nc6jUlP5bLO1fIe3cJ-NfKkTaGROz05CW8wk',
    'UbOQaNXORqJSvigWbQuLjcq7WJS0rOD55ED6TrxRzxlhxWFVjzvuBJgkcx-nSb6MhBfF1Hz6quUp',
    '2_ULS7hBQqs6k4RWjQEeI6vTF5zydtue8aqVRmvjslJeWu8ULDJHzjFuv1oDXXkQox_8Bwovwxh9',
    'yrRvAfOjjuupebA_pM_EQqoeyCCHZbfyGIRUEeEwGmLZ66lg0ZJbpdoqf7rk2uVPL3Kl1SSTyYR4',
    'qmBmOcR7uRPr3Y8EpwOeIOmDYHzsjFgi7gMGqtGqpAEcU6kW0RxToRX4MoorXSuv-Cyaxjcwy60K',
    'LA5gfsDovT2HZ9cLStqzZGxXn6xkC-PIH1zEOfx-o5XmWXCetAq72aUe-xqxmp1Yw9r22hvldx8Y',
    'H382aNQ27NRqdmpFx8gFSgRtuWZB3KqFCb2Ag2G1eEua4MxGa99489EhboAeytiEKZm_M3uMurx7',
    '-l3loilkpjf-BVBLAwQUAAAACAAJQW9doNBOGm8CAABSDAAAEgAAAHdvcmQvbnVtYmVyaW5nLnht',
    'bM2XS27bMBCGryJw71By5AeEKEHbIIWLvoCmB6Al2ibCF0hKis_QRXfttmfrSTqULPlRILBlBPDG',
    'tDgz3_wUOUP75u5Z8KCkxjIlUxRdhSigMlM5k8sUfX98GExRYB2ROeFK0hStqUV3tzdVIgsxpwbc',
    'ApEls6VUhsw5OFRRHFTRKKh0FKMA6NImlc5StHJOJxjbbEUFsVeCZUZZtXBXmRJYLRYso7hSJsfD',
    'MArrb9qojFoLOd4RWRLb4sT_NKWpBONCGUEcPJolFsQ8FXoAdE0cmzPO3BrY4bjFqBQVRiYbxKAT',
    '5EOSRtBmaCPMMXmbkHuVFYJKV2fEhnLQoKRdMb1dRl8aGFctpHxpEaXg2y2I4vP24N6QCoYt8Bj5',
    'eRMkeKP8ZWIUHrEjHtFFHCNhP2erRBAmt4l7vZqdlxuNTgMMDwF6ed7mvDeq0FsaO482k08dyxf9',
    'CazNJu8uzZ4n5tuKaIp8yyFz6wzJ3OdCBHtPsxxaF_JtJzEUupXxk013erNw1Lw1lDylKKwpouCO',
    'faQl5Y9rTQFUEg4K13PD8k_exr0NYe_LSw4ODAYfDV8dFCFUckl9Qu9RZ2shURMFrfFBdJPzgnPq',
    'Ot4jfe5Mf3__7OY_ZO0sp4uNu_5q_MBkDjY_naLJsNaxInJZt-jrceh98cYZ16xD6dFrSP9xqvQo',
    'jntoH76C9l9_TtU-jMY9tF9fxJEZTqc9tMcXcWZAag_to4s4M_F1n1odX8SZGYV9anVyGdonfWp1',
    'ehHax_FxtYr37r-NqqD-bC7Dg_tylh8sAihf4Gc_3Hl054brlrxj20bhvbD6WfrkeOffwO0_UEsD',
    'BBQAAAAIAAlBb13Ii2NfrQEAACgJAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbMVWy07DMBD8lShX',
    '1LjlgBBqy4HHETiUD3DtTWqIH7I3pf171klbKdCUQhtxibyenZ2xd6NkfLvSZbIEH5Q1k3SUDdME',
    'jLBSmWKSvs4eB9fp7XQ8WzsICaWaMEkXiO6GsSAWoHnIrANDSG695kihL5jj4p0XwC6HwysmrEEw',
    'OMBYI52O7yHnVYnJXbMfS09SpWO-M0WaPKxou7ETY3aQ8eagTak3fs35iTLXrsWI8WFGofIWI8aH',
    'GWFZXNA9tli018nizpVKcKREtjTySx8Gmx5kHso6JyyUC98ECA1HKXwlxviPzmyeKwHSikoTJbPz',
    'vAqUDfKRirRErESsr-2ZJtQrCafofFgvnbcCQqDh1mW2QzRXprmZF-7xiWuqzWI626VsjtuLj4Dr',
    'EsJ-Aw12kvx2EIT1MCBhBx7VHj0y-EJoYDHxnAcWVUCrj5OuU88pDnGaJMij5Kl0r502lZ6Dp_X-',
    'Zu_gXk3k1qKx2DVxO7hXE9STAx62aL-vHSDSquvF26A9t4IK8XkJXa3YwOc0gfTV7tCroeY56vXc',
    'C-AS_H4TDfbf-pdbfVb_-kw_AVBLAwQUAAAACAAJQW9d9B4F1moDAAB_DAAAEQAAAHdvcmQvZG9j',
    'dW1lbnQueG1spZfbUtswEIZfxeN7UOwEk2YITAu0MLQl09CLXmUUWY5VbEkjbRLSp-_KhzjFKeOE',
    'G8s67Le_VitZvrh6yTNvxY0VSo794LTne1wyFQu5GPs_nz6fDH3PApUxzZTkY3_DrX91ebEexYot',
    'cy7By9nofiGVofMM-9fBwFsHZ95aBwPfQ7i0o7VmYz8F0CNCLEt5Tu1pLphRViVwylROVJIIxsla',
    'mZiEvaBXvGmjGLcWlVxTuaK2xuVtmtJcYmeiTE4Bq2ZBcmqel_oE6ZqCmItMwAbZvajGqLG_NHJU',
    'IU62gpzJqBRUFbWF6eK3NLmpolN4JIZnqEFJmwrdTONYGnamNWT11iRWedYsQTB43xrcGLrGogF2',
    'kR-XRnlWKn-bGPQ6rIhDbC26SPjXZ60kp0I2jo8KzU5wg7PDAOFrgF68b3G-GLXUDU28j3Yvn7cs',
    't-cPYFWLvDs1-z4x05Tq7Q5kL91gVd453oCwlBrgLw0jOBhyRj6QYRsUHgHCCYZBG9U_GBURp6oF',
    '6pjLr0CoqkXqmNSvSXsmFx1HCtuk8-NI_TZpeByplU54kDwfgRLNHqN5Pz6YcE5yFfOs3xyGQcR4',
    'x-1R77VhtVkJa-bjOKKjnpoTbTliV89xYnYANoY4PYgS1mczcbYUaEptuks87DjD_VrjNjnGyF18',
    '5ireuFIXj4lxxTPn-jt_AW89WtFs7Cc0s9wnrstqynDNsIcmwPEKMcQrFlI4fqRQTFHJhDtmw6hX',
    'mggZY2MijIWvRc95WPX8ZrUHSKm4ERaMmC-hcEW2aspH9f5ZSbDOu2UCvwtPd96U4l1tKSfTB-eb',
    '2T2N6UdpW4MLBfM9U5xf2z2tYl_b3pFSTYxSSRmuP_WAflgF8E9jVLcxWxQZLQJbBeTk6a6IrIhF',
    'XS3DUoUCXBoU64Eh1YZbblbcv5zNpg-3X2-fHr_PPj3e_JrNnAmUhmVUCxWcQYlJOY25-cETbvCm',
    'zNEjbDQSY57QZQa-Z0Zu_5j7OCrF_s-gWOCd4eflcL2Yuhjg5SYIPrjrKhLwPRr2h-5dGYE3QZyA',
    'MmCogNroGzWOrPBeFgZRkVZGLFIcGQwGZcopAJU39Ywn0AwuVWKu9Qo3iVKwU10soahWeQgCMj5Z',
    'kOpH4IsRcZXGEwEM5fbLXCZN4Ei9c0jz73D5F1BLAwQUAAAACAAJQW9dk4gBcN0BAADyBQAAEQAA',
    'AHdvcmQvc2V0dGluZ3MueG1spZTbbtswDIZfxdB9YjtYt8GoW2zregA27CLZAzCSbAuRREGSneXt',
    'R8dxnG5AkTRXkk3x409S4u39H6OTTvqg0JYsn2cskZajULYu2e_V4-wzS0IEK0CjlSXbycDu7263',
    'RZAx0qGQEMCGYut4yZoYXZGmgTfSQJgbxT0GrOKco0mxqhSX6Ra9SBdZnu13ziOXIRDoG9gOAjvg',
    'zP80dNKSsUJvINKnr1MDftO6GdEdRLVWWsUdsbOPIwZL1npbHBCzo6DepRgEHZbRw58Td3B5QN4a',
    'aeM-YuqlJg1oQ6PclMZ7aWRsRkj3VhKd0ezYgvzDdT148LClZQKeI18MTkYPyt8m5tkZHekRR49z',
    'JLyOOSoxoOwU-F2lOSlufnMZYPEvwNXXNefJY-smmrqO9mI3R1b_ri9gHZp8mlq4TsyyAUcv0PDi',
    'pbboYa1JEbUsoaon_bVm_cQRKjgNu6_ANzXVwoq9W9qbGiXk0kmtCfbde_Th-PvJg6GLojjoE4uQ',
    'FbQ6rmC9jOiSbdGBLtmnRcb2ZtlJ-8WKX0I8SxA0HccTFegghzPD1Jl2y2EgjifzG0ZbC4ZSeTWg',
    'fqKQvan1F7SwD5mexozkIB_Rxh8wxYzNbPXcs9dKqPFz8BzH9d1fUEsDBBQAAAAIAAlBb10pyKrM',
    'jwQAADAfAAAPAAAAd29yZC9zdHlsZXMueG1s5VlZb9s4EP4rgt4THZZP1C1Sp0aC7bZG42KfaYmy',
    'iFKklqTipL9-SV12TCk-pBib3aeYM8PhfHMQn5gPn55ibDxCxhElU9O5tk0DEp8GiKyn5s_l_Gpk',
    'GlwAEgBMCZyaz5Cbnz5-2Ey4eMaQG7E_uV8TysAKS-3G8YyN0zcN6ZXwSexPzUiIZGJZ3I9gDPg1',
    'TSCRypCyGAi5ZGsrBuxXmlz5NE6AQCuEkXi2XNselG7YMV5oGCIf3lI_jSER2X6LQSw9UsIjlPDS',
    '2-YYbxvKgoRRH3IuMxHj3F8MEKncOJ7mKEY-o5yG4lqCKSLKXMntjp39ivHWQf80B27pQKU_oP4t',
    'DEGKBVdLtmDFslhlf-aUCG5sJoD7CE3N5Z3xAGSlUrJ4-MOUcp_XCKMbwjVjS_kjdMEoDbPf_Lc0',
    'fQR4avZcs5DM-L4MA7IuZSK6Wt6pA1YoQOVSWllFvNY-imR_lZ2SAB9lTkEooOyMka18YqSa0x3Y',
    'hcek8Ljrw9KylvWw3C2eE7k7kXDXDCSRcpip7oOp-U11BVaiIN8ppySrAAExLLEVRhnmv-dZH-Vx',
    'ZG70o4QalxfHLJWk5izBUthwnJHtyQ9N0YIhyuTklDbjcVEWGKM7FASQ5IYkQgH8K4LkJ4dBJhIr',
    'nOdW_rgnQRVk8ARUKHJebLM0nEGM_wS5NU2aTTEMRY3WsUe5fkWFoHHzfobW0SsOrJfBWBWI5pTX',
    'V3eJBNbzm0vzQIFM03dSV2gCn8TrDVBN4nZa-gN9WnLZzhycBOEOAnVb601ZKAynSyQ-xZSVtu6X',
    'ofe5bx59IbSE6DZCdC8M0a2pottFFXuNEHtvBtGZe7fDkQbRq4HodQDRa4TodQkRZQs049YrNW0J',
    'pd8IpX-BhmwZ_KAx-MEFWu3c4B8Eo2SthV6IO4x7lfvK-ufcYL8iLhaVZj9mpTW26kOxH8Mr6sOY',
    'gUSxYC0Av5CfmzWddPTKm_Ig6djNeBO1k5x7l84dM9qe1_cGNwq9kIwazpRO8gf5heHuX3DOSL_g',
    'nFa9-RmtMKKZ_FlL9gtlhxkfmvUpPpkJfZ_pFEJQvwV9qIn2aFLa1BOOvU_xT0WpswiF8nwG8YYo',
    'ZZNnfFyxacWh2kLX2YWCfj6zuBj0gdcWus46FPTzGcfFoI-1b9pToessRUE_n6FcDLrjjtpi10mO',
    'wn4-wbkc9kHri25Yi334DrCPW990o1rso38_dtdtfdWNa7GP3wH2_rF3nR9J8L709PLDRuoYRuSX',
    '_mVTaeqSUDwJVlRcPZseelarwVr3wWP3B71ZwaDSUqielPP3pcNMsx7pnFJBqIA_YAgZJL7-hBUW',
    'FgarTLqCfrjqRSYeIRM3GK2r03gqy8B9hhLRhmeX6JeyYZuBC6U91POqJ0r5rtuZTHv7PDR1_-6T',
    'tVctfqTqXyggFbT2q2fnacaueZqxu-inCvp-VksDQ1kY2-wc3U5Nie6s2d4yPV9I8Pq0wdzgvzhs',
    'BfbaWSthnzxqO07_Z5O2j3w_pYW-kznbLd17GLOvsjTf0ngF9bSoqhkk111qtLbhl7_4x38AUEsB',
    'AhQAFAAAAAgACUFvXdSZQLkQAQAAIgUAABwAAAAAAAAAAAAAAAAAAAAAAHdvcmQvX3JlbHMvZG9j',
    'dW1lbnQueG1sLnJlbHNQSwECFAAUAAAACAAJQW9dsCy99zcBAACDAgAAEQAAAAAAAAAAAAAAAABK',
    'AQAAZG9jUHJvcHMvY29yZS54bWxQSwECFAAUAAAACAAJQW9dH6OSluYAAADOAgAACwAAAAAAAAAA',
    'AAAAAACwAgAAX3JlbHMvLnJlbHNQSwECFAAUAAAACAAJQW9d0nf8t20AAAB7AAAAGwAAAAAAAAAA',
    'AAAAAAC_AwAAd29yZC9fcmVscy9oZWFkZXIxLnhtbC5yZWxzUEsBAhQAFAAAAAgACUFvXdJ3_Ldt',
    'AAAAewAAABsAAAAAAAAAAAAAAAAAZQQAAHdvcmQvX3JlbHMvaGVhZGVyMi54bWwucmVsc1BLAQIU',
    'ABQAAAAIAAlBb137Xv2ySQIAAJELAAAQAAAAAAAAAAAAAAAAAAsFAAB3b3JkL2hlYWRlcjEueG1s',
    'UEsBAhQAFAAAAAgACUFvXScA3pD2AQAAewgAABAAAAAAAAAAAAAAAAAAggcAAHdvcmQvaGVhZGVy',
    'Mi54bWxQSwECFAAUAAAACAAJQW9dWHnbIpIAAADkAAAAEwAAAAAAAAAAAAAAAACmCQAAZG9jUHJv',
    'cHMvY3VzdG9tLnhtbFBLAQIUABQAAAAIAAlBb13i_J3akwAAAOYAAAAQAAAAAAAAAAAAAAAAAGkK',
    'AABkb2NQcm9wcy9hcHAueG1sUEsBAhQAFAAAAAgACUFvXZyJyZHOAQAArQYAABIAAAAAAAAAAAAA',
    'AAAAKgsAAHdvcmQvZm9vdG5vdGVzLnhtbFBLAQIUABQAAAAIAAlBb13Sd_y3bQAAAHsAAAAdAAAA',
    'AAAAAAAAAAAAACgNAAB3b3JkL19yZWxzL2Zvb3Rub3Rlcy54bWwucmVsc1BLAQIUABQAAAAIAAlB',
    'b10_So6NwQEAAJIGAAARAAAAAAAAAAAAAAAAANANAAB3b3JkL2VuZG5vdGVzLnhtbFBLAQIUABQA',
    'AAAIAAlBb13Sd_y3bQAAAHsAAAAcAAAAAAAAAAAAAAAAAMAPAAB3b3JkL19yZWxzL2VuZG5vdGVz',
    'LnhtbC5yZWxzUEsBAhQAFAAAAAgACUFvXWPtXtYdAQAAQwMAABIAAAAAAAAAAAAAAAAAZxAAAHdv',
    'cmQvZm9udFRhYmxlLnhtbFBLAQIUABQAAAAIAAlBb13Sd_y3bQAAAHsAAAAdAAAAAAAAAAAAAAAA',
    'ALQRAAB3b3JkL19yZWxzL2ZvbnRUYWJsZS54bWwucmVsc1BLAQIUABQAAAAIAAlBb13UbT9s-QUA',
    'AMofAAAVAAAAAAAAAAAAAAAAAFwSAAB3b3JkL3RoZW1lL3RoZW1lMS54bWxQSwECFAAUAAAACAAJ',
    'QW9doNBOGm8CAABSDAAAEgAAAAAAAAAAAAAAAACIGAAAd29yZC9udW1iZXJpbmcueG1sUEsBAhQA',
    'FAAAAAgACUFvXciLY1-tAQAAKAkAABMAAAAAAAAAAAAAAAAAJxsAAFtDb250ZW50X1R5cGVzXS54',
    'bWxQSwECFAAUAAAACAAJQW9d9B4F1moDAAB_DAAAEQAAAAAAAAAAAAAAAAAFHQAAd29yZC9kb2N1',
    'bWVudC54bWxQSwECFAAUAAAACAAJQW9dk4gBcN0BAADyBQAAEQAAAAAAAAAAAAAAAACeIAAAd29y',
    'ZC9zZXR0aW5ncy54bWxQSwECFAAUAAAACAAJQW9dKciqzI8EAAAwHwAADwAAAAAAAAAAAAAAAACq',
    'IgAAd29yZC9zdHlsZXMueG1sUEsFBgAAAAAVABUAbQUAAGYnAAAAAA=='
  ].join('');

  function escapeDocxXmlText(str) {
    return String(str === undefined || str === null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function buildOfficialReportDocumentXml(params) {
    const p = params || {};
    const schoolTitle = String(p.schoolTitle || 'กลุ่มโรงเรียนศรีเสาวภาค');
    const subjectName = String(p.subjectName || '');
    const subjectCode = String(p.subjectCode || '');
    const r = p.report || { preCount: 0, postCount: 0, preAvg: 0, postAvg: 0, avgGain: 0, indicatorBreakdown: [], allStudents: [] };
    const reporterName = String(p.reporterName || '..........................................................');
    const reportDateText = String(p.reportDateText || '');
    const indDescMap = p.indicatorDescriptions || {};

    function makeRun(text, opts) {
      const o = opts || {};
      const sz = o.sz || 32;
      const boldXml = o.bold ? '<w:b/><w:bCs/>' : '<w:b w:val="false"/><w:bCs w:val="false"/>';
      return `<w:r><w:rPr><w:rFonts w:ascii="TH SarabunPSK" w:cs="TH SarabunPSK" w:hAnsi="TH SarabunPSK"/>${boldXml}<w:noProof/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:cs/><w:lang w:val="th-TH" w:bidi="th-TH"/></w:rPr><w:t xml:space="preserve">${escapeDocxXmlText(text)}</w:t></w:r>`;
    }

    function makePara(text, opts) {
      const o = opts || {};
      const jc = o.align || 'left';
      const indentXml = o.indent ? `<w:ind w:firstLine="${o.indent}"/>` : '';
      const keepNextXml = o.keepNext ? '<w:keepNext/>' : '';
      const before = o.before !== undefined ? o.before : 0;
      const after = o.after !== undefined ? o.after : 80;
      const line = o.line || 260;
      return `<w:p><w:pPr>${keepNextXml}<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/>${indentXml}<w:jc w:val="${jc}"/></w:pPr>${makeRun(text, { bold: o.bold, sz: o.sz || 32 })}</w:p>`;
    }

    function makeCell(widthDxa, text, opts) {
      const o = opts || {};
      const shdXml = o.isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="EFECE6"/>' : '';
      return `<w:tc><w:tcPr><w:tcW w:w="${widthDxa}" w:type="dxa"/>${shdXml}<w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>${makePara(text, { align: o.align || 'left', bold: o.bold, sz: o.sz || 30, after: 40, line: 240 })}</w:tc>`;
    }

    function makeTable(colWidths, headers, rows, rowAligns) {
      const gridXml = colWidths.map(w => `<w:gridCol w:w="${w}"/>`).join('');
      const headerCells = headers.map((h, i) => makeCell(colWidths[i], h, { isHeader: true, bold: true, align: 'center', sz: 30 })).join('');
      const headerRowXml = `<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>${headerCells}</w:tr>`;
      const bodyRowsXml = rows.map(row => {
        const cells = row.map((val, i) => makeCell(colWidths[i], val, {
          isHeader: false,
          bold: false,
          align: (rowAligns && rowAligns[i]) || 'left',
          sz: 28
        })).join('');
        return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells}</w:tr>`;
      }).join('');
      return `<w:tbl><w:tblPr><w:tblW w:w="8306" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:left w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:right w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="333333"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="333333"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${gridXml}</w:tblGrid>${headerRowXml}${bodyRowsXml}</w:tbl>`;
    }

    const introText = `ตามที่${schoolTitle} กลุ่มโรงเรียนศรีเสาวภาค สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสระบุรี เขต 2 ได้ดำเนินการจัดสอบวัดผลก่อนติว (Pre O-NET) และหลังติว (Post O-NET) รายวิชา${subjectName} (รหัสวิชา ${subjectCode}) ชั้นประถมศึกษาปีที่ 6 ปีการศึกษา 2569 เพื่อวิเคราะห์จุดควรพัฒนารายตัวชี้วัดตามผังการสร้างข้อสอบของสถาบันทดสอบทางการศึกษาแห่งชาติ (องค์การมหาชน) นั้น สรุปผลการวิเคราะห์ได้ดังต่อไปนี้`;

    const avgGainNum = hasFiniteNumber(r.avgGain) ? Number(r.avgGain) : 0;
    const gainPrefix = avgGainNum >= 0 ? '+' : '';
    const summaryRows = [[
      `${Number(r.preCount || 0)} คน`,
      fmtFixed(r.preAvg, 2, '0.00'),
      `${Number(r.postCount || 0)} คน`,
      fmtFixed(r.postAvg, 2, '0.00'),
      `${gainPrefix}${fmtFixed(avgGainNum, 2, '0.00')}`
    ]];

    const indList = (r.indicatorBreakdown || []).slice(0, 20);
    const indRows = indList.length
      ? indList.map((ind, idx) => {
          const desc = indDescMap[ind.indicatorCode] ? ` - ${indDescMap[ind.indicatorCode]}` : '';
          return [
            String(idx + 1),
            String(ind.indicatorCode || ''),
            `สาระที่ ${ind.strandNo}${desc}`,
            `${fmtFixed(ind.preMasteryPct, 2, '0.00')}%`,
            `${fmtFixed(ind.postMasteryPct, 2, '0.00')}%`,
            ind.isWeak ? 'ควรเร่งเสริมเข้ม (<50%)' : 'ผ่านเกณฑ์'
          ];
        })
      : [['-', '-', 'ยังไม่มีข้อมูลการตรวจกระดาษคำตอบ', '-', '-', '-']];

    const stuList = r.allStudents || [];
    const stuRows = stuList.length
      ? stuList.map((st, idx) => [
          String(idx + 1),
          String(st.studentName || st.studentId || ''),
          fmtFixed(st.preScore, 2, '-'),
          fmtFixed(st.postScore, 2, '-'),
          hasFiniteNumber(st.gain) ? ((Number(st.gain) >= 0 ? '+' : '') + fmtFixed(st.gain, 2, '0.00')) : '-'
        ])
      : [['-', 'ยังไม่มีข้อมูลคะแนนรายบุคคล', '-', '-', '-']];

    return [
      makePara('รายงานผลการวิเคราะห์คะแนนทดสอบคู่ขนาน Pre O-NET และ Post O-NET ปีการศึกษา 2569', { align: 'center', bold: true, sz: 38, after: 20 }),
      makePara('โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)', { align: 'center', bold: true, sz: 32, after: 20 }),
      makePara(`รายวิชา${subjectName} (รหัสวิชา ${subjectCode}) | ${schoolTitle}`, { align: 'center', bold: true, sz: 34, after: 140 }),
      makePara(introText, { align: 'thaiDistribute', indent: 720, bold: false, sz: 32, after: 140 }),
      makeTable(
        [1661, 1661, 1661, 1661, 1662],
        ['เข้าสอบ Pre (คน)', 'เฉลี่ย Pre O-NET', 'เข้าสอบ Post (คน)', 'เฉลี่ย Post O-NET', 'ค่าพัฒนาการ (Gain)'],
        summaryRows,
        ['center', 'center', 'center', 'center', 'center']
      ),
      makePara('1. ลำดับตัวชี้วัดที่ต้องเร่งยกระดับผลสัมฤทธิ์ (เรียงจากจุดอ่อนสูงสุด)', { align: 'left', bold: true, sz: 32, before: 180, after: 80, keepNext: true }),
      makeTable(
        [660, 1400, 2246, 1200, 1200, 1600],
        ['ลำดับ', 'รหัสตัวชี้วัด', 'สาระ / รายละเอียด', 'ก่อนติว (%)', 'หลังติว (%)', 'การแปลผล'],
        indRows,
        ['center', 'center', 'left', 'center', 'center', 'center']
      ),
      makePara('2. ตารางเปรียบเทียบคะแนนรายบุคคล (Pre O-NET vs Post O-NET)', { align: 'left', bold: true, sz: 32, before: 180, after: 80, keepNext: true }),
      makeTable(
        [830, 3496, 1326, 1326, 1328],
        ['ลำดับ', 'ชื่อ - นามสกุลนักเรียน', 'Pre O-NET', 'Post O-NET', 'พัฒนาการ'],
        stuRows,
        ['center', 'left', 'center', 'center', 'center']
      ),
      makePara('ลงชื่อ .......................................................... ผู้รายงานผล', { align: 'right', before: 320, after: 20 }),
      makePara(`(${reporterName})`, { align: 'right', before: 0, after: 20 }),
      makePara(`วันที่พิมพ์รายงาน: ${reportDateText}`, { align: 'right', before: 0, after: 40 })
    ].join('');
  }

  function isApprovedSubmissionStatus_(st) {
    return st === 'ผ่านพร้อมรวมเล่ม' || st === 'ผ่านเกณฑ์' || st === 'อนุมัติแล้ว';
  }

  function normalizeSubMetaClient_(s) {
    const out = Object.assign({}, s || {});
    out.docCategory = String(out.docCategory || '').trim().toUpperCase() || 'TUTORING_STRAND';
    out.targetAudience = String(out.targetAudience || '').trim().toUpperCase() || 'TEACHER';
    out.examRound = String(out.examRound || '').trim().toUpperCase();
    return out;
  }

  function formatSubmissionCardBadges_(raw) {
    const s = normalizeSubMetaClient_(raw);
    const catBadge = s.docCategory === 'MERGED_BOOK'
      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold gw-badge-success">📚 ฉบับรวมเล่มสมบูรณ์</span>'
      : (s.docCategory === 'PREPOST_EXAM'
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold gw-badge-info">📝 ข้อสอบ Pre-Post${s.examRound ? ' (' + escHtml(s.examRound) + ')' : ''}</span>`
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold" style="background: var(--gw-input-bg); border: 1px solid var(--gw-line);">📄 เอกสารตามสาระฯ</span>');
    const audBadge = s.targetAudience === 'STUDENT'
      ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold gw-badge-info">📘 ฉบับนักเรียน</span>'
      : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold gw-badge-danger">📕 ฉบับครู (มีเฉลย)</span>';
    return `${catBadge} ${audBadge}`;
  }

  function buildSarabunRPr_(opts = {}) {
    const sz = Number(opts.sz || 32);
    const bold = opts.bold ? '<w:b/><w:bCs/>' : '';
    const italic = opts.italic ? '<w:i/><w:iCs/>' : '';
    const color = opts.color ? `<w:color w:val="${escapeDocxXmlText(opts.color)}"/>` : '';
    return `<w:rPr><w:rFonts w:ascii="TH SarabunPSK" w:hAnsi="TH SarabunPSK" w:cs="TH SarabunPSK"/>${bold}${italic}${color}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:noProof/><w:cs/><w:lang w:val="th-TH" w:bidi="th-TH"/></w:rPr>`;
  }

  function buildSarabunPara_(text, opts = {}) {
    const jc = opts.jc || 'thaiDistribute';
    const before = opts.before != null ? opts.before : 40;
    const after = opts.after != null ? opts.after : 80;
    const firstLine = opts.firstLine ? `<w:ind w:firstLine="${opts.firstLine}"/>` : '';
    const keepNext = opts.keepNext ? '<w:keepNext/>' : '';
    const rPr = buildSarabunRPr_(opts);
    return `<w:p><w:pPr><w:spacing w:before="${before}" w:after="${after}" w:line="276" w:lineRule="auto"/>${firstLine}${keepNext}<w:jc w:val="${jc}"/></w:pPr><w:r>${rPr}<w:t xml:space="preserve">${escapeDocxXmlText(text)}</w:t></w:r></w:p>`;
  }

  function buildFixedTable_(rows = [], colWidths = [], opts = {}) {
    const totalWidth = colWidths.reduce((s, w) => s + w, 0) || 8306;
    const borderColor = escapeDocxXmlText(opts.borderColor || '94A3B8');
    const borderSz = Number(opts.borderSz || 6);
    const tblBorders = `<w:tblBorders><w:top w:val="single" w:sz="${borderSz}" w:space="0" w:color="${borderColor}"/><w:left w:val="single" w:sz="${borderSz}" w:space="0" w:color="${borderColor}"/><w:bottom w:val="single" w:sz="${borderSz}" w:space="0" w:color="${borderColor}"/><w:right w:val="single" w:sz="${borderSz}" w:space="0" w:color="${borderColor}"/><w:insideH w:val="single" w:sz="${Math.max(4, borderSz - 2)}" w:space="0" w:color="${borderColor}"/><w:insideV w:val="single" w:sz="${Math.max(4, borderSz - 2)}" w:space="0" w:color="${borderColor}"/></w:tblBorders>`;
    const tblGrid = `<w:tblGrid>${colWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`;
    const trsXml = rows.map((row) => {
      const trPr = `<w:trPr>${row.isHeader ? '<w:tblHeader/>' : ''}<w:cantSplit/></w:trPr>`;
      const cellsXml = row.cells.map((cell, cIdx) => {
        const w = colWidths[cIdx] || Math.floor(totalWidth / Math.max(1, colWidths.length));
        const shd = cell.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${escapeDocxXmlText(cell.fill)}"/>` : '';
        const vAlign = cell.vAlign ? `<w:vAlign w:val="${escapeDocxXmlText(cell.vAlign)}"/>` : '';
        const parasXml = Array.isArray(cell.paras)
          ? cell.paras.join('')
          : buildSarabunPara_(cell.text != null ? String(cell.text) : '', {
              sz: cell.sz || 30,
              bold: !!cell.bold,
              color: cell.color || '',
              jc: cell.jc || 'left',
              before: cell.before != null ? cell.before : 30,
              after: cell.after != null ? cell.after : 30
            });
        return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${shd}${vAlign}</w:tcPr>${parasXml}</w:tc>`;
      }).join('');
      return `<w:tr>${trPr}${cellsXml}</w:tr>`;
    }).join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="${totalWidth}" w:type="dxa"/>${tblBorders}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>${tblGrid}${trsXml}</w:tbl>`;
  }

  function buildLockedImageFrameBox_(captionText) {
    return buildFixedTable_(
      [{
        cells: [{
          fill: 'F8FAFC',
          paras: [
            buildSarabunPara_(captionText || '[กรอบวางรูปภาพ / แผนภาพ / ตารางประกอบ (ล็อกตำแหน่งคงที่ 8306 DXA)]', { sz: 28, bold: true, color: '334155', jc: 'center', before: 140, after: 40 }),
            buildSarabunPara_('คำแนะนำสำหรับผู้จัดทำ: คลิกในช่องนี้แล้วแทรกรูปภาพแบบ In Line with Text (จัดแนวในบรรทัดเดียวกับข้อความ) ภาพจะไม่เคลื่อนหรือเด้งข้ามหน้าเวลาแปลงเป็น PDF หรือรวมเล่มอัตโนมัติ', { sz: 26, italic: true, color: '64748B', jc: 'center', before: 20, after: 140 })
          ]
        }]
      }],
      [8306],
      { borderColor: '94A3B8', borderSz: 6 }
    );
  }

  function roundScore(val) {
    return Math.round((Number(val) + Number.EPSILON) * 1000) / 1000;
  }

  function normalizeThaiDigits(raw) {
    const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
    return String(raw === undefined || raw === null ? '' : raw).replace(/[๐-๙]/g, (ch) => {
      const idx = thaiDigits.indexOf(ch);
      return idx !== -1 ? String(idx) : ch;
    });
  }

  function normalizeNumericAnswer(raw) {
    const s = normalizeThaiDigits(raw).trim().replace(/,/g, '');
    if (!s) return null;
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    const num = Number(s);
    return Number.isFinite(num) ? num : null;
  }

  function normalizeOrderSequence(raw) {
    const s = normalizeThaiDigits(raw).trim();
    if (!s) return '';
    const tokens = s.match(/[0-9A-Za-zก-ฮ]+/g);
    if (!tokens) return '';
    if (tokens.length === 1 && /^\d{2,}$/.test(tokens[0])) {
      return tokens[0].split('').join('-');
    }
    return tokens.map(t => t.toUpperCase()).join('-');
  }

  function normalizeComplexMc(raw) {
    const s = normalizeThaiDigits(raw).trim();
    if (!s) return '';
    return s
      .split(/[|,;/]+/)
      .map(part => {
        const p = part.trim().toUpperCase();
        if (p === 'ใช่' || p === 'Y' || p === 'YES' || p === 'T' || p === 'TRUE' || p === '1' || p === 'ถูก') return 'Y';
        if (p === 'ไม่ใช่' || p === 'N' || p === 'NO' || p === 'F' || p === 'FALSE' || p === '2' || p === '0' || p === 'ผิด') return 'N';
        return p;
      })
      .filter(Boolean)
      .join('|');
  }

  function validateExamKeyByType(itemType, rawVal, subjectCode) {
    const v = normalizeThaiDigits(rawVal).trim();
    if (!v) return { ok: false, reason: 'ค่าว่าง' };
    const t = String(itemType || '').toUpperCase().trim();
    const sub = String(subjectCode || '').trim();

    if (t === 'MC4') {
      if (!/^[1-4]$/.test(v)) return { ok: false, reason: 'ต้องเป็นตัวเลข 1, 2, 3 หรือ 4 เท่านั้น' };
      return { ok: true, normalized: v };
    }
    if (t === 'NUMERIC') {
      const num = normalizeNumericAnswer(v);
      if (num === null) return { ok: false, reason: 'ต้องเป็นตัวเลขที่ถูกต้อง (เช่น 45 หรือ 125)' };
      if (sub === '64') {
        if (!Number.isInteger(num) || num < 0 || num > 999) {
          return { ok: false, reason: 'คณิตศาสตร์ ป.6 (สทศ. ข้อ 12–15) ต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 999 เท่านั้น' };
        }
        return { ok: true, normalized: String(num) };
      }
      return { ok: true, normalized: v };
    }
    if (t === 'ESSAY') {
      const essayStr = v.replace(/^RUBRIC_/i, '').trim();
      const num = normalizeNumericAnswer(essayStr);
      if (num === null || num < 0) return { ok: false, reason: 'ต้องเป็นตัวเลขคะแนนเต็มที่ไม่ติดลบ (เช่น 15)' };
      return { ok: true, normalized: String(num) };
    }
    if (t === 'ORDER') {
      const chunks = v.split('|').map(c => c.trim());
      if (chunks.length === 1) {
        const seq = normalizeOrderSequence(chunks[0]);
        if (!seq || seq.indexOf('-') === -1) return { ok: false, reason: 'ต้องระบุลำดับคั่นด้วยขีด เช่น 3-1-4-2' };
        return { ok: true, normalized: seq };
      }
      if (chunks.length === 2) {
        const s1 = normalizeOrderSequence(chunks[0]);
        const s2 = normalizeOrderSequence(chunks[1]);
        if (!s1 || s1.indexOf('-') === -1 || !s2 || s2.indexOf('-') === -1) {
          return { ok: false, reason: 'ข้อเรียงลำดับ 2 ข้อย่อยต้องระบุลำดับให้ครบทั้ง 21.1 และ 21.2' };
        }
        return { ok: true, normalized: `${s1}|${s2}` };
      }
      return { ok: false, reason: 'รูปแบบข้อเรียงลำดับรองรับ 1 ชุด หรือ 2 ข้อย่อยคั่นด้วย | เท่านั้น' };
    }
    if (t === 'COMPLEX_MC') {
      const parts = normalizeComplexMc(v).split('|').filter(Boolean);
      if (parts.length !== 3 || !parts.every(p => p === 'Y' || p === 'N')) {
        return { ok: false, reason: 'ต้องระบุคำตอบครบ 3 ข้อความย่อยเป็น ใช่ หรือ ไม่ใช่ คั่นด้วย | เช่น ใช่|ไม่ใช่|ใช่' };
      }
      return { ok: true, normalized: parts.map(p => (p === 'Y' ? 'ใช่' : 'ไม่ใช่')).join('|') };
    }
    return { ok: true, normalized: v };
  }

  function extractPlainTextFromDocxXml(xml) {
    if (!xml) return '';
    return String(xml)
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tab\s*\/>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  const NIETS_2569_EXAM_ITEMS = {
    '61': [
      ...[
        { n: 1, ind: 'ท 1.1 ป.6/2' }, { n: 2, ind: 'ท 1.1 ป.6/2' },
        { n: 3, ind: 'ท 1.1 ป.6/4' }, { n: 4, ind: 'ท 1.1 ป.6/4' },
        { n: 5, ind: 'ท 1.1 ป.6/5' }, { n: 6, ind: 'ท 1.1 ป.6/7' }
      ].map((x) => ({ itemNo: x.n, strandNo: '1', strandName: 'การอ่าน', standardCode: 'ท 1.1', indicatorCode: x.ind, itemType: 'MC4', weight: 4, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–20 ข้อละ 4 คะแนน รวม 80 คะแนน)' })),
      ...[
        { n: 7, ind: 'ท 2.1 ป.6/2' }, { n: 8, ind: 'ท 2.1 ป.6/6' }
      ].map((x) => ({ itemNo: x.n, strandNo: '2', strandName: 'การเขียน', standardCode: 'ท 2.1', indicatorCode: x.ind, itemType: 'MC4', weight: 4, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–20 ข้อละ 4 คะแนน รวม 80 คะแนน)' })),
      ...[
        { n: 9, ind: 'ท 3.1 ป.6/2' }, { n: 10, ind: 'ท 3.1 ป.6/2' }, { n: 11, ind: 'ท 3.1 ป.6/3' }
      ].map((x) => ({ itemNo: x.n, strandNo: '3', strandName: 'การฟัง การดู และการพูด', standardCode: 'ท 3.1', indicatorCode: x.ind, itemType: 'MC4', weight: 4, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–20 ข้อละ 4 คะแนน รวม 80 คะแนน)' })),
      ...[
        { n: 12, ind: 'ท 4.1 ป.6/1' }, { n: 13, ind: 'ท 4.1 ป.6/2' }, { n: 14, ind: 'ท 4.1 ป.6/3' },
        { n: 15, ind: 'ท 4.1 ป.6/4' }, { n: 16, ind: 'ท 4.1 ป.6/5' }, { n: 17, ind: 'ท 4.1 ป.6/6' }
      ].map((x) => ({ itemNo: x.n, strandNo: '4', strandName: 'หลักการใช้ภาษาไทย', standardCode: 'ท 4.1', indicatorCode: x.ind, itemType: 'MC4', weight: 4, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–20 ข้อละ 4 คะแนน รวม 80 คะแนน)' })),
      ...[
        { n: 18, ind: 'ท 5.1 ป.5/2' }, { n: 19, ind: 'ท 5.1 ป.6/1' }, { n: 20, ind: 'ท 5.1 ป.6/3' }
      ].map((x) => ({ itemNo: x.n, strandNo: '5', strandName: 'วรรณคดีและวรรณกรรม', standardCode: 'ท 5.1', indicatorCode: x.ind, itemType: 'MC4', weight: 4, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–20 ข้อละ 4 คะแนน รวม 80 คะแนน)' })),
      { itemNo: 21, strandNo: '2', strandName: 'การเขียน', standardCode: 'ท 2.1', indicatorCode: 'ท 2.1 ป.6/8', itemType: 'ORDER', weight: 5, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบอัตนัยประยุกต์ (ข้อ 21 เรียงลำดับคำ 5 คะแนน และข้อ 22 เขียนสรุปใจความ 15 คะแนน รวม 20 คะแนน)' },
      { itemNo: 22, strandNo: '2', strandName: 'การเขียน', standardCode: 'ท 2.1', indicatorCode: 'ท 2.1 ป.6/5', itemType: 'ESSAY', weight: 15, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบอัตนัยประยุกต์ (ข้อ 21 เรียงลำดับคำ 5 คะแนน และข้อ 22 เขียนสรุปใจความ 15 คะแนน รวม 20 คะแนน)' }
    ],
    '64': [
      ...[
        { n: 1, std: 'ค 1.1', ind: 'ค 1.1 ป.4/10' }, { n: 2, std: 'ค 1.1', ind: 'ค 1.1 ป.5/8' },
        { n: 3, std: 'ค 1.1', ind: 'ค 1.1 ป.6/1' }, { n: 4, std: 'ค 1.1', ind: 'ค 1.1 ป.6/11' },
        { n: 5, std: 'ค 1.2', ind: 'ค 1.2 ป.6/1' }
      ].map((x) => ({ itemNo: x.n, strandNo: '1', strandName: 'จำนวนและพีชคณิต', standardCode: x.std, indicatorCode: x.ind, itemType: 'MC4', weight: 6.5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–11 ข้อละ 6.5 คะแนน รวม 71.5 คะแนน)' })),
      ...[
        { n: 6, std: 'ค 2.1', ind: 'ค 2.1 ป.4/1' }, { n: 7, std: 'ค 2.1', ind: 'ค 2.1 ป.5/1' },
        { n: 8, std: 'ค 2.1', ind: 'ค 2.1 ป.5/2' }, { n: 9, std: 'ค 2.1', ind: 'ค 2.1 ป.6/2' },
        { n: 10, std: 'ค 2.2', ind: 'ค 2.2 ป.5/2' }
      ].map((x) => ({ itemNo: x.n, strandNo: '2', strandName: 'การวัดและเรขาคณิต', standardCode: x.std, indicatorCode: x.ind, itemType: 'MC4', weight: 6.5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–11 ข้อละ 6.5 คะแนน รวม 71.5 คะแนน)' })),
      { itemNo: 11, strandNo: '3', strandName: 'สถิติและความน่าจะเป็น', standardCode: 'ค 3.1', indicatorCode: 'ค 3.1 ป.5/1', itemType: 'MC4', weight: 6.5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–11 ข้อละ 6.5 คะแนน รวม 71.5 คะแนน)' },
      { itemNo: 12, strandNo: '1', strandName: 'จำนวนและพีชคณิต', standardCode: 'ค 1.1', indicatorCode: 'ค 1.1 ป.6/11', itemType: 'NUMERIC', weight: 7.125, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบระบายคำตอบที่เป็นตัวเลข (ข้อ 12–15 ข้อละ 7.125 คะแนน รวม 28.5 คะแนน)' },
      { itemNo: 13, strandNo: '1', strandName: 'จำนวนและพีชคณิต', standardCode: 'ค 1.1', indicatorCode: 'ค 1.1 ป.6/12', itemType: 'NUMERIC', weight: 7.125, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบระบายคำตอบที่เป็นตัวเลข (ข้อ 12–15 ข้อละ 7.125 คะแนน รวม 28.5 คะแนน)' },
      { itemNo: 14, strandNo: '2', strandName: 'การวัดและเรขาคณิต', standardCode: 'ค 2.1', indicatorCode: 'ค 2.1 ป.6/3', itemType: 'NUMERIC', weight: 7.125, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบระบายคำตอบที่เป็นตัวเลข (ข้อ 12–15 ข้อละ 7.125 คะแนน รวม 28.5 คะแนน)' },
      { itemNo: 15, strandNo: '3', strandName: 'สถิติและความน่าจะเป็น', standardCode: 'ค 3.1', indicatorCode: 'ค 3.1 ป.6/1', itemType: 'NUMERIC', weight: 7.125, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบระบายคำตอบที่เป็นตัวเลข (ข้อ 12–15 ข้อละ 7.125 คะแนน รวม 28.5 คะแนน)' }
    ],
    '65': [
      ...[
        { n: 1, std: 'ว 1.1', ind: 'ว 1.1 ป.5/3' }, { n: 2, std: 'ว 1.2', ind: 'ว 1.2 ป.4/1' }, { n: 3, std: 'ว 1.3', ind: 'ว 1.3 ป.5/1' }
      ].map((x) => ({ itemNo: x.n, strandNo: '1', strandName: 'วิทยาศาสตร์ชีวภาพ', standardCode: x.std, indicatorCode: x.ind, itemType: 'MC4', weight: 5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–18 ข้อละ 5 คะแนน รวม 90 คะแนน)' })),
      ...[
        { n: 4, std: 'ว 2.1', ind: 'ว 2.1 ป.4/1' }, { n: 5, std: 'ว 2.1', ind: 'ว 2.1 ป.5/1' }, { n: 6, std: 'ว 2.1', ind: 'ว 2.1 ป.6/1' },
        { n: 7, std: 'ว 2.2', ind: 'ว 2.2 ป.4/1' }, { n: 8, std: 'ว 2.2', ind: 'ว 2.2 ป.5/1' }, { n: 9, std: 'ว 2.2', ind: 'ว 2.2 ป.6/1' },
        { n: 10, std: 'ว 2.3', ind: 'ว 2.3 ป.5/1' }, { n: 11, std: 'ว 2.3', ind: 'ว 2.3 ป.6/1' }
      ].map((x) => ({ itemNo: x.n, strandNo: '2', strandName: 'วิทยาศาสตร์กายภาพ', standardCode: x.std, indicatorCode: x.ind, itemType: 'MC4', weight: 5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–18 ข้อละ 5 คะแนน รวม 90 คะแนน)' })),
      ...[
        { n: 12, std: 'ว 3.1', ind: 'ว 3.1 ป.5/2' }, { n: 13, std: 'ว 3.1', ind: 'ว 3.1 ป.6/1' },
        { n: 14, std: 'ว 3.2', ind: 'ว 3.2 ป.5/1' }, { n: 15, std: 'ว 3.2', ind: 'ว 3.2 ป.6/1' }, { n: 16, std: 'ว 3.2', ind: 'ว 3.2 ป.6/4' }
      ].map((x) => ({ itemNo: x.n, strandNo: '3', strandName: 'วิทยาศาสตร์โลก และอวกาศ', standardCode: x.std, indicatorCode: x.ind, itemType: 'MC4', weight: 5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–18 ข้อละ 5 คะแนน รวม 90 คะแนน)' })),
      ...[
        { n: 17, std: 'ว 4.2', ind: 'ว 4.2 ป.5/1' }, { n: 18, std: 'ว 4.2', ind: 'ว 4.2 ป.6/1' }
      ].map((x) => ({ itemNo: x.n, strandNo: '4', strandName: 'เทคโนโลยี', standardCode: x.std, indicatorCode: x.ind, itemType: 'MC4', weight: 5, sectionNo: 1, sectionTitle: 'ตอนที่ 1 แบบปรนัย 4 ตัวเลือก (ข้อ 1–18 ข้อละ 5 คะแนน รวม 90 คะแนน)' })),
      { itemNo: 19, strandNo: '1', strandName: 'วิทยาศาสตร์ชีวภาพ', standardCode: 'ว 1.2', indicatorCode: 'ว 1.2 ป.6/4', itemType: 'COMPLEX_MC', weight: 5, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบเลือกตอบเชิงซ้อน (ข้อ 19–20 ข้อละ 5 คะแนน รวม 10 คะแนน | ถูก 3 ข้อได้ 5 คะแนน, ถูก 2 ข้อได้ 2.5 คะแนน)' },
      { itemNo: 20, strandNo: '2', strandName: 'วิทยาศาสตร์กายภาพ', standardCode: 'ว 2.1', indicatorCode: 'ว 2.1 ป.5/3', itemType: 'COMPLEX_MC', weight: 5, sectionNo: 2, sectionTitle: 'ตอนที่ 2 แบบเลือกตอบเชิงซ้อน (ข้อ 19–20 ข้อละ 5 คะแนน รวม 10 คะแนน | ถูก 3 ข้อได้ 5 คะแนน, ถูก 2 ข้อได้ 2.5 คะแนน)' }
    ],
    '63': [
      ...[1, 2, 3, 4, 5, 6].map((n) => ({ itemNo: n, strandNo: '1', strandName: 'ภาษาเพื่อการสื่อสาร', standardCode: 'ต 1.1', indicatorCode: n <= 3 ? 'ต 1.1 ป.6/3' : 'ต 1.1 ป.6/4', itemType: 'MC4', weight: 3.125, sectionNo: 1, sectionTitle: 'ตอนที่ 1 ข้อสอบภาษาอังกฤษแบบปรนัย 4 ตัวเลือก (ข้อ 1–32 ข้อละ 3.125 คะแนน รวม 100 คะแนน)' })),
      ...[
        { n: 7, ind: 'ต 1.2 ป.6/1' }, { n: 8, ind: 'ต 1.2 ป.6/1' },
        { n: 9, ind: 'ต 1.2 ป.6/2' }, { n: 10, ind: 'ต 1.2 ป.6/2' },
        { n: 11, ind: 'ต 1.2 ป.6/3' }, { n: 12, ind: 'ต 1.2 ป.6/3' },
        { n: 13, ind: 'ต 1.2 ป.6/4' }, { n: 14, ind: 'ต 1.2 ป.6/4' },
        { n: 15, ind: 'ต 1.2 ป.6/5' }, { n: 16, ind: 'ต 1.2 ป.6/5' }
      ].map((x) => ({ itemNo: x.n, strandNo: '1', strandName: 'ภาษาเพื่อการสื่อสาร', standardCode: 'ต 1.2', indicatorCode: x.ind, itemType: 'MC4', weight: 3.125, sectionNo: 1, sectionTitle: 'ตอนที่ 1 ข้อสอบภาษาอังกฤษแบบปรนัย 4 ตัวเลือก (ข้อ 1–32 ข้อละ 3.125 คะแนน รวม 100 คะแนน)' })),
      ...[
        { n: 17, ind: 'ต 1.3 ป.6/1' }, { n: 18, ind: 'ต 1.3 ป.6/1' },
        { n: 19, ind: 'ต 1.3 ป.6/2' }, { n: 20, ind: 'ต 1.3 ป.6/2' },
        { n: 21, ind: 'ต 1.3 ป.6/3' }, { n: 22, ind: 'ต 1.3 ป.6/3' }
      ].map((x) => ({ itemNo: x.n, strandNo: '1', strandName: 'ภาษาเพื่อการสื่อสาร', standardCode: 'ต 1.3', indicatorCode: x.ind, itemType: 'MC4', weight: 3.125, sectionNo: 1, sectionTitle: 'ตอนที่ 1 ข้อสอบภาษาอังกฤษแบบปรนัย 4 ตัวเลือก (ข้อ 1–32 ข้อละ 3.125 คะแนน รวม 100 คะแนน)', pairGroup: (x.n === 18 || x.n === 19) ? 'Items 18–19' : '' })),
      ...[23, 24].map((n) => ({ itemNo: n, strandNo: '2', strandName: 'ภาษาและวัฒนธรรม', standardCode: 'ต 2.1', indicatorCode: 'ต 2.1 ป.6/2', itemType: 'MC4', weight: 3.125, sectionNo: 1, sectionTitle: 'ตอนที่ 1 ข้อสอบภาษาอังกฤษแบบปรนัย 4 ตัวเลือก (ข้อ 1–32 ข้อละ 3.125 คะแนน รวม 100 คะแนน)' })),
      ...[25, 26, 27, 28].map((n) => ({ itemNo: n, strandNo: '2', strandName: 'ภาษาและวัฒนธรรม', standardCode: 'ต 2.2', indicatorCode: n <= 26 ? 'ต 2.2 ป.6/1' : 'ต 2.2 ป.6/2', itemType: 'MC4', weight: 3.125, sectionNo: 1, sectionTitle: 'ตอนที่ 1 ข้อสอบภาษาอังกฤษแบบปรนัย 4 ตัวเลือก (ข้อ 1–32 ข้อละ 3.125 คะแนน รวม 100 คะแนน)' })),
      ...[29, 30, 31, 32].map((n) => ({ itemNo: n, strandNo: '4', strandName: 'ภาษากับความสัมพันธ์กับชุมชนและโลก', standardCode: 'ต 4.1', indicatorCode: 'ต 4.1 ป.6/1', itemType: 'MC4', weight: 3.125, sectionNo: 1, sectionTitle: 'ตอนที่ 1 ข้อสอบภาษาอังกฤษแบบปรนัย 4 ตัวเลือก (ข้อ 1–32 ข้อละ 3.125 คะแนน รวม 100 คะแนน)', pairGroup: n <= 30 ? 'Items 29–30' : 'Items 31–32' }))
    ]
  };

  function formatExamItemTypeLabel_(itemType) {
    const t = String(itemType || 'MC4').toUpperCase();
    if (t === 'NUMERIC') return 'ระบายคำตอบตัวเลข (000–999)';
    if (t === 'COMPLEX_MC') return 'เลือกตอบเชิงซ้อน (ใช่/ไม่ใช่ 3 ข้อย่อย)';
    if (t === 'ORDER') return 'เรียงลำดับคำตอบ (2 ข้อย่อย: 21.1 + 21.2)';
    if (t === 'ESSAY') return 'เขียนสรุปใจความไม่เกิน 3 บรรทัด';
    return 'ปรนัย 4 ตัวเลือก';
  }

  function getExamBlueprintItemsForScope(params = {}) {
    const subjectCode = String(params.subjectCode || '61');
    const strandNo = String(params.strandNo || '1');
    const subStandard = String(params.subStandard || 'ครบทั้งสาระ').trim();
    const examScope = String(params.examScope || 'WHOLE_SUBJECT').toUpperCase();
    const baseList = NIETS_2569_EXAM_ITEMS[subjectCode] || NIETS_2569_EXAM_ITEMS['61'];

    const customMap = new Map();
    if (Array.isArray(params.examItems)) {
      params.examItems.forEach((it) => {
        if (String(it.subjectCode || subjectCode) === subjectCode && it.itemNo != null) {
          customMap.set(Number(it.itemNo), it);
        }
      });
    }

    const merged = baseList.map((b) => {
      const custom = customMap.get(Number(b.itemNo));
      return {
        ...b,
        strandNo: custom && custom.strandNo ? String(custom.strandNo) : b.strandNo,
        standardCode: (custom && custom.standardCode) || b.standardCode,
        indicatorCode: (custom && custom.indicatorCode) || b.indicatorCode,
        itemType: (custom && custom.itemType) || b.itemType,
        weight: (custom && custom.weight != null) ? Number(custom.weight) : b.weight
      };
    });

    if (examScope !== 'BY_STRAND' || !strandNo || strandNo === 'ALL') return merged;

    let filtered = merged.filter((it) => String(it.strandNo) === strandNo);
    if (subStandard && !/ครบทั้งสาระ|ALL|ทั้งสาระ/i.test(subStandard)) {
      const normSub = subStandard.replace(/\s+/g, '');
      let bySub = filtered.filter((it) => {
        const ind = String(it.indicatorCode || '').replace(/\s+/g, '');
        const std = String(it.standardCode || '').replace(/\s+/g, '');
        return ind === normSub || std === normSub || ind.indexOf(normSub) === 0;
      });
      if (bySub.length === 0) {
        const stdM = /^([ก-ฮ]\s*\d+\.\d+)/.exec(subStandard);
        if (stdM) {
          const stdPrefix = stdM[1].replace(/\s+/g, '');
          bySub = filtered.filter((it) => String(it.standardCode || '').replace(/\s+/g, '') === stdPrefix);
        }
      }
      if (bySub.length > 0) filtered = bySub;
    }
    return filtered.length ? filtered : merged;
  }

  function formatLockedRangeSummary_(items = []) {
    if (!items.length) return '-';
    const sorted = items.map((x) => Number(x.itemNo)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `ข้อ ${start}` : `ข้อ ${start}–${prev}`);
        start = sorted[i];
        prev = sorted[i];
      }
    }
    ranges.push(start === prev ? `ข้อ ${start}` : `ข้อ ${start}–${prev}`);
    return ranges.join(', ');
  }

  function buildExamTemplateItemBlocks_(item, isTeacher, subjectCode) {
    const out = [];
    const itemNo = item.itemNo;
    const weight = Number(item.weight || 0);
    const indTag = isTeacher ? `[${item.indicatorCode || item.standardCode || 'O-NET'}] ` : '';
    const pairNote = item.pairGroup ? ` (ข้อสอบกลุ่มเดียวกัน: ${item.pairGroup} — อ่านบทความ/สถานการณ์ร่วมกัน)` : '';

    if (item.itemType === 'COMPLEX_MC') {
      out.push(
        buildSarabunPara_(`ข้อ ${itemNo}. ${indTag}[พิมพ์โจทย์สถานการณ์/ข้อมูลทดลอง — รูปแบบเลือกตอบเชิงซ้อน (${weight} คะแนน)]`, { sz: 32, bold: true, jc: 'left', before: 80, after: 30, keepNext: true }),
        buildSarabunPara_('คำสั่ง: พิจารณาข้อความต่อไปนี้แล้วทำเครื่องหมาย ✓ ลงในช่อง "ใช่" หรือ "ไม่ใช่" ของแต่ละข้อย่อย (ตอบถูกครบทั้ง 3 ข้อได้ 5 คะแนน | ถูก 2 ข้อได้ 2.5 คะแนน)', { sz: 28, italic: true, color: '334155', jc: 'left', before: 10, after: 30 }),
        buildFixedTable_(
          [
            {
              isHeader: true,
              cells: [
                { text: `ข้อความย่อย (ข้อ ${itemNo}.1 – ${itemNo}.3)`, sz: 30, bold: true, fill: isTeacher ? 'FEF2F2' : 'F1F5F9', color: isTeacher ? '991B1B' : '0F172A', jc: 'center' },
                { text: 'ใช่', sz: 30, bold: true, fill: isTeacher ? 'FEF2F2' : 'F1F5F9', color: isTeacher ? '991B1B' : '0F172A', jc: 'center' },
                { text: 'ไม่ใช่', sz: 30, bold: true, fill: isTeacher ? 'FEF2F2' : 'F1F5F9', color: isTeacher ? '991B1B' : '0F172A', jc: 'center' }
              ]
            },
            { cells: [{ text: `${itemNo}.1 ................................................................................................`, sz: 30 }, { text: '[  ]', sz: 30, jc: 'center' }, { text: '[  ]', sz: 30, jc: 'center' }] },
            { cells: [{ text: `${itemNo}.2 ................................................................................................`, sz: 30 }, { text: '[  ]', sz: 30, jc: 'center' }, { text: '[  ]', sz: 30, jc: 'center' }] },
            { cells: [{ text: `${itemNo}.3 ................................................................................................`, sz: 30 }, { text: '[  ]', sz: 30, jc: 'center' }, { text: '[  ]', sz: 30, jc: 'center' }] }
          ],
          [5306, 1500, 1500],
          { borderColor: isTeacher ? 'DC2626' : '64748B', borderSz: 6 }
        )
      );
      if (isTeacher) {
        out.push(buildSarabunPara_(`เฉลย ข้อ ${itemNo}: ตอบ ใช่|ไม่ใช่|ใช่ | เกณฑ์ สทศ.: ถูก 3/3 = 5 คะแนน, ถูก 2/3 = 2.5 คะแนน, 0–1/3 = 0 คะแนน | เหตุผล: [อธิบายทีละข้อย่อย ${itemNo}.1–${itemNo}.3]`, { sz: 30, color: '991B1B', firstLine: 720, before: 20, after: 80 }));
      }
      return out;
    }

    if (item.itemType === 'NUMERIC') {
      out.push(
        buildSarabunPara_(`ข้อ ${itemNo}. ${indTag}[พิมพ์โจทย์คณิตศาสตร์แบบอัตนัยระบายตัวเลข (${weight} คะแนน)]`, { sz: 32, bold: true, jc: 'left', before: 80, after: 30, keepNext: true }),
        buildFixedTable_(
          [{ cells: [{ text: `ช่องเขียน/ระบายคำตอบสำหรับข้อที่ ${itemNo}: [     ] [     ] [     ]  (คำตอบต้องเป็นจำนวนเต็มไม่เกิน 3 หลัก ตั้งแต่ 000–999 เท่านั้น: หลักร้อย-หลักสิบ-หลักหน่วย)`, sz: 28, fill: 'FAFAFA' }] }],
          [8306],
          { borderColor: '94A3B8', borderSz: 4 }
        )
      );
      if (isTeacher) {
        out.push(buildSarabunPara_(`เฉลย ข้อ ${itemNo}: ตอบ 125 (จำนวนเต็ม 0–999) | วิธีคิดและขั้นตอนการคำนวณ: [แสดงวิธีทำละเอียดเพื่อตรวจสอบความสมเหตุสมผล 0–999]`, { sz: 30, color: '991B1B', firstLine: 720, before: 20, after: 80 }));
      }
      return out;
    }

    if (item.itemType === 'ORDER') {
      out.push(
        buildSarabunPara_(`ข้อ ${itemNo}. ${indTag}[โจทย์อัตนัยประยุกต์: การแต่งประโยค/เรียงลำดับคำตามผัง สทศ. (${weight} คะแนน)]`, { sz: 32, bold: true, jc: 'left', before: 80, after: 30, keepNext: true }),
        buildLockedImageFrameBox_(`[กรอบวางภาพประกอบข้อ ${itemNo}.1 (ภาพที่ 1 สำหรับเรียงลำดับ 10 คำ) — วางรูปแบบ In Line with Text]`),
        buildSarabunPara_(`ข้อ ${itemNo}.1 จงเรียงหมายเลขคำต่อไปนี้ให้เป็นประโยคที่ถูกต้องสมบูรณ์ (2 คะแนน — กำหนดให้ 10 คำ หมายเลข 1–10):`, { sz: 30, bold: true, jc: 'left', before: 40, after: 20 }),
        buildSarabunPara_('คำที่กำหนด: (1) ........ (2) ........ (3) ........ (4) ........ (5) ........ (6) ........ (7) ........ (8) ........ (9) ........ (10) ........', { sz: 30, jc: 'left', before: 10, after: 20 }),
        buildSarabunPara_(`ลำดับคำตอบข้อ ${itemNo}.1: ........ - ........ - ........ - ........ - ........ - ........ - ........ - ........ - ........ - ........`, { sz: 30, jc: 'left', before: 10, after: 50 }),
        buildLockedImageFrameBox_(`[กรอบวางภาพประกอบข้อ ${itemNo}.2 (ภาพที่ 2 สำหรับเรียงลำดับ 13 คำ) — วางรูปแบบ In Line with Text]`),
        buildSarabunPara_(`ข้อ ${itemNo}.2 จงเรียงหมายเลขคำต่อไปนี้ให้เป็นประโยคที่ถูกต้องสมบูรณ์ (3 คะแนน — กำหนดให้ 13 คำ หมายเลข 1–13):`, { sz: 30, bold: true, jc: 'left', before: 40, after: 20 }),
        buildSarabunPara_('คำที่กำหนด: (1) ...... (2) ...... (3) ...... (4) ...... (5) ...... (6) ...... (7) ...... (8) ...... (9) ...... (10) ...... (11) ...... (12) ...... (13) ......', { sz: 30, jc: 'left', before: 10, after: 20 }),
        buildSarabunPara_(`ลำดับคำตอบข้อ ${itemNo}.2: ..... - ..... - ..... - ..... - ..... - ..... - ..... - ..... - ..... - ..... - ..... - ..... - .....`, { sz: 30, jc: 'left', before: 10, after: 40 })
      );
      if (isTeacher) {
        out.push(buildSarabunPara_(`เฉลย ข้อ ${itemNo}: ตอบ 1-2-3-4-5-6-7-8-9-10|1-2-3-4-5-6-7-8-9-10-11-12-13 (คั่น 21.1 และ 21.2 ด้วยเครื่องหมาย |) | วิธีคิด: [ระบุประโยคเต็มที่ถูกต้องและเหตุผลทางไวยากรณ์]`, { sz: 30, color: '991B1B', firstLine: 720, before: 20, after: 80 }));
      }
      return out;
    }

    if (item.itemType === 'ESSAY') {
      out.push(
        buildSarabunPara_(`ข้อ ${itemNo}. ${indTag}[โจทย์อัตนัย: เขียนเล่าเรื่อง/สรุปใจความสำคัญ (${weight} คะแนน — ความยาวไม่เกิน 3 บรรทัดตามเกณฑ์ สทศ.)]`, { sz: 32, bold: true, jc: 'left', before: 80, after: 30, keepNext: true }),
        buildLockedImageFrameBox_(`[กรอบวางบทอ่านหรือภาพประกอบข้อ ${itemNo} — วางรูปแบบ In Line with Text]`),
        buildSarabunPara_('คำสั่ง: อ่านเรื่องหรือดูภาพที่กำหนด แล้วเขียนสรุปใจความสำคัญด้วยภาษาไทยที่ถูกต้อง ความยาวไม่เกิน 3 บรรทัด:', { sz: 30, italic: true, jc: 'left', before: 30, after: 20 }),
        buildFixedTable_(
          [{
            cells: [{
              fill: 'FAFAFA',
              paras: [
                buildSarabunPara_('บรรทัดที่ 1: ...................................................................................................................................................', { sz: 30, jc: 'left', before: 40, after: 40 }),
                buildSarabunPara_('บรรทัดที่ 2: ...................................................................................................................................................', { sz: 30, jc: 'left', before: 40, after: 40 }),
                buildSarabunPara_('บรรทัดที่ 3: ...................................................................................................................................................', { sz: 30, jc: 'left', before: 40, after: 40 })
              ]
            }]
          }],
          [8306],
          { borderColor: '94A3B8', borderSz: 4 }
        )
      );
      if (isTeacher) {
        out.push(buildSarabunPara_(`เฉลย ข้อ ${itemNo}: คะแนนเต็ม 15 | แนวคำตอบและเกณฑ์การให้คะแนนรูบริก สทศ.: (1) สาระสำคัญ/ใจความครบถ้วน (6 คะแนน) (2) การใช้ภาษาและสะกดคำถูกต้อง (5 คะแนน) (3) เรียบเรียงกระชับไม่เกิน 3 บรรทัด (4 คะแนน)`, { sz: 30, color: '991B1B', firstLine: 720, before: 20, after: 80 }));
      }
      return out;
    }

    const mathAscNote = String(subjectCode) === '64'
      ? ' (หมายเหตุ สทศ.: หากตัวเลือก 1–4 เป็นจำนวน/ค่าตัวเลข กรุณาเรียงลำดับจากน้อยไปมาก หรือมากไปน้อย)'
      : '';
    out.push(
      buildSarabunPara_(`ข้อ ${itemNo}. ${indTag}[พิมพ์โจทย์ข้อ ${itemNo} — ล็อกเลขข้อตามผัง สทศ. ห้ามเปลี่ยนเลขข้อ${pairNote}]`, { sz: 32, bold: true, jc: 'left', before: 60, after: 20 }),
      buildSarabunPara_(`    1. ........................................    2. ........................................${mathAscNote}`, { sz: 30, jc: 'left', before: 10, after: 10 }),
      buildSarabunPara_('    3. ........................................    4. ........................................', { sz: 30, jc: 'left', before: 10, after: isTeacher ? 20 : 60 })
    );
    if (isTeacher) {
      out.push(buildSarabunPara_(`เฉลย ข้อ ${itemNo}: ตอบ 1 | วิธีคิดและเหตุผล: [อธิบายวิธีคิดและเหตุผลของตัวลวง 2, 3, 4]`, { sz: 30, color: '991B1B', firstLine: 720, before: 10, after: 60 }));
    }
    return out;
  }

  function buildManuscriptTemplateDocumentXml(params = {}) {
    const subjectCode = String(params.subjectCode || '61');
    const rawSubjectName = String(params.subjectName || `รายวิชา (${subjectCode})`);
    const cleanSubName = rawSubjectName.replace(/\s*\((?:รหัส(?:วิชา)?\s*)?\d+\)\s*$/i, '').trim() || rawSubjectName;
    const subjectDisplay = `${cleanSubName} (รหัสวิชา ${subjectCode})`;
    const strandNo = String(params.strandNo || '1');
    const rawStrandName = String(params.strandName || `สาระที่ ${strandNo}`);
    const strandDisplay = /^สาระที่/.test(rawStrandName.trim()) ? rawStrandName.trim() : `สาระที่ ${strandNo} ${rawStrandName.trim()}`;
    const subStandard = String(params.subStandard || 'ครบทั้งสาระ');
    const expectedIndicators = Array.isArray(params.expectedIndicators) && params.expectedIndicators.length
      ? params.expectedIndicators
      : ['ระบุรหัสตัวชี้วัดตามผัง O-NET 2569'];
    const indicatorDetails = Array.isArray(params.indicatorDetails) ? params.indicatorDetails : [];
    const indDescMap = {};
    indicatorDetails.forEach((d) => {
      if (d && d.indicatorCode) indDescMap[String(d.indicatorCode)] = String(d.indicatorDesc || '');
    });
    const docCategory = String(params.docCategory || 'TUTORING_STRAND').toUpperCase();
    const targetAudience = String(params.targetAudience || 'STUDENT').toUpperCase();
    const examRound = String(params.examRound || 'PRE').toUpperCase();
    const examScope = String(params.examScope || 'WHOLE_SUBJECT').toUpperCase();

    const isTeacher = targetAudience === 'TEACHER';
    const isExam = docCategory === 'PREPOST_EXAM';
    const roundLabel = examRound === 'POST'
      ? 'Post-Test (ชุดทดสอบหลังติว คู่ขนาน O-NET)'
      : (examRound === 'PRE' ? 'Pre-Test (ชุดทดสอบก่อนติว คู่ขนาน O-NET)' : 'คู่ขนาน Pre & Post O-NET');
    const scopeLabel = examScope === 'BY_STRAND' ? `เฉพาะ${strandDisplay} (${subStandard})` : 'ครบชุดทั้งรายวิชา (ตาม Test Blueprint ปี พ.ศ. 2569)';
    const indListText = expectedIndicators.join(' | ');
    const bannerFill = isTeacher ? 'FEF2F2' : 'ECFDF5';
    const bannerBorder = isTeacher ? '991B1B' : '1B4332';
    const bannerColor = isTeacher ? '991B1B' : '1B4332';
    const blocks = [];

    if (isExam && !isTeacher) {
      const examItems = getExamBlueprintItemsForScope({ subjectCode, strandNo, subStandard, examScope, examItems: params.examItems });
      const lockedRangeText = formatLockedRangeSummary_(examItems);
      const totalPts = roundScore(examItems.reduce((s, it) => s + Number(it.weight || 0), 0));

      blocks.push(
        buildFixedTable_([{ cells: [{ fill: bannerFill, paras: [
          buildSarabunPara_('โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)', { sz: 34, bold: true, color: bannerColor, jc: 'center', before: 40, after: 16 }),
          buildSarabunPara_('ฉบับที่ 1: แบบทดสอบคู่ขนาน Pre-Post O-NET — ฉบับนักเรียน (ล็อกเลขข้อตามผัง สทศ. 2569)', { sz: 32, bold: true, color: '0F172A', jc: 'center', before: 0, after: 40 })
        ] }] }], [8306], { borderColor: bannerBorder, borderSz: 8 }),
        buildSarabunPara_('', { sz: 16, before: 20, after: 20 }),
        buildFixedTable_([
          { cells: [{ text: `รายวิชา: ${subjectDisplay}`, sz: 30, bold: true, fill: 'F8FAFC' }, { text: `ชุดข้อสอบ: ${roundLabel}`, sz: 30, bold: true, fill: 'F8FAFC' }] },
          { cells: [{ text: `ขอบเขตและช่วงข้อที่รับผิดชอบ: ${lockedRangeText}`, sz: 30, bold: true, color: '1B4332' }, { text: `จำนวน ${examItems.length} ข้อ (${scopeLabel}) | คะแนนรวม ${totalPts} คะแนน`, sz: 28 }] },
          { cells: [{ text: 'ชื่อ-สกุลนักเรียน: ....................................................', sz: 30 }, { text: 'โรงเรียน: ........................................ เลขที่: ........', sz: 30 }] }
        ], [4153, 4153], { borderColor: '94A3B8', borderSz: 6 }),
        buildSarabunPara_('คำชี้แจงสำหรับคณะกรรมการและนักเรียน', { sz: 34, bold: true, color: '1B4332', jc: 'left', before: 120, after: 40, keepNext: true }),
        buildSarabunPara_(`1. แบบทดสอบชุดนี้ล็อกหมายเลขข้อ ${lockedRangeText} ตามผัง สทศ. ปีการศึกษา 2569 เพื่อนำไปรวมเล่มอัตโนมัติ (กรุณาคงหมายเลขข้อตามแม่แบบนี้)`, { sz: 30, firstLine: 720, before: 20, after: 30 }),
        buildSarabunPara_('2. ให้นักเรียนอ่านคำสั่งแต่ละตอนให้รอบคอบ แล้วเลือกคำตอบหรือเขียนคำตอบลงในกระดาษคำตอบ (ห้ามมีรหัสตัวชี้วัดหรือคำตอบปรากฏในไฟล์นักเรียนชุดนี้)', { sz: 30, firstLine: 720, before: 10, after: 80 }),
        buildLockedImageFrameBox_('[พื้นที่สำหรับใส่ภาพ/แผนภูมิ/บทอ่านประกอบโจทย์แบบล็อกตำแหน่ง — กรุณาวางรูปแบบ In Line with Text]')
      );

      let lastSecNo = -1;
      examItems.forEach((it) => {
        if (it.sectionNo !== lastSecNo) {
          lastSecNo = it.sectionNo;
          blocks.push(buildSarabunPara_(it.sectionTitle || `ตอนที่ ${it.sectionNo}`, { sz: 34, bold: true, color: '1B4332', jc: 'left', before: 100, after: 40, keepNext: true }));
        }
        blocks.push(...buildExamTemplateItemBlocks_(it, false, subjectCode));
      });
    } else if (isExam && isTeacher) {
      const examItems = getExamBlueprintItemsForScope({ subjectCode, strandNo, subStandard, examScope, examItems: params.examItems });
      const lockedRangeText = formatLockedRangeSummary_(examItems);
      const totalPts = roundScore(examItems.reduce((s, it) => s + Number(it.weight || 0), 0));
      const examUniqueInds = Array.from(new Set(examItems.map((it) => it.indicatorCode).filter(Boolean)));
      const effectiveIndText = examUniqueInds.length ? examUniqueInds.join(' | ') : indListText;

      const rangeRows = [{ isHeader: true, cells: [
        { text: 'ช่วงเลขข้อ (ล็อก)', sz: 28, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'สาระ / มาตรฐาน', sz: 28, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'รูปแบบข้อสอบ สทศ.', sz: 28, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'ข้อกำหนดพิเศษในการออกข้อสอบ', sz: 28, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' }
      ] }];
      const groupsMap = new Map();
      examItems.forEach((it) => {
        const gKey = `${it.standardCode}::${it.itemType}`;
        if (!groupsMap.has(gKey)) groupsMap.set(gKey, { standardCode: it.standardCode, strandName: it.strandName, itemType: it.itemType, items: [] });
        groupsMap.get(gKey).items.push(it);
      });
      Array.from(groupsMap.values()).forEach((g) => {
        let special = 'เรียงลำดับความยากง่ายตามเกณฑ์ O-NET';
        if (g.itemType === 'COMPLEX_MC') special = 'เลือกตอบเชิงซ้อน ใช่/ไม่ใช่ 3 ข้อย่อย (3/3=5, 2/3=2.5 คะแนน)';
        else if (g.itemType === 'NUMERIC') special = 'ระบายตัวเลขจำนวนเต็ม 000–999 (หลักร้อย-สิบ-หน่วย) เท่านั้น';
        else if (g.itemType === 'ORDER') special = 'แยก 21.1 (10 คำ+ภาพ, 2 คะแนน) และ 21.2 (13 คำ+ภาพ, 3 คะแนน)';
        else if (g.itemType === 'ESSAY') special = 'เขียนสรุปใจความไม่เกิน 3 บรรทัด (15 คะแนน)';
        else if (subjectCode === '64') special = 'ตัวเลือกที่เป็นตัวเลขควรเรียงจากน้อยไปมากหรือมากไปน้อย';
        rangeRows.push({ cells: [
          { text: formatLockedRangeSummary_(g.items), sz: 28, bold: true, jc: 'center' },
          { text: `${g.standardCode} (${g.strandName})`, sz: 26, jc: 'left' },
          { text: formatExamItemTypeLabel_(g.itemType), sz: 26, jc: 'center' },
          { text: special, sz: 26, jc: 'left' }
        ] });
      });

      const bpRows = [{ isHeader: true, cells: [
        { text: 'ข้อที่', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'รหัสตัวชี้วัด (O-NET 2569)', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'รูปแบบ / คะแนน', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'เฉลยคำตอบ', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' }
      ] }];
      examItems.forEach((it) => {
        let sampleKey = '1';
        if (it.itemType === 'NUMERIC') sampleKey = '125';
        else if (it.itemType === 'COMPLEX_MC') sampleKey = 'ใช่|ไม่ใช่|ใช่';
        else if (it.itemType === 'ORDER') sampleKey = '1-2-3-4-5-6-7-8-9-10|1-2-3-4-5-6-7-8-9-10-11-12-13';
        else if (it.itemType === 'ESSAY') sampleKey = '15';
        bpRows.push({ cells: [
          { text: `ข้อ ${it.itemNo}`, sz: 28, bold: true, jc: 'center' },
          { text: it.indicatorCode || effectiveIndText, sz: 28, jc: 'left' },
          { text: `${formatExamItemTypeLabel_(it.itemType)} (${it.weight})`, sz: 26, jc: 'center' },
          { text: sampleKey, sz: 28, bold: true, color: '991B1B', jc: 'center' }
        ] });
      });

      blocks.push(
        buildFixedTable_([{ cells: [{ fill: bannerFill, paras: [
          buildSarabunPara_('[ลับเฉพาะครู — ฉบับที่ 2: ฉบับครูผู้สอน] แบบทดสอบคู่ขนาน Pre-Post O-NET ปีการศึกษา 2569', { sz: 36, bold: true, color: bannerColor, jc: 'center', before: 40, after: 20 }),
          buildSarabunPara_('ประกอบด้วย ผังข้อสอบ ตัวข้อสอบ รหัสตัวชี้วัด ตารางสรุปเฉลย และวิธีคิดละเอียด (ใช้ตรวจ IOC และดูดเฉลยอัตโนมัติ)', { sz: 28, bold: true, color: '0F172A', jc: 'center', before: 0, after: 40 })
        ] }] }], [8306], { borderColor: bannerBorder, borderSz: 8 }),
        buildSarabunPara_('', { sz: 16, before: 20, after: 20 }),
        buildFixedTable_([
          { cells: [{ text: `รายวิชา: ${subjectDisplay}`, sz: 30, bold: true, fill: 'F8FAFC' }, { text: `ชุดข้อสอบ: ${roundLabel} | ขอบเขต: ${scopeLabel}`, sz: 30, bold: true, fill: 'F8FAFC' }] },
          { cells: [{ text: `ช่วงข้อสอบที่ล็อก (${examItems.length} ข้อ / ${totalPts} คะแนน):`, sz: 30, bold: true }, { text: `${lockedRangeText} | ตัวชี้วัดที่รับผิดชอบ: ${indListText}`, sz: 28 }] }
        ], [3100, 5206], { borderColor: '94A3B8', borderSz: 6 }),
        buildSarabunPara_('ตารางสรุปช่วงเลขข้อสอบตามผัง สทศ. (Locked Item Numbers — ห้ามรันเลขข้อเริ่ม 1 ใหม่เอง)', { sz: 32, bold: true, color: '991B1B', jc: 'left', before: 120, after: 40, keepNext: true }),
        buildFixedTable_(rangeRows, [1100, 1600, 2000, 3606], { borderColor: 'DC2626', borderSz: 6 }),
        buildSarabunPara_('ส่วนที่ 1: ผังข้อสอบและตารางสรุปเฉลย (ระบบสามารถดูดเฉลยจากตารางนี้เข้าหน้าจัดการเฉลยอัตโนมัติ)', { sz: 34, bold: true, color: '991B1B', jc: 'left', before: 140, after: 60, keepNext: true }),
        buildFixedTable_(bpRows, [950, 2556, 2600, 2200], { borderColor: 'DC2626', borderSz: 6 }),
        buildSarabunPara_('ส่วนที่ 2: ตัวข้อสอบ เฉลย และวิธีคิดละเอียดรายข้อ (สำหรับครูผู้สอน และตรวจ IOC 2 หน้าจอคู่ขนาน)', { sz: 34, bold: true, color: '991B1B', jc: 'left', before: 160, after: 60, keepNext: true }),
        buildLockedImageFrameBox_('[พื้นที่สำหรับภาพประกอบข้อสอบ/กราฟเฉลย (ล็อกตำแหน่ง 8306 DXA) — วางรูปแบบ In Line with Text]')
      );

      let lastSecNo = -1;
      examItems.forEach((it) => {
        if (it.sectionNo !== lastSecNo) {
          lastSecNo = it.sectionNo;
          blocks.push(buildSarabunPara_(it.sectionTitle || `ตอนที่ ${it.sectionNo}`, { sz: 32, bold: true, color: '991B1B', jc: 'left', before: 100, after: 30, keepNext: true }));
        }
        blocks.push(...buildExamTemplateItemBlocks_(it, true, subjectCode));
      });
    } else if (!isExam && !isTeacher) {
      const summarySubBlocks = [];
      if (expectedIndicators.length <= 10) {
        expectedIndicators.forEach((ind, idx) => {
          const desc = indDescMap[ind] ? ` — ${indDescMap[ind]}` : '';
          summarySubBlocks.push(
            buildSarabunPara_(`1.${idx + 1} สรุปเนื้อหาตัวชี้วัด ${ind}${desc}`, { sz: 32, bold: true, color: '1B4332', jc: 'left', before: 80, after: 20, keepNext: true }),
            buildSarabunPara_('• สรุปหลักการสำคัญ นิยาม สูตร หรือเทคนิคการสังเกตโจทย์ O-NET ที่นักเรียนต้องรู้: ....................................................................................', { sz: 30, firstLine: 720, before: 10, after: 40 })
          );
        });
      } else {
        const stdGroups = new Map();
        expectedIndicators.forEach((ind) => {
          const m = /^([ก-ฮ]\s*\d+\.\d+)/.exec(ind);
          const stdKey = m ? m[1] : 'มาตรฐานประจำสาระ';
          if (!stdGroups.has(stdKey)) stdGroups.set(stdKey, []);
          stdGroups.get(stdKey).push(ind);
        });
        let gIdx = 1;
        Array.from(stdGroups.entries()).forEach(([stdKey, inds]) => {
          summarySubBlocks.push(
            buildSarabunPara_(`1.${gIdx++} สรุปเนื้อหากลุ่ม${stdKey} (${inds.length} ตัวชี้วัด: ${inds.join(', ')})`, { sz: 32, bold: true, color: '1B4332', jc: 'left', before: 80, after: 20, keepNext: true }),
            buildSarabunPara_('• สรุปมโนทัศน์หลัก แผนผังความคิด และตัวอย่างสถานการณ์ตรงจุดออกสอบ O-NET: ....................................................................................', { sz: 30, firstLine: 720, before: 10, after: 40 })
          );
        });
      }

      const starterCount = Math.min(Math.max(expectedIndicators.length, 2), 5);
      const practiceStudentBlocks = [];
      for (let k = 1; k <= starterCount; k++) {
        practiceStudentBlocks.push(
          buildSarabunPara_(`ข้อ ${k}. [พิมพ์โจทย์แบบฝึกทักษะข้อที่ ${k} ให้ตรงกับชุดของครูผู้สอน — สามารถเพิ่มจำนวนข้อได้ตามต้องการ]`, { sz: 32, bold: true, jc: 'left', before: 50, after: 20, keepNext: true }),
          buildSarabunPara_('    1. ........................................    2. ........................................', { sz: 30, jc: 'left', before: 10, after: 10 }),
          buildSarabunPara_('    3. ........................................    4. ........................................', { sz: 30, jc: 'left', before: 10, after: 40 })
        );
      }

      blocks.push(
        buildFixedTable_([{ cells: [{ fill: bannerFill, paras: [
          buildSarabunPara_('โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)', { sz: 34, bold: true, color: bannerColor, jc: 'center', before: 40, after: 20 }),
          buildSarabunPara_('ฉบับที่ 3: เอกสารยกระดับตามสาระและตัวชี้วัด — ฉบับนักเรียน (สรุปความรู้และแบบฝึกทักษะ ป.6)', { sz: 30, bold: true, color: '0F172A', jc: 'center', before: 0, after: 40 })
        ] }] }], [8306], { borderColor: bannerBorder, borderSz: 8 }),
        buildSarabunPara_('', { sz: 16, before: 20, after: 20 }),
        buildFixedTable_([
          { cells: [{ text: `รายวิชา: ${subjectDisplay}`, sz: 30, bold: true, fill: 'F8FAFC' }, { text: `${strandDisplay} | ขอบเขต: ${subStandard}`, sz: 30, bold: true, fill: 'F8FAFC' }] },
          { cells: [{ text: `ตัวชี้วัดที่มุ่งพัฒนา (${expectedIndicators.length} ตัวชี้วัด):`, sz: 30, bold: true }, { text: indListText, sz: 28 }] },
          { cells: [{ text: 'ชื่อ-สกุลนักเรียน: ................................................', sz: 30 }, { text: 'โรงเรียน: ........................................ เลขที่: ........', sz: 30 }] }
        ], [3000, 5306], { borderColor: '94A3B8', borderSz: 6 }),
        buildSarabunPara_('ส่วนที่ 1: สรุปความรู้ตรงจุดออกสอบ (Knowledge Summary)', { sz: 34, bold: true, color: '1B4332', jc: 'left', before: 140, after: 40, keepNext: true }),
        buildSarabunPara_('คำชี้แจง: ให้นักเรียนศึกษาสรุปหลักการสำคัญ สูตร และเทคนิคจำง่ายในแต่ละตัวชี้วัด แล้วฝึกทำโจทย์ในส่วนที่ 2 ด้วยตนเอง (เอกสารชุดนี้สำหรับนักเรียนฝึกคิด ไม่มีคำตอบแสดงไว้)', { sz: 30, firstLine: 720, before: 20, after: 50 }),
        ...summarySubBlocks,
        buildLockedImageFrameBox_('[กรอบวางแผนภาพสรุปความรู้ / Mind Map / กราฟประกอบ — วางรูปแบบ In Line with Text]'),
        buildSarabunPara_('ส่วนที่ 2: แบบฝึกทักษะและข้อสอบฝึกคิดสำหรับนักเรียน (Skill Practice)', { sz: 34, bold: true, color: '1B4332', jc: 'left', before: 140, after: 40, keepNext: true }),
        ...practiceStudentBlocks,
        buildFixedTable_([{ cells: [{ text: 'พื้นที่ให้นักเรียนฝึกทดเลข / บันทึกเหตุผลการเลือกคำตอบ:\n................................................................................................................................................', sz: 30, fill: 'FAFAFA', before: 120, after: 120 }] }], [8306], { borderColor: 'CBD5E1', borderSz: 4 })
      );
    } else {
      const starterCount = Math.min(Math.max(expectedIndicators.length, 2), 5);
      const summaryTeacherBlocks = [];
      if (expectedIndicators.length <= 10) {
        expectedIndicators.forEach((ind, idx) => {
          const desc = indDescMap[ind] ? ` — ${indDescMap[ind]}` : '';
          summaryTeacherBlocks.push(
            buildSarabunPara_(`1.${idx + 1} จุดเน้นการสอนตัวชี้วัด ${ind}${desc}`, { sz: 32, bold: true, color: '991B1B', jc: 'left', before: 80, after: 20, keepNext: true }),
            buildSarabunPara_('• แนวทางจัดกิจกรรมติว / จุดที่นักเรียนมักเข้าใจคลาดเคลื่อน (Misconceptions) และเทคนิคตัดตัวลวง: ....................................................', { sz: 30, firstLine: 720, before: 10, after: 40 })
          );
        });
      } else {
        const stdGroups = new Map();
        expectedIndicators.forEach((ind) => {
          const m = /^([ก-ฮ]\s*\d+\.\d+)/.exec(ind);
          const stdKey = m ? m[1] : 'มาตรฐานประจำสาระ';
          if (!stdGroups.has(stdKey)) stdGroups.set(stdKey, []);
          stdGroups.get(stdKey).push(ind);
        });
        let gIdx = 1;
        Array.from(stdGroups.entries()).forEach(([stdKey, inds]) => {
          summaryTeacherBlocks.push(
            buildSarabunPara_(`1.${gIdx++} จุดเน้นการสอนกลุ่ม${stdKey} (${inds.length} ตัวชี้วัด: ${inds.join(', ')})`, { sz: 32, bold: true, color: '991B1B', jc: 'left', before: 80, after: 20, keepNext: true }),
            buildSarabunPara_('• แนวทางจัดกิจกรรมติว / จุดที่นักเรียนมักเข้าใจคลาดเคลื่อน (Misconceptions) และสื่อการสอน: ....................................................', { sz: 30, firstLine: 720, before: 10, after: 40 })
          );
        });
      }

      const practiceTeacherBlocks = [];
      const keyRows = [{ isHeader: true, cells: [
        { text: 'ข้อที่', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'รหัสตัวชี้วัด', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'คำตอบที่ถูก', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' },
        { text: 'วิธีคิด จุดสังเกต และวิเคราะห์ตัวลวง', sz: 30, bold: true, fill: 'FEF2F2', color: '991B1B', jc: 'center' }
      ] }];
      for (let k = 1; k <= starterCount; k++) {
        const ind = expectedIndicators[(k - 1) % expectedIndicators.length];
        practiceTeacherBlocks.push(
          buildSarabunPara_(`ข้อ ${k}. [${ind}] พิมพ์โจทย์แบบฝึกและตัวเลือกข้อที่ ${k} ให้ตรงกับฉบับนักเรียนที่นี่`, { sz: 32, bold: true, jc: 'left', before: 50, after: 20, keepNext: true }),
          buildSarabunPara_('    1. ........................................    2. ........................................', { sz: 30, jc: 'left', before: 10, after: 10 }),
          buildSarabunPara_('    3. ........................................    4. ........................................', { sz: 30, jc: 'left', before: 10, after: 20 }),
          buildSarabunPara_(`เฉลย ข้อ ${k}: ตอบ 1 | วิธีคิด: [อธิบายเหตุผลของคำตอบที่ถูก เพื่อให้ระบบสกัดเข้าคลังฝึกออนไลน์ให้นักเรียนอ่านหลังทำข้อสอบอัตโนมัติ]`, { sz: 30, color: '991B1B', firstLine: 720, before: 10, after: 50 })
        );
        keyRows.push({ cells: [
          { text: `ข้อ ${k}`, sz: 30, jc: 'center' },
          { text: ind, sz: 30, jc: 'left' },
          { text: '1', sz: 30, bold: true, color: '991B1B', jc: 'center' },
          { text: 'อธิบายเหตุผลของคำตอบที่ถูกต้อง และจุดที่นักเรียนมักเข้าใจผิด', sz: 28, jc: 'left' }
        ] });
      }

      blocks.push(
        buildFixedTable_([{ cells: [{ fill: bannerFill, paras: [
          buildSarabunPara_('[ฉบับที่ 4: ฉบับครูผู้สอน — มีจุดเน้นการสอนและเฉลยละเอียด] โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)', { sz: 30, bold: true, color: bannerColor, jc: 'center', before: 40, after: 20 }),
          buildSarabunPara_('ชั้นประถมศึกษาปีที่ 6 ปีการศึกษา 2569 — กลุ่มโรงเรียนศรีเสาวภาค (ระบบดึงโจทย์และเฉลยเข้าคลังฝึกออนไลน์อัตโนมัติ)', { sz: 28, bold: true, color: '0F172A', jc: 'center', before: 0, after: 40 })
        ] }] }], [8306], { borderColor: bannerBorder, borderSz: 8 }),
        buildSarabunPara_('', { sz: 16, before: 20, after: 20 }),
        buildFixedTable_([
          { cells: [{ text: `รายวิชา: ${subjectDisplay}`, sz: 30, bold: true, fill: 'F8FAFC' }, { text: `${strandDisplay} | ขอบเขต: ${subStandard}`, sz: 30, bold: true, fill: 'F8FAFC' }] },
          { cells: [{ text: `ตัวชี้วัดที่รับผิดชอบ (${expectedIndicators.length} ตัวชี้วัด):`, sz: 30, bold: true }, { text: indListText, sz: 28 }] },
          { cells: [{ text: 'แนวทางแบ่งงานกรณีมีครูหลายท่านในสาระ:', sz: 28, bold: true, fill: 'FEF2F2', color: '991B1B' }, { text: 'ทำร่วมกันเป็น 1 ชุดประจำสาระ หรือเลือกแบ่งตามมาตรฐาน/รายตัวชี้วัดในระบบแล้วอัปโหลดแยกชุด (ระบบรวมเล่มตามลำดับให้อัตโนมัติ)', sz: 26, fill: 'FEF2F2' }] }
        ], [3000, 5306], { borderColor: '94A3B8', borderSz: 6 }),
        buildSarabunPara_('ส่วนที่ 1: สรุปความรู้ตรงจุดออกสอบ และจุดเน้นการสอนสำหรับครูผู้สอน', { sz: 34, bold: true, color: '991B1B', jc: 'left', before: 140, after: 40, keepNext: true }),
        buildSarabunPara_('แนวทางการสอนของครู: ระบุเทคนิคการอธิบายมโนทัศน์หลัก ความเข้าใจคลาดเคลื่อนที่พบบ่อย (Misconceptions) และสื่อประกอบการสอน', { sz: 30, firstLine: 720, before: 20, after: 50 }),
        ...summaryTeacherBlocks,
        buildLockedImageFrameBox_('[กรอบวางแผนภาพประกอบการสอนของครู — วางรูปแบบ In Line with Text เพื่อล็อกตำแหน่ง 8306 DXA]'),
        buildSarabunPara_('ส่วนที่ 2: แบบฝึกทักษะ/ข้อสอบประจำตัวชี้วัด (พร้อมระบุรหัสตัวชี้วัดกำกับรายข้อ — ระบบดึงเข้าคลังฝึกออนไลน์อัตโนมัติ)', { sz: 34, bold: true, color: '991B1B', jc: 'left', before: 140, after: 40, keepNext: true }),
        ...practiceTeacherBlocks,
        buildSarabunPara_('ส่วนที่ 3: ตารางสรุปเฉลยและวิธีคิดละเอียดสำหรับครูผู้สอน', { sz: 34, bold: true, color: '991B1B', jc: 'left', before: 120, after: 60, keepNext: true }),
        buildFixedTable_(keyRows, [950, 2100, 1250, 4006], { borderColor: 'DC2626', borderSz: 6 })
      );
    }

    return [
      '<' + '?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" ',
      'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ',
      'xmlns:o="urn:schemas-microsoft-com:office:office" ',
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ',
      'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ',
      'xmlns:v="urn:schemas-microsoft-com:vml" ',
      'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" ',
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ',
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ',
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ',
      'xmlns:w10="urn:schemas-microsoft-com:office:word" ',
      'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ',
      'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ',
      'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" ',
      'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" ',
      'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" ',
      'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">',
      '<w:body>',
      blocks.join(''),
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="2160" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>',
      '</w:body></w:document>'
    ].join('');
  }

  function buildMergedBookFrontMatterXml(params = {}) {
    const subjectName = String(params.subjectName || 'รายวิชา O-NET ป.6');
    const docCategoryLabel = String(params.docCategoryLabel || 'เอกสารยกระดับผลสัมฤทธิ์ตามสาระและตัวชี้วัด');
    const editionLabel = String(params.editionLabel || 'ฉบับนักเรียน');
    const docTitle = String(params.docTitle || `รวมเล่ม${docCategoryLabel} — ${subjectName} (${editionLabel})`);
    const schoolClusterName = String(params.schoolClusterName || 'กลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2 (8 โรงเรียน)');
    const academicYearBE = String(params.academicYearBE || '2569');
    const generatedDateThai = String(params.generatedDateThai || formatThaiDateFull(new Date()));
    const chapters = Array.isArray(params.chapters) ? params.chapters : [];

    const tocRows = [{ isHeader: true, cells: [
      { text: 'ลำดับ', sz: 30, bold: true, fill: 'ECFDF5', color: '1B4332', jc: 'center' },
      { text: 'สาระ / ชุดเอกสาร', sz: 30, bold: true, fill: 'ECFDF5', color: '1B4332', jc: 'center' },
      { text: 'รายละเอียดไฟล์ต้นฉบับ', sz: 30, bold: true, fill: 'ECFDF5', color: '1B4332', jc: 'center' },
      { text: 'ผู้จัดทำ / โรงเรียน', sz: 30, bold: true, fill: 'ECFDF5', color: '1B4332', jc: 'center' }
    ] }];
    chapters.forEach((ch, idx) => {
      tocRows.push({ cells: [
        { text: `${idx + 1}`, sz: 30, jc: 'center' },
        { text: String(ch.strandLabel || `สาระที่ ${ch.strandNo || (idx + 1)}`), sz: 30, jc: 'left' },
        { text: String(ch.subStandard || ch.fileName || '-'), sz: 28, jc: 'left' },
        { text: String(ch.authorSchool || '-'), sz: 28, jc: 'left' }
      ] });
    });

    return [
      buildSarabunPara_('', { sz: 32, before: 240, after: 240 }),
      buildFixedTable_([{ cells: [{ fill: 'F0FDF4', paras: [
        buildSarabunPara_('โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)', { sz: 34, bold: true, color: '1B4332', jc: 'center', before: 140, after: 24 }),
        buildSarabunPara_(`ชั้นประถมศึกษาปีที่ 6 — ${schoolClusterName}`, { sz: 32, bold: true, color: '334155', jc: 'center', before: 0, after: 80 }),
        buildSarabunPara_(docTitle, { sz: 44, bold: true, color: '0F172A', jc: 'center', before: 80, after: 80 }),
        buildSarabunPara_(`${docCategoryLabel} | ${editionLabel} | ปีการศึกษา ${academicYearBE}`, { sz: 32, bold: true, color: '166534', jc: 'center', before: 20, after: 140 })
      ] }] }], [8306], { borderColor: '1B4332', borderSz: 10 }),
      buildSarabunPara_('', { sz: 24, before: 180, after: 180 }),
      buildFixedTable_([
        { cells: [{ text: 'กลุ่มรายวิชา', sz: 30, bold: true, fill: 'F8FAFC' }, { text: subjectName, sz: 30, bold: true }] },
        { cells: [{ text: 'จำนวนตอนที่รวมเล่ม', sz: 30, bold: true, fill: 'F8FAFC' }, { text: `${chapters.length} ชุดเอกสาร (จัดเรียงลำดับตามสาระ/ชุดและมาตรฐานตัวชี้วัดอัตโนมัติ)`, sz: 30 }] },
        { cells: [{ text: 'วันที่จัดทำรูปเล่ม', sz: 30, bold: true, fill: 'F8FAFC' }, { text: generatedDateThai, sz: 30 }] }
      ], [2800, 5506], { borderColor: '94A3B8', borderSz: 6 }),
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
      buildSarabunPara_('สารบัญเอกสารรวมเล่มอัตโนมัติ', { sz: 38, bold: true, color: '1B4332', jc: 'center', before: 60, after: 80, keepNext: true }),
      buildFixedTable_(tocRows, [900, 2200, 2906, 2300], { borderColor: '1B4332', borderSz: 6 }),
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    ].join('');
  }

  function sanitizeXmlAttrVal_(val) {
    return String(val || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  function sanitizeAndRemapDocxBodyForMerge(documentXml = '', relsXml = '', partIndex = 1, startRId = 20) {
    let nextRId = Number(startRId || 20);
    const idMap = {};
    const mediaToCopy = [];
    const newRelationships = [];

    if (relsXml) {
      const relTagRegex = /<Relationship\b([^>]*?)\/?\s*>/gi;
      let m;
      while ((m = relTagRegex.exec(relsXml)) !== null) {
        const attrs = m[1];
        const idM = /\bId\s*=\s*"([^"]+)"/i.exec(attrs);
        const typeM = /\bType\s*=\s*"([^"]+)"/i.exec(attrs);
        const targetM = /\bTarget\s*=\s*"([^"]+)"/i.exec(attrs);
        const modeM = /\bTargetMode\s*=\s*"([^"]+)"/i.exec(attrs);
        if (!idM || !typeM || !targetM) continue;

        const oldId = idM[1];
        const relType = typeM[1];
        const target = targetM[1];
        const targetMode = modeM ? modeM[1] : '';

        if (relType.endsWith('/image') && targetMode.toLowerCase() !== 'external') {
          const cleanTarget = target.replace(/^\/+/, '').replace(/^(\.\.\/)+/, '');
          const baseName = sanitizeXmlAttrVal_(cleanTarget.split('/').pop() || 'img.png');
          const newRId = `rId${nextRId++}`;
          const newTarget = `media/part${partIndex}_${baseName}`;
          const oldZipPath = cleanTarget.startsWith('word/') ? cleanTarget : `word/${cleanTarget}`;
          const newZipPath = `word/${newTarget}`;
          idMap[oldId] = newRId;
          mediaToCopy.push({ oldTarget: cleanTarget, oldZipPath, newZipPath, newTarget, rId: newRId, type: relType });
          newRelationships.push({ rId: newRId, type: relType, target: newTarget, targetMode: '' });
        } else if (relType.endsWith('/hyperlink') && targetMode.toLowerCase() === 'external') {
          const newRId = `rId${nextRId++}`;
          idMap[oldId] = newRId;
          newRelationships.push({ rId: newRId, type: relType, target, targetMode: 'External' });
        }
      }
    }

    const bodyMatch = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(String(documentXml || ''));
    let bodyXml = bodyMatch ? bodyMatch[1] : String(documentXml || '');

    bodyXml = bodyXml
      .replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/gi, '')
      .replace(/<w:sectPr\b[^>]*\/>/gi, '')
      .replace(/<w:headerReference\b[^>]*\/>/gi, '')
      .replace(/<w:footerReference\b[^>]*\/>/gi, '')
      .replace(/<w:footnoteReference\b[^>]*\/>/gi, '')
      .replace(/<w:endnoteReference\b[^>]*\/>/gi, '')
      .replace(/<w:commentReference\b[^>]*\/>/gi, '')
      .replace(/<w:commentRangeStart\b[^>]*\/>/gi, '')
      .replace(/<w:commentRangeEnd\b[^>]*\/>/gi, '')
      .replace(/<w:altChunk\b[^>]*\/>/gi, '');

    bodyXml = bodyXml.replace(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>/gi, (full, attrs, inner) => {
      const ridM = /\br:id\s*=\s*"([^"]+)"/i.exec(attrs);
      if (ridM && idMap[ridM[1]]) return full;
      return inner;
    });

    bodyXml = bodyXml.replace(/\s(r:(?:embed|link|id))\s*=\s*"([^"]+)"/gi, (full, attrName, oldId) => {
      return idMap[oldId] ? ` ${attrName}="${idMap[oldId]}"` : '';
    });

    let shapeSeq = 0;
    bodyXml = bodyXml
      .replace(/(<w:bookmark(?:Start|End)\b[^>]*?\bw:id\s*=\s*")(\d+)(")/gi, (_, p1, idNum, p3) => `${p1}${Number(partIndex) * 10000 + Number(idNum)}${p3}`)
      .replace(/(<wp:docPr\b[^>]*?\bid\s*=\s*")(\d+)(")/gi, (_, p1, _idNum, p3) => {
        shapeSeq += 1;
        return `${p1}${Number(partIndex) * 10000 + shapeSeq}${p3}`;
      });

    return { bodyXml: bodyXml.trim(), mediaToCopy, newRelationships, nextRId };
  }

  /* ---- v11: Canonical Smart Key Extractor, Smart Exam Assembler & Official IOC Helpers (1:1 synced with core_logic.js) ---- */
  function extractWordTopLevelBlocks_(bodyXml = '') {
    const s = String(bodyXml || '');
    const blocks = [];
    const openRe = /<(w:p|w:tbl)(?=[\s>\/])/gi;
    let idx = 0;

    while (idx < s.length) {
      openRe.lastIndex = idx;
      const m = openRe.exec(s);
      if (!m) break;

      const startIdx = m.index;
      const tagName = m[1];
      const tagRe = new RegExp(`<(?:(\\/))?${tagName}(?=[\\s>\\/])[^>]*>`, 'gi');
      tagRe.lastIndex = startIdx;

      let depth = 0;
      let endIdx = -1;
      let tm;
      while ((tm = tagRe.exec(s)) !== null) {
        const fullTag = tm[0];
        const isClosing = !!tm[1];
        const isSelfClosing = !isClosing && /\/\s*>$/.test(fullTag);
        if (isSelfClosing) {
          if (depth === 0) {
            endIdx = tm.index + fullTag.length;
            break;
          }
          continue;
        }
        depth += isClosing ? -1 : 1;
        if (depth === 0) {
          endIdx = tm.index + fullTag.length;
          break;
        }
      }

      if (endIdx === -1) break;
      const blockXml = s.slice(startIdx, endIdx);
      blocks.push({
        tag: tagName.toLowerCase(),
        xml: blockXml,
        text: extractPlainTextFromDocxXml(blockXml)
      });
      idx = endIdx;
    }

    return blocks;
  }

  function isPlaceholderOrChromeBlock_(block, options = {}) {
    const txt = String(block && block.text || '').replace(/\s+/g, ' ').trim();
    const hasMedia = /<w:drawing\b|<w:pict\b|<v:imagedata\b|<a:blip\b/i.test(String(block && block.xml || ''));
    if (hasMedia) return false;
    if (!txt) return true;

    if (/แบบทดสอบคู่ขนาน Pre-Post O-NET|ฉบับนักเรียน\s*\(|ฉบับครูผู้สอน|\[ลับเฉพาะครู/i.test(txt)) return true;
    if (/^รายวิชา:.*ชุดข้อสอบ:|^ขอบเขตและช่วงข้อที่รับผิดชอบ:|^ชื่อ-สกุล:\s*\.+/i.test(txt)) return true;
    if (/^คำชี้แจงสำหรับคณะกรรมการและนักเรียน/.test(txt)) return true;
    if (/^1\.\s*แบบทดสอบชุดนี้ล็อกหมายเลขข้อ|^2\.\s*ให้นักเรียนอ่านคำสั่งแต่ละตอน/.test(txt)) return true;
    if (/คำแนะนำสำหรับผู้จัดทำ:\s*คลิกในช่องนี้|\[กรอบวาง.*In Line with Text|\[พื้นที่สำหรับภาพประกอบข้อสอบ/i.test(txt)) return true;
    if (/^ตารางสรุปช่วงเลขข้อสอบตามผัง สทศ\.|^ส่วนที่ 1:\s*ผังข้อสอบและตารางสรุปเฉลย|^ส่วนที่ 2:\s*ตัวข้อสอบ เฉลย/.test(txt)) return true;
    if (/^ตอนที่\s*[1-9๑-๙]+\s*(?:ข้อสอบ|แบบปรนัย|แบบระบาย|แบบเลือกตอบ|แบบอัตนัย|ข้อสอบภาษาอังกฤษ)/.test(txt)) return true;

    if (block.tag === 'w:tbl') {
      if (/ช่วงเลขข้อ\s*\(ล็อก\)|ผังข้อสอบ|รหัสตัวชี้วัด\s*\(O-NET\s*2569\)|เฉลยคำตอบ/.test(txt)) return true;
    }
    return false;
  }

  function extractAnswerKeysFromTeacherDocxXml(documentXml = '', subjectCode = '61') {
    const sub = String(subjectCode || '61');
    const bpItems = NIETS_2569_EXAM_ITEMS[sub] || NIETS_2569_EXAM_ITEMS['61'];
    const itemTypeMap = new Map();
    bpItems.forEach((it) => itemTypeMap.set(Number(it.itemNo), it.itemType));

    const keys = {};
    const warnings = [];
    const subOrderParts = {};

    function tryStoreKey(itemNo, rawCandidate) {
      const num = Number(itemNo);
      const iType = itemTypeMap.get(num);
      if (!iType) return;
      const cleaned = normalizeThaiDigits(rawCandidate)
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();
      if (!cleaned || /\.\.\.|ระบุคำตอบ/.test(cleaned)) return;

      const firstToken = cleaned.split(/\s+/)[0].replace(new RegExp('^ข้อ\\s*', 'i'), '');
      const cand = iType === 'COMPLEX_MC' || iType === 'ORDER' ? firstToken : (normalizeNumericAnswer(firstToken) !== null ? firstToken : firstToken);
      const chk = validateExamKeyByType(iType, cand, sub);
      if (chk.ok) {
        keys[num] = chk.normalized;
      }
    }

    /* 1. Parse summary blueprint table rows (e.g. "ข้อ 12 | ค 1.1 ป.6/12 | ... | 125") */
    const trRegex = /<w:tr\b[\s\S]*?<\/w:tr>/gi;
    let trM;
    while ((trM = trRegex.exec(String(documentXml || ''))) !== null) {
      const tcRegex = /<w:tc\b[\s\S]*?<\/w:tc>/gi;
      const cellsText = [];
      let tcM;
      while ((tcM = tcRegex.exec(trM[0])) !== null) {
        cellsText.push(extractPlainTextFromDocxXml(tcM[0]).replace(/\s+/g, ' ').trim());
      }
      if (cellsText.length >= 2) {
        const firstCell = normalizeThaiDigits(cellsText[0]);
        const itemMatch = /^\s*(?:ข้อ\s*)?(\d{1,2})\s*$/.exec(firstCell);
        if (itemMatch) {
          const rawAns = cellsText[cellsText.length - 1];
          tryStoreKey(Number(itemMatch[1]), rawAns);
        }
      }
    }

    /* 2. Parse inline teacher solution paragraphs (takes precedence or fills missing) */
    const plainLines = normalizeThaiDigits(extractPlainTextFromDocxXml(documentXml)).split(/\r?\n/);
    plainLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      /* Match "ข้อ 21.1 ... ตอบ/เฉลย ..." or "เฉลย ข้อ 21.1: ..." */
      const subOrderM = /(?:เฉลย\s*)?ข้อ\s*21\.([12])\s*[:=\-]?\s*(?:เฉลย|ตอบ(?:ข้อ)?|ลำดับคำตอบ)?\s*[:=\-]?\s*([0-9]+(?:[-,\s]+[0-9]+)+)/i.exec(trimmed);
      if (subOrderM) {
        const subIdx = subOrderM[1];
        const seq = normalizeOrderSequence(subOrderM[2]);
        if (seq && seq.indexOf('-') !== -1) {
          subOrderParts[subIdx] = seq;
        }
      }

      const ansM = /เฉลย\s*ข้อ\s*(\d{1,2})\s*[:=\-]?\s*(?:ตอบ(?:ข้อ)?|คะแนนเต็ม)?\s*[:=\-]?\s*([^\s|]+(?:\|(?:ใช่|ไม่ใช่|Y|N|[0-9-]+))*)/i.exec(trimmed);
      if (ansM) {
        tryStoreKey(Number(ansM[1]), ansM[2]);
      }
    });

    if (subOrderParts['1'] && subOrderParts['2']) {
      tryStoreKey(21, `${subOrderParts['1']}|${subOrderParts['2']}`);
    }

    const count = Object.keys(keys).length;
    if (count === 0) {
      warnings.push('ไม่พบเฉลยที่ตรงรูปแบบในไฟล์ฉบับครู (กรุณาตรวจสอบตารางสรุปเฉลย หรือบรรทัด "เฉลย ข้อ X: ตอบ ...")');
    }
    return { keys, count, warnings };
  }

  function buildNietsExamBookletFrontMatterXml(params = {}) {
    const subjectCode = String(params.subjectCode || '61');
    const subjectName = String(params.subjectName || SUBJECT_NAMES[subjectCode] || `รายวิชา (${subjectCode})`);
    const examRound = String(params.examRound || 'PRE').toUpperCase();
    const editionLabel = String(params.editionLabel || 'ฉบับนักเรียน');
    const isTeacher = /ครู/.test(editionLabel) || String(params.targetAudience || '').toUpperCase() === 'TEACHER';
    const examCodeNo = examRound === 'POST' ? '200' : '100';
    const roundTitle = examRound === 'POST' ? 'Post O-NET (หลังติว)' : 'Pre O-NET (ก่อนติว)';
    const totalItems = Number(params.totalItems || (NIETS_2569_EXAM_ITEMS[subjectCode] || []).length || 20);
    const schoolClusterName = String(params.schoolClusterName || 'กลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2 (8 โรงเรียน)');
    const generatedDateThai = String(params.generatedDateThai || formatThaiDateFull(new Date()));
    const chapters = Array.isArray(params.chapters) ? params.chapters : [];

    const tocRows = [
      {
        isHeader: true,
        cells: [
          { text: 'ลำดับ', sz: 28, bold: true, fill: isTeacher ? 'FEF2F2' : 'ECFDF5', color: isTeacher ? '991B1B' : '1B4332', jc: 'center' },
          { text: 'สาระการเรียนรู้', sz: 28, bold: true, fill: isTeacher ? 'FEF2F2' : 'ECFDF5', color: isTeacher ? '991B1B' : '1B4332', jc: 'center' },
          { text: 'ช่วงข้อ / รายละเอียดไฟล์ต้นฉบับ', sz: 28, bold: true, fill: isTeacher ? 'FEF2F2' : 'ECFDF5', color: isTeacher ? '991B1B' : '1B4332', jc: 'center' },
          { text: 'ผู้จัดทำ / โรงเรียน', sz: 28, bold: true, fill: isTeacher ? 'FEF2F2' : 'ECFDF5', color: isTeacher ? '991B1B' : '1B4332', jc: 'center' }
        ]
      }
    ];
    chapters.forEach((ch, idx) => {
      tocRows.push({
        cells: [
          { text: `${idx + 1}`, sz: 28, jc: 'center' },
          { text: String(ch.strandLabel || `สาระที่ ${ch.strandNo || (idx + 1)}`), sz: 28, jc: 'left' },
          { text: String(ch.subStandard || ch.fileName || '-'), sz: 26, jc: 'left' },
          { text: String(ch.authorSchool || '-'), sz: 26, jc: 'left' }
        ]
      });
    });

    const borderCol = isTeacher ? '991B1B' : '1E293B';
    const fillCol = isTeacher ? 'FEF2F2' : 'F8FAFC';

    return [
      buildFixedTable_(
        [{
          cells: [{
            fill: fillCol,
            paras: [
              buildSarabunPara_('การทดสอบระดับกลุ่มโรงเรียนศรีเสาวภาค คู่ขนาน O-NET ชั้นประถมศึกษาปีที่ 6 ปีการศึกษา 2569', { sz: 36, bold: true, color: '0F172A', jc: 'center', before: 120, after: 40 }),
              buildSarabunPara_(schoolClusterName, { sz: 32, bold: true, color: '334155', jc: 'center', before: 0, after: 60 }),
              buildSarabunPara_(`รหัสวิชา ${subjectCode}  รายวิชา ${subjectName}`, { sz: 46, bold: true, color: isTeacher ? '991B1B' : '1B4332', jc: 'center', before: 60, after: 40 }),
              buildSarabunPara_(`[  รหัสชุดข้อสอบ ${examCodeNo}  |  ${roundTitle}  |  ${editionLabel}  ]`, { sz: 36, bold: true, color: isTeacher ? '991B1B' : '0F172A', jc: 'center', before: 20, after: 120 })
            ]
          }]
        }],
        [8306],
        { borderColor: borderCol, borderSz: 12 }
      ),
      buildSarabunPara_('', { sz: 24, before: 120, after: 120 }),
      buildFixedTable_(
        [
          { cells: [{ text: 'ระดับชั้นที่ทดสอบ', sz: 30, bold: true, fill: 'F8FAFC' }, { text: 'ประถมศึกษาปีที่ 6 (ตามโครงสร้างข้อสอบ สทศ. 2569)', sz: 30 }] },
          { cells: [{ text: 'จำนวนข้อสอบทั้งฉบับ', sz: 30, bold: true, fill: 'F8FAFC' }, { text: `${totalItems} ข้อ | คะแนนเต็ม 100 คะแนน`, sz: 30, bold: true }] },
          { cells: [{ text: 'วันที่จัดทำรูปเล่ม', sz: 30, bold: true, fill: 'F8FAFC' }, { text: generatedDateThai, sz: 30 }] }
        ],
        [2800, 5506],
        { borderColor: '94A3B8', borderSz: 6 }
      ),
      buildSarabunPara_('', { sz: 20, before: 100, after: 100 }),
      buildFixedTable_(
        [{
          cells: [{
            fill: 'FEFCE8',
            paras: [
              buildSarabunPara_('คำเตือนสำคัญในการสอบ', { sz: 34, bold: true, color: '854D0E', jc: 'center', before: 80, after: 20 }),
              buildSarabunPara_('1. ห้ามเปิดข้อสอบจนกว่ากรรมการคุมสอบจะอนุญาต', { sz: 32, bold: true, color: '0F172A', jc: 'center', before: 20, after: 20 }),
              buildSarabunPara_('2. ห้ามนำข้อสอบออกจากห้องสอบโดยเด็ดขาด', { sz: 32, bold: true, color: '0F172A', jc: 'center', before: 10, after: 80 })
            ]
          }]
        }],
        [8306],
        { borderColor: 'CA8A04', borderSz: 8 }
      ),
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
      buildSarabunPara_('คำชี้แจงในการทำแบบทดสอบ และสารบัญชุดข้อสอบ', { sz: 38, bold: true, color: isTeacher ? '991B1B' : '1B4332', jc: 'center', before: 60, after: 80, keepNext: true }),
      buildSarabunPara_('1. แบบทดสอบฉบับนี้จัดเรียงข้อสอบตามลำดับผังการสร้างข้อสอบ (Test Blueprint) ของสถาบันทดสอบทางการศึกษาแห่งชาติ (สทศ.) ครบทุกสาระการเรียนรู้', { sz: 30, firstLine: 720, before: 20, after: 40 }),
      buildSarabunPara_('2. ให้นักเรียนตรวจนับจำนวนหน้าและหมายเลขข้อให้ครบถ้วนตั้งแต่ข้อที่ 1 ถึงข้อสุดท้าย ก่อนลงมือทำข้อสอบ และระบายคำตอบลงในกระดาษคำตอบหรือระบบสอบดิจิทัลอย่างรอบคอบ', { sz: 30, firstLine: 720, before: 10, after: 80 }),
      buildFixedTable_(tocRows, [900, 2200, 2906, 2300], { borderColor: borderCol, borderSz: 6 }),
      '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    ].join('');
  }

  function assembleSmartExamBodyXml(partEntries = [], params = {}) {
    const subjectCode = String(params.subjectCode || '61');
    const targetAudience = String(params.targetAudience || 'STUDENT').toUpperCase();
    const bpItems = NIETS_2569_EXAM_ITEMS[subjectCode] || [];
    const sectionByItem = new Map();
    bpItems.forEach((it) => sectionByItem.set(Number(it.itemNo), { no: it.sectionNo, title: it.sectionTitle }));

    const itemBuckets = new Map();
    let encounterSeq = 0;

    partEntries.forEach((part) => {
      const blocks = extractWordTopLevelBlocks_(part.bodyXml || '');
      let currentItemNo = null;
      let leadingBlocks = [];

      blocks.forEach((blk) => {
        if (isPlaceholderOrChromeBlock_(blk, { targetAudience })) return;
        const cleanTxt = normalizeThaiDigits(blk.text || '').trim();
        if (targetAudience === 'STUDENT' && /^เฉลย\s*ข้อ\s*\d+/i.test(cleanTxt)) return;

        const itemM = blk.tag === 'w:p'
          ? /^\s*ข้อ\s*(\d{1,2})(?:\.(\d{1,2}))?(?:\s*[.\):]|(?=\s+\[|\s+จง|\s+ข้อ|\s|$))/.exec(cleanTxt)
          : null;

        if (itemM) {
          const parentNo = Number(itemM[1]);
          const subNo = itemM[2] ? Number(itemM[2]) : null;
          if (subNo && currentItemNo === parentNo) {
            itemBuckets.get(parentNo).blocks.push(blk.xml);
            return;
          }
          currentItemNo = parentNo;
          if (!itemBuckets.has(parentNo)) {
            itemBuckets.set(parentNo, {
              itemNo: parentNo,
              seq: ++encounterSeq,
              blocks: []
            });
          }
          if (leadingBlocks.length > 0) {
            itemBuckets.get(parentNo).blocks.push(...leadingBlocks);
            leadingBlocks = [];
          }
          itemBuckets.get(parentNo).blocks.push(blk.xml);
        } else if (currentItemNo !== null) {
          itemBuckets.get(currentItemNo).blocks.push(blk.xml);
        } else {
          leadingBlocks.push(blk.xml);
        }
      });
    });

    if (itemBuckets.size === 0) {
      const fallbackXml = partEntries.map((p, idx) => {
        const divider = idx > 0 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : '';
        return divider + String(p.bodyXml || '');
      }).join('');
      return {
        usedFallback: true,
        itemCount: 0,
        sortedItemNos: [],
        bodyXml: fallbackXml
      };
    }

    const sortedItems = Array.from(itemBuckets.values()).sort((a, b) => (a.itemNo - b.itemNo) || (a.seq - b.seq));
    const outParts = [];
    let lastSecNo = -1;

    sortedItems.forEach((entry) => {
      const sec = sectionByItem.get(entry.itemNo);
      if (sec && sec.no !== lastSecNo) {
        lastSecNo = sec.no;
        outParts.push(buildSarabunPara_(sec.title, {
          sz: 34,
          bold: true,
          color: targetAudience === 'TEACHER' ? '991B1B' : '1B4332',
          jc: 'left',
          before: outParts.length ? 160 : 40,
          after: 60,
          keepNext: true
        }));
      }
      outParts.push(...entry.blocks);
    });

    return {
      usedFallback: false,
      itemCount: sortedItems.length,
      sortedItemNos: sortedItems.map((x) => x.itemNo),
      bodyXml: outParts.join('')
    };
  }

  function computeExamIocSummary(reviews = [], examKeyItems = [], approvedCommitteeTeachers = []) {
    const committeeList = Array.isArray(approvedCommitteeTeachers) ? approvedCommitteeTeachers : [];
    const totalCommitteeCount = committeeList.length;
    const evaluatorIds = new Set();

    const sortedKeys = (examKeyItems || []).slice().sort((a, b) => Number(a.itemNo) - Number(b.itemNo));
    const itemAccum = new Map();
    sortedKeys.forEach((k) => {
      itemAccum.set(Number(k.itemNo), {
        itemNo: Number(k.itemNo),
        strandNo: k.strandNo || '',
        indicatorCode: k.indicatorCode || '',
        itemType: k.itemType || 'MC4',
        sum: 0,
        evaluatorCount: 0,
        plusOneCount: 0,
        zeroCount: 0,
        minusOneCount: 0,
        comments: [],
        reviewerScores: []
      });
    });

    (reviews || []).forEach((rev) => {
      const tId = String(rev.teacherId || '').trim();
      const tName = String(rev.teacherName || tId || 'คณะกรรมการ');
      const schoolId = String(rev.schoolId || '');
      let scoresObj = rev.scores || {};
      if (typeof scoresObj === 'string') {
        try { scoresObj = JSON.parse(scoresObj || '{}'); } catch (_) { scoresObj = {}; }
      }
      let commentsObj = rev.comments || {};
      if (typeof commentsObj === 'string') {
        try { commentsObj = JSON.parse(commentsObj || '{}'); } catch (_) { commentsObj = {}; }
      }

      let hasAnyScore = false;
      Object.keys(scoresObj).forEach((rawKey) => {
        const itemNo = Number(rawKey);
        const val = Number(scoresObj[rawKey]);
        if (!itemAccum.has(itemNo)) return;
        if (val !== 1 && val !== 0 && val !== -1) return;

        hasAnyScore = true;
        const acc = itemAccum.get(itemNo);
        acc.sum += val;
        acc.evaluatorCount += 1;
        if (val === 1) acc.plusOneCount += 1;
        else if (val === 0) acc.zeroCount += 1;
        else acc.minusOneCount += 1;

        const commentTxt = String(commentsObj[rawKey] || commentsObj[itemNo] || '').trim();
        acc.reviewerScores.push({ teacherId: tId, teacherName: tName, schoolId, score: val, comment: commentTxt });
        if (commentTxt) {
          acc.comments.push({ teacherName: tName, schoolId, score: val, comment: commentTxt });
        }
      });

      if (hasAnyScore && tId) evaluatorIds.add(tId);
    });

    const items = Array.from(itemAccum.values()).map((acc) => {
      const ioc = acc.evaluatorCount > 0 ? Math.round((acc.sum / acc.evaluatorCount) * 100) / 100 : null;
      const passed = ioc !== null && ioc >= 0.5;
      const needsRevision = ioc !== null && (ioc < 0.5 || acc.minusOneCount > 0);
      return {
        ...acc,
        ioc,
        passed,
        needsRevision
      };
    });

    const scoredItems = items.filter((it) => it.ioc !== null);
    const passingItemsCount = items.filter((it) => it.passed).length;
    const needsRevisionItems = items.filter((it) => it.needsRevision).map((it) => it.itemNo);
    const overallAvgIoc = scoredItems.length > 0
      ? Math.round((scoredItems.reduce((s, it) => s + it.ioc, 0) / scoredItems.length) * 100) / 100
      : 0;
    const evaluatedCount = evaluatorIds.size;
    const quorumMet = totalCommitteeCount > 0 ? evaluatedCount >= totalCommitteeCount : evaluatedCount > 0;
    const allItemsPass = items.length > 0 && scoredItems.length === items.length && passingItemsCount === items.length;

    const evaluatedTeacherList = committeeList.filter((t) => evaluatorIds.has(String(t.teacherId || '').trim()));
    const pendingTeacherList = committeeList.filter((t) => !evaluatorIds.has(String(t.teacherId || '').trim()));

    return {
      totalItems: items.length,
      scoredItemsCount: scoredItems.length,
      passingItemsCount,
      needsRevisionItems,
      overallAvgIoc,
      evaluatedCount,
      totalCommitteeCount,
      quorumMet,
      allItemsPass,
      evaluatedTeacherIds: Array.from(evaluatorIds),
      evaluatedTeacherList,
      pendingTeacherList,
      items
    };
  }

  function buildOfficialIocReportDocumentXml(params = {}) {
    const subjectCode = String(params.subjectCode || '61');
    const subjectName = String(params.subjectName || SUBJECT_NAMES[subjectCode] || `รายวิชา (${subjectCode})`);
    const examRound = String(params.round || params.examRound || 'PRE').toUpperCase();
    const roundLabel = examRound === 'POST' ? 'Post O-NET (ชุดทดสอบหลังติว)' : 'Pre O-NET (ชุดทดสอบก่อนติว)';
    const reportDateText = String(params.reportDateText || formatThaiDateFull(new Date()));
    const reporterName = String(params.reporterName || 'ประธานคณะกรรมการตรวจประเมินข้อสอบ (IOC)');
    const schoolClusterName = String(params.schoolClusterName || 'กลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2 (8 โรงเรียน)');
    const iocSummary = params.iocSummary || { totalItems: 0, passingItemsCount: 0, overallAvgIoc: 0, evaluatedCount: 0, totalCommitteeCount: 0, items: [] };
    const reviews = Array.isArray(params.reviews) ? params.reviews : [];
    const schoolNameMap = params.schoolNameMap || {};

    const iocRows = [
      {
        isHeader: true,
        cells: [
          { text: 'ข้อที่', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'ตัวชี้วัด', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'ผู้ตรวจ', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: '+1', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: '0', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: '-1', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'ค่า IOC', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'ผลประเมิน / ข้อเสนอแนะ', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' }
        ]
      }
    ];

    (iocSummary.items || []).forEach((it) => {
      const hasIoc = hasFiniteNumber(it.ioc);
      const iocText = fmtFixed(it.ioc, 2, '-');
      const statusTxt = !hasIoc
        ? 'รอประเมิน'
        : (it.passed ? (it.minusOneCount > 0 ? 'ผ่าน (มีข้อทักท้วง -1)' : 'ผ่านเกณฑ์ (>= 0.50)') : 'ควรปรับปรุง (< 0.50)');
      const noteText = (it.comments || []).length
        ? `${statusTxt}: ${it.comments.map((c) => `${c.teacherName}: ${c.comment}`).join(' ; ')}`
        : statusTxt;
      iocRows.push({
        cells: [
          { text: String(it.itemNo), sz: 28, bold: true, jc: 'center' },
          { text: String(it.indicatorCode || '-'), sz: 26, jc: 'left' },
          { text: `${it.evaluatorCount}`, sz: 28, jc: 'center' },
          { text: `${it.plusOneCount}`, sz: 28, jc: 'center' },
          { text: `${it.zeroCount}`, sz: 28, jc: 'center' },
          { text: `${it.minusOneCount}`, sz: 28, jc: 'center', color: it.minusOneCount > 0 ? '991B1B' : '' },
          { text: iocText, sz: 28, bold: true, jc: 'center', color: hasIoc && !it.passed ? '991B1B' : '166534' },
          { text: noteText, sz: 24, jc: 'left' }
        ]
      });
    });

    const evaluatorRows = [
      {
        isHeader: true,
        cells: [
          { text: 'ลำดับ', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'ชื่อ - นามสกุล คณะกรรมการ', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'สถานศึกษา', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' },
          { text: 'ความเห็นเพิ่มเติม', sz: 28, bold: true, fill: 'EFECE6', jc: 'center' }
        ]
      }
    ];
    if (reviews.length) {
      reviews.forEach((rv, idx) => {
        evaluatorRows.push({
          cells: [
            { text: `${idx + 1}`, sz: 28, jc: 'center' },
            { text: String(rv.teacherName || '-'), sz: 28, jc: 'left' },
            { text: String(schoolNameMap[rv.schoolId] || rv.schoolId || '-'), sz: 26, jc: 'left' },
            { text: String(rv.summaryNote || 'ตรวจประเมินครบถ้วนตามผัง สทศ.'), sz: 26, jc: 'left' }
          ]
        });
      });
    } else {
      evaluatorRows.push({
        cells: [
          { text: '-', sz: 28, jc: 'center' },
          { text: 'ยังไม่มีข้อมูลการบันทึกผลประเมิน IOC', sz: 28, jc: 'left' },
          { text: '-', sz: 28, jc: 'center' },
          { text: '-', sz: 28, jc: 'center' }
        ]
      });
    }

    const avgIocDocxTxt = Number(iocSummary.evaluatedCount || 0) > 0
      ? fmtFixed(iocSummary.overallAvgIoc, 2, '0.00')
      : '- (รอตรวจ)';

    const bodyBlocks = [
      buildSarabunPara_('แบบรายงานผลการตรวจประเมินความเที่ยงตรงเชิงเนื้อหาของข้อสอบ (IOC)', { sz: 38, bold: true, jc: 'center', before: 40, after: 20 }),
      buildSarabunPara_('โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)', { sz: 32, bold: true, jc: 'center', before: 0, after: 16 }),
      buildSarabunPara_(`ชั้นประถมศึกษาปีที่ 6 ปีการศึกษา 2569 — ${schoolClusterName}`, { sz: 30, bold: true, jc: 'center', before: 0, after: 80 }),
      buildSarabunPara_(`        ตามที่คณะกรรมการผู้รับผิดชอบจัดทำข้อสอบและตรวจสอบคุณภาพข้อสอบคู่ขนาน O-NET ประจำกลุ่มโรงเรียนศรีเสาวภาค ได้ร่วมกันตรวจพิจารณาความสอดคล้องของข้อคำถามกับตัวชี้วัดและผังการสร้างข้อสอบ สทศ. (Index of Item-Objective Congruence : IOC) ในรายวิชา${subjectName} (รหัสวิชา ${subjectCode}) ชุด${roundLabel} โดยกำหนดเกณฑ์พิจารณาค่าดัชนีความสอดคล้องผ่านเกณฑ์ที่ IOC ตั้งแต่ 0.50 ขึ้นไป สรุปผลการประเมินรายข้อได้ดังต่อไปนี้`, { sz: 32, jc: 'thaiDistribute', before: 40, after: 80 }),
      buildFixedTable_(
        [
          { cells: [{ text: 'รายวิชา / ชุดข้อสอบ', sz: 30, bold: true, fill: 'F8FAFC' }, { text: `${subjectName} (${subjectCode}) — ${roundLabel}`, sz: 30, bold: true }] },
          { cells: [{ text: 'องค์ประชุมคณะกรรมการ', sz: 30, bold: true, fill: 'F8FAFC' }, { text: `ประเมินแล้ว ${iocSummary.evaluatedCount} จาก ${iocSummary.totalCommitteeCount || iocSummary.evaluatedCount} ท่าน`, sz: 30 }] },
          { cells: [{ text: 'ผลสรุปภาพรวม IOC', sz: 30, bold: true, fill: 'F8FAFC' }, { text: `ผ่านเกณฑ์ (IOC >= 0.50) จำนวน ${iocSummary.passingItemsCount}/${iocSummary.totalItems} ข้อ | ค่าเฉลี่ย IOC = ${avgIocDocxTxt}`, sz: 30, bold: true }] },
          { cells: [{ text: 'วันที่จัดทำรายงาน', sz: 30, bold: true, fill: 'F8FAFC' }, { text: reportDateText, sz: 30 }] }
        ],
        [2500, 5806],
        { borderColor: '333333', borderSz: 6 }
      ),
      buildSarabunPara_('1. ตารางผลการประเมินค่าดัชนีความสอดคล้อง (IOC) รายข้อ', { sz: 34, bold: true, jc: 'left', before: 140, after: 60, keepNext: true }),
      buildFixedTable_(iocRows, [700, 1450, 900, 850, 850, 850, 1000, 1706], { borderColor: '333333', borderSz: 4 }),
      buildSarabunPara_('2. รายชื่อคณะกรรมการผู้ตรวจประเมินคุณภาพข้อสอบ (IOC)', { sz: 34, bold: true, jc: 'left', before: 140, after: 60, keepNext: true }),
      buildFixedTable_(evaluatorRows, [800, 3000, 2506, 2000], { borderColor: '333333', borderSz: 4 }),
      buildSarabunPara_('ลงชื่อ .......................................................... ผู้รายงานผลการตรวจประเมิน', { sz: 32, jc: 'right', before: 280, after: 20 }),
      buildSarabunPara_(`(${reporterName})`, { sz: 32, jc: 'right', before: 0, after: 20 }),
      buildSarabunPara_(`วันที่จัดทำรายงาน: ${reportDateText}`, { sz: 32, jc: 'right', before: 0, after: 40 })
    ].join('');

    return [
      '<' + '?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ',
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      '<w:body>',
      bodyBlocks,
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="2160" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>',
      '</w:body></w:document>'
    ].join('');
  }

  /* ---- v14: Auto-Extract Practice Items from Tutoring .docx & Split-Screen IOC Preview Parser (1:1 synced with core_logic.js) ---- */
  function normalizeChoiceTokenTo14_(rawToken) {
    const t = normalizeThaiDigits(String(rawToken || ''))
      .replace(/^(?:คำตอบที่ถูก|คำตอบ|ตอบข้อ|ตอบ|เฉลย|ข้อที่|ข้อ)\s*[:=\-]?\s*/i, '')
      .replace(/[\.\)\]\s]+$/g, '')
      .replace(/^[\(\[\s]+/g, '')
      .trim();
    if (['1', '2', '3', '4'].includes(t)) return t;
    const map = { 'ก': '1', 'ข': '2', 'ค': '3', 'ง': '4', 'a': '1', 'b': '2', 'c': '3', 'd': '4' };
    const first = t.charAt(0).toLowerCase();
    if (map[first] && t.length <= 2) return map[first];
    const m = /^([1-4])\b/.exec(t);
    return m ? m[1] : '';
  }

  function isUneditedPlaceholderText_(txt) {
    const s = String(txt || '').replace(/\s+/g, ' ').trim();
    if (!s) return true;
    if (/\.{5,}|…{3,}/.test(s)) return true;
    if (/พิมพ์คำถามแบบฝึกทักษะ|พิมพ์โจทย์แบบฝึกและตัวเลือก|\[พิมพ์โจทย์|อธิบายเหตุผลของคำตอบที่ถูกต้อง และจุดที่นักเรียนมักเข้าใจผิด|\[อธิบายเหตุผล|\[อธิบายวิธีคิด|ข้อ\s*\.\.\./i.test(s)) {
      return true;
    }
    return false;
  }

  function splitChoicesFromParagraphLine_(rawLine) {
    const line = normalizeThaiDigits(String(rawLine || '')).replace(/\u00A0/g, ' ').trim();
    if (!line) return [];
    const markerRe = /(?:^|\s+)(?:([1-4])[\.\)]\s+|\(([1-4])\)\s*|([กขคง])[\.\)]\s+|([A-Da-d])[\.\)]\s+)/g;
    const rawMatches = [];
    let m;
    while ((m = markerRe.exec(line)) !== null) {
      const rawKey = m[1] || m[2] || m[3] || m[4];
      const numKey = normalizeChoiceTokenTo14_(rawKey);
      if (!numKey) continue;
      const prefixWs = /^\s+/.exec(m[0]);
      const markerStart = m.index + (prefixWs ? prefixWs[0].length : 0);
      const valueStart = m.index + m[0].length;
      rawMatches.push({ numKey, markerStart, valueStart });
    }
    if (!rawMatches.length || rawMatches[0].markerStart !== 0) return [];

    const matches = [rawMatches[0]];
    for (let i = 1; i < rawMatches.length; i++) {
      const prevNum = Number(matches[matches.length - 1].numKey);
      const curNum = Number(rawMatches[i].numKey);
      if (curNum === prevNum + 1) {
        matches.push(rawMatches[i]);
      }
    }

    const out = [];
    for (let i = 0; i < matches.length; i++) {
      const end = i + 1 < matches.length ? matches[i + 1].markerStart : line.length;
      let val = line.slice(matches[i].valueStart, end).trim();
      val = val.replace(/\s*\(หมายเหตุ\s*สทศ\..*?\)\s*$/i, '').trim();
      out.push({ key: matches[i].numKey, text: val });
    }
    return out;
  }

  function extractTutoringItemsFromSingleXml_(documentXml = '') {
    const out = {
      summaryLines: [],
      itemsMap: new Map(),
      keyMetaMap: new Map()
    };
    if (!documentXml) return out;

    const bodyMatch = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(String(documentXml));
    const bodyXml = bodyMatch ? bodyMatch[1] : String(documentXml);
    const blocks = extractWordTopLevelBlocks_(bodyXml);

    let sectionMode = 'HEADER';
    let currentItemNo = null;

    function ensureItem(no) {
      const n = Number(no);
      if (!out.itemsMap.has(n)) {
        out.itemsMap.set(n, { itemNo: n, indicatorCode: '', stemLines: [], choices: {} });
      }
      return out.itemsMap.get(n);
    }

    function ensureKeyMeta(no) {
      const n = Number(no);
      if (!out.keyMetaMap.has(n)) {
        out.keyMetaMap.set(n, { itemNo: n, indicatorCode: '', correctChoice: '', explanation: '' });
      }
      return out.keyMetaMap.get(n);
    }

    blocks.forEach((blk) => {
      const rawText = String(blk.text || '');
      const normText = normalizeThaiDigits(rawText).replace(/\r/g, '');
      const flat = normText.replace(/\s+/g, ' ').trim();
      if (!flat) return;

      if (/^ส่วนที่\s*1\s*[:\-]?\s*สรุปความรู้/i.test(flat)) {
        sectionMode = 'SUMMARY';
        currentItemNo = null;
        return;
      }
      if (/^ส่วนที่\s*2\s*[:\-]?\s*(?:แบบฝึก|ข้อสอบ|ตัวข้อสอบ)/i.test(flat)) {
        sectionMode = 'QUESTIONS';
        currentItemNo = null;
        return;
      }
      if (/^ส่วนที่\s*3\s*[:\-]?\s*เฉลย/i.test(flat)) {
        sectionMode = 'KEYS';
        currentItemNo = null;
        return;
      }

      if (blk.tag === 'w:tbl') {
        const trRegex = /<w:tr\b[\s\S]*?<\/w:tr>/gi;
        let trM;
        let parsedAnyKeyRow = false;
        while ((trM = trRegex.exec(blk.xml)) !== null) {
          const tcRegex = /<w:tc\b[\s\S]*?<\/w:tc>/gi;
          const cells = [];
          let tcM;
          while ((tcM = tcRegex.exec(trM[0])) !== null) {
            cells.push(extractPlainTextFromDocxXml(tcM[0]).replace(/\s+/g, ' ').trim());
          }
          if (cells.length >= 3) {
            const c0 = normalizeThaiDigits(cells[0]);
            const itemM = /^\s*(?:ข้อ(?:ที่)?\s*)?(\d{1,3})\s*$/.exec(c0);
            if (itemM) {
              const no = Number(itemM[1]);
              const km = ensureKeyMeta(no);
              if (cells.length >= 4) {
                const indCand = cells[1].trim();
                const ansCand = normalizeChoiceTokenTo14_(cells[2]);
                const expCand = cells[3].trim();
                if (indCand && !/รหัสตัวชี้วัด/.test(indCand)) km.indicatorCode = km.indicatorCode || indCand;
                if (ansCand) km.correctChoice = ansCand;
                if (expCand && !isUneditedPlaceholderText_(expCand)) km.explanation = expCand;
                parsedAnyKeyRow = true;
              } else if (cells.length === 3) {
                const ansCand = normalizeChoiceTokenTo14_(cells[1]);
                const expCand = cells[2].trim();
                if (ansCand) km.correctChoice = ansCand;
                if (expCand && !isUneditedPlaceholderText_(expCand)) km.explanation = expCand;
                parsedAnyKeyRow = true;
              }
            }
          }
        }
        if (parsedAnyKeyRow || sectionMode === 'HEADER') return;
        if (/พื้นที่ให้นักเรียนฝึกแสดงวิธีทำ|กรอบวางแผนภาพ|คำแนะนำสำหรับผู้จัดทำ/.test(flat)) return;
      }

      if (sectionMode === 'SUMMARY') {
        if (/^คำชี้แจงสำหรับคณะกรรมการ|^แนวทางการสอนของครู:\s*ระบุเทคนิค|^\[กรอบวางแผนภาพ|^คำแนะนำสำหรับผู้จัดทำ/i.test(flat)) {
          return;
        }
        normText.split('\n').map(l => l.trim()).filter(Boolean).forEach(l => {
          if (!isUneditedPlaceholderText_(l)) out.summaryLines.push(l);
        });
        return;
      }

      const lines = normText.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line) => {
        const inlineAnsM = /^(?:เฉลย|คำตอบ)\s*(?:ข้อ(?:ที่)?\s*(\d{1,3}))?\s*[:=\-]?\s*(?:ตอบ(?:ข้อ)?\s*)?([1-4กขคงA-Da-d])\b(?:\s*(?:\||[:\-]|วิธีคิด(?:และเหตุผล)?|เหตุผล|คำอธิบาย|เพราะ)\s*[:=\-]?\s*(.*))?$/i.exec(line);
        if (inlineAnsM) {
          const targetNo = inlineAnsM[1] ? Number(inlineAnsM[1]) : currentItemNo;
          if (targetNo) {
            const km = ensureKeyMeta(targetNo);
            const ch = normalizeChoiceTokenTo14_(inlineAnsM[2]);
            if (ch) km.correctChoice = ch;
            const expRaw = String(inlineAnsM[3] || '').replace(/^(?:วิธีคิด(?:และเหตุผล)?|เหตุผล|คำอธิบาย)\s*[:=\-]?\s*/i, '').trim();
            if (expRaw && !isUneditedPlaceholderText_(expRaw)) {
              km.explanation = expRaw;
            }
          }
          return;
        }

        if (sectionMode === 'KEYS') return;

        const qStartM = /^ข้อ(?:ที่)?\s*(\d{1,3})\s*[\.\):]?\s*(.*)$/.exec(line);
        if (qStartM) {
          sectionMode = 'QUESTIONS';
          const qNo = Number(qStartM[1]);
          currentItemNo = qNo;
          const it = ensureItem(qNo);
          let rest = qStartM[2].trim();
          const indBracketM = /^\[([^\]]+)\]\s*(.*)$/.exec(rest);
          if (indBracketM) {
            const bracketContent = indBracketM[1].trim();
            if (/[ทควต]\s*\d+\.\d+/i.test(bracketContent)) {
              it.indicatorCode = bracketContent;
              rest = indBracketM[2].trim();
            }
          }
          if (rest && !isUneditedPlaceholderText_(rest)) {
            it.stemLines.push(rest);
          }
          return;
        }

        if (sectionMode === 'QUESTIONS' && currentItemNo !== null) {
          const splitCh = splitChoicesFromParagraphLine_(line);
          if (splitCh.length > 0) {
            const it = ensureItem(currentItemNo);
            splitCh.forEach((c) => {
              if (c.text && !isUneditedPlaceholderText_(c.text)) {
                it.choices[c.key] = c.text;
              }
            });
          } else if (!/^พื้นที่ให้นักเรียนฝึกแสดงวิธีทำ|^คำชี้แจง|^\[กรอบวาง/i.test(line) && !isUneditedPlaceholderText_(line)) {
            const it = ensureItem(currentItemNo);
            if (Object.keys(it.choices).length === 0) {
              it.stemLines.push(line);
            }
          }
        }
      });
    });

    return out;
  }

  function extractPracticeItemsFromTutoringDocxXml(params = {}) {
    const subjectCode = String(params.subjectCode || '61').trim();
    const strandNo = String(params.strandNo || '1').trim();
    const subStandard = String(params.subStandard || '').trim();
    const expectedIndicators = Array.isArray(params.expectedIndicators) ? params.expectedIndicators.filter(Boolean) : [];
    const defaultIndicator = expectedIndicators[0] || (subStandard && subStandard !== 'ALL' ? subStandard : `สาระที่ ${strandNo}`);

    const stuParsed = extractTutoringItemsFromSingleXml_(params.studentDocXml || '');
    const tchParsed = extractTutoringItemsFromSingleXml_(params.teacherDocXml || '');

    const summarySourceLines = stuParsed.summaryLines.length > 0 ? stuParsed.summaryLines : tchParsed.summaryLines;
    const subjLabel = SUBJECT_NAMES[subjectCode] || subjectCode;

    let summaryTitle = `${subjLabel} สาระที่ ${strandNo}${subStandard && subStandard !== 'ALL' ? ' (' + subStandard + ')' : ''} — สรุปตรงจุดออกสอบ`;
    let summaryText = '';
    if (summarySourceLines.length > 0) {
      const firstLine = summarySourceLines[0];
      if (firstLine.length <= 95 && summarySourceLines.length > 1) {
        summaryTitle = firstLine;
        summaryText = summarySourceLines.slice(1).join(' ').slice(0, 650).trim();
      } else {
        summaryText = summarySourceLines.join(' ').slice(0, 650).trim();
      }
    }
    if (!summaryText) {
      summaryText = `ทบทวนหลักการสำคัญ ${subjLabel} สาระที่ ${strandNo} (${defaultIndicator}) ก่อนฝึกทำโจทย์`;
    }

    const allNosSet = new Set([
      ...Array.from(stuParsed.itemsMap.keys()),
      ...Array.from(tchParsed.itemsMap.keys())
    ]);
    const sortedNos = Array.from(allNosSet).sort((a, b) => a - b);

    const items = [];
    const warnings = [];
    let skippedNoKeyCount = 0;
    let skippedIncompleteCount = 0;

    sortedNos.forEach((no) => {
      const sIt = stuParsed.itemsMap.get(no);
      const tIt = tchParsed.itemsMap.get(no);
      const kMeta = tchParsed.keyMetaMap.get(no) || stuParsed.keyMetaMap.get(no) || {};

      const stemText = (sIt && sIt.stemLines.length ? sIt.stemLines.join(' ') : (tIt && tIt.stemLines.length ? tIt.stemLines.join(' ') : '')).trim();
      const mergedChoices = Object.assign({}, (tIt && tIt.choices) || {}, (sIt && sIt.choices) || {});
      const c1 = String(mergedChoices['1'] || '').trim();
      const c2 = String(mergedChoices['2'] || '').trim();
      const c3 = String(mergedChoices['3'] || '').trim();
      const c4 = String(mergedChoices['4'] || '').trim();

      if (!stemText || !c1 || !c2 || !c3 || !c4) {
        skippedIncompleteCount++;
        return;
      }

      const correctChoice = String(kMeta.correctChoice || '').trim();
      if (!['1', '2', '3', '4'].includes(correctChoice)) {
        skippedNoKeyCount++;
        return;
      }

      const indicatorCode = String(
        kMeta.indicatorCode ||
        (tIt && tIt.indicatorCode) ||
        (sIt && sIt.indicatorCode) ||
        defaultIndicator
      ).trim();

      const explanation = String(kMeta.explanation || `คำตอบที่ถูกต้องคือตัวเลือกที่ ${correctChoice} (ตามหลักการตัวชี้วัด ${indicatorCode})`).trim();

      items.push({
        itemNo: no,
        subjectCode,
        strandNo,
        indicatorCode,
        summaryTitle,
        summaryText,
        questionText: stemText,
        choice1: c1,
        choice2: c2,
        choice3: c3,
        choice4: c4,
        correctChoice,
        explanation
      });
    });

    if (skippedNoKeyCount > 0) {
      warnings.push(`พบโจทย์ ${skippedNoKeyCount} ข้อที่ยังไม่มีเฉลย 1–4 ในไฟล์ฉบับครู`);
    }
    return {
      items,
      summaryTitle,
      summaryText,
      skippedNoKeyCount,
      skippedIncompleteCount,
      warnings
    };
  }

  function buildRelsImageLookup_(relsXml = '', mediaMap = {}) {
    const lookup = {};
    if (!relsXml || !mediaMap) return lookup;
    const relTagRegex = /<Relationship\b([^>]*?)\/?\s*>/gi;
    let m;
    while ((m = relTagRegex.exec(relsXml)) !== null) {
      const attrs = m[1];
      const idM = /\bId\s*=\s*"([^"]+)"/i.exec(attrs);
      const typeM = /\bType\s*=\s*"([^"]+)"/i.exec(attrs);
      const targetM = /\bTarget\s*=\s*"([^"]+)"/i.exec(attrs);
      if (!idM || !typeM || !targetM) continue;
      if (!typeM[1].toLowerCase().endsWith('/image')) continue;
      const rId = idM[1];
      const cleanTarget = targetM[1].replace(/^\/+/, '').replace(/^(\.\.\/)+/, '').replace(/^word\//i, '');
      const dataUrl = mediaMap[cleanTarget] || mediaMap['word/' + cleanTarget] || '';
      if (dataUrl) lookup[rId] = dataUrl;
    }
    return lookup;
  }

  function extractImagesFromBlockXml_(blockXml = '', rIdLookup = {}) {
    const urls = [];
    const seen = new Set();
    const re = /\br:(?:embed|id|link)\s*=\s*"([^"]+)"/gi;
    let m;
    while ((m = re.exec(String(blockXml || ''))) !== null) {
      const url = rIdLookup[m[1]];
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
    return urls;
  }

  function parseTableRowsFromBlockXml_(tblXml = '', rIdLookup = {}) {
    const rows = [];
    const trRegex = /<w:tr\b[\s\S]*?<\/w:tr>/gi;
    let trM;
    while ((trM = trRegex.exec(String(tblXml || ''))) !== null) {
      const cells = [];
      const tcRegex = /<w:tc\b[\s\S]*?<\/w:tc>/gi;
      let tcM;
      while ((tcM = tcRegex.exec(trM[0])) !== null) {
        const cellXml = tcM[0];
        const text = extractPlainTextFromDocxXml(cellXml).replace(/\r/g, '').trim();
        const images = extractImagesFromBlockXml_(cellXml, rIdLookup);
        cells.push({ text, images });
      }
      if (cells.length > 0) rows.push(cells);
    }
    return rows;
  }

  function parseExamDocxItemsForIocPreview(partEntries = [], subjectCode = '61') {
    const sub = String(subjectCode || '61');
    const itemsByNo = {};

    function ensurePreviewItem(no) {
      const n = Number(no);
      if (!itemsByNo[n]) {
        itemsByNo[n] = {
          itemNo: n,
          indicatorFromDoc: '',
          sharedPassageBlocks: [],
          stemLines: [],
          choices: {},
          tables: [],
          images: [],
          teacherSolutionLines: [],
          extractedKey: '',
          sourceFiles: [],
          hasRealContent: false,
          isTemplatePlaceholder: false
        };
      }
      return itemsByNo[n];
    }

    const orderedParts = (Array.isArray(partEntries) ? partEntries.slice() : []).sort((a, b) => {
      const ra = String(a && a.targetAudience || '').toUpperCase() === 'STUDENT' ? 0 : 1;
      const rb = String(b && b.targetAudience || '').toUpperCase() === 'STUDENT' ? 0 : 1;
      return ra - rb;
    });

    orderedParts.forEach((part) => {
      if (!part || !part.documentXml) return;
      const aud = String(part.targetAudience || 'STUDENT').toUpperCase();
      const rIdLookup = buildRelsImageLookup_(part.relsXml || '', part.mediaMap || {});
      const bodyMatch = /<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i.exec(String(part.documentXml));
      const bodyXml = bodyMatch ? bodyMatch[1] : String(part.documentXml);
      const blocks = extractWordTopLevelBlocks_(bodyXml);

      if (aud === 'TEACHER') {
        const keyRes = extractAnswerKeysFromTeacherDocxXml(part.documentXml, sub);
        const extractedKeysMap = (keyRes && keyRes.keys) || {};
        Object.keys(extractedKeysMap).forEach((kNo) => {
          const entry = ensurePreviewItem(Number(kNo));
          entry.extractedKey = extractedKeysMap[kNo];
        });
      }

      const populatedFromStudent = new Set();
      if (aud === 'TEACHER') {
        Object.keys(itemsByNo).forEach((kNo) => {
          const ex = itemsByNo[kNo];
          if (ex && (ex.stemLines.length > 0 || ex.tables.length > 0 || ex.images.length > 0)) {
            populatedFromStudent.add(Number(kNo));
          }
        });
      }

      let currentItemNo = null;
      let pendingSharedStimulus = [];

      blocks.forEach((blk) => {
        if (isPlaceholderOrChromeBlock_(blk, { targetAudience: aud })) return;
        const rawTxt = String(blk.text || '').replace(/\r/g, '');
        const cleanTxt = normalizeThaiDigits(rawTxt).trim();
        const blkImages = extractImagesFromBlockXml_(blk.xml, rIdLookup);

        if (blk.tag === 'w:p' && !/^\s*ข้อ\s*\d/.test(cleanTxt)) {
          const rangeM = /(?:ตอบคำถาม|พิจารณา.*?ข้อ|items?)\s*(?:ข้อ\s*)?(\d{1,2})\s*(?:[-–—]|ถึง|and|to)\s*(\d{1,2})/i.exec(cleanTxt);
          if (rangeM) {
            currentItemNo = null;
            pendingSharedStimulus.push({
              type: 'p',
              text: rawTxt.trim(),
              images: blkImages,
              rangeStart: Number(rangeM[1]),
              rangeEnd: Number(rangeM[2])
            });
            return;
          }
        }

        const itemM = blk.tag === 'w:p'
          ? /^\s*ข้อ\s*(\d{1,2})(?:\.(\d{1,2}))?(?:\s*[\.\):]|(?=\s+\[|\s+จง|\s+ข้อ|\s|$))(.*)$/s.exec(cleanTxt)
          : null;

        if (itemM) {
          const parentNo = Number(itemM[1]);
          const subNo = itemM[2] ? Number(itemM[2]) : null;
          const entry = ensurePreviewItem(parentNo);
          if (part.fileName && !entry.sourceFiles.includes(part.fileName)) {
            entry.sourceFiles.push(part.fileName);
          }

          if (!subNo) {
            currentItemNo = parentNo;
            if (pendingSharedStimulus.length > 0) {
              pendingSharedStimulus.forEach((stim) => {
                const rStart = stim.rangeStart || parentNo;
                const rEnd = stim.rangeEnd || parentNo;
                for (let targetNo = rStart; targetNo <= rEnd; targetNo++) {
                  if (aud === 'TEACHER' && populatedFromStudent.has(targetNo)) continue;
                  const tEntry = ensurePreviewItem(targetNo);
                  if (stim.text && !tEntry.sharedPassageBlocks.includes(stim.text)) {
                    tEntry.sharedPassageBlocks.push(stim.text);
                  }
                  (stim.images || []).forEach((u) => {
                    if (!tEntry.images.includes(u)) tEntry.images.push(u);
                  });
                }
              });
              pendingSharedStimulus = [];
            }
          }

          let rest = String(itemM[3] || '').trim();
          const indBracketM = /^\[([^\]]+)\]\s*(.*)$/s.exec(rest);
          if (indBracketM && /[ทควต]\s*\d+\.\d+|O-NET/i.test(indBracketM[1])) {
            if (!entry.indicatorFromDoc) entry.indicatorFromDoc = indBracketM[1].trim();
            rest = indBracketM[2].trim();
          }

          if (aud === 'TEACHER' && populatedFromStudent.has(parentNo)) {
            return;
          }

          if (subNo) {
            const subLabel = `ข้อ ${parentNo}.${subNo} ${rest}`.trim();
            entry.stemLines.push(subLabel);
          } else if (rest) {
            if (isUneditedPlaceholderText_(rest)) {
              entry.isTemplatePlaceholder = true;
            }
            entry.stemLines.push(rest);
          }
          blkImages.forEach((u) => {
            if (!entry.images.includes(u)) entry.images.push(u);
          });
          return;
        }

        if (currentItemNo === null) {
          if (cleanTxt || blkImages.length > 0) {
            const lastStim = pendingSharedStimulus[pendingSharedStimulus.length - 1];
            pendingSharedStimulus.push({
              type: blk.tag,
              text: rawTxt.trim(),
              images: blkImages,
              rangeStart: lastStim ? lastStim.rangeStart : null,
              rangeEnd: lastStim ? lastStim.rangeEnd : null
            });
          }
          return;
        }

        const entry = ensurePreviewItem(currentItemNo);

        if (/^(?:เฉลย|แนวคำตอบ)\s*(?:ข้อ\s*\d+)?/i.test(cleanTxt)) {
          const solTxt = rawTxt.trim();
          if (solTxt && !entry.teacherSolutionLines.includes(solTxt)) {
            entry.teacherSolutionLines.push(solTxt);
          }
          return;
        }

        if (aud === 'TEACHER' && populatedFromStudent.has(currentItemNo)) {
          return;
        }

        if (blk.tag === 'w:tbl') {
          const rows = parseTableRowsFromBlockXml_(blk.xml, rIdLookup);
          const flatTbl = cleanTxt.replace(/\s+/g, ' ');
          if (/^\[กรอบวาง|พื้นที่สำหรับภาพประกอบ/.test(flatTbl) && blkImages.length === 0) {
            return;
          }
          if (rows.length > 0) entry.tables.push(rows);
          blkImages.forEach((u) => {
            if (!entry.images.includes(u)) entry.images.push(u);
          });
          return;
        }

        blkImages.forEach((u) => {
          if (!entry.images.includes(u)) entry.images.push(u);
        });

        const paraLines = rawTxt.split('\n').map(l => l.trim()).filter(Boolean);
        paraLines.forEach((pLine) => {
          const splitCh = splitChoicesFromParagraphLine_(pLine);
          if (splitCh.length > 0) {
            splitCh.forEach((c) => {
              if (c.text) {
                if (isUneditedPlaceholderText_(c.text)) entry.isTemplatePlaceholder = true;
                entry.choices[c.key] = c.text;
              }
            });
          } else {
            if (isUneditedPlaceholderText_(pLine)) entry.isTemplatePlaceholder = true;
            entry.stemLines.push(pLine);
          }
        });
      });
    });

    let realCount = 0;
    Object.keys(itemsByNo).forEach((k) => {
      const it = itemsByNo[k];
      const nonPlaceholderStem = it.stemLines.some(l => !isUneditedPlaceholderText_(l));
      const nonPlaceholderChoices = Object.values(it.choices).some(c => !isUneditedPlaceholderText_(c));
      it.hasRealContent = nonPlaceholderStem || nonPlaceholderChoices || it.images.length > 0 || it.tables.length > 0;
      if (it.hasRealContent) realCount++;
    });

    return {
      itemsByNo,
      totalParsedItems: Object.keys(itemsByNo).length,
      realContentCount: realCount
    };
  }

  if (typeof window !== 'undefined') {
    window.extractPracticeItemsFromTutoringDocxXml = extractPracticeItemsFromTutoringDocxXml;
    window.parseExamDocxItemsForIocPreview = parseExamDocxItemsForIocPreview;
  }

  async function unpackDocxWithMediaInBrowser_(base64OrArrayBuffer) {
    if (!base64OrArrayBuffer) return { documentXml: '', relsXml: '', mediaMap: {} };
    if (typeof JSZip !== 'undefined') {
      const isB64 = typeof base64OrArrayBuffer === 'string';
      const zip = await JSZip.loadAsync(base64OrArrayBuffer, isB64 ? { base64: true } : undefined);
      const docFile = zip.file('word/document.xml');
      const relsFile = zip.file('word/_rels/document.xml.rels');
      const documentXml = docFile ? await docFile.async('string') : '';
      const relsXml = relsFile ? await relsFile.async('string') : '';
      const mediaMap = {};
      const mimeByExt = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml'
      };
      const fileEntries = Object.keys(zip.files);
      for (let i = 0; i < fileEntries.length; i++) {
        const zPath = fileEntries[i];
        const zEntry = zip.files[zPath];
        if (!zEntry || zEntry.dir) continue;
        if (!/^word\/media\//i.test(zPath)) continue;
        const ext = (zPath.split('.').pop() || '').toLowerCase();
        const mime = mimeByExt[ext];
        if (!mime) continue;
        try {
          const b64 = await zEntry.async('base64');
          const relTarget = zPath.replace(/^word\//i, '');
          mediaMap[relTarget] = `data:${mime};base64,${b64}`;
        } catch (e) {}
      }
      return { documentXml, relsXml, mediaMap };
    }
    /* Fallback if JSZip is unavailable */
    let ab = base64OrArrayBuffer;
    if (typeof base64OrArrayBuffer === 'string') {
      const bin = atob(base64OrArrayBuffer);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      ab = u8.buffer;
    }
    const xmls = await extractDocxXmlInBrowser(ab);
    return { documentXml: xmls.documentXml || '', relsXml: '', mediaMap: {} };
  }

  async function extractDocxXmlInBrowser(arrayBuffer) {
    if (typeof JSZip !== 'undefined') {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docFile = zip.file('word/document.xml');
      const styleFile = zip.file('word/styles.xml');
      return {
        documentXml: docFile ? await docFile.async('string') : '',
        stylesXml: styleFile ? await styleFile.async('string') : ''
      };
    }
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('ไฟล์ไม่ใช่รูปแบบ .docx มาตรฐาน');
    const cdCount = view.getUint16(eocd + 10, true);
    let ptr = view.getUint32(eocd + 16, true);
    const out = { documentXml: '', stylesXml: '' };
    const decoder = new TextDecoder('utf-8');
    for (let idx = 0; idx < cdCount; idx++) {
      const method = view.getUint16(ptr + 10, true);
      const compSize = view.getUint32(ptr + 20, true);
      const nameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localOffset = view.getUint32(ptr + 42, true);
      const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      ptr += 46 + nameLen + extraLen + commentLen;
      if (name === 'word/document.xml' || name === 'word/styles.xml') {
        const lNameLen = view.getUint16(localOffset + 26, true);
        const lExtraLen = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + lNameLen + lExtraLen;
        const slice = bytes.subarray(dataStart, dataStart + compSize);
        let text = '';
        if (method === 0) text = decoder.decode(slice);
        else if (method === 8 && typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(slice);
          writer.close();
          const buf = await new Response(ds.readable).arrayBuffer();
          text = decoder.decode(buf);
        }
        if (name === 'word/document.xml') out.documentXml = text;
        if (name === 'word/styles.xml') out.stylesXml = text;
      }
    }
    return out;
  }

  /* ========================================================================
   * 4. INITIALIZATION & NAVIGATION
   * ======================================================================== */
  function togglePassInput(inputId, btnId) {
    const inp = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!inp || !btn) return;
    const toText = inp.type === 'password';
    inp.type = toText ? 'text' : 'password';
    btn.textContent = toText ? 'ซ่อน' : 'แสดง';
  }

  function scrubLegacyPasswordStorage() {
    try {
      const keys = Object.values(ROLE_CRED_KEYS).concat([STUDENT_CRED_KEY]);
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, 'p')) {
          delete obj.p;
          localStorage.setItem(k, JSON.stringify(obj));
        }
      });
      localStorage.removeItem(STAFF_CRED_KEY);
    } catch (e) {}
  }

  function getSavedRoleCred(tabRole) {
    try {
      const raw = localStorage.getItem(ROLE_CRED_KEYS[tabRole]);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') {
          if (Object.prototype.hasOwnProperty.call(obj, 'p')) delete obj.p;
          return obj;
        }
      }
    } catch (e) {}
    return null;
  }

  function prefillAllRoleLogins() {
    /* Admin exclusive card is pre-selected by default for 1-click access */
    selectAdminProfile(false);
    const adminSaved = getSavedRoleCred('ADMIN');
    const adminPassInp = document.getElementById('adminLoginPass');
    const clearAdminBtn = document.getElementById('btnClearSavedAdmin');
    if (adminSaved && adminSaved.authToken) {
      if (adminPassInp) {
        adminPassInp.value = '';
        adminPassInp.placeholder = '✓ จำสิทธิ์ในเครื่องนี้แล้ว (กดเข้าสู่ระบบได้ทันที หรือพิมพ์รหัสใหม่)';
      }
      const chkAdmin = document.getElementById('chkRememberAdmin');
      if (chkAdmin) chkAdmin.checked = true;
      if (clearAdminBtn) clearAdminBtn.classList.remove('hidden');
    } else {
      if (adminPassInp) adminPassInp.placeholder = 'กรอกรหัสผ่านแอดมิน';
      if (clearAdminBtn) clearAdminBtn.classList.add('hidden');
    }

    ['COMMITTEE', 'INSTRUCTOR', 'ACADEMIC'].forEach(tabRole => {
      const ui = ROLE_UI_MAP[tabRole];
      if (!ui) return;
      const clearBtn = document.getElementById(ui.clearBtn);
      const saved = getSavedRoleCred(tabRole);
      if (clearBtn) clearBtn.classList.toggle('hidden', !(saved && (saved.authToken || saved.u)));
      renderRoleTeacherSelect(tabRole);
    });
  }

  function clearSavedRoleCred(tabRole) {
    try {
      localStorage.removeItem(ROLE_CRED_KEYS[tabRole]);
      if (tabRole === 'ADMIN') localStorage.removeItem(STAFF_CRED_KEY);
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (e) {}
    if (tabRole === 'ADMIN') {
      const passInp = document.getElementById('adminLoginPass');
      const clearBtn = document.getElementById('btnClearSavedAdmin');
      if (passInp) {
        passInp.value = '';
        passInp.placeholder = 'กรอกรหัสผ่านแอดมิน';
      }
      if (clearBtn) clearBtn.classList.add('hidden');
    } else if (ROLE_UI_MAP[tabRole]) {
      const ui = ROLE_UI_MAP[tabRole];
      const passInp = document.getElementById(ui.loginPass);
      const clearBtn = document.getElementById(ui.clearBtn);
      if (passInp) {
        passInp.value = '';
        passInp.placeholder = 'กรอกรหัสผ่าน';
      }
      if (clearBtn) clearBtn.classList.add('hidden');
    }
    showToast('ล้างสิทธิ์ที่จำไว้ในเครื่องนี้เรียบร้อยแล้วครับ', 'info');
  }

  function persistActiveSession(payload) {
    try {
      if (!payload) localStorage.removeItem(ACTIVE_SESSION_KEY);
      else localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function canTeacherAccessTab(teacher, tab) {
    if (!teacher) return false;
    if (teacher.role === 'SUPER_ADMIN') return true;
    if (tab === 'COMMITTEE' && teacher.role === 'COMMITTEE_TEACHER') return true;
    if (tab === 'INSTRUCTOR' && teacher.role === 'SUBJECT_TEACHER') return true;
    if (tab === 'ACADEMIC' && teacher.role === 'SCHOOL_ACADEMIC') return true;
    return false;
  }

  function activateTeacherSessionUI(teacher, targetTab, authToken, preloadedWorkspace = null) {
    if (authToken) STATE.authToken = authToken;
    STATE.currentTeacher = teacher;
    const roleLabel = ROLE_LABELS_TH[teacher.role] || teacher.role;
    document.getElementById('currentUserBadge').textContent = `${teacher.fullName} (${roleLabel})`;
    document.getElementById('currentUserBadge').classList.remove('hidden');
    document.getElementById('btnLogout').classList.remove('hidden');

    if (teacher.schoolId && teacher.schoolId !== 'ALL') {
      ['gradeSchoolId', 'repSchoolId', 'rosterSchoolId', 'instWeakSchoolId', 'instPracSchoolId'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = teacher.schoolId;
      });
    }
    if (teacher.subjectCode && teacher.subjectCode !== 'ALL') {
      const weakSub = document.getElementById('instWeakSubjectCode');
      const pracSub = document.getElementById('instPracSubjectCode');
      if (weakSub) weakSub.value = teacher.subjectCode;
      if (pracSub) pracSub.value = teacher.subjectCode;
    }

    let defaultRoleTab = 'COMMITTEE';
    if (teacher.role === 'SUPER_ADMIN') defaultRoleTab = 'ADMIN';
    else if (teacher.role === 'SCHOOL_ACADEMIC') defaultRoleTab = 'ACADEMIC';
    else if (teacher.role === 'SUBJECT_TEACHER') defaultRoleTab = 'INSTRUCTOR';

    const destTab = (targetTab && targetTab !== 'STUDENT' && canTeacherAccessTab(teacher, targetTab))
      ? targetTab
      : defaultRoleTab;
    switchMainTab(destTab, preloadedWorkspace);
    renderNotificationsPopover();
  }

  async function activateStudentSessionUI(student, authToken, preloadedPortalData = null) {
    if (authToken) STATE.authToken = authToken;
    STATE.currentStudent = student;
    if (!STATE.practiceAttempts) STATE.practiceAttempts = {};
    document.getElementById('currentUserBadge').textContent = `นักเรียน: ${student.fullName}`;
    document.getElementById('currentUserBadge').classList.remove('hidden');
    document.getElementById('btnLogout').classList.remove('hidden');
    document.getElementById('studentLoginCard').classList.add('hidden');
    document.getElementById('studentWorkspace').classList.remove('hidden');
    document.getElementById('stuWelcomeTitle').textContent = `สวัสดี ${student.fullName} (${student.room || 'ป.6/1'})`;
    await refreshStudentWorkspace(STATE.studentSubFilter || 'ALL', preloadedPortalData);
    runGlassRevealAnimation(document.getElementById('studentWorkspace'));
    renderNotificationsPopover();
  }

  async function restoreSavedAuthAndSession() {
    scrubLegacyPasswordStorage();

    /* 1. Pre-fill remembered student school + name (without plaintext password) */
    try {
      const stuRaw = localStorage.getItem(STUDENT_CRED_KEY);
      if (stuRaw) {
        const stuSaved = JSON.parse(stuRaw);
        if (stuSaved && stuSaved.schoolId) {
          document.getElementById('stuSchoolSelect').value = stuSaved.schoolId;
          await onStudentSchoolChange();
          if (stuSaved.studentId) {
            document.getElementById('stuNameSelect').value = stuSaved.studentId;
            onStudentNameChange(false);
            document.getElementById('chkRememberStudent').checked = !!stuSaved.authToken;
          }
        }
      }
    } catch (e) {}

    /* 2. Auto-restore verified HMAC session token from server */
    try {
      const sessRaw = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!sessRaw) return;
      const sess = JSON.parse(sessRaw);
      if (sess && sess.authToken) {
        const res = await callGas('apiRestoreSession', { authToken: sess.authToken });
        if (res && res.ok) {
          STATE.authToken = res.authToken || sess.authToken;
          if (res.kind === 'TEACHER' && res.teacher) {
            activateTeacherSessionUI(res.teacher, sess.activeTab, STATE.authToken, res.initialWorkspace || null);
            return;
          }
          if (res.kind === 'STUDENT' && res.student) {
            await activateStudentSessionUI(res.student, STATE.authToken, res.portalData || null);
            return;
          }
        }
      }
      persistActiveSession(null);
    } catch (e) {
      persistActiveSession(null);
    }
  }

  async function initAppBootstrap() {
    if (window.__ONET_BOOTSTRAPPED__) return;
    window.__ONET_BOOTSTRAPPED__ = true;

    loadSavedGlassSettings();
    refreshIcons();
    updateExamCountdown('2027-01-30');
    runGlassRevealAnimation();
    renderNotificationsPopover();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleGlassPanel(false);
        toggleNotificationsPanel(false);
        closeCustomModal();
        const iocOverlay = document.getElementById('iocA4PreviewOverlay');
        if (iocOverlay) iocOverlay.remove();
      }
    });

    let hydratedFromCache = false;
    try {
      const cachedRaw = localStorage.getItem(BOOTSTRAP_SWR_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.ok && Array.isArray(cached.schools) && cached.schools.length > 0) {
          STATE.config = cached.config || {};
          STATE.schools = cached.schools || [];
          STATE.teachers = cached.teachers || [];
          STATE.students = cached.students || [];
          STATE.blueprint = cached.blueprint || [];
          STATE.examStructure = cached.examStructure || [];
          updateExamCountdown(STATE.config.EXAM_DATE_CE);
          populateAllSchoolDropdowns();
          prefillAllRoleLogins();
          onUploadSubjectChange();
          renderDigitalAnswerSheetGrid();
          renderNotificationsPopover();
          hydratedFromCache = true;
        }
      }
    } catch (_) {}

    try {
      const res = await callGas('apiGetBootstrapData');
      if (res && res.ok) {
        STATE.config = res.config;
        STATE.schools = res.schools || [];
        STATE.teachers = res.teachers || [];
        STATE.students = res.students || [];
        STATE.blueprint = res.blueprint || [];
        STATE.examStructure = res.examStructure || [];
        try {
          localStorage.setItem(BOOTSTRAP_SWR_KEY, JSON.stringify(res));
        } catch (_) {}
        updateExamCountdown(STATE.config.EXAM_DATE_CE);
        populateAllSchoolDropdowns();
        if (!hydratedFromCache) {
          prefillAllRoleLogins();
          onUploadSubjectChange();
          renderDigitalAnswerSheetGrid();
        }
        await restoreSavedAuthAndSession();
        renderNotificationsPopover();
      }
    } catch (err) {
      if (!hydratedFromCache) {
        showToast('โหลดข้อมูลเริ่มต้นไม่สำเร็จ: ' + err.message, 'error');
      }
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initAppBootstrap();
  } else {
    window.addEventListener('DOMContentLoaded', initAppBootstrap);
  }

  function populateAllSchoolDropdowns() {
    const ids = [
      'stuSchoolSelect',
      'commFilterSchool', 'commRegSchool',
      'instFilterSchool', 'instRegSchool',
      'acadFilterSchool', 'acadRegSchool',
      'gradeSchoolId', 'repSchoolId', 'rosterSchoolId',
      'instWeakSchoolId', 'instPracSchoolId'
    ];
    ids.forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const prevVal = sel.value;
      let html = '';
      if (id === 'stuSchoolSelect') html += '<option value="">-- เลือกโรงเรียน (8 โรงเรียน) --</option>';
      if (id === 'commFilterSchool' || id === 'instFilterSchool' || id === 'acadFilterSchool') {
        html += '<option value="ALL">แสดงทุกโรงเรียน (8 โรงเรียน)</option>';
      }
      if (id === 'repSchoolId' || id === 'instWeakSchoolId' || id === 'instPracSchoolId') {
        html += '<option value="ALL">รวมทั้งกลุ่มโรงเรียนศรีเสาวภาค (8 โรงเรียน)</option>';
      }
      STATE.schools.forEach(s => {
        html += `<option value="${escHtml(s.schoolId)}">${escHtml(s.schoolNo)}. ${escHtml(s.schoolName)}</option>`;
      });
      sel.innerHTML = html;
      if (prevVal && Array.from(sel.options).some(o => o.value === prevVal)) {
        sel.value = prevVal;
      }
    });
  }

  function switchMainTab(tab, preloadedWorkspace = null) {
    STATE.activeTab = tab;
    toggleGlassPanel(false);
    toggleNotificationsPanel(false);

    ['STUDENT', 'COMMITTEE', 'INSTRUCTOR', 'ACADEMIC', 'ADMIN'].forEach(t => {
      ['tabBtn_', 'mobBtn_'].forEach(prefix => {
        const btn = document.getElementById(prefix + t);
        if (btn) {
          if (t === tab) btn.setAttribute('aria-current', 'page');
          else btn.removeAttribute('aria-current');
        }
      });
      const p = document.getElementById('panel_' + t);
      if (p) p.classList.add('hidden');
      if (t !== 'STUDENT') {
        const ac = document.getElementById('authCard_' + t);
        if (ac) ac.classList.add('hidden');
      }
    });

    const meta = VIEW_META[tab] || VIEW_META.STUDENT;
    const titleEl = document.getElementById('gwViewTitle');
    const greetEl = document.getElementById('gwGreetingText');
    if (titleEl) titleEl.textContent = meta.title;
    if (greetEl) {
      if (STATE.currentTeacher && tab !== 'STUDENT' && canTeacherAccessTab(STATE.currentTeacher, tab)) {
        greetEl.textContent = `สวัสดีคุณครู ${STATE.currentTeacher.fullName} | ${meta.greeting}`;
      } else if (STATE.currentStudent && tab === 'STUDENT') {
        greetEl.textContent = `สวัสดี ${STATE.currentStudent.fullName} | พร้อมฝึกทำโจทย์ O-NET แล้ว!`;
      } else {
        greetEl.textContent = meta.greeting;
      }
    }

    if (tab === 'STUDENT') {
      const targetPanel = document.getElementById('panel_STUDENT');
      targetPanel.classList.remove('hidden');
      runGlassRevealAnimation(targetPanel);
      return;
    }

    if (!canTeacherAccessTab(STATE.currentTeacher, tab)) {
      const roleAuth = document.getElementById('authCard_' + tab);
      if (roleAuth) {
        if (ROLE_UI_MAP[tab]) renderRoleTeacherSelect(tab);
        roleAuth.classList.remove('hidden');
        refreshIcons();
        runGlassRevealAnimation(roleAuth);
      }
      return;
    }

    const activePanel = document.getElementById('panel_' + tab);
    activePanel.classList.remove('hidden');
    runGlassRevealAnimation(activePanel);

    if (STATE.currentTeacher && STATE.authToken) {
      try {
        if (localStorage.getItem(ACTIVE_SESSION_KEY)) {
          persistActiveSession({ type: 'TEACHER', authToken: STATE.authToken, activeTab: tab });
        }
      } catch (e) {}
    }

    if (preloadedWorkspace && Array.isArray(preloadedWorkspace.submissions)) {
      STATE.cachedSubmissions = preloadedWorkspace.submissions;
    }

    if (tab === 'COMMITTEE') {
      if (preloadedWorkspace && Array.isArray(preloadedWorkspace.submissions)) {
        renderCommitteeSubmissionsList();
        renderNotificationsPopover();
      } else {
        loadCommitteeSubmissions();
      }
    }
    if (tab === 'INSTRUCTOR') {
      if (preloadedWorkspace && Array.isArray(preloadedWorkspace.submissions)) {
        renderInstructorMaterialsGrid();
      } else {
        loadInstructorMaterials();
      }
    }
    if (tab === 'ACADEMIC') {
      if (preloadedWorkspace && preloadedWorkspace.gradingInit && preloadedWorkspace.gradingInit.ok) {
        applyGradingSheetInitData_(preloadedWorkspace.gradingInit, '');
      } else {
        loadGradingSheetData();
      }
      if (preloadedWorkspace && Array.isArray(preloadedWorkspace.rosterStudents)) {
        const rosSch = (document.getElementById('rosterSchoolId') && document.getElementById('rosterSchoolId').value)
          || (STATE.currentTeacher && STATE.currentTeacher.schoolId) || '';
        applyAcademicRosterList_(rosSch, preloadedWorkspace.rosterStudents);
      } else {
        refreshRosterTable();
      }
      if (preloadedWorkspace && Array.isArray(preloadedWorkspace.submissions)) {
        renderAcademicMaterialsGrid();
      } else {
        loadAcademicMaterials();
      }
    }
    if (tab === 'ADMIN') {
      if (preloadedWorkspace && preloadedWorkspace.superAdminData && preloadedWorkspace.superAdminData.ok) {
        refreshSuperAdminDashboard(preloadedWorkspace.superAdminData);
      } else {
        refreshSuperAdminDashboard();
      }
    }
  }

  function logoutAll() {
    STATE.currentStudent = null;
    STATE.currentTeacher = null;
    STATE.authToken = '';
    STATE.gradingDirty = false;
    persistActiveSession(null);
    ['stuPasswordInput', 'stuPasswordConfirm', 'commLoginPass', 'instLoginPass', 'acadLoginPass', 'adminLoginPass'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('currentUserBadge').classList.add('hidden');
    document.getElementById('btnLogout').classList.add('hidden');
    document.getElementById('studentLoginCard').classList.remove('hidden');
    document.getElementById('studentWorkspace').classList.add('hidden');
    prefillAllRoleLogins();
    switchMainTab('STUDENT');
    renderNotificationsPopover();
  }

  /* ========================================================================
   * 5. TAB 1: STUDENT FLOW (CHOOSE SCHOOL -> CHOOSE NAME -> PASSWORD -> GO)
   * ======================================================================== */
  function toggleStudentQuickAdd() {
    document.getElementById('stuQuickAddBox').classList.toggle('hidden');
  }

  async function onStudentSchoolChange() {
    const schoolId = document.getElementById('stuSchoolSelect').value;
    const sel = document.getElementById('stuNameSelect');
    const selfWrap = document.getElementById('stuSelfAddWrap');
    const quickBox = document.getElementById('stuQuickAddBox');
    document.getElementById('stuPasswordBox').classList.add('hidden');
    document.getElementById('stuPasswordInput').value = '';
    quickBox.classList.add('hidden');

    if (!schoolId) {
      selfWrap.classList.add('hidden');
      sel.innerHTML = '<option value="">-- กรุณาเลือกโรงเรียนก่อน --</option>';
      return;
    }

    selfWrap.classList.remove('hidden');

    let list = STATE.studentListCache[schoolId];
    if (!list) {
      const preloaded = (STATE.students || []).filter(s => s.schoolId === schoolId);
      if (preloaded.length) {
        list = preloaded;
      } else {
        sel.innerHTML = '<option value="">กำลังโหลดรายชื่อนักเรียน...</option>';
        list = (await callGas('apiListStudentsBySchool', schoolId)) || [];
      }
      STATE.studentListCache[schoolId] = list;
    }

    if (!list.length) {
      sel.innerHTML = '<option value="">(ยังไม่มีรายชื่อนักเรียน — เพิ่มชื่อตนเองด้านล่างได้เลย)</option>';
      document.getElementById('stuAddNo').value = '1';
      quickBox.classList.remove('hidden');
      return;
    }

    document.getElementById('stuAddNo').value = String(list.length + 1);
    sel.innerHTML = '<option value="">-- เลือกชื่อ-นามสกุลของตนเอง --</option>' + list.map(s =>
      `<option value="${escHtml(s.studentId)}" data-needs="${s.needsPasswordSetup ? '1' : '0'}">เลขที่ ${escHtml(s.studentNo)} ${escHtml(s.fullName)} (${escHtml(s.room)})</option>`
    ).join('');
  }

  async function submitStudentQuickAdd() {
    const schoolId = document.getElementById('stuSchoolSelect').value;
    const studentNo = document.getElementById('stuAddNo').value.trim() || '1';
    const roomEl = document.getElementById('stuAddRoom');
    const room = roomEl ? roomEl.value : 'ป.6/1';
    const prefix = document.getElementById('stuAddPrefix').value;
    const firstName = document.getElementById('stuAddFirst').value.trim();
    const lastName = document.getElementById('stuAddLast').value.trim();
    if (!schoolId || !firstName) {
      showToast('กรุณากรอกชื่อจริงของนักเรียนก่อนบันทึก', 'error');
      return;
    }
    return withButtonBusy('btnStudentQuickAddSubmit', 'กำลังบันทึกชื่อ...', async () => {
      try {
        const res = await callGas('apiStudentQuickAdd', {
          schoolId,
          studentNo,
          prefix,
          firstName,
          lastName,
          room
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'เพิ่มชื่อไม่สำเร็จ', 'error');
          return;
        }
        const freshList = Array.isArray(res.schoolStudents)
          ? res.schoolStudents
          : ((await callGas('apiListStudentsBySchool', schoolId)) || []);
        STATE.studentListCache[schoolId] = freshList;
        STATE.students = (STATE.students || []).filter(s => s.schoolId !== schoolId).concat(freshList);

        document.getElementById('stuAddFirst').value = '';
        document.getElementById('stuAddLast').value = '';
        document.getElementById('stuQuickAddBox').classList.add('hidden');

        await onStudentSchoolChange();
        const targetId = (res.student && res.student.studentId) || (freshList[freshList.length - 1] && freshList[freshList.length - 1].studentId);
        if (targetId) {
          document.getElementById('stuNameSelect').value = targetId;
          onStudentNameChange(true);
        }
        showToast('เพิ่มชื่อเข้าโรงเรียนสำเร็จ! ตั้งรหัสผ่านของตนเองแล้วเข้าเรียนได้เลยครับ', 'success');
      } catch (err) {
        showToast('บันทึกชื่อไม่สำเร็จ: ' + err.message, 'error');
      }
    });
  }

  function onStudentNameChange(shouldFocus = false) {
    const sel = document.getElementById('stuNameSelect');
    const opt = sel.options[sel.selectedIndex];
    const box = document.getElementById('stuPasswordBox');
    const inp = document.getElementById('stuPasswordInput');
    const confirmWrap = document.getElementById('stuPasswordConfirmWrap');
    const confirmInp = document.getElementById('stuPasswordConfirm');
    if (!opt || !opt.value) {
      box.classList.add('hidden');
      if (confirmWrap) confirmWrap.classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');
    const needsSetup = opt.getAttribute('data-needs') === '1';
    if (confirmWrap) confirmWrap.classList.toggle('hidden', !needsSetup);
    if (confirmInp) confirmInp.value = '';
    inp.value = '';

    let hasSavedToken = false;
    try {
      const stuRaw = localStorage.getItem(STUDENT_CRED_KEY);
      if (stuRaw) {
        const stuSaved = JSON.parse(stuRaw);
        if (stuSaved && stuSaved.studentId === opt.value && stuSaved.authToken && !needsSetup) {
          hasSavedToken = true;
        }
      }
    } catch (e) {}

    document.getElementById('stuPasswordLabel').textContent = needsSetup
      ? '3. เข้าครั้งแรก — ตั้งรหัสผ่านของตัวเองได้เลย (อย่างน้อย 4 ตัว)'
      : '3. กรอกรหัสผ่านของตนเองเพื่อเข้าสู่ระบบ';
    inp.placeholder = needsSetup
      ? 'ตั้งรหัสผ่านของตัวเอง เช่น 1234'
      : (hasSavedToken ? '✓ จำสิทธิ์ในเครื่องนี้แล้ว (กดเข้าห้องเรียนได้ทันที หรือพิมพ์รหัสใหม่)' : 'กรอกรหัสผ่านของตนเอง');
    document.getElementById('stuPasswordHint').textContent = needsSetup
      ? 'ครั้งต่อไป เลือกโรงเรียน | เลือกชื่อตัวเอง | ใส่รหัสนี้แล้วเข้าใช้งานได้เลย!'
      : 'หากลืมรหัสผ่าน แจ้งคุณครูวิชาการประจำโรงเรียนกดรีเซ็ตให้ได้ทันที';
    if (shouldFocus) setTimeout(() => inp.focus(), 40);
  }

  async function submitStudentLogin() {
    const schoolId = document.getElementById('stuSchoolSelect').value;
    const sel = document.getElementById('stuNameSelect');
    const studentId = sel.value;
    const passVal = document.getElementById('stuPasswordInput').value;
    const confirmEl = document.getElementById('stuPasswordConfirm');
    const confirmVal = confirmEl ? confirmEl.value : passVal;
    if (!schoolId || !studentId) {
      showToast('กรุณาเลือกโรงเรียนและเลือกชื่อของตนเองก่อนครับ', 'error');
      return;
    }
    const opt = sel.options[sel.selectedIndex];
    const needsSetup = opt && opt.getAttribute('data-needs') === '1';

    if (needsSetup) {
      if (!passVal || passVal.length < 4) {
        showToast('กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษรครับ', 'error');
        document.getElementById('stuPasswordInput').focus();
        return;
      }
      if (passVal !== confirmVal) {
        showToast('รหัสผ่านยืนยันทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้งครับ', 'error');
        if (confirmEl) confirmEl.focus();
        return;
      }
    }

    return withButtonBusy('btnStudentLoginSubmit', 'กำลังเข้าสู่ห้องเรียน...', async () => {
      try {
        let res = null;
        if (needsSetup) {
          res = await callGas('apiStudentLoginOrSetup', {
            schoolId,
            studentId,
            password: '',
            newPassword: passVal
          });
        } else if (!passVal) {
          let stuSaved = null;
          try {
            const raw = localStorage.getItem(STUDENT_CRED_KEY);
            if (raw) stuSaved = JSON.parse(raw);
          } catch (e) {}
          if (stuSaved && stuSaved.schoolId === schoolId && stuSaved.studentId === studentId && stuSaved.authToken) {
            const restored = await callGas('apiRestoreSession', { authToken: stuSaved.authToken });
            if (restored && restored.ok && restored.kind === 'STUDENT' && restored.student && restored.student.studentId === studentId) {
              res = restored;
            } else {
              try {
                delete stuSaved.authToken;
                localStorage.setItem(STUDENT_CRED_KEY, JSON.stringify(stuSaved));
              } catch (e) {}
              showToast('สิทธิ์ที่จำไว้หมดอายุ กรุณากรอกรหัสผ่านของตนเองใหม่อีกครั้งครับ', 'error');
              onStudentNameChange(true);
              return;
            }
          } else {
            showToast('กรุณากรอกรหัสผ่านของตนเองก่อนเข้าสู่ระบบครับ', 'error');
            document.getElementById('stuPasswordInput').focus();
            return;
          }
        } else {
          res = await callGas('apiStudentLoginOrSetup', {
            schoolId,
            studentId,
            password: passVal,
            newPassword: ''
          });
        }

        if (!res || !res.ok) {
          showToast((res && (res.error || res.message)) || 'ไม่สามารถเข้าสู่ระบบได้', 'error');
          return;
        }

        /* Mark password as already set in client cache so next login prompts regular password */
        if (opt) opt.setAttribute('data-needs', '0');
        (STATE.studentListCache[schoolId] || []).forEach(s => {
          if (s.studentId === studentId) s.needsPasswordSetup = false;
        });
        (STATE.students || []).forEach(s => {
          if (s.schoolId === schoolId && s.studentId === studentId) s.needsPasswordSetup = false;
        });

        const authToken = res.authToken || STATE.authToken || '';
        if (document.getElementById('chkRememberStudent').checked) {
          try {
            localStorage.setItem(STUDENT_CRED_KEY, JSON.stringify({ schoolId, studentId, authToken }));
          } catch (e) {}
          persistActiveSession({ type: 'STUDENT', authToken, activeTab: 'STUDENT' });
        } else {
          try { localStorage.removeItem(STUDENT_CRED_KEY); } catch (e) {}
          persistActiveSession(null);
        }
        document.getElementById('stuPasswordInput').value = '';
        if (confirmEl) confirmEl.value = '';
        STATE.practiceAttempts = {};
        await activateStudentSessionUI(res.student, authToken, res.portalData || null);
      } catch (err) {
        showToast('เข้าสู่ระบบไม่สำเร็จ: ' + err.message, 'error');
      }
    });
  }

  async function refreshStudentWorkspace(subjectFilter = 'ALL', preloadedData = null) {
    const data = (preloadedData && preloadedData.ok)
      ? preloadedData
      : await callGas('apiGetStudentPortalData', {
          authToken: STATE.authToken || '',
          studentId: STATE.currentStudent.studentId,
          schoolId: STATE.currentStudent.schoolId
        });
    STATE.studentPortalData = data;
    renderStudentMaterialsPanel(STATE.stuMatFilter || subjectFilter || 'ALL');
    renderStudentPracticeCards(subjectFilter);
  }

  function filterStudentMaterials(subCode) {
    STATE.stuMatFilter = subCode || 'ALL';
    ['ALL', '61', '64', '65', '63'].forEach(k => {
      const btn = document.getElementById('stuMatFilter_' + k);
      if (btn) btn.classList.toggle('is-active', k === STATE.stuMatFilter);
    });
    renderStudentMaterialsPanel(STATE.stuMatFilter);
  }

  function renderStudentMaterialsPanel(subCode = 'ALL') {
    const listEl = document.getElementById('stuMaterialsList');
    const summaryEl = document.getElementById('stuMaterialsSummaryBar');
    if (!listEl || !summaryEl) return;
    const data = STATE.studentPortalData || {};
    const allMats = (data.studentMaterials || []).map(normalizeSubMetaClient_).sort((a, b) => {
      const rank = (x) => (x.docCategory === 'MERGED_BOOK' ? 0 : (x.docCategory === 'PREPOST_EXAM' ? 1 : 2));
      return rank(a) - rank(b) || Number(a.strandNo || 99) - Number(b.strandNo || 99);
    });
    const visible = subCode === 'ALL' ? allMats : allMats.filter(m => String(m.subjectCode) === String(subCode));
    summaryEl.textContent = allMats.length
      ? `มีเอกสารฉบับนักเรียนพร้อมดาวน์โหลดทั้งหมด ${allMats.length} รายการ (แสดง ${visible.length} รายการ)`
      : 'ยังไม่มีเอกสารฉบับนักเรียนที่ผ่านการอนุมัติในขณะนี้';
    if (!visible.length) {
      listEl.innerHTML = '<div class="gw-subcard text-xs md:col-span-2" style="color: var(--gw-muted);">ยังไม่มีเอกสารฉบับนักเรียนในหมวดวิชานี้ (หากครูผู้ดูแลกลุ่มฯ อนุมัติหรือรวมเล่มแล้ว เอกสารจะแสดงที่นี่โดยอัตโนมัติครับ)</div>';
      return;
    }
    listEl.innerHTML = visible.map(doc => `
      <div class="gw-subcard space-y-2 border" style="border-color: var(--gw-accent-soft);">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <span class="font-bold" style="color: var(--gw-accent);">${escHtml(SUBJECT_NAMES[doc.subjectCode] || doc.subjectCode)} | สาระที่ ${escHtml(doc.strandNo)}</span>
          <div class="flex flex-wrap gap-1">${formatSubmissionCardBadges_(doc)}</div>
        </div>
        <div class="font-bold text-xs">${escHtml(doc.fileName)}</div>
        <div class="text-[11px]" style="color: var(--gw-muted);">${doc.subStandard && doc.subStandard !== 'ALL' ? escHtml(doc.subStandard) + ' | ' : ''}จัดทำโดย: ${escHtml(doc.teacherName)} (${escHtml(getSchoolShortName(doc.schoolId))})</div>
        <div class="flex flex-wrap gap-2 pt-1">
          ${doc.pdfFileUrl ? `<a href="${escHtml(doc.pdfFileUrl)}" target="_blank" class="gw-btn-primary !py-1.5 !px-3 text-xs">📄 ดาวน์โหลด PDF ฉบับนักเรียน</a>` : ''}
          <a href="${escHtml(doc.driveFileUrl)}" target="_blank" class="${doc.pdfFileUrl ? 'gw-btn-soft' : 'gw-btn-primary'} !py-1.5 !px-3 text-xs !font-bold">📘 ดาวน์โหลด Word (.docx)</a>
        </div>
      </div>
    `).join('');
  }

  function filterStudentPractice(subCode) {
    STATE.studentSubFilter = subCode;
    STATE.practiceStepIndex = 0;
    ['ALL', '61', '64', '65', '63'].forEach(k => {
      const btn = document.getElementById('stuSubFilter_' + k);
      if (btn) btn.classList.toggle('is-active', k === subCode);
    });
    renderStudentPracticeCards(subCode);
  }

  function setStudentPracticeMode(mode) {
    STATE.practiceMode = mode === 'STEP' ? 'STEP' : 'ALL';
    STATE.practiceStepIndex = 0;
    const btnAll = document.getElementById('btnStuModeAll');
    const btnStep = document.getElementById('btnStuModeStep');
    if (btnAll) btnAll.classList.toggle('is-active', STATE.practiceMode === 'ALL');
    if (btnStep) btnStep.classList.toggle('is-active', STATE.practiceMode === 'STEP');
    renderStudentPracticeCards(STATE.studentSubFilter || 'ALL');
  }

  function stepStudentPractice(delta) {
    const data = STATE.studentPortalData;
    if (!data) return;
    const subFilter = STATE.studentSubFilter || 'ALL';
    const items = data.practiceItems || [];
    const filtered = subFilter === 'ALL' ? items : items.filter(x => x.subjectCode === subFilter);
    if (!filtered.length) return;
    const nextIdx = (STATE.practiceStepIndex || 0) + Number(delta || 0);
    STATE.practiceStepIndex = Math.max(0, Math.min(filtered.length - 1, nextIdx));
    renderStudentPracticeCards(subFilter);
  }

  function renderStudentPracticeCards(subFilter) {
    const data = STATE.studentPortalData;
    if (!data) return;
    const filterKey = subFilter || STATE.studentSubFilter || 'ALL';
    const items = data.practiceItems || [];
    const doneSet = new Set(data.completedItemIds || []);
    const pct = items.length ? Math.round((doneSet.size / items.length) * 100) : 0;
    document.getElementById('stuProgressText').textContent = `ความก้าวหน้า ${pct}% (${doneSet.size}/${items.length} บทเรียน)`;
    document.getElementById('stuProgressBar').style.width = `${pct}%`;

    const histBox = document.getElementById('stuExamHistoryBox');
    histBox.innerHTML = ['61', '64', '65', '63'].map(code => {
      const pre = (data.examHistory || []).find(r => r.subjectCode === code && r.round === 'PRE');
      const post = (data.examHistory || []).find(r => r.subjectCode === code && r.round === 'POST');
      return `<div class="gw-subcard">
        <div class="text-xs font-bold">${escHtml(SUBJECT_NAMES[code])}</div>
        <div class="text-xs mt-1 gw-tabular" style="color: var(--gw-muted);">
          Pre: <b>${pre ? pre.totalScore : '-'}</b> | Post: <b style="color: var(--gw-accent);">${post ? post.totalScore : '-'}</b>
        </div>
      </div>`;
    }).join('');

    const filtered = filterKey === 'ALL' ? items : items.filter(x => x.subjectCode === filterKey);
    const stepNav = document.getElementById('stuStepperNav');
    const stepStatus = document.getElementById('stuStepperStatus');
    let visibleList = filtered;

    if (STATE.practiceMode === 'STEP' && filtered.length > 0) {
      const safeIdx = Math.max(0, Math.min(STATE.practiceStepIndex || 0, filtered.length - 1));
      STATE.practiceStepIndex = safeIdx;
      visibleList = [filtered[safeIdx]];
      if (stepNav) stepNav.classList.remove('hidden');
      if (stepStatus) stepStatus.textContent = `ข้อที่ ${safeIdx + 1} / ${filtered.length}`;
    } else if (stepNav) {
      stepNav.classList.add('hidden');
    }

    const container = document.getElementById('stuPracticeContainer');
    if (!visibleList.length) {
      container.innerHTML = '<div class="gw-panel text-xs md:col-span-2" style="color: var(--gw-muted);">ยังไม่มีแบบฝึกในหมวดวิชานี้ครับ ลองเลือก "ทุกวิชา" หรือรอคุณครูกรรมการเพิ่มข้อสอบ</div>';
      return;
    }

    container.innerHTML = visibleList.map(it => {
      const isDone = doneSet.has(it.itemId);
      const indDesc = getIndicatorDesc(it.indicatorCode);
      return `<div class="gw-panel space-y-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold" style="background: var(--gw-accent-soft); color: var(--gw-accent);">
            ${escHtml(SUBJECT_NAMES[it.subjectCode] || it.subjectCode)} | ${escHtml(it.indicatorCode)}
          </span>
          <span id="pracStatus_${escHtml(it.itemId)}" class="${isDone ? 'gw-badge-success' : 'gw-badge-warn'}">
            ${isDone ? '✓ ผ่านแล้ว' : 'รอฝึกทำ'}
          </span>
        </div>
        ${indDesc ? `<div class="text-xs" style="color: var(--gw-muted);">${escHtml(indDesc)}</div>` : ''}
        <h4 class="font-bold text-sm">${escHtml(it.summaryTitle)}</h4>
        <div class="gw-subcard text-xs leading-relaxed">
          <b>สรุปตรงจุดออกสอบ:</b> ${escHtml(it.summaryText)}
        </div>
        <div class="text-xs font-bold pt-1">คำถาม: ${escHtml(it.questionText)}</div>
        <div id="pracChoices_${escHtml(it.itemId)}" class="space-y-1.5 text-xs">
          ${[1, 2, 3, 4].map(n => `
            <button type="button" data-choice="${n}" onclick="answerStudentPractice('${escHtml(it.itemId)}', '${n}')"
              class="gw-btn-soft w-full !justify-start text-left py-2.5 px-3">
              ${n}) ${escHtml(it['choice' + n])}
            </button>
          `).join('')}
        </div>
        <div id="pracFeedback_${escHtml(it.itemId)}" class="hidden text-xs"></div>
      </div>`;
    }).join('');
  }

  async function answerStudentPractice(itemId, choiceNo) {
    if (!STATE.practiceAttempts) STATE.practiceAttempts = {};
    const prevTries = STATE.practiceAttempts[itemId] || 0;
    const currentTry = prevTries + 1;

    const res = await callGas('apiSubmitPracticeAnswer', {
      authToken: STATE.authToken || '',
      studentId: STATE.currentStudent.studentId,
      schoolId: STATE.currentStudent.schoolId,
      itemId,
      selectedAnswer: choiceNo
    });
    STATE.practiceAttempts[itemId] = currentTry;

    const fb = document.getElementById('pracFeedback_' + itemId);
    const choicesBox = document.getElementById('pracChoices_' + itemId);

    if (fb) {
      fb.classList.remove('hidden');
      if (res.isCorrect) {
        fb.className = 'gw-alert-success text-xs';
        fb.innerHTML = `<b>ถูกต้อง! เก่งมากเลย 🎉</b><br>${escHtml(res.explanation)}`;
      } else if (currentTry === 1) {
        fb.className = 'gw-alert-warn text-xs';
        fb.innerHTML = '<b>ยังไม่ถูกนะครับ (โอกาสแก้ตัวครั้งที่ 2)</b><br>ลองกลับไปอ่าน "สรุปตรงจุดออกสอบ" ด้านบน แล้วเลือกคำตอบใหม่อีกครั้งได้เลยครับ!';
        if (choicesBox) {
          const btn = choicesBox.querySelector(`button[data-choice="${choiceNo}"]`);
          if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.55';
          }
        }
      } else {
        fb.className = 'gw-alert-danger text-xs';
        fb.innerHTML = `<b>ยังไม่ถูกนะครับ (คำตอบที่ถูกคือข้อ ${escHtml(res.correctChoice)})</b><br>${escHtml(res.explanation)}`;
      }
    }

    if (res.isCorrect && STATE.studentPortalData) {
      if (!STATE.studentPortalData.completedItemIds.includes(itemId)) {
        STATE.studentPortalData.completedItemIds.push(itemId);
      }
      const badge = document.getElementById('pracStatus_' + itemId);
      if (badge) {
        badge.className = 'gw-badge-success';
        badge.textContent = '✓ ผ่านแล้ว';
      }
      const totalItems = (STATE.studentPortalData.practiceItems || []).length;
      const doneCount = STATE.studentPortalData.completedItemIds.length;
      const pct = totalItems ? Math.round((doneCount / totalItems) * 100) : 0;
      document.getElementById('stuProgressText').textContent = `ความก้าวหน้า ${pct}% (${doneCount}/${totalItems} บทเรียน)`;
      document.getElementById('stuProgressBar').style.width = `${pct}%`;
    }
  }

  /* ========================================================================
   * 6. DEDICATED ROLE AUTHENTICATION (COMMITTEE / ACADEMIC / EXCLUSIVE ADMIN)
   * ======================================================================== */
  function selectAdminProfile(shouldFocus = false) {
    const card = document.getElementById('btnAdminProfileCard');
    const badge = document.getElementById('adminSelectBadge');
    const box = document.getElementById('adminPassBox');
    const inp = document.getElementById('adminLoginPass');
    if (card) card.classList.add('is-selected');
    if (badge) badge.textContent = '✓ เลือกแล้ว';
    if (box) box.classList.remove('hidden');
    if (shouldFocus && inp) setTimeout(() => inp.focus(), 40);
  }

  async function submitAdminExclusiveLogin() {
    const adminUser = 'keardtisakkaruna@gmail.com';
    const rawPass = document.getElementById('adminLoginPass').value;
    const saved = getSavedRoleCred('ADMIN');

    if (!rawPass && !(saved && saved.authToken)) {
      selectAdminProfile(true);
      showToast('กรุณากรอกรหัสผ่านแอดมิน (ครูเกียรติศักดิ์)', 'error');
      return;
    }

    return withButtonBusy('btnAdminLoginSubmit', 'กำลังเข้าสู่ระบบ...', async () => {
      try {
        let res = null;
        if (!rawPass) {
          const restored = await callGas('apiRestoreSession', { authToken: saved.authToken });
          if (restored && restored.ok && restored.kind === 'TEACHER' && restored.teacher && restored.teacher.role === 'SUPER_ADMIN') {
            res = restored;
          } else {
            try { localStorage.removeItem(ROLE_CRED_KEYS.ADMIN); } catch (e) {}
            document.getElementById('btnClearSavedAdmin').classList.add('hidden');
            document.getElementById('adminLoginPass').placeholder = 'กรอกรหัสผ่านแอดมิน';
            selectAdminProfile(true);
            showToast('สิทธิ์ที่จำไว้หมดอายุ กรุณากรอกรหัสผ่านแอดมินใหม่อีกครั้งครับ', 'error');
            return;
          }
        } else {
          res = await callGas('apiTeacherLogin', {
            usernameOrEmail: adminUser,
            password: rawPass
          });
        }

        if (!res || !res.ok) { showToast((res && res.error) || 'เข้าสู่ระบบไม่สำเร็จ', 'error'); return; }

        const authToken = res.authToken || STATE.authToken || '';
        if (document.getElementById('chkRememberAdmin').checked) {
          try {
            localStorage.setItem(ROLE_CRED_KEYS.ADMIN, JSON.stringify({ u: adminUser, authToken }));
          } catch (e) {}
          document.getElementById('btnClearSavedAdmin').classList.remove('hidden');
          persistActiveSession({ type: 'TEACHER', authToken, activeTab: 'ADMIN' });
        } else {
          try { localStorage.removeItem(ROLE_CRED_KEYS.ADMIN); } catch (e) {}
          document.getElementById('btnClearSavedAdmin').classList.add('hidden');
          persistActiveSession(null);
        }
        document.getElementById('adminLoginPass').value = '';
        activateTeacherSessionUI(res.teacher, 'ADMIN', authToken, res.initialWorkspace || null);
      } catch (err) {
        showToast('เข้าสู่ระบบไม่สำเร็จ: ' + err.message, 'error');
      }
    });
  }

  function toggleRoleAuthMode(tabRole, mode) {
    const ui = ROLE_UI_MAP[tabRole];
    if (!ui) return;
    const loginForm = document.getElementById(ui.loginForm);
    const regForm = document.getElementById(ui.regForm);
    const btnLogin = document.getElementById(ui.btnLogin);
    const btnReg = document.getElementById(ui.btnReg);
    if (loginForm) loginForm.classList.toggle('hidden', mode !== 'LOGIN');
    if (regForm) regForm.classList.toggle('hidden', mode !== 'REGISTER');
    if (btnLogin) btnLogin.classList.toggle('is-active', mode === 'LOGIN');
    if (btnReg) btnReg.classList.toggle('is-active', mode === 'REGISTER');
    if (mode === 'REGISTER') {
      const filterEl = document.getElementById(ui.filterSchool);
      const regSch = document.getElementById(ui.regSchool);
      const filterVal = filterEl ? filterEl.value : '';
      if (filterVal && filterVal !== 'ALL' && regSch) regSch.value = filterVal;
    }
  }

  function getSchoolShortName(schoolId) {
    const s = (STATE.schools || []).find(x => x.schoolId === schoolId);
    return s ? s.schoolName.replace(/^โรงเรียน/, 'รร.') : schoolId;
  }

  function getPendingNoticeIdForRole(tabRole) {
    const ui = ROLE_UI_MAP[tabRole];
    if (ui && ui.pendingNotice) return ui.pendingNotice;
    return ({ COMMITTEE: 'commPendingNotice', INSTRUCTOR: 'instPendingNotice', ACADEMIC: 'acadPendingNotice' })[tabRole] || '';
  }

  function formatTeacherSubjectBadge(tabRole, subjectCode, bracketStyle) {
    if (tabRole === 'ACADEMIC') return '';
    if (tabRole === 'INSTRUCTOR' && (!subjectCode || subjectCode === 'ALL')) {
      return bracketStyle ? ' [ครบ 4 วิชา]' : ' (ครบ 4 วิชา)';
    }
    if (subjectCode && SUBJECT_NAMES[subjectCode]) {
      return bracketStyle ? ` [${SUBJECT_NAMES[subjectCode]}]` : ` (${SUBJECT_NAMES[subjectCode]})`;
    }
    return '';
  }

  function renderRoleTeacherSelect(tabRole) {
    const ui = ROLE_UI_MAP[tabRole];
    if (!ui) return;
    const filterSel = document.getElementById(ui.filterSchool);
    const teacherSel = document.getElementById(ui.selectTeacher);
    const chipsWrap = document.getElementById(ui.chipsWrap);
    const chipsBox = document.getElementById(ui.chipsBox);
    const emptyHint = document.getElementById(ui.emptyHint);
    const passBox = document.getElementById(ui.passBox);
    if (!filterSel || !teacherSel) return;

    const allRoleTeachers = (STATE.teachers || []).filter(t => t.role === ui.roleCode);
    const filterSchool = filterSel.value || 'ALL';
    const filtered = filterSchool === 'ALL'
      ? allRoleTeachers
      : allRoleTeachers.filter(t => t.schoolId === filterSchool);

    const prevVal = teacherSel.value;
    const saved = getSavedRoleCred(tabRole);

    /* Quick-select chips strictly follow the school filter */
    if (filtered.length > 0 && chipsWrap && chipsBox) {
      chipsWrap.classList.remove('hidden');
      chipsBox.innerHTML = filtered.map(t => {
        const subTag = formatTeacherSubjectBadge(tabRole, t.subjectCode, false);
        const pendingTag = t.status !== 'APPROVED' ? ' [รออนุมัติ]' : '';
        return `<button type="button" data-user="${escHtml(t.usernameOrEmail)}"
                        onclick="quickPickTeacherChip('${tabRole}', '${escHtml(t.usernameOrEmail)}')"
                        class="gw-name-chip">
                  <span>${escHtml(t.fullName)}</span>
                  <span class="opacity-75 font-normal">| ${escHtml(getSchoolShortName(t.schoolId))}${escHtml(subTag)}${escHtml(pendingTag)}</span>
                </button>`;
      }).join('');
    } else if (chipsWrap) {
      chipsWrap.classList.add('hidden');
      if (chipsBox) chipsBox.innerHTML = '';
    }

    if (!filtered.length) {
      teacherSel.innerHTML = '<option value="">(ยังไม่มีรายชื่อครูในรายการนี้)</option>';
      if (emptyHint) emptyHint.classList.remove('hidden');
      if (passBox) passBox.classList.add('hidden');
      return;
    }

    if (emptyHint) emptyHint.classList.add('hidden');
    teacherSel.innerHTML = '<option value="">-- คลิกเลือกชื่อครูเพื่อกรอกรหัสผ่าน --</option>' + filtered.map(t => {
      const schName = getSchoolShortName(t.schoolId);
      const subLabel = formatTeacherSubjectBadge(tabRole, t.subjectCode, true);
      const statusLabel = t.status !== 'APPROVED' ? ' (รอครูเกียรติศักดิ์อนุมัติ)' : '';
      return `<option value="${escHtml(t.usernameOrEmail)}">${escHtml(t.fullName)} | ${escHtml(schName)}${escHtml(subLabel)}${escHtml(statusLabel)}</option>`;
    }).join('');

    if (prevVal && filtered.some(t => t.usernameOrEmail === prevVal)) {
      teacherSel.value = prevVal;
    } else if (saved && saved.u && filtered.some(t => t.usernameOrEmail === saved.u)) {
      teacherSel.value = saved.u;
    } else if (filtered.length === 1) {
      teacherSel.value = filtered[0].usernameOrEmail;
    }
    onRoleTeacherSelected(tabRole, false);
  }

  function quickPickTeacherChip(tabRole, username) {
    const ui = ROLE_UI_MAP[tabRole];
    if (!ui) return;
    const filterSel = document.getElementById(ui.filterSchool);
    const teacherSel = document.getElementById(ui.selectTeacher);
    if (teacherSel && !Array.from(teacherSel.options).some(o => o.value === username) && filterSel) {
      filterSel.value = 'ALL';
      renderRoleTeacherSelect(tabRole);
    }
    if (teacherSel) {
      teacherSel.value = username;
      onRoleTeacherSelected(tabRole, true);
    }
  }

  function onRoleTeacherSelected(tabRole, shouldFocus = false) {
    const ui = ROLE_UI_MAP[tabRole];
    if (!ui) return;
    const teacherSel = document.getElementById(ui.selectTeacher);
    const passBox = document.getElementById(ui.passBox);
    const passInp = document.getElementById(ui.loginPass);
    const chipsBox = document.getElementById(ui.chipsBox);
    const pendingEl = document.getElementById(getPendingNoticeIdForRole(tabRole));
    if (!teacherSel || !passBox || !passInp) return;

    const chosenUser = teacherSel.value;
    if (chipsBox) {
      chipsBox.querySelectorAll('.gw-name-chip').forEach(btn => {
        btn.classList.toggle('is-selected', btn.getAttribute('data-user') === chosenUser);
      });
    }

    if (!chosenUser) {
      passBox.classList.add('hidden');
      if (pendingEl) pendingEl.classList.add('hidden');
      return;
    }

    const pickedT = (STATE.teachers || []).find(t => t.usernameOrEmail === chosenUser);
    if (pendingEl) {
      if (pickedT && pickedT.status !== 'APPROVED') {
        pendingEl.textContent = `บัญชี "${pickedT.fullName}" กำลังรออนุมัติสิทธิ์จากครูเกียรติศักดิ์ กรุณา เมื่ออนุมัติแล้วจึงจะเข้าใช้งานได้ครับ`;
        pendingEl.classList.remove('hidden');
      } else {
        pendingEl.classList.add('hidden');
      }
    }

    passBox.classList.remove('hidden');
    const saved = getSavedRoleCred(tabRole);
    if (saved && saved.u === chosenUser && saved.authToken) {
      passInp.value = '';
      passInp.placeholder = '✓ จำสิทธิ์ในเครื่องนี้แล้ว (กดเข้าสู่ระบบได้เลย หรือพิมพ์รหัสใหม่)';
    } else {
      passInp.placeholder = 'กรอกรหัสผ่าน';
      if (!shouldFocus) passInp.value = '';
    }
    if (shouldFocus) setTimeout(() => passInp.focus(), 40);
  }

  async function submitRoleRegister(tabRole) {
    const ui = ROLE_UI_MAP[tabRole];
    if (!ui) return;
    const schoolId = document.getElementById(ui.regSchool).value;
    const fullName = document.getElementById(ui.regName).value.trim();
    const password = document.getElementById(ui.regPass).value;
    const subjectCode = ui.regSubject ? document.getElementById(ui.regSubject).value : 'ALL';

    return withButtonBusy(ui.regSubmitBtn, 'กำลังส่งลงทะเบียน...', async () => {
      try {
        const res = await callGas('apiRegisterTeacher', {
          fullName,
          schoolId,
          role: ui.roleCode,
          subjectCode,
          password
        });
        if (!res || !res.ok) { showToast((res && res.error) || 'ลงทะเบียนไม่สำเร็จ', 'error'); return; }

        if (res.teacher) {
          STATE.teachers = (STATE.teachers || []).concat([res.teacher]);
        }
        document.getElementById(ui.regName).value = '';
        document.getElementById(ui.regPass).value = '';

        toggleRoleAuthMode(tabRole, 'LOGIN');
        if (schoolId) document.getElementById(ui.filterSchool).value = schoolId;
        renderRoleTeacherSelect(tabRole);

        if (res.teacher) {
          const teacherSel = document.getElementById(ui.selectTeacher);
          teacherSel.value = res.teacher.usernameOrEmail;
          onRoleTeacherSelected(tabRole, false);
        }
        const pendingEl = document.getElementById(getPendingNoticeIdForRole(tabRole));
        if (pendingEl) {
          pendingEl.textContent = res.message || `ลงทะเบียน "${fullName}" สำเร็จ! ขณะนี้อยู่ระหว่างรอครูเกียรติศักดิ์กดอนุมัติสิทธิ์ก่อนเข้าใช้งานครับ`;
          pendingEl.classList.remove('hidden');
        }
        renderNotificationsPopover();
        showToast(res.message || 'ลงทะเบียนชื่อครูสำเร็จ! รอครูเกียรติศักดิ์กดอนุมัติก่อนเข้าใช้งานครับ', 'success');
      } catch (err) {
        showToast('ลงทะเบียนไม่สำเร็จ: ' + err.message, 'error');
      }
    });
  }

  async function submitRoleSelectLogin(tabRole) {
    const ui = ROLE_UI_MAP[tabRole];
    if (!ui) return;
    const chosenUser = document.getElementById(ui.selectTeacher).value;
    const rawPass = document.getElementById(ui.loginPass).value;
    const rememberChecked = document.getElementById(ui.chkRemember).checked;
    const clearBtn = document.getElementById(ui.clearBtn);
    const saved = getSavedRoleCred(tabRole);

    if (!chosenUser) {
      showToast('กรุณาเลือกชื่อครูจากรายการก่อนเข้าสู่ระบบ (หากยังไม่มีชื่อ กดปุ่ม + ลงทะเบียนด้านบน)', 'error');
      return;
    }

    if (!rawPass && !(saved && saved.u === chosenUser && saved.authToken)) {
      showToast('กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบครับ', 'error');
      document.getElementById(ui.loginPass).focus();
      return;
    }

    return withButtonBusy(ui.loginSubmitBtn, 'กำลังเข้าสู่ระบบ...', async () => {
      try {
        let res = null;
        if (!rawPass) {
          const restored = await callGas('apiRestoreSession', { authToken: saved.authToken });
          if (restored && restored.ok && restored.kind === 'TEACHER' && restored.teacher && restored.teacher.usernameOrEmail === chosenUser) {
            res = restored;
          } else {
            try { localStorage.removeItem(ROLE_CRED_KEYS[tabRole]); } catch (e) {}
            if (clearBtn) clearBtn.classList.add('hidden');
            document.getElementById(ui.loginPass).placeholder = 'กรอกรหัสผ่าน';
            showToast('สิทธิ์ที่จำไว้หมดอายุ กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบครับ', 'error');
            document.getElementById(ui.loginPass).focus();
            return;
          }
        } else {
          res = await callGas('apiTeacherLogin', {
            usernameOrEmail: chosenUser,
            password: rawPass
          });
        }

        if (!res || !res.ok) { showToast((res && res.error) || 'เข้าสู่ระบบไม่สำเร็จ', 'error'); return; }

        const authToken = res.authToken || STATE.authToken || '';
        if (rememberChecked) {
          try {
            localStorage.setItem(ROLE_CRED_KEYS[tabRole], JSON.stringify({ u: chosenUser, authToken }));
          } catch (e) {}
          if (clearBtn) clearBtn.classList.remove('hidden');
          persistActiveSession({ type: 'TEACHER', authToken, activeTab: tabRole });
        } else {
          try { localStorage.removeItem(ROLE_CRED_KEYS[tabRole]); } catch (e) {}
          if (clearBtn) clearBtn.classList.add('hidden');
          persistActiveSession(null);
        }
        document.getElementById(ui.loginPass).value = '';
        activateTeacherSessionUI(res.teacher, tabRole, authToken, res.initialWorkspace || null);
      } catch (err) {
        showToast('เข้าสู่ระบบไม่สำเร็จ: ' + err.message, 'error');
      }
    });
  }

  /* ========================================================================
   * 7. TAB 2: COMMITTEE DOCX / PDF UPLOAD & PRE-CHECK + ANTI-SHIFT TEMPLATE
   * ======================================================================== */
  const LOCKED_DOCX_TEMPLATE_B64 = [
    'UEsDBBQAAAAIAAlBb13UmUC5EAEAACIFAAAcAAAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVs',
    'c7WUy07DMBBFfyXynjgJUAqq2w1C6haFD3DtyUPED9lTRP8ei7RNiiqLhbuca_veo9GMV5tvNWRf',
    '4HxvNCNlXpAMtDCy1y0jH_Xb3ZJs1qt3GDiGG77rrc_CE-0Z6RDtC6VedKC4z40FHU4a4xTHULqW',
    'Wi4-eQu0KooFdXMPcumZbSUjbitLktUHC__xNk3TC3g1Yq9A45UI6vEwgA-O3LWAjIx1HnwIvR5f',
    'pYzXe7UDF_o4EZylGMR9SojGGNQG5204SzGIh5QQoOUfhpMSQ3hMOguAGPo-n4ajEkNYpETogEtw',
    'E8BYl7H8p9vnV7H8Zcp8DG9hiv8tRzHag-e066Cx5rsB5utwlE4Q9OKzW_8AUEsDBBQAAAAIAAlB',
    'b13rtK9vNwEAAIMCAAARAAAAZG9jUHJvcHMvY29yZS54bWylkl1rwjAUhv9KyX2bpmVOShthG15N',
    'GEzZ2F1IjhrWfJBkVv_90qpVmXe7TN4nD-85bT3bqzbZgfPS6AaRLEcJaG6E1JsGrZbzdIoSH5gW',
    'rDUaGnQAj2a05rbixsGbMxZckOCT6NG-4rZB2xBshbHnW1DMZ5HQMVwbp1iIR7fBlvFvtgFc5PkE',
    'KwhMsMBwL0ztaEQnpeCj0v64dhAIjqEFBTp4TDKCL2wAp_zdB0NyRSoZDhbuoudwpPdejmDXdVlX',
    'DmjsT_Dn4vV9GDWVut8UB0RrwSvugAXj6EqnmikQNb667BfYMh8WcdNrCeLpcMX9zXrcwU72X4mS',
    'gRiP9WnooxtEEstWx9HOyUf5_LKcI1rkxSQlJCXlMi-rYlKRh6ycPn711W4cF6k6lfiX9SyhQ_Pb',
    'H4f-AlBLAwQUAAAACAAJQW9dH6OSluYAAADOAgAACwAAAF9yZWxzLy5yZWxzrZLPSgMxEIdfJcy9',
    'O9tWRKRpL1LoTaQ-QEhmd4PNHyZTrW9vKIpW6tpDj5n85ss3QxarQ9ipV-LiU9QwbVpQFG1yPvYa',
    'nrfryR2slosn2hmpiTL4XFRtiUXDIJLvEYsdKJjSpEyx3nSJg5F65B6zsS-mJ5y17S3yTwacMtXG',
    'aeCNm4Lavme6hJ26zlt6SHYfKMqZJ34lKtlwT6LhLbFD91luKhbwvM3scpu_J8VAYpwRgzYxTTLX',
    'bhZP5VuoujzWcjkmxoTm11wPHYSiIzeuZHIeM7q5ppHdF0nhnxUdM19KePIxlx9QSwMEFAAAAAgA',
    'CUFvXdJ3_LdtAAAAewAAABsAAAB3b3JkL19yZWxzL2hlYWRlcjEueG1sLnJlbHNNjEEOAiEMRa9C',
    'uneKLowxw8xuDmD0AA1WIA6FUGI8vixd_rz3_rx-824-3DQVcXCcLBgWX55JgoPHfTtcYF3mG-_U',
    'h6ExVTUjEXUQe69XRPWRM-lUKssgr9Iy9TFbwEr-TYHxZO0Z2_8H4PIDUEsDBBQAAAAIAAlBb13S',
    'd_y3bQAAAHsAAAAbAAAAd29yZC9fcmVscy9oZWFkZXIyLnhtbC5yZWxzTYxBDgIhDEWvQrp3ii6M',
    'McPMbg5g9AANViAOhVBiPL4sXf689_68fvNuPtw0FXFwnCwYFl-eSYKDx307XGBd5hvv1IehMVU1',
    'IxF1EHuvV0T1kTPpVCrLIK_SMvUxW8BK_k2B8WTtGdv_B-DyA1BLAwQUAAAACAAJQW9d-179skkC',
    'AACRCwAAEAAAAHdvcmQvaGVhZGVyMS54bWzdlt1yojAUx1-Fyb1GsHVdRu107Lbd2Rtn6j5ADAGy',
    'JR-TRNB9-g3IhyttB_DOGxKSc37nf3JO0MXDgSVOSpSmgi-BO54Ah3AsAsqjJfi9fR7NwcNqkflx',
    'oBxryrWfSbwEsTHSh1DjmDCkx4xiJbQIzRgLBkUYUkxgJlQAvYk7KWZSCUy0ttw14inSoMSxNk1I',
    'wu1mKBRDxr6qCDKk3vdyZOkSGbqjCTVHy57MKoxYgr3ifokY1YJyF_8kqBwqD9Ul7snlSeA9I9wU',
    'EaEiidUguI6pbNIYSrObcQVJv0oiZQmoS-DeXVeDJ4UyOzTALvKDkxNLTsq_JrqTDhXJEbVHFwn_',
    'x6yUMER5E3jQ0ZwdrnvfD-BdAmR0XXFelNjLhkavo_3k7zWLk16sssjnqenrxLzFSNY3EB-6wcq-',
    'y3l3EMdIGXJoGG5vyD38DudtkDcAZBP03DZq2hs1g7mqFqhjL1-ArKoWqWNTX5I-SG42jOS1Sd-G',
    'kaZt0nwYqdVOmTvDNOjX49UlgdbzjKP73TXbTCVGH5kVlP_oyuKxUfnwBzuZn6JkCRSNYgPgagHr',
    'zdOjnD8LbrQ1RhpT--3YvjpvSKHdnm_efgG7jvUHi_Ej1y1jmPO42CghwmKu_1Yiph4oV9b6cg3r',
    'YkgQj6otE4-2r3mcHQ1o9XpKoZQdJsHa1sKpZ9ujtCe4I5H9tpeWN5Iq5dqoLTmYvFl8LRG2iUpF',
    'NFEpAavN48uP3Lo2u6nkP6mzJtLqMeTGSv1JtoQHTaKwuOiw-I-9-gdQSwMEFAAAAAgACUFvXScA',
    '3pD2AQAAewgAABAAAAB3b3JkL2hlYWRlcjIueG1spZbbbqMwEIZfBfk-MZA2m0Wl1apVt6u9iZTs',
    'AzjGBKv4INtAuk-_hhjIhqoCcsPgw3zzDzMGHp5OLPdKojQVPAbB0gce4VgklB9j8Gf_utiAp8eH',
    'KsoS5dmtXEeVxDHIjJERhBpnhCG9ZBQroUVqllgwKNKUYgIroRIY-oHf3EklMNHacp8RL5EGDseG',
    'NCEJt4upUAwZO1RHyJB6L-TC0iUy9EBzaj4s21-3GBGDQvHIIRadoNolOgtypvVQY-KeXV4ELhjh',
    'pokIFcmtBsF1RmWfxlyaXcxaSPlVEiXLQVeC4O62GrwoVFnTA8fIT85OLD8r_5oY-CMqUiM6jzES',
    '_o_ZKmGI8j7wrEdz8XCD-2mA8Bogj7cV56cShexp9DbaL_7esTiZxHJFvkxN3yZmlyHZnUB8Ggdz',
    'fVfz7iDOkDLk1DOCyZB7-B1uhqBwBsgmGAZD1Goyag1rVQPQyF6-AllVA9LIpr4mfZLceh4pHJK-',
    'zSOthqTNPNKgnapgjWkyrcfbQwKt5wVHTztrtpkcRn8wK6j-6MrmslW1Uc68Cm60V0VIY2rfDPs3',
    'b4cUOhR8u_sN7DzWn0xmP7gebIY1j4utEiJt7vVfu7VEeQxWIXAzz_p6DuvG5Igf2yWTLfZvdZwD',
    'TWg7tLugkw1dFrBJCTZ_E4__AFBLAwQUAAAACAAJQW9dWHnbIpIAAADkAAAAEwAAAGRvY1Byb3Bz',
    'L2N1c3RvbS54bWydzkEKwjAQheGrlNnbVBcipWk34tpFdR_SaRtoZkImLfb2RgQP4PLxw8drupdf',
    'ig2jOCYNx7KCAsny4GjS8OhvhwsUkgwNZmFCDTsKdG1zjxwwJodSZIBEw5xSqJUSO6M3UuZMuYwc',
    'vUl5xknxODqLV7arR0rqVFVnZVdJ7A_hx8HXq7f0Lzmw_byTZ7-H7Kn2DVBLAwQUAAAACAAJQW9d',
    '4vyd2pMAAADmAAAAEAAAAGRvY1Byb3BzL2FwcC54bWydzkEKwjAQheGrhOxtqguR0rQbce2iug_J',
    'tA00MyETS3t7I4IHcPn44eO1_RYWsUJiT6jlsaqlALTkPE5aPobb4SIFZ4POLISg5Q4s-669J4qQ',
    'sgcWBUDWcs45NkqxnSEYrkrGUkZKweQy06RoHL2FK9lXAMzqVNdnBVsGdOAO8QfKr9is-V_Ukf38',
    '4-ewx-Kp7g1QSwMEFAAAAAgACUFvXZyJyZHOAQAArQYAABIAAAB3b3JkL2Zvb3Rub3Rlcy54bWzV',
    'lM1O4zAQx18l8r11UgFaRU05gEDcEN19AOM4jYXtsWwnoW-_k8RNuiyqCj1xib9mfvOfmdjr23et',
    'klY4L8EUJFumJBGGQynNriB_fj8sfpHEB2ZKpsCIguyFJ7ebdZdXAMFAED5BgvF5Z3lB6hBsTqnn',
    'tdDML7XkDjxUYclBU6gqyQXtwJV0lWbpMLMOuPAew90x0zJPIk7_TwMrDB5W4DQLuHQ7qpl7a-wC',
    '6ZYF-SqVDHtkpzcHDBSkcSaPiMUkqHfJR0FxOHi4c-KOLvfAGy1MGCJSJxRqAONraec0vkvDw_oA',
    'aU8l0WpFphZkV5f14N6xDocZeI78cnTSalR-mpilZ3SkR0we50j4N-ZBiWbSzIG_VZqj4mbXXwOs',
    'PgLs7rLmPDpo7EyTl9GezNvE6i_2F1ixycep-cvEbGtm8QZqnj_tDDj2qlARtizBqif9b02On5yk',
    'y8PeooUXljkWwBHckmVBFtlgaIfPs-sHbxnHCGjAqiDwdqe9sZJ9zqurafHS9CFZE4DQzZpO7uMn',
    'zrdhr_roLVMFeYhqXkQlHL6ZIjpG42o-jvsTbpI9HdBBM529Pk2XgwnSNMMrs_2YevoTMv80g1NV',
    'OFr4zV9QSwMEFAAAAAgACUFvXdJ3_LdtAAAAewAAAB0AAAB3b3JkL19yZWxzL2Zvb3Rub3Rlcy54',
    'bWwucmVsc02MQQ4CIQxFr0K6d4oujDHDzG4OYPQADVYgDoVQYjy-LF3-vPf-vH7zbj7cNBVxcJws',
    'GBZfnkmCg8d9O1xgXeYb79SHoTFVNSMRdRB7r1dE9ZEz6VQqyyCv0jL1MVvASv5NgfFk7Rnb_wfg',
    '8gNQSwMEFAAAAAgACUFvXT9Kjo3BAQAAkgYAABEAAAB3b3JkL2VuZG5vdGVzLnhtbM2U227jIBCG',
    'X8XiPsGOutXKitOLHla9q5rdB6AYx6jAIMD25u13fAjOtlWUNje9MaeZb_6ZMaxv_mqVtMJ5CaYg',
    '2TIliTAcSml2Bfnz-2Hxk9xs1l0uTGkgCJ-gvfF5Z3lB6hBsTqnntdDML7XkDjxUYclBU6gqyQXt',
    'wJV0lWbpMLMOuPAe4bfMtMyTCaff08AKg4cVOM0CLt2OauZeG7tAumVBvkglwx7Z6fUBAwVpnMkn',
    'xCIK6l3yUdA0HDzcOXFHlzvgjRYmDBGpEwo1gPG1tHMaX6XhYX2AtKeSaLUisQXZ1WU9uHOsw2EG',
    'niO_HJ20GpWfJmbpGR3pEdHjHAn_xzwo0UyaOfCXSnNU3OzH5wCrtwC7u6w5vxw0dqbJy2iP5jWy',
    'jPgUa2rycWr-MjHbmlm8gZrnjzsDjr0oVIQtS7DqSf9bk6MXJ-nysLdo4IVljgVwBLdkWZBFNtjZ',
    '4fPk-sFbxjEAGrAqCLzcaW-sZJ_y6iounps-ImsCELpZ0-g-fqb5NuxVH71lqiD3o5hnUQmH76OY',
    '_CZbEU-n7QiLouMBHRTT6PRRqhxMkKYZHpjt27TT75_1h_pPVGCe-80_UEsDBBQAAAAIAAlBb13S',
    'd_y3bQAAAHsAAAAcAAAAd29yZC9fcmVscy9lbmRub3Rlcy54bWwucmVsc02MQQ4CIQxFr0K6d4ou',
    'jDHDzG4OYPQADVYgDoVQYjy-LF3-vPf-vH7zbj7cNBVxcJwsGBZfnkmCg8d9O1xgXeYb79SHoTFV',
    'NSMRdRB7r1dE9ZEz6VQqyyCv0jL1MVvASv5NgfFk7Rnb_wfg8gNQSwMEFAAAAAgACUFvXWPtXtYd',
    'AQAAQwMAABIAAAB3b3JkL2ZvbnRUYWJsZS54bWyd0d1uwiAUB_BXIdwrtZmNaazeLEt2vz0AArVE',
    'Dqfh4NS3H622a-KN3RUQ8v_lfGz3V3DsxwSy6Cu-WmacGa9QW3-s-PfXx2LDGUXptXToTcVvhvh-',
    't72UNfpILKU9laAq3sTYlkKQagxIWmJrfPqsMYCM6RmOAmQ4nduFQmhltAfrbLyJPMsK_mDCKwrW',
    'tVXmHdUZjI99XgTjkoieGtvSoF1e0S4YdBtQGaLUMbi7B9L6kVm9PUFgVUDCOi5TM4-KeirFV1l_',
    'A_cHrOcB-RNQKHOdZ2wehkjJqWP1PKcYHasnzv-KmQCko25mKfkwV9FlZZSNpGYqmnlFrUfuBt2M',
    'QJWfR49BHlyS0tZZWhzrYXafXHew-zLY0AIXu19QSwMEFAAAAAgACUFvXdJ3_LdtAAAAewAAAB0A',
    'AAB3b3JkL19yZWxzL2ZvbnRUYWJsZS54bWwucmVsc02MQQ4CIQxFr0K6d4oujDHDzG4OYPQADVYg',
    'DoVQYjy-LF3-vPf-vH7zbj7cNBVxcJwsGBZfnkmCg8d9O1xgXeYb79SHoTFVNSMRdRB7r1dE9ZEz',
    '6VQqyyCv0jL1MVvASv5NgfFk7Rnb_wfg8gNQSwMEFAAAAAgACUFvXdRtP2z5BQAAyh8AABUAAAB3',
    'b3JkL3RoZW1lL3RoZW1lMS54bWztWU1v20YQ_SsE742-JcuIEtj6iJvYiRErKXIcUStyrSWX2F3a',
    '0a1ITr0UKJAWPTRAbz0URQM0QINe-mMMJGjTH9EhKUu70jKxE7sIUMuAzV2-mX2cmZ19pq7ffBwy',
    '54gISXnUcSvXyq5DIo-PaeR33AfDwWcbriMVRGNgPCIdd0ake_PGddhUAQmJg9aR3ISOGygVb5ZK',
    '0sNpkNd4TCK8N-EiBIVD4ZfGAo7Ra8hK1XK5WQqBRq4TQYhO700m1CPOMHXpLpz3Gf6KlEwnPCYO',
    'vGxF3SLDjqeV9I-cyS4TzhGwjovrjPnxkDxWrsNAKrzRccvZxy3duF5aGDFVYKvZDbLP3G5uMJ5W',
    'MzvhjxaG9Xqj3txa-K_m_tdx_Va_2W8u_GUA8Dx80orFZ6varc-xGii_tPjutXq1ioHX_NfW8FuN',
    '9MfA15b4-hp-MOguY6iB8svGGr6x3d7umf4bS3xzDd8qb_XqLQOfgQJGo-kautxo1rqnT7uATDjb',
    'scLbjfqgVZ3Dl6iSVl25faSKai2EQy4GCMiSC4pGjprFZAIe4rrA6EhQZ5f6ARZeDBGXOF2ulgfl',
    'Gv5Of-rZVZZR2CSgWedTnlybSvk40hM0Vh33Nnp1NcjrV69Onrw8efL7ydOnJ09-na-9brcDka_b',
    'vf3pm3-ef-n8_duPb599a8dLHf_ml6_e_PHnu9wrg9Z3L968fPH6-6__-vmZBb4lYKTDhzQk0rlL',
    'jp37PMQHtCxARuJ8FsMAqG6xFfkSIkhtLOi-Cgz03RkwsOC2iRnHhwLbhQ14Kzk0CB8EIlHUArwT',
    'hAZwj3O2zYX1me6ka-lRSCLfvrhIdNx9gCPb2t2VLPeTGOue2lx2A2LQ3GeYcvBJRJST3uNTQixm',
    'jyg14rpHPcElnyjnEXW2gVpDMqQjZTfaoSHmZWYjiPk2YrP30NnmzOa-R45MJO4NYDaXhBlhvAWJ',
    'gtDKGEKmI3dBBTaSBzPhGQGXCjPtE8ad_phIabO5J2YG3TvYZuxp32Oz0EQKRac25C5wriN7fNoN',
    'IIytnGkU6NjP5RRLFJx9rqwkuLlD0jHmAaLCdD-kRJ1vbz_ANmQvkPROImxbgnBzP87YBIjN-ZYI',
    'jRa7Jai1OrYT3yjtXUIYHMOYEOfB5zY8j7md9O0Au8oOscXmNpi1mo4jIlErpeLGklgqjZI9ID4v',
    '4LM3W2k8M4hCEEWe707NkunjURda65V5U6OVUpFuWjuJezKEM3ndD8Aoq3Qs7fU6E9F59xjaHH6A',
    'DTm3DTb2M8dmCIzYC2YIqDJs7RZNErtJup0ys8RqNzE37TINpRXRE9LovQpoRfs0Lk_7oMJ4_cPz',
    'S9M7F690iprJqr4pwq2qmi4XY_rpi5oeJNE-wXPkStNcaZr_o6Yp2s9XSuZKyVwpmf9MySzFS0l_',
    '0ZN5CQvf-kwoYwdqxsiuzGSPxL0_HuBkNsiMFi-Z4gAv58sZOF9Adu0Irr6gKjgIIMZllEjyRXw5',
    '9-5LJ-YStZNb6D7TXkm4x8f5bKVy-moTDUAt51F7nc6jUlP5bLO1fIe3cJ-NfKkTaGROz05CW8wk',
    'UbOQaNXORqJSvigWbQuLjcq7WJS0rOD55ED6TrxRzxlhxWFVjzvuBJgkcx-nSb6MhBfF1Hz6quUp',
    '2_ULS7hBQqs6k4RWjQEeI6vTF5zydtue8aqVRmvjslJeWu8ULDJHzjFuv1oDXXkQox_8Bwovwxh9',
    'yrRvAfOjjuupebA_pM_EQqoeyCCHZbfyGIRUEeEwGmLZ66lg0ZJbpdoqf7rk2uVPL3Kl1SSTyYR4',
    'qmBmOcR7uRPr3Y8EpwOeIOmDYHzsjFgi7gMGqtGqpAEcU6kW0RxToRX4MoorXSuv-Cyaxjcwy60K',
    'LA5gfsDovT2HZ9cLStqzZGxXn6xkC-PIH1zEOfx-o5XmWXCetAq72aUe-xqxmp1Yw9r22hvldx8Y',
    'H382aNQ27NRqdmpFx8gFSgRtuWZB3KqFCb2Ag2G1eEua4MxGa99489EhboAeytiEKZm_M3uMurx7',
    '-l3loilkpjf-BVBLAwQUAAAACAAJQW9doNBOGm8CAABSDAAAEgAAAHdvcmQvbnVtYmVyaW5nLnht',
    'bM2XS27bMBCGryJw71By5AeEKEHbIIWLvoCmB6Al2ibCF0hKis_QRXfttmfrSTqULPlRILBlBPDG',
    'tDgz3_wUOUP75u5Z8KCkxjIlUxRdhSigMlM5k8sUfX98GExRYB2ROeFK0hStqUV3tzdVIgsxpwbc',
    'ApEls6VUhsw5OFRRHFTRKKh0FKMA6NImlc5StHJOJxjbbEUFsVeCZUZZtXBXmRJYLRYso7hSJsfD',
    'MArrb9qojFoLOd4RWRLb4sT_NKWpBONCGUEcPJolFsQ8FXoAdE0cmzPO3BrY4bjFqBQVRiYbxKAT',
    '5EOSRtBmaCPMMXmbkHuVFYJKV2fEhnLQoKRdMb1dRl8aGFctpHxpEaXg2y2I4vP24N6QCoYt8Bj5',
    'eRMkeKP8ZWIUHrEjHtFFHCNhP2erRBAmt4l7vZqdlxuNTgMMDwF6ed7mvDeq0FsaO482k08dyxf9',
    'CazNJu8uzZ4n5tuKaIp8yyFz6wzJ3OdCBHtPsxxaF_JtJzEUupXxk013erNw1Lw1lDylKKwpouCO',
    'faQl5Y9rTQFUEg4K13PD8k_exr0NYe_LSw4ODAYfDV8dFCFUckl9Qu9RZ2shURMFrfFBdJPzgnPq',
    'Ot4jfe5Mf3__7OY_ZO0sp4uNu_5q_MBkDjY_naLJsNaxInJZt-jrceh98cYZ16xD6dFrSP9xqvQo',
    'jntoH76C9l9_TtU-jMY9tF9fxJEZTqc9tMcXcWZAag_to4s4M_F1n1odX8SZGYV9anVyGdonfWp1',
    'ehHax_FxtYr37r-NqqD-bC7Dg_tylh8sAihf4Gc_3Hl054brlrxj20bhvbD6WfrkeOffwO0_UEsD',
    'BBQAAAAIAAlBb13Ii2NfrQEAACgJAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbMVWy07DMBD8lShX',
    '1LjlgBBqy4HHETiUD3DtTWqIH7I3pf171klbKdCUQhtxibyenZ2xd6NkfLvSZbIEH5Q1k3SUDdME',
    'jLBSmWKSvs4eB9fp7XQ8WzsICaWaMEkXiO6GsSAWoHnIrANDSG695kihL5jj4p0XwC6HwysmrEEw',
    'OMBYI52O7yHnVYnJXbMfS09SpWO-M0WaPKxou7ETY3aQ8eagTak3fs35iTLXrsWI8WFGofIWI8aH',
    'GWFZXNA9tli018nizpVKcKREtjTySx8Gmx5kHso6JyyUC98ECA1HKXwlxviPzmyeKwHSikoTJbPz',
    'vAqUDfKRirRErESsr-2ZJtQrCafofFgvnbcCQqDh1mW2QzRXprmZF-7xiWuqzWI626VsjtuLj4Dr',
    'EsJ-Aw12kvx2EIT1MCBhBx7VHj0y-EJoYDHxnAcWVUCrj5OuU88pDnGaJMij5Kl0r502lZ6Dp_X-',
    'Zu_gXk3k1qKx2DVxO7hXE9STAx62aL-vHSDSquvF26A9t4IK8XkJXa3YwOc0gfTV7tCroeY56vXc',
    'C-AS_H4TDfbf-pdbfVb_-kw_AVBLAwQUAAAACAAJQW9dNqTQcaYMAADRowAAEQAAAHdvcmQvZG9j',
    'dW1lbnQueG1s7V1tb9vIEf4rCwEtkg8R9WZZVs855Bzn7DaXBLGv_XA4CDRFWWwoUSXpt6AfTqmA',
    'OGkKFGgcn5JrrrYb5C5GgMSX9Kh_w5_S3VkuuRIpm5JtWY4XNiRyyZ1d7swzMzs7S332-XpNR6uq',
    'aWlGfTqRTqYSSK0rRlmrL08nvl68caWQQJYt18uybtTV6cSGaiU-v_rZWrFsKCs1tW6jmlKcX64b',
    'pryk4-tr6RxaS0-gtUY6l0CYeN0qrjWU6UTVthtFSbKUqlqTrWRNU0zDMip2UjFqklGpaIoqrRlm',
    'Wcqk0ik4apiGoloW7smMXF-VLUauFqZmNNQ6vlgxzJps41NzWarJ5r2VxhVMvSHb2pKma_YGpp3K',
    'MzLGdGLFrBc9Elf8DpEqRdoh74vVMOO0S6tc90YHWpRMVcd9MOpWVWsEjzEsNXyxyoisHvYQqzU9',
    'YEE6dzweXDflNfwVEIzT_TKtVNNpzw-nmE7F4Agh4deI04XuNllParJWDxoeami4wU1PDEYg00ug',
    'sXw85nxpGiuNgJp2PGrz9Xs-LYL5AWh5TOYfzTpeZxaqcsNHoLIej5gnd4ReTlKqsmmr6wGN9MBE',
    'JqQpqRAmlBmCEH7ATDpMKjswqbxEehUiFFOWewjhXoUoxRTqXkoRD5cfjlImTGlyOErZMKXCcJRC',
    '4oQVyb0hSGkBxuRatjwwhUmpZpRVPRsow3ReUWPCg2Gt4IFVUoLnIXS0mP1hdPI-HY3vz3Cd4QhY',
    'ZbtcHYhKhulmidSVbbkqW1We4mDqDOOVkduo4TEijs-SUd4g3w34uGOSr3uq2rilrtsSObEasoK5',
    'hNaKcsVWsdOQw04Vrqdis4SbhxNdI4o1k08loMqfFVy2KuvTCQWbedUkpZJPnX54xzeMum0R2pai',
    'YT2_OIcWZOx7rdTvLPyBUFasiMLqtboVuhlaXqKfMxZ81407pmFU6GPcZ33Keb207s9YvWUKrajL',
    '8MBwya5eWZyDJ9bKGjulD-Q9hE0YAuOEB6FhqpZqrqqJq27nO9d56zpN13njOgeuswcH-NNxnRdw',
    'te06v7qdR3DbPrmng29-5TrvXOcx3PbUdR6wG97A53PX2QWae3AbvuE9FP4AFd_A6Y7r_Nd1tl3n',
    'e9f54HaeoNtXbs0uIiD6Hsi1SQ88Es-gwk-u8z-g-zP0FV_9CCQ-up1NlEespMmepOt-lJnIT5ER',
    'sem4UHYPJlbY2gq5iiVXZPgPQAxeE_4Srh6USgtff_H70q1rX82WSugSPl28e-3Wda_g8jF5k-9i',
    'TTp3OHN0tWKPF2uymTBrWNnJsmaL4QN_PuTAixHWAYT6sNt0nV_I_R4cHwGKKZZ3oPoW3PlPOG6j',
    'S6R25yHTKA-g0gEoAF4Z4JKf0bUc4jRJC-TkAMg2yTFpkXavp7ct-PRA73ZapAo5-A4uvQJltQk9',
    'aEdLlL2ke1_eMC3pf8LDaG808DCV12UypniaU8jieavk3fAFtkh4wg5nRoOxgPjKugriYOgGFkF5',
    'xTbIqXUfo4pWJnI2yP1Lhm0btUFqmNpydaAmNCylZXVu8Cp_jF9F6h42qXu8vzS1Mjlcxt8zhk4H',
    'PFPIeK11FU_kCpmAIqtpU1KepCty3V5o6JrN-DWnyrhhrxaDg0I_2VkU04M-2EpMnmfy5I89fCEG',
    '1yemyN9gfI9s5XDORzQj9TyXVS3jyxVNx_VnC7OzNyYieEptma7KJhuZr2QzGJUQblJdQ9B7OZ1J',
    '9TxwPwLs6fpQkPyeSAFXeWsRYbx5A5Hh7UPuXBjvbITxzp6u8fZdqbCRiDAAkaYiQglLARqPxiRT',
    'AAKTApMCk7uex-TN2z5CydOQy-ZP5t4FGCZV9liVNhx3MFz741MK7Gw_a3v69jUSmSeO5cg6x8by',
    'xYDliKdSrNmKrFtqgkE0ovSsAUsnNw5MR_Ac5QEg7mEPDJGEWETkIVTBB0_PwGQKmAmYfcIwg1gg',
    'nJJyah1fu85_4KBFIfgSW9EkC3--A__VoZUQ1MKUt1AGXSqgfq1EBRyELRUgFyA_hWgyFz3kvV0W',
    'GSSn_qrDB_CRH9PFCWFdBfAE8E5qGeevqGcdR9hAAUUBxdOB4j7YtDcQdn0PmHwM5u4RHL8HK7fF',
    '1tF-YLPK3tV56u5iQ_lTst-iuDCIAoUChWEUlkrz2NDdnF9YFIZOQExA7FQMXctbmyAWrAO2a5MZ',
    'N2y0fiEh0z4BGGHJBMwEzGJassXZazNzs3dLCzNzt2_fFPZMAE0A7VTsGQ2dfA9W6gWbi_mrfW2Y',
    '1rVZxmNvomRkZiNKp1K_EcZOYFBgMBYG05cRrO99gMDIS7fzJHprA8lfA4h1_gaQxLj7EXKan8DN',
    'EGkhhU-h1jbDL1lz6E1-PiLh-UcKZGjxCeoaWgRNQAo0vR_CO0enxwvBOXnByRDBecZ0cxtyq-jc',
    '5AVbPX7JUiFpAvtDBMKzz4JykLVOxcmTCbpBpietfR-Of4WrW2wHDKS7E4E8AHF9AeLVRr_9y4ph',
    '_w6o7MH_tjc9Ijc9ZZOh18zAPOcigEGePbo0X0c3sTSgNc2uokV13b5MCSPWexpG5HrDdSJqGF5B',
    'E7tCUM9AULOXaZLCDucmdM2aWeLDHvBvk-qiNugiKtZNuPU5p9Ng7xTPc04fomSjXPGJPCekSat0',
    'g0YHjpn0ddUqG8o6Ynjw8ywOWZP15h7ki27ciL8jqNAtVudvR1A-Qnbyp-GhUua99o0Z2U-XLqKu',
    'vYBde3T2WGRmy4vDEGGjewHfchsKeVW3c8iqBdkMFgRW4-8Ei4DhEVIQJQNanaZcm5Z9E65MZkLS',
    'YVdl7bpm2aa2tGKr46h_tKiyQTTVyPaf8ULFp268AT3UApH4B1Vn23DeBs-txW1HIFnOvDvFpI96',
    'dd4eBD8VZAdINsOyeSKbTmOINy_dxFFsQXf_xYU64zin_LjFwx3vzGKfwLML_HQz5NWSpl-BA9Hy',
    'c2jE1sxRQYP3EPnZxBZY8CbjHbW0vR4YBMabEDZvdxX2OptHaHVPQvttyOzagYnSuWR-Ajfxd3xr',
    'Uuy4PE87LtmAS2sj2FrJcVds4xLbuC7sNq6XzKzzDgqLE4RVerdC74A-_oC64wW80Tji5R1EtUeG',
    'oFnDUdHm0MRyD3q84_kK4GGNNPV9CF0iItfjrhZEXCdKYXzDnP8mQPBjVNyN0wXR2qJvQPIxQ3T4',
    'PRv-xKBJIzQjiDr6Osif1h26MEamPu-CN4CQ_Tm7LOTUb83sWxFoGrtAU6aIfClznX-z6fY2m7Rj',
    'Tr-Tot4xFXpNTZ_ptwgnfdLhpBZw_zGnr8j0uMirvbYnSz2bAr1Yh-9FtZgcUfny3bNnoJia7PUW',
    'b7teQUTk0Y89vWTEubTrbv1IPLCe_YVxsrq3mRrchdy3TWh_FxYmt4FO02-QRs6oam-jb0qlG_N3',
    'FxYhAlX6VoRyRiWWh7wcz18i8d-Q1Y6vzXoWmom8P4MAjf8qLF_sH7C3bz3g1vN4m_oWSG6BSLVZ',
    'nBS3_EEEcs5TIGdqapI21lU6mU1NjSy843dBRHdEdOfiRnd8Xe95B8fN0WMYFrgSuLrAuOp1eUMu',
    'VRAyYH5Tt2-PcqjfpVEGLge3kiJuKYA5vsBMn4F9E4gYd0SISH7fpT8-x6efTfMzKxAXZGp7hclk',
    'sjekI_Jtz2pHQbRDwXFQsOascvaPYk1GsOaMstSPZE1WsOYMWJOLw5qcmCwJ11BMloa0S2KyJBAh',
    'rNHpTJYyYrI0vtwUk6WxZY2YLI0ta8RkaWxZc0KTJZFrOupc02yRZsc98jY5BuuG_Et6WuyN4RE_',
    'tSPy58LsG8GvVPJM68nT7PoVyV-gEH5TlmTa8e-uHpK3IuntPCW9pbOZqYjiialCKmhH5MKJnB0R',
    '7TpvuXABtAWuBK4uLq6O2KVyXJgxUylgJmAmYBZvMuFPQch8Yh_A6cBGXO-VeN5L_MiusIhpB9nR',
    'Q999tM_9bFWfPWsE7xT1r0f9i3NiQVZg_FPC-LGzV4fwSAUiBCI-YUQM4TwKRIw7IsQaULSHGPYN',
    '98G_e89eJnCkb-jP3fqtJbEt_WkU-RaCZDIpHEABbmHuzigjTziAAhGfFCKi0kmEA3jRESEcwDN3',
    'ALPDO4BBlpGlKjZ9pCosbd9VK6qp1hU1kCy1Iq_odgKZRa08nTDny15SQ78K8Joz7nbPQWwsL9z3',
    'JDQ9lYKgfRUf5wvZAjk2TA0rWTyYhmmbsmazSliEEWAJi2GapsqA5JNMGZoqQ5ESnBPRDG6mvZxO',
    'TKagmYph2Nzp8ooNp0xBabau3lmG47KhkKQADwR3NFupkrQkBi42cBLpQHkDDnCVlRp-iqv_B1BL',
    'AwQUAAAACAAJQW9dk4gBcN0BAADyBQAAEQAAAHdvcmQvc2V0dGluZ3MueG1spZTbbtswDIZfxdB9',
    'YjtYt8GoW2zregA27CLZAzCSbAuRREGSneXtR8dxnG5AkTRXkk3x409S4u39H6OTTvqg0JYsn2cs',
    'kZajULYu2e_V4-wzS0IEK0CjlSXbycDu7263RZAx0qGQEMCGYut4yZoYXZGmgTfSQJgbxT0GrOKc',
    'o0mxqhSX6Ra9SBdZnu13ziOXIRDoG9gOAjvgzP80dNKSsUJvINKnr1MDftO6GdEdRLVWWsUdsbOP',
    'IwZL1npbHBCzo6DepRgEHZbRw58Td3B5QN4aaeM-YuqlJg1oQ6PclMZ7aWRsRkj3VhKd0ezYgvzD',
    'dT148LClZQKeI18MTkYPyt8m5tkZHekRR49zJLyOOSoxoOwU-F2lOSlufnMZYPEvwNXXNefJY-sm',
    'mrqO9mI3R1b_ri9gHZp8mlq4TsyyAUcv0PDipbboYa1JEbUsoaon_bVm_cQRKjgNu6_ANzXVwoq9',
    'W9qbGiXk0kmtCfbde_Th-PvJg6GLojjoE4uQFbQ6rmC9jOiSbdGBLtmnRcb2ZtlJ-8WKX0I8SxA0',
    'HccTFegghzPD1Jl2y2EgjifzG0ZbC4ZSeTWgfqKQvan1F7SwD5mexozkIB_Rxh8wxYzNbPXcs9dK',
    'qPFz8BzH9d1fUEsDBBQAAAAIAAlBb10pyKrMjwQAADAfAAAPAAAAd29yZC9zdHlsZXMueG1s5VlZ',
    'b9s4EP4rgt4THZZP1C1Sp0aC7bZG42KfaYmyiFKklqTipL9-SV12TCk-pBib3aeYM8PhfHMQn5gP',
    'n55ibDxCxhElU9O5tk0DEp8GiKyn5s_l_GpkGlwAEgBMCZyaz5Cbnz5-2Ey4eMaQG7E_uV8TysAK',
    'S-3G8YyN0zcN6ZXwSexPzUiIZGJZ3I9gDPg1TSCRypCyGAi5ZGsrBuxXmlz5NE6AQCuEkXi2XNse',
    'lG7YMV5oGCIf3lI_jSER2X6LQSw9UsIjlPDS2-YYbxvKgoRRH3IuMxHj3F8MEKncOJ7mKEY-o5yG',
    '4lqCKSLKXMntjp39ivHWQf80B27pQKU_oP4tDEGKBVdLtmDFslhlf-aUCG5sJoD7CE3N5Z3xAGSl',
    'UrJ4-MOUcp_XCKMbwjVjS_kjdMEoDbPf_Lc0fQR4avZcs5DM-L4MA7IuZSK6Wt6pA1YoQOVSWllF',
    'vNY-imR_lZ2SAB9lTkEooOyMka18YqSa0x3Yhcek8Ljrw9KylvWw3C2eE7k7kXDXDCSRcpip7oOp',
    '-U11BVaiIN8ppySrAAExLLEVRhnmv-dZH-VxZG70o4QalxfHLJWk5izBUthwnJHtyQ9N0YIhyuTk',
    'lDbjcVEWGKM7FASQ5IYkQgH8K4LkJ4dBJhIrnOdW_rgnQRVk8ARUKHJebLM0nEGM_wS5NU2aTTEM',
    'RY3WsUe5fkWFoHHzfobW0SsOrJfBWBWI5pTXV3eJBNbzm0vzQIFM03dSV2gCn8TrDVBN4nZa-gN9',
    'WnLZzhycBOEOAnVb601ZKAynSyQ-xZSVtu6Xofe5bx59IbSE6DZCdC8M0a2pottFFXuNEHtvBtGZ',
    'e7fDkQbRq4HodQDRa4TodQkRZQs049YrNW0Jpd8IpX-BhmwZ_KAx-MEFWu3c4B8Eo2SthV6IO4x7',
    'lfvK-ufcYL8iLhaVZj9mpTW26kOxH8Mr6sOYgUSxYC0Av5CfmzWddPTKm_Ig6djNeBO1k5x7l84d',
    'M9qe1_cGNwq9kIwazpRO8gf5heHuX3DOSL_gnFa9-RmtMKKZ_FlL9gtlhxkfmvUpPpkJfZ_pFEJQ',
    'vwV9qIn2aFLa1BOOvU_xT0WpswiF8nwG8YYoZZNnfFyxacWh2kLX2YWCfj6zuBj0gdcWus46FPTz',
    'GcfFoI-1b9pToessRUE_n6FcDLrjjtpi10mOwn4-wbkc9kHri25Yi334DrCPW990o1rso38_dtdt',
    'fdWNa7GP3wH2_rF3nR9J8L709PLDRuoYRuSX_mVTaeqSUDwJVlRcPZseelarwVr3wWP3B71ZwaDS',
    'UqielPP3pcNMsx7pnFJBqIA_YAgZJL7-hBUWFgarTLqCfrjqRSYeIRM3GK2r03gqy8B9hhLRhmeX',
    '6JeyYZuBC6U91POqJ0r5rtuZTHv7PDR1_-6TtVctfqTqXyggFbT2q2fnacaueZqxu-inCvp-VksD',
    'Q1kY2-wc3U5Nie6s2d4yPV9I8Pq0wdzgvzhsBfbaWSthnzxqO07_Z5O2j3w_pYW-kznbLd17GLOv',
    'sjTf0ngF9bSoqhkk111qtLbhl7_4x38AUEsBAhQAFAAAAAgACUFvXdSZQLkQAQAAIgUAABwAAAAA',
    'AAAAAAAAAAAAAAAAAHdvcmQvX3JlbHMvZG9jdW1lbnQueG1sLnJlbHNQSwECFAAUAAAACAAJQW9d',
    '67SvbzcBAACDAgAAEQAAAAAAAAAAAAAAAABKAQAAZG9jUHJvcHMvY29yZS54bWxQSwECFAAUAAAA',
    'CAAJQW9dH6OSluYAAADOAgAACwAAAAAAAAAAAAAAAACwAgAAX3JlbHMvLnJlbHNQSwECFAAUAAAA',
    'CAAJQW9d0nf8t20AAAB7AAAAGwAAAAAAAAAAAAAAAAC_AwAAd29yZC9fcmVscy9oZWFkZXIxLnht',
    'bC5yZWxzUEsBAhQAFAAAAAgACUFvXdJ3_LdtAAAAewAAABsAAAAAAAAAAAAAAAAAZQQAAHdvcmQv',
    'X3JlbHMvaGVhZGVyMi54bWwucmVsc1BLAQIUABQAAAAIAAlBb137Xv2ySQIAAJELAAAQAAAAAAAA',
    'AAAAAAAAAAsFAAB3b3JkL2hlYWRlcjEueG1sUEsBAhQAFAAAAAgACUFvXScA3pD2AQAAewgAABAA',
    'AAAAAAAAAAAAAAAAggcAAHdvcmQvaGVhZGVyMi54bWxQSwECFAAUAAAACAAJQW9dWHnbIpIAAADk',
    'AAAAEwAAAAAAAAAAAAAAAACmCQAAZG9jUHJvcHMvY3VzdG9tLnhtbFBLAQIUABQAAAAIAAlBb13i',
    '_J3akwAAAOYAAAAQAAAAAAAAAAAAAAAAAGkKAABkb2NQcm9wcy9hcHAueG1sUEsBAhQAFAAAAAgA',
    'CUFvXZyJyZHOAQAArQYAABIAAAAAAAAAAAAAAAAAKgsAAHdvcmQvZm9vdG5vdGVzLnhtbFBLAQIU',
    'ABQAAAAIAAlBb13Sd_y3bQAAAHsAAAAdAAAAAAAAAAAAAAAAACgNAAB3b3JkL19yZWxzL2Zvb3Ru',
    'b3Rlcy54bWwucmVsc1BLAQIUABQAAAAIAAlBb10_So6NwQEAAJIGAAARAAAAAAAAAAAAAAAAANAN',
    'AAB3b3JkL2VuZG5vdGVzLnhtbFBLAQIUABQAAAAIAAlBb13Sd_y3bQAAAHsAAAAcAAAAAAAAAAAA',
    'AAAAAMAPAAB3b3JkL19yZWxzL2VuZG5vdGVzLnhtbC5yZWxzUEsBAhQAFAAAAAgACUFvXWPtXtYd',
    'AQAAQwMAABIAAAAAAAAAAAAAAAAAZxAAAHdvcmQvZm9udFRhYmxlLnhtbFBLAQIUABQAAAAIAAlB',
    'b13Sd_y3bQAAAHsAAAAdAAAAAAAAAAAAAAAAALQRAAB3b3JkL19yZWxzL2ZvbnRUYWJsZS54bWwu',
    'cmVsc1BLAQIUABQAAAAIAAlBb13UbT9s-QUAAMofAAAVAAAAAAAAAAAAAAAAAFwSAAB3b3JkL3Ro',
    'ZW1lL3RoZW1lMS54bWxQSwECFAAUAAAACAAJQW9doNBOGm8CAABSDAAAEgAAAAAAAAAAAAAAAACI',
    'GAAAd29yZC9udW1iZXJpbmcueG1sUEsBAhQAFAAAAAgACUFvXciLY1-tAQAAKAkAABMAAAAAAAAA',
    'AAAAAAAAJxsAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAAUAAAACAAJQW9dNqTQcaYMAADRowAA',
    'EQAAAAAAAAAAAAAAAAAFHQAAd29yZC9kb2N1bWVudC54bWxQSwECFAAUAAAACAAJQW9dk4gBcN0B',
    'AADyBQAAEQAAAAAAAAAAAAAAAADaKQAAd29yZC9zZXR0aW5ncy54bWxQSwECFAAUAAAACAAJQW9d',
    'KciqzI8EAAAwHwAADwAAAAAAAAAAAAAAAADmKwAAd29yZC9zdHlsZXMueG1sUEsFBgAAAAAVABUA',
    'bQUAAKIwAAAAAA=='
  ].join('');
  function onUploadCategoryChange() {
    const catEl = document.getElementById('upDocCategory');
    const roundWrap = document.getElementById('upExamRoundWrap');
    const scopeWrap = document.getElementById('upExamScopeWrap');
    const guideEl = document.getElementById('upPrePostGuideNote');
    const autoSyncBox = document.getElementById('autoSyncPracticeToggleBox');
    const isExam = catEl && catEl.value === 'PREPOST_EXAM';
    if (roundWrap) roundWrap.classList.toggle('hidden', !isExam);
    if (scopeWrap) scopeWrap.classList.toggle('hidden', !isExam);
    if (guideEl) guideEl.classList.toggle('hidden', !isExam);
    if (autoSyncBox) autoSyncBox.classList.toggle('hidden', isExam);
    onUploadStrandChange();
    if (STATE.preCheckSlots && STATE.preCheckSlots.STUDENT) runSlotDocxPreCheck('STUDENT');
    if (STATE.preCheckSlots && STATE.preCheckSlots.TEACHER) runSlotDocxPreCheck('TEACHER');
  }

  function onUploadSubjectChange() {
    const subCode = document.getElementById('upSubjectCode').value;
    const rows = STATE.blueprint.filter(r => r.subjectCode === subCode);
    const strandMap = new Map();
    rows.forEach(r => {
      if (!strandMap.has(r.strandNo)) strandMap.set(r.strandNo, r.strandName);
    });
    const strandSel = document.getElementById('upStrandNo');
    strandSel.innerHTML = Array.from(strandMap.entries()).map(([no, name]) =>
      `<option value="${escHtml(no)}">สาระที่ ${escHtml(no)} ${escHtml(name)}</option>`
    ).join('');
    onUploadStrandChange();
  }

  function onUploadStrandChange() {
    const subCode = document.getElementById('upSubjectCode').value;
    const strandNo = document.getElementById('upStrandNo').value;
    const rows = STATE.blueprint.filter(r => r.subjectCode === subCode && String(r.strandNo) === String(strandNo));
    const stdSet = Array.from(new Set(rows.map(r => r.standardCode)));
    const roundSel = document.getElementById('upExamRound');
    const rKey = (roundSel && roundSel.value === 'POST') ? 'POST' : 'PRE';
    const customExamItems = (STATE.examStructure || []).filter(k => k.subjectCode === subCode && k.round === rKey);

    const subSel = document.getElementById('upSubStandard');
    const prevVal = subSel.value;
    let html = '<option value="ALL">ครบทั้งสาระ (ทำรวมเป็นชุดเดียวของสาระนี้)</option>';
    if (stdSet.length > 1) {
      html += '<optgroup label="แบ่งตามมาตรฐานย่อย">';
      stdSet.forEach(sd => {
        const stdExam = getExamBlueprintItemsForScope({
          subjectCode: subCode,
          strandNo,
          subStandard: sd,
          examScope: 'BY_STRAND',
          examItems: customExamItems
        });
        const rng = formatLockedRangeSummary_(stdExam);
        html += `<option value="${escHtml(sd)}">มาตรฐาน ${escHtml(sd)}${rng !== '-' ? ' (' + escHtml(rng) + ')' : ''}</option>`;
      });
      html += '</optgroup>';
    }
    if (rows.length > 1) {
      html += '<optgroup label="แบ่งรายตัวชี้วัด (กรณีครูช่วยกันทำหลายคน)">';
      rows.forEach(r => {
        const normInd = String(r.indicatorCode || '').replace(/\s+/g, '');
        const exactItems = getExamBlueprintItemsForScope({
          subjectCode: subCode,
          strandNo,
          subStandard: 'ALL',
          examScope: 'BY_STRAND',
          examItems: customExamItems
        }).filter(it => String(it.indicatorCode || '').replace(/\s+/g, '') === normInd);
        const rngTag = exactItems.length ? ` [ข้อสอบ ${formatLockedRangeSummary_(exactItems)}]` : '';
        html += `<option value="${escHtml(r.indicatorCode)}">เฉพาะตัวชี้วัด ${escHtml(r.indicatorCode)}${escHtml(rngTag)}</option>`;
      });
      html += '</optgroup>';
    }
    subSel.innerHTML = html;
    if (Array.from(subSel.options).some(o => o.value === prevVal)) subSel.value = prevVal;

    const docCatEl = document.getElementById('upDocCategory');
    const scopeEl = document.getElementById('upExamScope');
    const isExam = docCatEl && docCatEl.value === 'PREPOST_EXAM';
    const isWholeExam = isExam && scopeEl && scopeEl.value === 'WHOLE_SUBJECT';
    const inds = getExpectedUploadIndicators();
    const scopedItems = getExamBlueprintItemsForScope({
      subjectCode: subCode,
      strandNo: isWholeExam ? 'ALL' : strandNo,
      subStandard: isWholeExam ? 'ALL' : subSel.value,
      examScope: isWholeExam ? 'WHOLE_SUBJECT' : 'BY_STRAND',
      examItems: customExamItems
    });
    const lockedRangeText = formatLockedRangeSummary_(scopedItems);
    const lockedExamHtml = `
      <div class="mb-2 rounded-lg px-2.5 py-1.5 border text-xs font-bold flex flex-wrap items-center gap-2" style="background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.35); color: var(--gw-ink);">
        <span>🔒 ช่วงเลขข้อสอบคู่ขนาน Pre/Post ตามผัง สทศ. ของขอบเขตนี้:</span>
        <span class="px-2 py-0.5 rounded bg-emerald-600 text-white">${escHtml(lockedRangeText)}</span>
        <span class="text-[11px] font-normal opacity-85">(${scopedItems.length} ข้อ | เวลาแอดมินกดรวมเล่มจะเรียงเข้าข้อ 1..N อัตโนมัติ)</span>
      </div>
    `;
    document.getElementById('expectedIndicatorsBox').innerHTML = `
      ${lockedExamHtml}
      <div class="font-bold">${isWholeExam ? `ตัวชี้วัดในผังข้อสอบชุดนี้ (${inds.length} ตัวชี้วัด — เฉพาะไฟล์ฉบับครูต้องมีผัง/เฉลย, ฉบับนักเรียนห้ามใส่รหัสตัวชี้วัด):` : `รหัสตัวชี้วัดที่รับผิดชอบในขอบเขตนี้ (${inds.length} ตัวชี้วัด):`}</div>
      <div class="pt-1">${inds.map(i => `<span class="inline-block rounded-lg px-2 py-0.5 mr-1 mb-1 font-bold border" style="background: var(--gw-input-bg); border-color: var(--gw-line);">${escHtml(i)}</span>`).join('')}</div>
    `;
  }

  function getExpectedUploadIndicatorsForCategory_(docCategoryOverride, examScopeOverride) {
    const subCode = document.getElementById('upSubjectCode').value;
    const strandNo = document.getElementById('upStrandNo').value;
    const chosenStd = (document.getElementById('upSubStandard') && document.getElementById('upSubStandard').value) || 'ALL';
    const docCatEl = document.getElementById('upDocCategory');
    const scopeEl = document.getElementById('upExamScope');
    const docCategory = String(docCategoryOverride || (docCatEl && docCatEl.value) || 'TUTORING_STRAND').toUpperCase();
    const examScope = String(examScopeOverride || (scopeEl && scopeEl.value) || 'BY_STRAND').toUpperCase();

    if (docCategory === 'PREPOST_EXAM') {
      const roundSel = document.getElementById('upExamRound');
      const rKey = (roundSel && roundSel.value === 'POST') ? 'POST' : 'PRE';
      const customExamItems = (STATE.examStructure || []).filter(k => k.subjectCode === subCode && k.round === rKey);
      const isWhole = examScope === 'WHOLE_SUBJECT';
      const scopedItems = getExamBlueprintItemsForScope({
        subjectCode: subCode,
        strandNo: isWhole ? 'ALL' : strandNo,
        subStandard: isWhole ? 'ALL' : chosenStd,
        examScope: isWhole ? 'WHOLE_SUBJECT' : 'BY_STRAND',
        examItems: customExamItems
      });
      const uniqueExamInds = Array.from(new Set(scopedItems.map(it => it.indicatorCode).filter(Boolean)));
      if (uniqueExamInds.length > 0) return uniqueExamInds;
    }

    return STATE.blueprint
      .filter(r => r.subjectCode === subCode && String(r.strandNo) === String(strandNo) && (chosenStd === 'ALL' || r.standardCode === chosenStd || r.indicatorCode === chosenStd))
      .map(r => r.indicatorCode);
  }

  function getExpectedUploadIndicators() {
    return getExpectedUploadIndicatorsForCategory_(null, null);
  }

  function uint8ToBase64_(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function buildTemplateDocxUint8_({ docCategory, targetAudience, examRound, examScope }) {
    const subCode = document.getElementById('upSubjectCode').value;
    const strandSel = document.getElementById('upStrandNo');
    const strandNo = strandSel.value;
    const strandText = strandSel.options[strandSel.selectedIndex] ? strandSel.options[strandSel.selectedIndex].textContent : `สาระที่ ${strandNo}`;
    const subName = SUBJECT_NAMES[subCode] || subCode;
    const subStandard = (document.getElementById('upSubStandard') && document.getElementById('upSubStandard').value) || 'ALL';
    const inds = getExpectedUploadIndicatorsForCategory_(docCategory, examScope);
    const indicatorDetails = STATE.blueprint.filter(r => r.subjectCode === subCode && inds.includes(r.indicatorCode));
    const roundKey = examRound === 'POST' ? 'POST' : 'PRE';
    const examItems = (STATE.examStructure || []).filter(k => k.subjectCode === subCode && k.round === roundKey);

    const binStr = atob(REPORT_DOCX_SKELETON_B64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

    const zip = await JSZip.loadAsync(bytes);
    const xml = buildManuscriptTemplateDocumentXml({
      subjectCode: subCode,
      subjectName: subName,
      strandNo,
      strandName: strandText,
      subStandard: subStandard === 'ALL' ? 'ครบทั้งสาระ' : subStandard,
      expectedIndicators: inds,
      indicatorDetails,
      docCategory,
      targetAudience: String(targetAudience || 'STUDENT').toUpperCase(),
      examRound,
      examScope,
      examItems
    });
    zip.file('word/document.xml', xml);
    return zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE'
    });
  }

  async function downloadSpecificTemplateEdition(docCategory, targetAudience = 'STUDENT') {
    const catEl = document.getElementById('upDocCategory');
    const hasPendingFiles = (STATE.preCheckSlots && (STATE.preCheckSlots.STUDENT || STATE.preCheckSlots.TEACHER));
    if (catEl && !hasPendingFiles && catEl.value !== docCategory) {
      catEl.value = docCategory;
      onUploadCategoryChange();
    }
    return downloadLockedStrandDocxTemplate(targetAudience, docCategory);
  }

  async function downloadLockedStrandDocxTemplate(targetAudience = 'STUDENT', docCategoryOverride = '') {
    try {
      if (typeof JSZip === 'undefined') throw new Error('JSZip ยังไม่พร้อมทำงาน');
      const subCode = document.getElementById('upSubjectCode').value;
      const strandNo = document.getElementById('upStrandNo').value;
      const subName = SUBJECT_NAMES[subCode] || subCode;
      const docCategory = String(docCategoryOverride || (document.getElementById('upDocCategory') && document.getElementById('upDocCategory').value) || 'TUTORING_STRAND').toUpperCase();
      const examRound = (document.getElementById('upExamRound') && document.getElementById('upExamRound').value) || 'PRE';
      const examScope = (document.getElementById('upExamScope') && document.getElementById('upExamScope').value) || 'BY_STRAND';
      const subStandard = (document.getElementById('upSubStandard') && document.getElementById('upSubStandard').value) || 'ALL';
      const audience = String(targetAudience || 'STUDENT').toUpperCase();

      const u8 = await buildTemplateDocxUint8_({ docCategory, targetAudience: audience, examRound, examScope });
      const outBlob = new Blob([u8], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const subSlug = subStandard === 'ALL' ? `สาระที่${strandNo}` : `สาระที่${strandNo}_${subStandard.replace(/\s+/g, '').replace(/[/.]/g, '-')}`;
      let editionNoSlug = '03_ฉบับที่3_เอกสารยกระดับ_ฉบับนักเรียน';
      if (docCategory === 'PREPOST_EXAM' && audience === 'STUDENT') editionNoSlug = `01_ฉบับที่1_ข้อสอบ_${examRound}_ฉบับนักเรียน`;
      else if (docCategory === 'PREPOST_EXAM' && audience === 'TEACHER') editionNoSlug = `02_ฉบับที่2_ข้อสอบ_${examRound}_ฉบับครู_มีเฉลย`;
      else if (docCategory !== 'PREPOST_EXAM' && audience === 'TEACHER') editionNoSlug = '04_ฉบับที่4_เอกสารยกระดับ_ฉบับครู_มีเฉลย';

      const scopeSlug = (docCategory === 'PREPOST_EXAM' && examScope === 'WHOLE_SUBJECT') ? 'ครบทั้งวิชา' : subSlug;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(outBlob);
      a.download = `${editionNoSlug}_${subName}_${scopeSlug}_2569.docx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      showToast(`ดาวน์โหลด "${editionNoSlug.replace(/^\d+_/, '')}" เรียบร้อยแล้วครับ!`, 'success');
    } catch (err) {
      showToast('ดาวน์โหลดแม่แบบไม่สำเร็จ: ' + err.message, 'error');
    }
  }

  async function downloadAll4StrandTemplatesZip() {
    return withButtonBusy('btnDownload4PackZip', 'กำลังสร้างชุด 4 ฉบับ (.zip)...', async () => {
      try {
        if (typeof JSZip === 'undefined') throw new Error('JSZip ยังไม่พร้อมทำงาน');
        const subCode = document.getElementById('upSubjectCode').value;
        const strandNo = document.getElementById('upStrandNo').value;
        const subName = SUBJECT_NAMES[subCode] || subCode;
        const examRound = (document.getElementById('upExamRound') && document.getElementById('upExamRound').value) || 'PRE';
        const examScope = (document.getElementById('upExamScope') && document.getElementById('upExamScope').value) || 'BY_STRAND';
        const subStandard = (document.getElementById('upSubStandard') && document.getElementById('upSubStandard').value) || 'ALL';
        const subSlug = subStandard === 'ALL' ? `สาระที่${strandNo}` : `สาระที่${strandNo}_${subStandard.replace(/\s+/g, '').replace(/[/.]/g, '-')}`;
        const examScopeSlug = examScope === 'WHOLE_SUBJECT' ? 'ครบทั้งวิชา' : subSlug;

        const packZip = new JSZip();
        const [f1, f2, f3, f4] = await Promise.all([
          buildTemplateDocxUint8_({ docCategory: 'PREPOST_EXAM', targetAudience: 'STUDENT', examRound, examScope }),
          buildTemplateDocxUint8_({ docCategory: 'PREPOST_EXAM', targetAudience: 'TEACHER', examRound, examScope }),
          buildTemplateDocxUint8_({ docCategory: 'TUTORING_STRAND', targetAudience: 'STUDENT', examRound, examScope: 'BY_STRAND' }),
          buildTemplateDocxUint8_({ docCategory: 'TUTORING_STRAND', targetAudience: 'TEACHER', examRound, examScope: 'BY_STRAND' })
        ]);

        packZip.file(`01_ฉบับที่1_ข้อสอบ_${examRound}_ฉบับนักเรียน_${subName}_${examScopeSlug}_2569.docx`, f1);
        packZip.file(`02_ฉบับที่2_ข้อสอบ_${examRound}_ฉบับครู_มีเฉลย_${subName}_${examScopeSlug}_2569.docx`, f2);
        packZip.file(`03_ฉบับที่3_เอกสารยกระดับ_ฉบับนักเรียน_${subName}_${subSlug}_2569.docx`, f3);
        packZip.file(`04_ฉบับที่4_เอกสารยกระดับ_ฉบับครู_มีเฉลย_${subName}_${subSlug}_2569.docx`, f4);
        packZip.file(
          '00_อ่านก่อนทำ_วิธีจัดทำและส่งคืนทั้ง4ฉบับ.txt',
          [
            `ชุดแม่แบบมาตรฐานครบ 4 ฉบับ — โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET) ปีการศึกษา 2569`,
            `รายวิชา: ${subName} (${subCode}) | สาระที่ ${strandNo} | ขอบเขต: ${subStandard === 'ALL' ? 'ครบทั้งสาระ' : subStandard}`,
            ``,
            `ไฟล์ในชุดนี้ประกอบด้วย 4 ฉบับมาตรฐาน (ตั้งค่า A4 ฟอนต์ TH SarabunPSK 16pt ล็อกตาราง 8306 DXA เรียบร้อยแล้ว):`,
            `1. ฉบับที่ 1: ข้อสอบคู่ขนาน (${examRound}) ฉบับนักเรียน — ล็อกเลขข้อตามผัง สทศ. ห้ามใส่คำตอบ/เฉลย/รหัสตัวชี้วัด`,
            `2. ฉบับที่ 2: ข้อสอบคู่ขนาน (${examRound}) ฉบับครู — มีตารางสรุปเฉลย รหัสตัวชี้วัด และวิธีคิดละเอียด (ใช้ตรวจ IOC 2 หน้าจอคู่ขนาน)`,
            `3. ฉบับที่ 3: เอกสารยกระดับตามสาระฯ ฉบับนักเรียน — ส่วนที่ 1 สรุปความรู้ + ส่วนที่ 2 แบบฝึกทักษะ (ห้ามมีเฉลย)`,
            `4. ฉบับที่ 4: เอกสารยกระดับตามสาระฯ ฉบับครู — ส่วนที่ 1 จุดเน้นการสอน + ส่วนที่ 2 โจทย์พร้อมเฉลย + ส่วนที่ 3 ตารางสรุปเฉลย (ระบบดึงเข้าคลังฝึกออนไลน์อัตโนมัติ)`,
            ``,
            `กรณีใน 1 สาระมีครูช่วยกันทำหลายคน เลือกทำได้ 2 วิธี:`,
            `- วิธีที่ 1 (ทำรวมเป็นชุดเดียวของสาระ): แบ่งข้อ/แบ่งตัวชี้วัดกันพิมพ์ แล้วนำมารวมในไฟล์ 4 ฉบับของสาระนี้ ส่งครั้งเดียว`,
            `- วิธีที่ 2 (ต่างคนต่างส่งแยกตามมาตรฐาน/ตัวชี้วัด): ก่อนกดโหลดแม่แบบและก่อนอัปโหลด ให้แต่ละท่านเลือกช่อง "แบ่งงานในสาระ" เป็นมาตรฐานหรือตัวชี้วัดที่ตนรับผิดชอบ ระบบจะล็อกเลขข้อเฉพาะส่วนนั้นให้ และเมื่อแอดมินกดรวมเล่ม ระบบจะเรียงต่อกันให้อัตโนมัติ!`
          ].join('\r\n')
        );

        const zipBlob = await packZip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `ชุดแม่แบบครบ4ฉบับ_${subName}_${subSlug}_2569.zip`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        showToast(`ดาวน์โหลดชุดแม่แบบครบทั้ง 4 ฉบับ (.zip) สำหรับ ${subName} (${subSlug}) สำเร็จ!`, 'success');
      } catch (err) {
        showToast('สร้างไฟล์ .zip ไม่สำเร็จ: ' + err.message, 'error');
      }
    });
  }

  const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

  async function onSlotPdfSelected(slot) {
    const edition = String(slot || 'STUDENT').toUpperCase();
    const inp = document.getElementById('upPdfFile_' + edition);
    const lbl = document.getElementById('pdfStatus_' + edition);
    if (!STATE.companionPdfSlots) STATE.companionPdfSlots = { STUDENT: null, TEACHER: null };
    if (!inp || !inp.files || !inp.files.length) {
      STATE.companionPdfSlots[edition] = null;
      if (lbl) lbl.textContent = '';
      return;
    }
    const f = inp.files[0];
    if (!/\.pdf$/i.test(f.name)) {
      showToast('ช่องนี้รองรับเฉพาะไฟล์ .pdf ล็อกหน้าเท่านั้นครับ', 'error');
      inp.value = '';
      STATE.companionPdfSlots[edition] = null;
      if (lbl) lbl.textContent = '';
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      showToast('ขนาดไฟล์ PDF เกิน 25 MB กรุณาย่อขนาดไฟล์ก่อนแนบครับ', 'error');
      inp.value = '';
      STATE.companionPdfSlots[edition] = null;
      if (lbl) lbl.textContent = '';
      return;
    }
    const bytes = new Uint8Array(await f.arrayBuffer());
    STATE.companionPdfSlots[edition] = { fileBase64: uint8ToBase64_(bytes), fileName: f.name };
    if (lbl) {
      lbl.innerHTML = `<span class="font-bold" style="color: var(--gw-accent);">✓ แนบ PDF แล้ว: ${escHtml(f.name)}</span>`;
    }
  }

  async function runSlotDocxPreCheck(slot) {
    const edition = String(slot || 'STUDENT').toUpperCase();
    const fileInput = document.getElementById('upDocxFile_' + edition);
    const card = document.getElementById('preCheckCard_' + edition);
    if (!STATE.preCheckSlots) STATE.preCheckSlots = { STUDENT: null, TEACHER: null };
    if (!fileInput || !fileInput.files || !fileInput.files.length) {
      if (card) card.classList.add('hidden');
      STATE.preCheckSlots[edition] = null;
      return;
    }
    const file = fileInput.files[0];
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('ขนาดไฟล์เกิน 25 MB กรุณาลดขนาดรูปภาพในเอกสารแล้วลองใหม่อีกครั้งครับ', 'error');
      fileInput.value = '';
      if (card) card.classList.add('hidden');
      STATE.preCheckSlots[edition] = null;
      return;
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      showToast('ช่องนี้รองรับเฉพาะไฟล์ Word (.docx) เท่านั้นครับ', 'error');
      fileInput.value = '';
      if (card) card.classList.add('hidden');
      STATE.preCheckSlots[edition] = null;
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64Data = uint8ToBase64_(bytes);

    try {
      const docCategory = (document.getElementById('upDocCategory') && document.getElementById('upDocCategory').value) || 'TUTORING_STRAND';
      const xmls = await extractDocxXmlInBrowser(arrayBuffer);
      const expectedInds = getExpectedUploadIndicators();
      const check = validateDocxXmlContent(xmls.documentXml, xmls.stylesXml, expectedInds, {
        docCategory,
        targetAudience: edition
      });
      const layoutClean = (!check.layoutWarnings || check.layoutWarnings.length === 0);
      const indMsg = (docCategory === 'PREPOST_EXAM' && edition === 'STUDENT')
        ? 'ไม่แสดงรหัสตัวชี้วัด (ถูกต้องสำหรับข้อสอบนักเรียน)'
        : (check.missingIndicators.length === 0 ? `รหัสตัวชี้วัดครบ (${expectedInds.length})` : `ขาดตัวชี้วัด (${check.missingIndicators.join(', ')})`);

      const summaryParts = [
        edition === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู',
        check.hasSarabunFont && check.otherFonts.length === 0 ? 'TH SarabunPSK' : `พบฟอนต์อื่น (${check.otherFonts.join(', ') || 'ไม่ระบุ'})`,
        indMsg,
        check.missingSections.length === 0 ? 'องค์ประกอบครบ' : `ขาด (${check.missingSections.join(', ')})`,
        check.hasAnswerLeak ? 'พบการหลุดเฉลยในฉบับนักเรียน!' : (layoutClean ? 'หน้า A4 ปลอดภัย' : `เตือนจัดหน้า (${check.layoutWarnings.length} จุด)`)
      ];

      STATE.preCheckSlots[edition] = {
        passed: check.passed && layoutClean,
        hasAnswerLeak: Boolean(check.hasAnswerLeak),
        summary: summaryParts.join(' | '),
        documentXml: xmls.documentXml || '',
        fileBase64: base64Data,
        fileName: file.name,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      let autoExtractLineHtml = '';
      if (docCategory === 'TUTORING_STRAND') {
        const stuXml = (STATE.preCheckSlots.STUDENT && STATE.preCheckSlots.STUDENT.documentXml) || '';
        const tchXml = (STATE.preCheckSlots.TEACHER && STATE.preCheckSlots.TEACHER.documentXml) || '';
        const previewExt = extractPracticeItemsFromTutoringDocxXml({
          studentDocXml: stuXml,
          teacherDocXml: tchXml,
          subjectCode: document.getElementById('upSubjectCode').value,
          strandNo: document.getElementById('upStrandNo').value,
          subStandard: document.getElementById('upSubStandard').value,
          expectedIndicators: expectedInds
        });
        if (previewExt.items.length > 0) {
          autoExtractLineHtml = `<div style="color: var(--gw-accent);">• คลังฝึกออนไลน์อัตโนมัติ: <b>✓ พบโจทย์พร้อมดึงเข้าคลัง ${previewExt.items.length} ข้อทันทีเมื่อกดอัปโหลด</b></div>`;
        } else if (edition === 'TEACHER') {
          autoExtractLineHtml = `<div class="opacity-80">• คลังฝึกออนไลน์อัตโนมัติ: <span>หากมีโจทย์ 4 ตัวเลือก + เฉลยในไฟล์ ระบบจะดึงเข้าเมนูย่อย 2 ให้อัตโนมัติ</span></div>`;
        }
      }

      const allGreen = check.passed && layoutClean;
      if (card) {
        card.className = (check.hasAnswerLeak ? 'gw-alert-danger' : (allGreen ? 'gw-alert-success' : 'gw-alert-warn')) + ' rounded-xl border p-3 text-xs space-y-1';
        card.innerHTML = `
          <div class="font-bold">
            ${check.hasAnswerLeak
              ? '🚨 บล็อกอัปโหลด: พบคำว่า "เฉลย" หรือคำตอบของครูหลุดอยู่ในไฟล์ฉบับนักเรียน!'
              : (allGreen ? '✅ สแกนผ่าน 100% พร้อมส่ง' : '⚠️ พบจุดควรตรวจสอบก่อนส่ง')}
          </div>
          ${check.hasAnswerLeak ? `<div class="font-bold gw-text-danger">จุดที่พบ: ${escHtml(check.answerLeakSnippets.join(' | '))}</div>` : ''}
          <div>• ฟอนต์ TH SarabunPSK: <b>${check.hasSarabunFont && check.otherFonts.length === 0 ? '✓ ผ่าน' : escHtml(check.otherFonts.join(', ') || 'ไม่พบฟอนต์สารบรรณ')}</b></div>
          <div>• ตัวชี้วัด: <b>${escHtml(indMsg)}</b></div>
          <div>• องค์ประกอบของ${edition === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู'}: <b>${check.missingSections.length === 0 ? '✓ ครบถ้วน' : escHtml(check.missingSections.join(', '))}</b></div>
          <div>• จัดหน้า A4 / รูปลอย: <b>${layoutClean ? '✓ ปลอดภัย' : escHtml(check.layoutWarnings.join(' ; '))}</b></div>
          ${autoExtractLineHtml}
        `;
        card.classList.remove('hidden');
      }
    } catch (err) {
      showToast('ไม่สามารถอ่านโครงสร้างไฟล์ .docx: ' + err.message, 'error');
    }
  }

  async function submitCommitteeUpload() {
    const slots = STATE.preCheckSlots || {};
    const selectedAuds = ['STUDENT', 'TEACHER'].filter(ed => slots[ed] && slots[ed].fileBase64);
    if (!selectedAuds.length) {
      showToast('กรุณาเลือกไฟล์ .docx อย่างน้อย 1 ช่อง (ฉบับนักเรียน และ/หรือ ฉบับครู)', 'error');
      return;
    }
    if (slots.STUDENT && slots.STUDENT.fileBase64 && slots.STUDENT.hasAnswerLeak) {
      showToast('ระบบบล็อกการส่งไฟล์ฉบับนักเรียนเนื่องจากตรวจพบ "เฉลย/คำตอบ" หลุดอยู่ภายในไฟล์ กรุณาลบเฉลยออกก่อนส่งครับ', 'error');
      return;
    }

    const docCategory = (document.getElementById('upDocCategory') && document.getElementById('upDocCategory').value) || 'TUTORING_STRAND';
    const examRound = docCategory === 'PREPOST_EXAM'
      ? ((document.getElementById('upExamRound') && document.getElementById('upExamRound').value) || 'PRE')
      : '';
    const examScope = (document.getElementById('upExamScope') && document.getElementById('upExamScope').value) || 'WHOLE_SUBJECT';
    const pairGroupId = selectedAuds.length === 2 ? ('PAIR_' + new Date().getTime()) : '';
    const subjectCodeVal = document.getElementById('upSubjectCode').value;
    const strandNo = (docCategory === 'PREPOST_EXAM' && examScope === 'WHOLE_SUBJECT')
      ? 'ทั้งวิชา'
      : document.getElementById('upStrandNo').value;
    const subStandard = (docCategory === 'PREPOST_EXAM' && examScope === 'WHOLE_SUBJECT')
      ? 'ครบทั้งรายวิชาตามผัง 2569'
      : document.getElementById('upSubStandard').value;

    /* Capture XMLs before clearing slots so we can auto-populate Student Practice Bank */
    const stuDocXmlSnap = (slots.STUDENT && slots.STUDENT.documentXml) || '';
    const tchDocXmlSnap = (slots.TEACHER && slots.TEACHER.documentXml) || '';
    const expectedIndsSnap = getExpectedUploadIndicators();
    const shouldAutoSyncPractice = docCategory === 'TUTORING_STRAND' &&
      Boolean(!document.getElementById('chkAutoSyncPracticeOnUpload') || document.getElementById('chkAutoSyncPracticeOnUpload').checked);

    const btn = document.getElementById('btnUploadManuscript');
    btn.disabled = true;
    try {
      const uploadedNames = [];
      for (let i = 0; i < selectedAuds.length; i++) {
        const aud = selectedAuds[i];
        const st = slots[aud];
        const pdf = (STATE.companionPdfSlots && STATE.companionPdfSlots[aud]) || null;
        btn.textContent = `กำลังอัปโหลด (${i + 1}/${selectedAuds.length}): ${aud === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู'}...`;
        const pdfTag = pdf && pdf.fileBase64 ? ' | แนบ PDF ล็อกหน้าแล้ว' : '';
        const res = await callGas('apiUploadCommitteeManuscript', {
          authToken: STATE.authToken || '',
          teacherId: STATE.currentTeacher.teacherId,
          subjectCode: subjectCodeVal,
          strandNo,
          subStandard,
          docCategory,
          targetAudience: aud,
          examRound,
          pairGroupId,
          fileName: st.fileName,
          mimeType: st.mimeType,
          base64Data: st.fileBase64,
          pdfBase64Data: pdf ? pdf.fileBase64 : '',
          pdfFileName: pdf ? pdf.fileName : '',
          preCheckPassed: st.passed,
          preCheckSummary: st.summary + pdfTag
        });
        if (!res.ok) { showToast(`อัปโหลด${aud === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู'}ไม่สำเร็จ: ${res.error}`, 'error'); return; }
        uploadedNames.push(res.stampedName);
      }

      /* Invalidate split-screen IOC preview cache when new PREPOST_EXAM files are uploaded */
      if (docCategory === 'PREPOST_EXAM') {
        STATE.iocPreviewCache = {};
      }

      let autoSyncMsg = '';
      if (shouldAutoSyncPractice && (stuDocXmlSnap || tchDocXmlSnap)) {
        const extracted = extractPracticeItemsFromTutoringDocxXml({
          studentDocXml: stuDocXmlSnap,
          teacherDocXml: tchDocXmlSnap,
          subjectCode: subjectCodeVal,
          strandNo,
          subStandard,
          expectedIndicators: expectedIndsSnap
        });
        if (extracted.items.length > 0) {
          btn.textContent = `กำลังสร้างโจทย์เข้าคลังฝึกออนไลน์อัตโนมัติ (${extracted.items.length} ข้อ)...`;
          const syncRes = await callGas('apiBulkUpsertPracticeItems', {
            authToken: STATE.authToken || '',
            items: extracted.items
          });
          if (syncRes && syncRes.ok) {
            autoSyncMsg = ` + ดึงโจทย์เข้าคลังฝึกออนไลน์อัตโนมัติ ${syncRes.totalProcessed} ข้อ (เพิ่มใหม่ ${syncRes.addedCount}, อัปเดต ${syncRes.updatedCount})`;
          }
        }
      }

      showToast(`อัปโหลดเข้า Google Drive สำเร็จครบ ${uploadedNames.length} ฉบับ${autoSyncMsg}!`, 'success');
      STATE.preCheckSlots = { STUDENT: null, TEACHER: null };
      STATE.companionPdfSlots = { STUDENT: null, TEACHER: null };
      ['STUDENT', 'TEACHER'].forEach(ed => {
        const dx = document.getElementById('upDocxFile_' + ed);
        const px = document.getElementById('upPdfFile_' + ed);
        const ps = document.getElementById('pdfStatus_' + ed);
        const cd = document.getElementById('preCheckCard_' + ed);
        if (dx) dx.value = '';
        if (px) px.value = '';
        if (ps) ps.textContent = '';
        if (cd) cd.classList.add('hidden');
      });

      await loadCommitteeSubmissions();
      renderNotificationsPopover();
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="cloud-upload" class="w-4 h-4"></i><span>อัปโหลดไฟล์ที่เลือกเข้า Google Drive (wkha@saraburi2.go.th)</span>';
      refreshIcons();
    }
  }

  function setCommitteeSubFilter(mode) {
    STATE.committeeSubFilter = mode === 'MINE' ? 'MINE' : 'ALL';
    const btnAll = document.getElementById('btnCommFilterAll');
    const btnMine = document.getElementById('btnCommFilterMine');
    if (btnAll) btnAll.classList.toggle('is-active', STATE.committeeSubFilter === 'ALL');
    if (btnMine) btnMine.classList.toggle('is-active', STATE.committeeSubFilter === 'MINE');
    renderCommitteeSubmissionsList();
  }

  function renderCommitteeSubmissionsList() {
    const box = document.getElementById('committeeSubmissionsList');
    if (!box) return;
    const allSubs = (STATE.cachedSubmissions || []).map(normalizeSubMetaClient_);
    const myId = STATE.currentTeacher ? STATE.currentTeacher.teacherId : '';
    const isAdmin = STATE.currentTeacher && STATE.currentTeacher.role === 'SUPER_ADMIN';
    const mode = STATE.committeeSubFilter || 'ALL';
    const list = mode === 'MINE' ? allSubs.filter(s => s.teacherId === myId) : allSubs;

    if (!list.length) {
      box.innerHTML = mode === 'MINE'
        ? '<div class="text-xs" style="color: var(--gw-muted);">ยังไม่มีรายการไฟล์ที่คุณครูอัปโหลดในขณะนี้</div>'
        : '<div class="text-xs" style="color: var(--gw-muted);">ยังไม่มีรายการอัปโหลดต้นฉบับ</div>';
      return;
    }

    box.innerHTML = list.map(s => {
      const isOk = isApprovedSubmissionStatus_(s.reviewStatus);
      const badgeCls = isOk ? 'gw-badge-success' : (s.reviewStatus === 'ส่งแก้' ? 'gw-badge-danger' : 'gw-badge-warn');
      const canDelete = (s.teacherId === myId || isAdmin) && !isOk;
      const subTag = s.subStandard && s.subStandard !== 'ALL' ? ` | ${s.subStandard}` : '';
      return `
        <div class="gw-subcard space-y-1.5">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <a href="${escHtml(s.driveFileUrl)}" target="_blank" class="font-bold underline" style="color: var(--gw-accent);">${escHtml(s.fileName)}</a>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${formatSubmissionCardBadges_(s)}
              <span class="${badgeCls}">${escHtml(s.reviewStatus || 'รอตรวจ')}</span>
              ${canDelete ? `<button type="button" onclick="deleteMySubmission('${escHtml(s.submissionId)}')" class="gw-btn-soft !py-1 !px-2.5 text-[11px] font-bold" style="color: var(--gw-danger-ink);">ลบงาน</button>` : ''}
            </div>
          </div>
          ${s.pdfFileUrl ? `<div><a href="${escHtml(s.pdfFileUrl)}" target="_blank" class="text-xs font-bold underline" style="color: var(--gw-info-ink);">📄 เปิดไฟล์ PDF ล็อกหน้าคู่ขนาน (รวมเล่มไม่เพี้ยน 100%)</a></div>` : ''}
          <div class="text-xs" style="color: var(--gw-muted);">สาระที่ ${escHtml(s.strandNo)}${escHtml(subTag)} | ผู้ส่ง: ${escHtml(s.teacherName)} (${escHtml(getSchoolShortName(s.schoolId))}) | ${escHtml(s.preCheckSummary)}</div>
          ${s.adminComment ? `<div class="text-xs font-bold gw-text-danger">ข้อเสนอแนะผู้ดูแล: ${escHtml(s.adminComment)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  async function loadCommitteeSubmissions() {
    const res = await callGas('apiGetSubmissionsList', { authToken: STATE.authToken || '' });
    if (res && res.ok) STATE.cachedSubmissions = res.submissions || [];
    renderCommitteeSubmissionsList();
    renderNotificationsPopover();
  }

  function deleteMySubmission(submissionId) {
    const sub = (STATE.cachedSubmissions || []).find(s => s.submissionId === submissionId);
    const label = sub ? sub.fileName : submissionId;
    openCustomModal({
      title: 'ยืนยันการลบไฟล์ต้นฉบับ',
      subtitle: 'ลบออกจากรายการส่งงาน (ใช้กรณีส่งไฟล์ผิดรุ่นหรือต้องการส่งใหม่)',
      bodyHtml: `<div class="text-xs leading-relaxed">ต้องการลบรายการ <b>${escHtml(label)}</b> ออกจากรายการส่งงานใช่หรือไม่ครับ? (หากลบแล้วสามารถเลือกไฟล์ใหม่อัปโหลดซ้ำได้ทันที)</div>`,
      confirmText: 'ยืนยันลบงาน',
      danger: true,
      onConfirm: async () => {
        const res = await callGas('apiDeleteSubmission', {
          authToken: STATE.authToken || '',
          submissionId
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'ลบงานไม่สำเร็จ', 'error');
          return false;
        }
        showToast('ลบรายการต้นฉบับเรียบร้อยแล้วครับ', 'success');
        await loadCommitteeSubmissions();
      }
    });
  }

  /* ---- Tab 2B: Committee Practice Question Bank CRUD ---- */
  function switchCommitteeSubTab(sub) {
    const mode = (sub === 'BANK' || sub === 'PRACTICE_BANK')
      ? 'BANK'
      : (sub === 'IOC' ? 'IOC' : 'UPLOAD');
    const upPanel = document.getElementById('commPanel_UPLOAD');
    const bankPanel = document.getElementById('commPanel_PRACTICE_BANK');
    const iocPanel = document.getElementById('commPanel_IOC');
    const btnUp = document.getElementById('btnCommSub_UPLOAD');
    const btnBank = document.getElementById('btnCommSub_BANK');
    const btnIoc = document.getElementById('btnCommSub_IOC');
    if (upPanel) upPanel.classList.toggle('hidden', mode !== 'UPLOAD');
    if (bankPanel) bankPanel.classList.toggle('hidden', mode !== 'BANK');
    if (iocPanel) iocPanel.classList.toggle('hidden', mode !== 'IOC');
    if (btnUp) btnUp.classList.toggle('is-active', mode === 'UPLOAD');
    if (btnBank) btnBank.classList.toggle('is-active', mode === 'BANK');
    if (btnIoc) btnIoc.classList.toggle('is-active', mode === 'IOC');
    if (mode === 'BANK') {
      const strandSel = document.getElementById('pbStrand');
      if (!strandSel || !strandSel.options.length) onPbSubjectChange();
      loadPracticeBankList();
    } else if (mode === 'IOC') {
      const iocSubEl = document.getElementById('iocSubject');
      const tSub = STATE.currentTeacher && String(STATE.currentTeacher.subjectCode || '').trim();
      if (iocSubEl && !STATE.iocSubjectInitialized && ['61', '64', '65', '63'].includes(tSub)) {
        iocSubEl.value = tSub;
        STATE.iocSubjectInitialized = true;
      }
      loadExamIocData();
    }
  }

  /* ---- Tab 2C: Split-Screen Committee Exam IOC (+1 / 0 / -1) Studio & Official Reports ---- */
  function getIndicatorDescByCode_(subjectCode, indicatorCode) {
    if (!indicatorCode) return '';
    const norm = String(indicatorCode).replace(/\s+/g, ' ').trim();
    const hit = (STATE.blueprint || []).find(b =>
      (!subjectCode || String(b.subjectCode) === String(subjectCode)) &&
      String(b.indicatorCode || '').replace(/\s+/g, ' ').trim() === norm
    );
    return hit && hit.indicatorDesc ? String(hit.indicatorDesc).trim() : '';
  }

  function toDriveEmbedPreviewUrl_(rawUrl) {
    const u = String(rawUrl || '').trim();
    if (!u) return '';
    const m = /\/file\/d\/([a-zA-Z0-9_-]+)/.exec(u);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    const idM = /[?&]id=([a-zA-Z0-9_-]+)/.exec(u);
    if (idM) return `https://drive.google.com/file/d/${idM[1]}/preview`;
    return u;
  }

  async function loadExamIocData(forceRefreshPreview = false) {
    const listEl = document.getElementById('iocItemsEvaluationList');
    const rightEl = document.getElementById('iocExamItemsPreviewList');
    const round = (document.getElementById('iocRound') && document.getElementById('iocRound').value) || 'PRE';
    const subjectCode = (document.getElementById('iocSubject') && document.getElementById('iocSubject').value) || '61';
    if (STATE.iocShowTeacherKey === undefined) STATE.iocShowTeacherKey = true;
    if (!STATE.iocRightViewMode) STATE.iocRightViewMode = 'ITEMS';
    if (!STATE.iocActiveItemNo) STATE.iocActiveItemNo = 1;

    if (listEl) {
      listEl.innerHTML = '<div class="text-xs py-6 text-center opacity-75">กำลังโหลดรายการประเมิน IOC รายข้อ...</div>';
    }
    if (rightEl) {
      rightEl.innerHTML = '<div class="text-xs py-6 text-center opacity-75">กำลังโหลดตัวข้อสอบรายข้อ...</div>';
    }

    try {
      const res = await callGas('apiGetExamIocData', {
        authToken: STATE.authToken,
        teacherId: STATE.currentTeacher && STATE.currentTeacher.teacherId,
        round,
        subjectCode
      });
      if (!res || !res.ok) {
        showToast((res && res.error) || 'โหลดข้อมูล IOC ไม่สำเร็จ', 'error');
        if (listEl) listEl.innerHTML = `<div class="text-xs py-4 text-center text-rose-500">${escHtml((res && res.error) || 'โหลดข้อมูลไม่สำเร็จ')}</div>`;
        return;
      }
      STATE.iocCurrentData = res;
      STATE.iocDraftScores = res.myReview && res.myReview.scores ? { ...res.myReview.scores } : {};
      STATE.iocDraftComments = res.myReview && res.myReview.comments ? { ...res.myReview.comments } : {};
      const firstNo = (res.examKeys && res.examKeys[0] && Number(res.examKeys[0].itemNo)) || 1;
      STATE.iocActiveItemNo = firstNo;
      STATE.iocSelectedRawDocIndex = 0;

      const noteEl = document.getElementById('iocSummaryNote');
      if (noteEl) noteEl.value = (res.myReview && res.myReview.summaryNote) || '';
      renderCommitteeIocPanel();
      /* Load & parse actual .docx exam items in parallel for the Right Screen */
      loadAndParseIocExamDocsPreview_(round, subjectCode, forceRefreshPreview);
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล IOC: ' + err.message, 'error');
      if (listEl) listEl.innerHTML = `<div class="text-xs py-4 text-center text-rose-500">${escHtml(err.message)}</div>`;
    }
  }

  async function loadAndParseIocExamDocsPreview_(round, subjectCode, forceRefresh = false) {
    if (!STATE.iocPreviewCache) STATE.iocPreviewCache = {};
    const cacheKey = `${round}_${subjectCode}`;
    const badgeEl = document.getElementById('iocRightSourceBadge');

    const curData = STATE.iocCurrentData;
    const refs = (curData && curData.refDocs) || [];
    if (!refs.length) {
      STATE.iocPreviewCache[cacheKey] = { itemsByNo: {}, totalParsedItems: 0, realContentCount: 0, noDocs: true };
      renderIocRightPreviewPanel();
      return;
    }

    if (!forceRefresh && STATE.iocPreviewCache[cacheKey] && !STATE.iocPreviewCache[cacheKey].loading) {
      renderIocRightPreviewPanel();
      return;
    }

    STATE.iocPreviewCache[cacheKey] = { loading: true, itemsByNo: {}, totalParsedItems: 0, realContentCount: 0 };
    if (badgeEl) badgeEl.textContent = 'กำลังอ่านข้อสอบจากไฟล์ .docx...';
    renderIocRightPreviewPanel();

    try {
      const res = await callGas('apiGetExamDocsForIocPreview', {
        authToken: STATE.authToken || '',
        round,
        subjectCode
      });
      if (!res || !res.ok) {
        STATE.iocPreviewCache[cacheKey] = { itemsByNo: {}, totalParsedItems: 0, realContentCount: 0, error: (res && res.error) || 'โหลดไฟล์ข้อสอบไม่สำเร็จ' };
        renderIocRightPreviewPanel();
        return;
      }

      const partEntries = [];
      const docs = res.docs || [];
      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        if (!d.base64Data) continue;
        try {
          const unpacked = await unpackDocxWithMediaInBrowser_(d.base64Data);
          if (unpacked.documentXml) {
            partEntries.push({
              targetAudience: d.targetAudience || 'STUDENT',
              documentXml: unpacked.documentXml,
              relsXml: unpacked.relsXml,
              mediaMap: unpacked.mediaMap,
              fileName: d.fileName,
              teacherName: d.teacherName,
              strandNo: d.strandNo
            });
          }
        } catch (parseErr) {}
      }

      const parsed = parseExamDocxItemsForIocPreview(partEntries, subjectCode);
      parsed.docCount = partEntries.length;
      STATE.iocPreviewCache[cacheKey] = parsed;
      /* Only re-render if user is still viewing the same round & subject */
      if (STATE.iocCurrentData && STATE.iocCurrentData.round === round && STATE.iocCurrentData.subjectCode === subjectCode) {
        renderIocRightPreviewPanel();
      }
    } catch (err) {
      STATE.iocPreviewCache[cacheKey] = { itemsByNo: {}, totalParsedItems: 0, realContentCount: 0, error: err.message };
      renderIocRightPreviewPanel();
    }
  }

  function styleIocScoreBtnHtml_(itemNo, btnVal, currentVal, canEdit) {
    const active = currentVal !== undefined && currentVal !== null && currentVal !== '' && Number(currentVal) === btnVal;
    let label = '0 (ไม่แน่ใจ)';
    let activeStyle = 'background:#d97706;color:#ffffff;border-color:#d97706;';
    if (btnVal === 1) {
      label = '+1 (สอดคล้อง)';
      activeStyle = 'background:#059669;color:#ffffff;border-color:#059669;';
    } else if (btnVal === -1) {
      label = '-1 (ไม่สอดคล้อง)';
      activeStyle = 'background:#dc2626;color:#ffffff;border-color:#dc2626;';
    }
    const idleStyle = 'background:var(--gw-surface);color:var(--gw-ink);border-color:var(--gw-line);';
    const disabledAttr = canEdit ? '' : 'disabled';
    return `<button type="button" id="iocScoreBtn_${itemNo}_${btnVal}" ${disabledAttr} onclick="event.stopPropagation(); setItemIocScore(${itemNo}, ${btnVal})" class="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap" style="${active ? activeStyle : idleStyle}">${label}</button>`;
  }

  function updateIocScoredProgressBadge_() {
    const badge = document.getElementById('iocScoredProgressBadge');
    if (!badge || !STATE.iocCurrentData) return;
    const keys = STATE.iocCurrentData.examKeys || [];
    let scored = 0;
    keys.forEach(k => {
      const no = Number(k.itemNo);
      const v = STATE.iocDraftScores[no] !== undefined ? STATE.iocDraftScores[no] : STATE.iocDraftScores[String(no)];
      if (v !== undefined && v !== null && v !== '' && [1, 0, -1].includes(Number(v))) scored++;
    });
    badge.textContent = `ให้คะแนนแล้ว ${scored}/${keys.length} ข้อ`;
  }

  function renderCommitteeIocPanel() {
    const data = STATE.iocCurrentData;
    if (!data) return;
    const summary = data.iocSummary || { totalItems: 0, passingItemsCount: 0, overallAvgIoc: 0, evaluatedCount: 0, totalCommitteeCount: 0, items: [], evaluatedTeacherList: [], pendingTeacherList: [] };
    const canEdit = !!data.canEvaluate;

    const quorumBox = document.getElementById('iocQuorumSummaryBox');
    if (quorumBox) {
      const doneNames = (summary.evaluatedTeacherList || []).map(t => t.fullName).join(', ');
      const waitNames = (summary.pendingTeacherList || []).map(t => t.fullName).join(', ');
      const avgIocTxt = Number(summary.evaluatedCount || 0) > 0 ? fmtFixed(summary.overallAvgIoc, 2, '0.00') : '- (รอตรวจ)';
      const passBadge = summary.allItemsPass && summary.quorumMet
        ? '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white whitespace-nowrap">✅ ผ่านเกณฑ์ครบองค์ประชุมพร้อมรวมเล่ม</span>'
        : `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white whitespace-nowrap">${summary.quorumMet ? '⚠️ มีข้อควรปรับปรุงตามผล IOC' : '⏳ รอคณะกรรมการตรวจให้ครบองค์ประชุม'}</span>`;
      quorumBox.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-bold">องค์ประชุมกรรมการ: <span class="gw-tabular">${summary.evaluatedCount}/${summary.totalCommitteeCount || summary.evaluatedCount}</span> ท่าน | ผ่านเกณฑ์ (&gt;= 0.50): <span class="gw-tabular">${summary.passingItemsCount}/${summary.totalItems}</span> ข้อ | ค่า IOC เฉลี่ย: <span class="gw-tabular" style="color:var(--gw-accent);">${escHtml(avgIocTxt)}</span></div>
          <div>${passBadge}</div>
        </div>
        <div class="text-[11px] opacity-85">
          <span>ตรวจแล้ว: ${escHtml(doneNames || '-')}</span>
          ${waitNames ? `<span class="ml-2 text-amber-600 font-bold">| ยังรอตรวจ: ${escHtml(waitNames)}</span>` : ''}
        </div>
      `;
    }

    const readBadge = document.getElementById('iocReadOnlyBadge');
    if (readBadge) readBadge.classList.toggle('hidden', canEdit);
    const btnSave = document.getElementById('btnSaveMyIoc');
    const btnPlusAll = document.getElementById('btnIocMarkAllPlusOne');
    const noteEl = document.getElementById('iocSummaryNote');
    if (btnSave) btnSave.disabled = !canEdit;
    if (btnPlusAll) btnPlusAll.disabled = !canEdit;
    if (noteEl) noteEl.disabled = !canEdit;

    renderCommitteeIocLeftItemsOnly();
    renderIocRightPreviewPanel();
  }

  function renderCommitteeIocLeftItemsOnly() {
    const data = STATE.iocCurrentData;
    const listEl = document.getElementById('iocItemsEvaluationList');
    if (!data || !listEl) return;
    const summary = data.iocSummary || { items: [] };
    const canEdit = !!data.canEvaluate;
    const keyMap = new Map((data.examKeys || []).map(k => [Number(k.itemNo), k]));
    const filterMode = (document.getElementById('iocLeftItemFilter') && document.getElementById('iocLeftItemFilter').value) || 'ALL';

    updateIocScoredProgressBadge_();

    const allItems = summary.items || [];
    if (!allItems.length) {
      listEl.innerHTML = '<div class="text-xs py-6 text-center opacity-75">ไม่พบรายการข้อสอบในผังเฉลยสำหรับรอบและรายวิชานี้</div>';
      return;
    }

    const filteredItems = allItems.filter(it => {
      const no = Number(it.itemNo);
      const myScore = STATE.iocDraftScores[no] !== undefined ? STATE.iocDraftScores[no] : STATE.iocDraftScores[String(no)];
      const hasMyScore = myScore !== undefined && myScore !== null && myScore !== '' && [1, 0, -1].includes(Number(myScore));
      if (filterMode === 'UNSCORED') return !hasMyScore;
      if (filterMode === 'REVISE') return hasFiniteNumber(it.ioc) && !it.passed;
      return true;
    });

    if (!filteredItems.length) {
      listEl.innerHTML = '<div class="text-xs py-6 text-center opacity-75">ไม่มีข้อสอบในตัวกรองที่เลือก</div>';
      return;
    }

    listEl.innerHTML = filteredItems.map(it => {
      const itemNo = Number(it.itemNo);
      const kMeta = keyMap.get(itemNo) || {};
      const weight = kMeta.scoreWeight !== undefined ? Number(kMeta.scoreWeight) : (kMeta.weight !== undefined ? Number(kMeta.weight) : '-');
      const myScore = STATE.iocDraftScores[itemNo] !== undefined ? STATE.iocDraftScores[itemNo] : STATE.iocDraftScores[String(itemNo)];
      const myComment = STATE.iocDraftComments[itemNo] !== undefined ? STATE.iocDraftComments[itemNo] : (STATE.iocDraftComments[String(itemNo)] || '');
      const hasIoc = hasFiniteNumber(it.ioc);
      const iocBadge = !hasIoc
        ? '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/20 whitespace-nowrap">รอผล IOC</span>'
        : (it.passed
            ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white whitespace-nowrap">IOC ${fmtFixed(it.ioc, 2)} (ผ่าน)</span>`
            : `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white whitespace-nowrap">IOC ${fmtFixed(it.ioc, 2)} (ปรับปรุง)</span>`);
      const indDesc = getIndicatorDescByCode_(data.subjectCode, it.indicatorCode);
      const isFocused = Number(STATE.iocActiveItemNo) === itemNo;
      const peerCommentsHtml = (it.comments || []).length
        ? `<div class="mt-1.5 text-[11px] rounded-lg px-2 py-1 border" style="background:var(--gw-surface);border-color:var(--gw-line);">
            <span class="font-bold">ความเห็นกรรมการ:</span> ${it.comments.map(c => `${escHtml(c.teacherName)} (${c.score >= 0 ? '+' + c.score : c.score}): ${escHtml(c.comment)}`).join(' | ')}
          </div>`
        : '';

      return `
        <div id="iocEvalCard_${itemNo}" onclick="focusIocSplitItem(${itemNo}, 'LEFT')" class="ioc-item-row space-y-2 cursor-pointer ${isFocused ? 'is-active-item' : ''}">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="font-bold px-2 py-0.5 rounded-lg whitespace-nowrap" style="background:var(--gw-accent-soft);color:var(--gw-accent);">ข้อ ${itemNo}</span>
              <span class="font-bold">${escHtml(it.indicatorCode || '-')}</span>
              <span class="px-1.5 py-0.5 rounded border text-[10px] whitespace-nowrap" style="border-color:var(--gw-line);">${escHtml(formatExamItemTypeLabel_(it.itemType))} (${escHtml(String(weight))} คะแนน)</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-[11px] opacity-75 whitespace-nowrap">ตรวจแล้ว ${it.evaluatorCount} คน</span>
              ${iocBadge}
            </div>
          </div>
          ${indDesc ? `<div class="text-[11px] leading-snug" style="color:var(--gw-muted);">ตัวชี้วัด: ${escHtml(indDesc)}</div>` : ''}
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex flex-wrap gap-1.5">
              ${styleIocScoreBtnHtml_(itemNo, 1, myScore, canEdit)}
              ${styleIocScoreBtnHtml_(itemNo, 0, myScore, canEdit)}
              ${styleIocScoreBtnHtml_(itemNo, -1, myScore, canEdit)}
            </div>
            <input type="text" id="iocCmt_${itemNo}" value="${escHtml(myComment)}" ${canEdit ? '' : 'disabled'} onclick="event.stopPropagation(); focusIocSplitItem(${itemNo}, 'LEFT')" oninput="onItemIocCommentInput(${itemNo}, this.value)" placeholder="ข้อเสนอแนะรายข้อ (กรณีให้ 0 หรือ -1)" class="gw-input flex-1 min-w-[170px] !py-1.5 text-xs">
          </div>
          ${peerCommentsHtml}
        </div>
      `;
    }).join('');
  }

  function renderIocRightPreviewPanel() {
    const data = STATE.iocCurrentData;
    const rightItemsEl = document.getElementById('iocExamItemsPreviewList');
    const rawDocBoxEl = document.getElementById('iocRawDocPreviewBox');
    const refBox = document.getElementById('iocRefDocsBox');
    const iframeWrap = document.getElementById('iocRawDocIframeWrap');
    const badgeEl = document.getElementById('iocRightSourceBadge');
    const btnModeItems = document.getElementById('btnIocRightModeItems');
    const btnModeDoc = document.getElementById('btnIocRightModeDoc');
    const btnShowKey = document.getElementById('btnToggleIocShowKey');
    if (!data || !rightItemsEl) return;

    const mode = STATE.iocRightViewMode === 'DOC' ? 'DOC' : 'ITEMS';
    const showKey = STATE.iocShowTeacherKey !== false;

    if (btnModeItems) {
      btnModeItems.style.borderColor = mode === 'ITEMS' ? 'var(--gw-accent)' : 'var(--gw-line)';
      btnModeItems.style.color = mode === 'ITEMS' ? 'var(--gw-accent)' : 'var(--gw-ink)';
    }
    if (btnModeDoc) {
      btnModeDoc.style.borderColor = mode === 'DOC' ? 'var(--gw-accent)' : 'var(--gw-line)';
      btnModeDoc.style.color = mode === 'DOC' ? 'var(--gw-accent)' : 'var(--gw-ink)';
    }
    if (btnShowKey) {
      btnShowKey.textContent = showKey ? '🔑 เฉลย: แสดง' : '🔑 เฉลย: ซ่อน';
      btnShowKey.classList.toggle('hidden', mode !== 'ITEMS');
    }

    rightItemsEl.classList.toggle('hidden', mode !== 'ITEMS');
    if (rawDocBoxEl) rawDocBoxEl.classList.toggle('hidden', mode !== 'DOC');

    const refs = data.refDocs || [];
    const cacheKey = `${data.round}_${data.subjectCode}`;
    const parsed = (STATE.iocPreviewCache && STATE.iocPreviewCache[cacheKey]) || null;

    if (badgeEl) {
      if (parsed && parsed.loading) {
        badgeEl.textContent = 'กำลังแยกข้อสอบรายข้อ...';
      } else if (parsed && parsed.realContentCount > 0) {
        badgeEl.textContent = `ดึงโจทย์จริงแล้ว ${parsed.realContentCount} ข้อ`;
      } else if (refs.length > 0) {
        badgeEl.textContent = `แนบไฟล์แล้ว ${refs.length} ฉบับ`;
      } else {
        badgeEl.textContent = 'รออัปโหลดไฟล์ข้อสอบ';
      }
    }

    /* Mode 2: Original PDF / Docx Embedded View */
    if (refBox) {
      if (!refs.length) {
        refBox.innerHTML = '<div class="rounded-lg border px-3 py-3 text-xs opacity-80" style="border-color:var(--gw-line);">ยังไม่มีไฟล์ต้นฉบับ PREPOST_EXAM อัปโหลดในรอบและรายวิชานี้ (กรรมการจัดทำข้อสอบสามารถส่งไฟล์ได้ที่เมนูย่อยที่ 1)</div>';
        if (iframeWrap) iframeWrap.innerHTML = '<div class="p-8 text-center text-xs opacity-70">เมื่อมีการอัปโหลดไฟล์ PDF หรือ Word ของข้อสอบชุดนี้ หน้ากระดาษต้นฉบับจะแสดงที่นี่ทันที</div>';
      } else {
        const selIdx = Math.min(Math.max(Number(STATE.iocSelectedRawDocIndex || 0), 0), refs.length - 1);
        const activeDoc = refs[selIdx];
        const rawUrl = activeDoc.pdfFileUrl || activeDoc.driveFileUrl || '';
        const previewUrl = toDriveEmbedPreviewUrl_(rawUrl);
        refBox.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap gap-1.5">
              ${refs.map((doc, idx) => {
                const audLabel = doc.targetAudience === 'TEACHER' ? '📕 ฉบับครู' : '📘 ฉบับนักเรียน';
                const isSel = idx === selIdx;
                return `<button type="button" onclick="selectIocRawDocEmbed(${idx})" class="px-2.5 py-1 rounded-lg border text-xs font-bold transition" style="${isSel ? 'border-color:var(--gw-accent);background:var(--gw-accent-soft);color:var(--gw-accent);' : 'border-color:var(--gw-line);background:var(--gw-surface);'}">${audLabel}: ${escHtml(doc.fileName || doc.submissionId)}</button>`;
              }).join('')}
            </div>
            ${rawUrl ? `<a href="${escHtml(rawUrl)}" target="_blank" rel="noopener" class="text-xs font-bold underline whitespace-nowrap" style="color:var(--gw-accent);">↗ เปิดหน้าต่างเต็ม</a>` : ''}
          </div>
        `;
        if (iframeWrap) {
          iframeWrap.innerHTML = previewUrl
            ? `<iframe src="${escHtml(previewUrl)}" title="ตัวอย่างไฟล์ข้อสอบต้นฉบับ" class="w-full border-0" style="height:560px;"></iframe>`
            : '<div class="p-6 text-center text-xs opacity-75">ไม่พบลิงก์แสดงตัวอย่างไฟล์</div>';
        }
      }
    }

    if (mode !== 'ITEMS') return;

    if (parsed && parsed.loading) {
      rightItemsEl.innerHTML = '<div class="text-xs py-8 text-center opacity-75">กำลังสกัดโจทย์ ตัวเลือก ภาพประกอบ และเฉลยรายข้อจากไฟล์ Word (.docx)...</div>';
      return;
    }

    const keys = (data.examKeys || []).slice().sort((a, b) => Number(a.itemNo) - Number(b.itemNo));
    const bpItems = NIETS_2569_EXAM_ITEMS[data.subjectCode] || [];
    const bpMap = new Map(bpItems.map(x => [Number(x.itemNo), x]));
    const itemsByNo = (parsed && parsed.itemsByNo) || {};

    let topNoticeHtml = '';
    if (!refs.length) {
      topNoticeHtml = `
        <div class="rounded-xl border px-3 py-2 text-xs" style="background:var(--gw-accent-soft);border-color:var(--gw-line);">
          <b>หมายเหตุ:</b> รอบและรายวิชานี้ยังไม่มีไฟล์ข้อสอบ <code>.docx</code> อัปโหลดเข้ามา — ด้านล่างแสดง <b>ผังโครงสร้างรายข้อตามมาตรฐาน สทศ. 2569</b> รอไฟล์ข้อสอบจริง (เมื่ออัปโหลดแล้ว ตัวโจทย์และตัวเลือกจะขึ้นแสดงรายข้ออัตโนมัติทันที)
        </div>
      `;
    } else if (parsed && parsed.realContentCount === 0) {
      topNoticeHtml = `
        <div class="rounded-xl border px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2" style="background:var(--gw-accent-soft);border-color:var(--gw-line);">
          <span>พบไฟล์แนบในระบบแล้ว หากไฟล์เป็น PDF ล้วนหรือใช้รูปแบบพิเศษ สามารถกดสลับดูโหมด <b>📄 ไฟล์ต้นฉบับ</b> ด้านบนได้ทันที</span>
          <button type="button" onclick="setIocRightViewMode('DOC')" class="gw-btn-soft !py-1 !px-2.5 text-[11px] font-bold">เปิดดูไฟล์ต้นฉบับ</button>
        </div>
      `;
    }

    const cardsHtml = keys.map(k => {
      const itemNo = Number(k.itemNo);
      const bp = bpMap.get(itemNo) || {};
      const docItem = itemsByNo[itemNo] || null;
      const indCode = k.indicatorCode || bp.indicatorCode || (docItem && docItem.indicatorFromDoc) || '-';
      const indDesc = getIndicatorDescByCode_(data.subjectCode, indCode);
      const weight = k.scoreWeight !== undefined ? Number(k.scoreWeight) : (bp.weight !== undefined ? Number(bp.weight) : '-');
      const itemType = k.itemType || bp.itemType || 'MC4';
      const systemKey = String(k.correctKey || (docItem && docItem.extractedKey) || '').trim();
      const isFocused = Number(STATE.iocActiveItemNo) === itemNo;

      const sharedHtml = docItem && docItem.sharedPassageBlocks && docItem.sharedPassageBlocks.length
        ? `<div class="ioc-shared-passage space-y-1">
            <div class="font-bold text-[11px]" style="color:var(--gw-accent);">📌 บทอ่าน / สถานการณ์ประกอบข้อสอบ:</div>
            ${docItem.sharedPassageBlocks.map(txt => `<div>${escHtml(txt)}</div>`).join('')}
          </div>`
        : '';

      const imagesHtml = docItem && docItem.images && docItem.images.length
        ? `<div class="space-y-1.5">${docItem.images.map(u => `<img src="${u}" alt="ภาพประกอบข้อ ${itemNo}" class="ioc-doc-img">`).join('')}</div>`
        : '';

      const stemLinesClean = docItem && docItem.stemLines
        ? docItem.stemLines.filter(l => !isUneditedPlaceholderText_(l))
        : [];
      const stemHtml = stemLinesClean.length
        ? `<div class="text-xs sm:text-[13px] font-semibold leading-relaxed space-y-1">${stemLinesClean.map(l => `<div>${escHtml(l)}</div>`).join('')}</div>`
        : `<div class="text-xs italic opacity-75">ยังไม่มีข้อความโจทย์จริงในไฟล์ .docx สำหรับข้อที่ ${itemNo} (${escHtml(formatExamItemTypeLabel_(itemType))})</div>`;

      const tablesHtml = docItem && docItem.tables && docItem.tables.length
        ? docItem.tables.map(rows => `
            <table class="ioc-doc-table">
              <tbody>
                ${rows.map((r, rIdx) => `<tr>${r.map(cell => {
                  const tag = rIdx === 0 ? 'th' : 'td';
                  const imgInCell = (cell.images || []).map(u => `<img src="${u}" alt="ภาพในตาราง" class="ioc-doc-img">`).join('');
                  return `<${tag}>${escHtml(cell.text || '')}${imgInCell}</${tag}>`;
                }).join('')}</tr>`).join('')}
              </tbody>
            </table>
          `).join('')
        : '';

      let choicesHtml = '';
      const choiceKeys = docItem && docItem.choices ? Object.keys(docItem.choices).filter(ck => !isUneditedPlaceholderText_(docItem.choices[ck])) : [];
      if (choiceKeys.length > 0) {
        choicesHtml = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
          ${['1', '2', '3', '4'].filter(ck => docItem.choices[ck] && !isUneditedPlaceholderText_(docItem.choices[ck])).map(ck => {
            const isAns = showKey && systemKey === ck;
            return `<div class="ioc-choice-pill ${isAns ? 'is-correct-choice' : ''}">
              <span class="font-bold mr-1">${ck}.</span>${escHtml(docItem.choices[ck])}
              ${isAns ? '<span class="ml-1 text-[10px] font-bold text-emerald-600 whitespace-nowrap">✓ เฉลย</span>' : ''}
            </div>`;
          }).join('')}
        </div>`;
      }

      let teacherKeyHtml = '';
      if (showKey && (systemKey || (docItem && docItem.teacherSolutionLines && docItem.teacherSolutionLines.length))) {
        const solText = docItem && docItem.teacherSolutionLines && docItem.teacherSolutionLines.length
          ? docItem.teacherSolutionLines.filter(l => !isUneditedPlaceholderText_(l)).join(' | ')
          : '';
        teacherKeyHtml = `
          <div class="rounded-lg border px-2.5 py-1.5 text-[11px] space-y-0.5" style="background:rgba(5,150,105,0.08);border-color:rgba(5,150,105,0.3);">
            <div class="font-bold text-emerald-700">🔑 เฉลยในระบบ/ฉบับครู: ${escHtml(systemKey || '-')}</div>
            ${solText ? `<div class="leading-relaxed">${escHtml(solText)}</div>` : ''}
          </div>
        `;
      }

      return `
        <div id="iocPreviewCard_${itemNo}" onclick="focusIocSplitItem(${itemNo}, 'RIGHT')" class="ioc-item-row space-y-2 cursor-pointer ${isFocused ? 'is-active-item' : ''}">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5 text-xs">
              <span class="font-bold px-2 py-0.5 rounded-lg whitespace-nowrap" style="background:var(--gw-accent-soft);color:var(--gw-accent);">ข้อ ${itemNo}</span>
              <span class="font-bold">${escHtml(indCode)}</span>
              <span class="px-1.5 py-0.5 rounded border text-[10px] whitespace-nowrap" style="border-color:var(--gw-line);">${escHtml(formatExamItemTypeLabel_(itemType))} • ${escHtml(String(weight))} คะแนน</span>
            </div>
            ${bp.sectionNo ? `<span class="text-[10px] font-bold opacity-70 whitespace-nowrap">ตอนที่ ${bp.sectionNo}</span>` : ''}
          </div>
          ${indDesc ? `<div class="text-[11px]" style="color:var(--gw-muted);">มาตรฐานตัวชี้วัด: ${escHtml(indDesc)}</div>` : ''}
          ${sharedHtml}
          ${stemHtml}
          ${imagesHtml}
          ${tablesHtml}
          ${choicesHtml}
          ${teacherKeyHtml}
        </div>
      `;
    }).join('');

    rightItemsEl.innerHTML = topNoticeHtml + cardsHtml;
  }

  function focusIocSplitItem(itemNo, sourceSide = 'LEFT') {
    const no = Number(itemNo);
    STATE.iocActiveItemNo = no;

    document.querySelectorAll('#iocItemsEvaluationList .ioc-item-row').forEach(el => {
      el.classList.toggle('is-active-item', el.id === `iocEvalCard_${no}`);
    });
    document.querySelectorAll('#iocExamItemsPreviewList .ioc-item-row').forEach(el => {
      el.classList.toggle('is-active-item', el.id === `iocPreviewCard_${no}`);
    });

    /* Smoothly align the opposite scrollable pane without jumping the page window */
    const targetContainer = sourceSide === 'LEFT'
      ? document.getElementById('iocExamItemsPreviewList')
      : document.getElementById('iocItemsEvaluationList');
    const targetCard = sourceSide === 'LEFT'
      ? document.getElementById(`iocPreviewCard_${no}`)
      : document.getElementById(`iocEvalCard_${no}`);

    if (targetContainer && targetCard && !targetContainer.classList.contains('hidden')) {
      const containerRect = targetContainer.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();
      const nextTop = targetContainer.scrollTop + (cardRect.top - containerRect.top) - 8;
      targetContainer.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
    }
  }

  function setIocRightViewMode(mode) {
    STATE.iocRightViewMode = mode === 'DOC' ? 'DOC' : 'ITEMS';
    renderIocRightPreviewPanel();
  }

  function toggleIocRightShowKey() {
    STATE.iocShowTeacherKey = !(STATE.iocShowTeacherKey !== false);
    renderIocRightPreviewPanel();
  }

  function selectIocRawDocEmbed(idx) {
    STATE.iocSelectedRawDocIndex = Number(idx || 0);
    renderIocRightPreviewPanel();
  }

  function setIocMobilePaneMode(mode) {
    const m = (mode === 'LEFT' || mode === 'RIGHT') ? mode : 'BOTH';
    const leftCol = document.getElementById('iocSplitLeftCol');
    const rightCol = document.getElementById('iocSplitRightCol');
    if (leftCol) leftCol.classList.toggle('hidden', m === 'RIGHT');
    if (rightCol) rightCol.classList.toggle('hidden', m === 'LEFT');
    ['Both', 'Left', 'Right'].forEach(k => {
      const b = document.getElementById('btnIocMob' + k);
      if (b) b.classList.toggle('is-active', k.toUpperCase() === m);
    });
  }

  function setItemIocScore(itemNo, score) {
    if (!STATE.iocCurrentData || !STATE.iocCurrentData.canEvaluate) return;
    const no = Number(itemNo);
    STATE.iocDraftScores[no] = Number(score);
    [-1, 0, 1].forEach(val => {
      const btn = document.getElementById(`iocScoreBtn_${no}_${val}`);
      if (!btn) return;
      const active = Number(score) === val;
      if (active) {
        btn.style.background = val === 1 ? '#059669' : (val === 0 ? '#d97706' : '#dc2626');
        btn.style.color = '#ffffff';
        btn.style.borderColor = btn.style.background;
      } else {
        btn.style.background = 'var(--gw-surface)';
        btn.style.color = 'var(--gw-ink)';
        btn.style.borderColor = 'var(--gw-line)';
      }
    });
    updateIocScoredProgressBadge_();
    focusIocSplitItem(no, 'LEFT');
  }

  function onItemIocCommentInput(itemNo, val) {
    STATE.iocDraftComments[itemNo] = String(val || '');
  }

  function markAllIocPlusOne() {
    if (!STATE.iocCurrentData || !STATE.iocCurrentData.canEvaluate) {
      showToast('สิทธิ์นี้สามารถดูได้เฉพาะโหมดอ่านเท่านั้นครับ', 'error');
      return;
    }
    const items = STATE.iocCurrentData.examKeys || [];
    items.forEach(k => { STATE.iocDraftScores[Number(k.itemNo)] = 1; });
    renderCommitteeIocLeftItemsOnly();
    showToast(`ตั้งค่าคะแนน IOC = +1 ครบทั้ง ${items.length} ข้อแล้ว กดปรับแก้ไขรายข้อได้ก่อนกดบันทึกครับ`, 'info');
  }

  async function saveCommitteeIocReview() {
    const data = STATE.iocCurrentData;
    if (!data || !data.canEvaluate) {
      showToast('ไม่มีสิทธิ์บันทึกประเมิน IOC ในรายวิชานี้ครับ', 'error');
      return;
    }
    const keys = (data.examKeys || []).slice().sort((a, b) => Number(a.itemNo) - Number(b.itemNo));
    for (let i = 0; i < keys.length; i++) {
      const no = Number(keys[i].itemNo);
      const v = STATE.iocDraftScores[no] !== undefined ? STATE.iocDraftScores[no] : STATE.iocDraftScores[String(no)];
      if (v === undefined || v === null || v === '' || ![1, 0, -1].includes(Number(v))) {
        showToast(`กรุณาเลือกคะแนน IOC (+1 / 0 / -1) ให้ครบทุกข้อ (ยังขาดข้อ ${no})`, 'error');
        return;
      }
    }
    const btn = document.getElementById('btnSaveMyIoc');
    if (btn) btn.disabled = true;
    try {
      const summaryNote = (document.getElementById('iocSummaryNote') && document.getElementById('iocSummaryNote').value) || '';
      const res = await callGas('apiSaveExamIocReview', {
        authToken: STATE.authToken,
        teacherId: STATE.currentTeacher && STATE.currentTeacher.teacherId,
        round: data.round,
        subjectCode: data.subjectCode,
        scoresMap: STATE.iocDraftScores,
        commentsMap: STATE.iocDraftComments,
        summaryNote
      });
      if (!res || !res.ok) {
        showToast((res && res.error) || 'บันทึกผล IOC ไม่สำเร็จ', 'error');
        return;
      }
      STATE.iocCurrentData = res;
      STATE.iocDraftScores = res.myReview && res.myReview.scores ? { ...res.myReview.scores } : { ...STATE.iocDraftScores };
      STATE.iocDraftComments = res.myReview && res.myReview.comments ? { ...res.myReview.comments } : { ...STATE.iocDraftComments };
      renderCommitteeIocPanel();
      showToast('บันทึกผลตรวจประเมิน IOC ของท่านเรียบร้อยแล้วครับ!', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก IOC: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = !STATE.iocCurrentData || !STATE.iocCurrentData.canEvaluate;
    }
  }

  function buildOfficialA4IocHtml(iocData) {
    const data = iocData || {};
    const subjectCode = String(data.subjectCode || '61');
    const subjectName = String(data.subjectName || SUBJECT_NAMES[subjectCode] || subjectCode);
    const round = String(data.round || 'PRE').toUpperCase();
    const roundLabel = round === 'POST' ? 'Post O-NET (ชุดทดสอบหลังติว)' : 'Pre O-NET (ชุดทดสอบก่อนติว)';
    const summary = data.iocSummary || { totalItems: 0, passingItemsCount: 0, overallAvgIoc: 0, evaluatedCount: 0, totalCommitteeCount: 0, items: [] };
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    const schoolMap = {};
    (STATE.schools || []).forEach(s => { schoolMap[s.schoolId] = s.schoolName; });

    const introText = `ตามที่คณะกรรมการผู้รับผิดชอบจัดทำข้อสอบและตรวจสอบคุณภาพข้อสอบคู่ขนาน O-NET ประจำกลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2 ได้ร่วมกันตรวจพิจารณาความสอดคล้องของข้อคำถามกับตัวชี้วัดและผังการสร้างข้อสอบ สทศ. (Index of Item-Objective Congruence : IOC) ในรายวิชา${subjectName} (รหัสวิชา ${subjectCode}) ชุด${roundLabel} โดยกำหนดเกณฑ์พิจารณาค่าดัชนีความสอดคล้องผ่านเกณฑ์ที่ IOC ตั้งแต่ 0.50 ขึ้นไป สรุปผลการประเมินรายข้อได้ดังต่อไปนี้`;

    const itemRows = (summary.items || []).map(it => {
      const hasIoc = hasFiniteNumber(it.ioc);
      const iocText = fmtFixed(it.ioc, 2, '-');
      const statusTxt = !hasIoc
        ? 'รอประเมิน'
        : (it.passed ? (it.minusOneCount > 0 ? 'ผ่าน (มีข้อทักท้วง -1)' : 'ผ่านเกณฑ์ (>= 0.50)') : 'ควรปรับปรุง (< 0.50)');
      const noteTxt = (it.comments || []).length
        ? `${statusTxt}: ${it.comments.map(c => `${c.teacherName}: ${c.comment}`).join(' ; ')}`
        : statusTxt;
      return `
        <tr>
          <td style="text-align:center;font-weight:700;">${it.itemNo}</td>
          <td style="text-align:left;">${escHtml(it.indicatorCode || '-')}</td>
          <td style="text-align:center;">${it.evaluatorCount}</td>
          <td style="text-align:center;">${it.plusOneCount}</td>
          <td style="text-align:center;">${it.zeroCount}</td>
          <td style="text-align:center;${it.minusOneCount > 0 ? 'color:#991B1B;font-weight:700;' : ''}">${it.minusOneCount}</td>
          <td style="text-align:center;font-weight:700;color:${hasIoc && !it.passed ? '#991B1B' : '#166534'};">${iocText}</td>
          <td style="text-align:left;">${escHtml(noteTxt)}</td>
        </tr>
      `;
    }).join('');

    const evalRows = reviews.length
      ? reviews.map((rv, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="text-align:left;">${escHtml(rv.teacherName || '-')}</td>
            <td style="text-align:left;">${escHtml(schoolMap[rv.schoolId] || rv.schoolId || '-')}</td>
            <td style="text-align:left;">${escHtml(rv.summaryNote || 'ตรวจประเมินครบถ้วนตามผัง สทศ.')}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="text-align:center;">ยังไม่มีข้อมูลการบันทึกผลประเมิน IOC</td></tr>';

    const reportDate = formatThaiDateFull(new Date().toISOString().slice(0, 10));
    const reporter = STATE.currentTeacher && STATE.currentTeacher.fullName ? STATE.currentTeacher.fullName : 'ประธานคณะกรรมการตรวจประเมินข้อสอบ (IOC)';
    const avgIocA4Txt = Number(summary.evaluatedCount || 0) > 0 ? fmtFixed(summary.overallAvgIoc, 2, '0.00') : '- (รอตรวจ)';

    return `
      <div style="text-align:center;font-size:20pt;font-weight:700;line-height:1.25;">แบบรายงานผลการตรวจประเมินความเที่ยงตรงเชิงเนื้อหาของข้อสอบ (IOC)</div>
      <div style="text-align:center;font-size:15.5pt;font-weight:700;line-height:1.3;margin-bottom:8pt;">โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)<br>ชั้นประถมศึกษาปีที่ 6 ปีการศึกษา 2569 — กลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2</div>
      <p style="text-indent:2.5cm;text-align:justify;margin:6pt 0;">${thaiDistributeHtml(introText)}</p>
      <table style="width:100%;border-collapse:collapse;margin:8pt 0;">
        <tbody>
          <tr><td style="border:1px solid #334155;padding:4pt 6pt;font-weight:700;width:32%;background:#F8FAFC;">รายวิชา / ชุดข้อสอบ</td><td style="border:1px solid #334155;padding:4pt 6pt;font-weight:700;">${escHtml(subjectName)} (${escHtml(subjectCode)}) — ${escHtml(roundLabel)}</td></tr>
          <tr><td style="border:1px solid #334155;padding:4pt 6pt;font-weight:700;background:#F8FAFC;">องค์ประชุมคณะกรรมการ</td><td style="border:1px solid #334155;padding:4pt 6pt;">ประเมินแล้ว ${summary.evaluatedCount} จาก ${summary.totalCommitteeCount || summary.evaluatedCount} ท่าน</td></tr>
          <tr><td style="border:1px solid #334155;padding:4pt 6pt;font-weight:700;background:#F8FAFC;">ผลสรุปภาพรวม IOC</td><td style="border:1px solid #334155;padding:4pt 6pt;font-weight:700;">ผ่านเกณฑ์ (IOC &gt;= 0.50) จำนวน ${summary.passingItemsCount}/${summary.totalItems} ข้อ | ค่าเฉลี่ย IOC = ${escHtml(avgIocA4Txt)}</td></tr>
          <tr><td style="border:1px solid #334155;padding:4pt 6pt;font-weight:700;background:#F8FAFC;">วันที่จัดทำรายงาน</td><td style="border:1px solid #334155;padding:4pt 6pt;">${escHtml(reportDate)}</td></tr>
        </tbody>
      </table>
      <div style="font-size:16pt;font-weight:700;margin-top:8pt;">1. ตารางผลการประเมินค่าดัชนีความสอดคล้อง (IOC) รายข้อ</div>
      <table style="width:100%;border-collapse:collapse;margin-top:4pt;">
        <thead>
          <tr style="background:#EFECE6;">
            <th style="border:1px solid #334155;padding:4pt;width:7%;">ข้อ</th>
            <th style="border:1px solid #334155;padding:4pt;width:17%;">ตัวชี้วัด</th>
            <th style="border:1px solid #334155;padding:4pt;width:9%;">ผู้ตรวจ</th>
            <th style="border:1px solid #334155;padding:4pt;width:8%;">+1</th>
            <th style="border:1px solid #334155;padding:4pt;width:8%;">0</th>
            <th style="border:1px solid #334155;padding:4pt;width:8%;">-1</th>
            <th style="border:1px solid #334155;padding:4pt;width:11%;">ค่า IOC</th>
            <th style="border:1px solid #334155;padding:4pt;width:32%;">ผลประเมิน / ข้อเสนอแนะ</th>
          </tr>
        </thead>
        <tbody>${itemRows || '<tr><td colspan="8" style="border:1px solid #334155;padding:6pt;text-align:center;">ไม่มีรายการข้อสอบ</td></tr>'}</tbody>
      </table>
      <div style="font-size:16pt;font-weight:700;margin-top:10pt;">2. รายชื่อคณะกรรมการผู้ตรวจประเมินคุณภาพข้อสอบ (IOC)</div>
      <table style="width:100%;border-collapse:collapse;margin-top:4pt;">
        <thead>
          <tr style="background:#EFECE6;">
            <th style="border:1px solid #334155;padding:4pt;width:10%;">ลำดับ</th>
            <th style="border:1px solid #334155;padding:4pt;width:34%;">ชื่อ - นามสกุล คณะกรรมการ</th>
            <th style="border:1px solid #334155;padding:4pt;width:28%;">สถานศึกษา</th>
            <th style="border:1px solid #334155;padding:4pt;width:28%;">ความเห็นเพิ่มเติม</th>
          </tr>
        </thead>
        <tbody>${evalRows}</tbody>
      </table>
      <div style="margin-top:22pt;text-align:right;padding-right:1.5cm;">
        <div>ลงชื่อ .......................................................... ผู้รายงานผลการตรวจประเมิน</div>
        <div>(${escHtml(reporter)})</div>
        <div>วันที่จัดทำรายงาน: ${escHtml(reportDate)}</div>
      </div>
    `;
  }

  async function resolveIocReportSource_(source = 'COMM') {
    if (source === 'ADMIN') {
      if (!STATE.adminIocCurrentData) await loadAdminIocDetail();
      return STATE.adminIocCurrentData;
    }
    if (!STATE.iocCurrentData) await loadExamIocData();
    return STATE.iocCurrentData;
  }

  async function previewAndPrintIocA4Report(source = 'COMM') {
    try {
      const iocData = await resolveIocReportSource_(source);
      if (!iocData) {
        showToast('ยังไม่มีข้อมูลผลการตรวจ IOC สำหรับสร้างรายงาน A4', 'error');
        return;
      }
      const reportHtml = buildOfficialA4IocHtml(iocData);
      const printArea = document.getElementById('printArea');
      if (printArea) printArea.innerHTML = reportHtml;

      let overlay = document.getElementById('iocA4PreviewOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'iocA4PreviewOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'ตัวอย่างรายงานผลการตรวจ IOC มาตรฐานกระดาษ A4');
        overlay.style.overscrollBehavior = 'contain';
        overlay.className = 'no-print fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 p-4 flex flex-col items-center';
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = `
        <div class="w-full max-w-[21cm] flex flex-wrap items-center justify-between gap-2 mb-3 bg-white text-slate-900 px-4 py-2.5 rounded-xl shadow-lg">
          <div class="font-bold text-sm">ตัวอย่างรายงานผลการตรวจ IOC มาตรฐานกระดาษ A4 (TH SarabunPSK)</div>
          <div class="flex gap-2">
            <button type="button" onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">🖨️ สั่งพิมพ์ / บันทึก PDF</button>
            <button type="button" onclick="document.getElementById('iocA4PreviewOverlay').remove()" class="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold">ปิดหน้าต่าง</button>
          </div>
        </div>
        <div class="w-full max-w-[21cm] bg-white text-slate-900 shadow-2xl rounded-sm" style="padding:2cm 1.5cm;font-family:'TH SarabunPSK','Sarabun',sans-serif;font-size:15pt;line-height:1.45;">
          ${reportHtml}
        </div>
      `;
    } catch (err) {
      showToast('เปิดตัวอย่างรายงาน A4 ไม่สำเร็จ: ' + err.message, 'error');
    }
  }

  async function exportOfficialIocDocx(source = 'COMM') {
    try {
      const iocData = await resolveIocReportSource_(source);
      if (!iocData) {
        showToast('ยังไม่มีข้อมูลผลการตรวจ IOC สำหรับส่งออก Word', 'error');
        return;
      }
      if (typeof JSZip === 'undefined') {
        showToast('ไม่พบโมดูล JSZip สำหรับสร้างไฟล์ .docx', 'error');
        return;
      }
      const schoolNameMap = {};
      (STATE.schools || []).forEach(s => { schoolNameMap[s.schoolId] = s.schoolName; });
      const xml = buildOfficialIocReportDocumentXml({
        subjectCode: iocData.subjectCode,
        subjectName: iocData.subjectName,
        round: iocData.round,
        iocSummary: iocData.iocSummary,
        reviews: iocData.reviews,
        schoolNameMap,
        reporterName: STATE.currentTeacher ? STATE.currentTeacher.fullName : undefined
      });
      const binStr = atob(REPORT_DOCX_SKELETON_B64.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const zip = await JSZip.loadAsync(bytes);
      zip.file('word/document.xml', xml);
      const outBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(outBlob);
      a.download = `รายงานผลตรวจ_IOC_${iocData.round}_${iocData.subjectName}_2569.docx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      showToast('ส่งออกรายงานผลตรวจ IOC ฉบับ Word (.docx) เรียบร้อยแล้วครับ!', 'success');
    } catch (err) {
      showToast('ส่งออกรายงาน Word (.docx) ไม่สำเร็จ: ' + err.message, 'error');
    }
  }

  function onPbSubjectChange() {
    const subEl = document.getElementById('pbSubject');
    const strandSel = document.getElementById('pbStrand');
    if (!subEl || !strandSel) return;
    const subCode = subEl.value || '61';
    const rows = (STATE.blueprint || []).filter(r => String(r.subjectCode) === String(subCode));
    const strandMap = new Map();
    rows.forEach(r => {
      if (!strandMap.has(String(r.strandNo))) strandMap.set(String(r.strandNo), r.strandName);
    });
    strandSel.innerHTML = Array.from(strandMap.entries()).map(([no, name]) =>
      `<option value="${escHtml(no)}">สาระที่ ${escHtml(no)} ${escHtml(name)}</option>`
    ).join('');
    onPbStrandChange();
  }

  function onPbStrandChange() {
    const subEl = document.getElementById('pbSubject');
    const strandEl = document.getElementById('pbStrand');
    const indSel = document.getElementById('pbIndicator');
    if (!subEl || !strandEl || !indSel) return;
    const subCode = subEl.value || '61';
    const strandNo = strandEl.value || '1';
    const rows = (STATE.blueprint || []).filter(r =>
      String(r.subjectCode) === String(subCode) && String(r.strandNo) === String(strandNo)
    );
    if (!rows.length) {
      indSel.innerHTML = '<option value="">-- ไม่พบตัวชี้วัด --</option>';
      return;
    }
    indSel.innerHTML = rows.map(r => {
      const desc = r.indicatorDesc ? ` — ${String(r.indicatorDesc).slice(0, 65)}` : '';
      return `<option value="${escHtml(r.indicatorCode)}">${escHtml(r.indicatorCode)}${escHtml(desc)}</option>`;
    }).join('');
  }

  function resetPracticeBankForm() {
    const titleEl = document.getElementById('pbFormTitle');
    const cancelBtn = document.getElementById('btnPbCancelEdit');
    const editIdEl = document.getElementById('pbEditItemId');
    if (titleEl) titleEl.textContent = 'ตรวจสอบ / แก้ไขรายข้อ หรือเพิ่มโจทย์เสริมด้วยตนเอง';
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (editIdEl) editIdEl.value = '';
    ['pbSummaryTitle', 'pbSummaryText', 'pbQuestionText', 'pbChoice1', 'pbChoice2', 'pbChoice3', 'pbChoice4', 'pbExplanation'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const correctEl = document.getElementById('pbCorrectChoice');
    if (correctEl) correctEl.value = '1';
    const saveBtn = document.getElementById('btnPbSave');
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i><span>บันทึกโจทย์เข้าคลังฝึกออนไลน์</span>';
      refreshIcons();
    }
  }

  async function syncPracticeBankFromSubmittedDocs() {
    const subSel = document.getElementById('pbAutoSyncSubject');
    const subjectCode = subSel ? subSel.value : 'ALL';
    const resultBox = document.getElementById('pbAutoSyncResultBox');

    return withButtonBusy('btnSyncPracticeFromSubmitted', 'กำลังดึงโจทย์จากไฟล์ครู...', async () => {
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = '⏳ กำลังสแกนไฟล์เอกสารยกระดับฯ (.docx) ที่คณะกรรมการส่งไว้ในระบบและสกัดโจทย์อัตโนมัติ...';
      }
      try {
        const res = await callGas('apiGetTutoringDocsForPracticeSync', {
          authToken: STATE.authToken || '',
          subjectCode
        });
        if (!res || !res.ok) {
          const msg = (res && res.error) || 'ไม่สามารถดึงไฟล์ต้นฉบับจาก Google Drive ได้';
          showToast(msg, 'error');
          if (resultBox) resultBox.innerHTML = `<span class="text-rose-500 font-bold">❌ ${escHtml(msg)}</span>`;
          return;
        }
        const docs = (res.docs || []).filter(d => d.base64Data);
        if (!docs.length) {
          const emptyMsg = 'ยังไม่พบไฟล์เอกสารยกระดับฯ (.docx) ที่ครูส่งไว้ในหมวดที่เลือก (เมื่อครูส่งไฟล์ที่เมนูย่อย 1 ระบบจะดึงโจทย์เข้าคลังให้ทันที หรือใช้ปุ่ม "เลือกไฟล์ .docx จากเครื่อง" ได้เลยครับ)';
          showToast(emptyMsg, 'info');
          if (resultBox) resultBox.innerHTML = `<span>ℹ️ ${escHtml(emptyMsg)}</span>`;
          return;
        }

        /* Group STUDENT + TEACHER files by (subjectCode | strandNo | subStandard) so paired files merge seamlessly */
        const groups = new Map();
        for (let i = 0; i < docs.length; i++) {
          const d = docs[i];
          const gKey = d.pairGroupId
            ? `PAIR_${d.pairGroupId}`
            : `${d.subjectCode || '61'}|${d.strandNo || '1'}|${d.subStandard || 'ALL'}`;
          if (!groups.has(gKey)) {
            groups.set(gKey, {
              subjectCode: d.subjectCode || '61',
              strandNo: d.strandNo || '1',
              subStandard: d.subStandard || 'ALL',
              teacherName: d.teacherName || '',
              studentDocXml: '',
              teacherDocXml: ''
            });
          }
          const unpacked = await unpackDocxWithMediaInBrowser_(d.base64Data);
          const grp = groups.get(gKey);
          if (String(d.targetAudience || '').toUpperCase() === 'STUDENT') {
            if (!grp.studentDocXml) grp.studentDocXml = unpacked.documentXml || '';
          } else {
            if (!grp.teacherDocXml) grp.teacherDocXml = unpacked.documentXml || '';
          }
        }

        const allExtractedItems = [];
        let totalSkippedNoKey = 0;
        groups.forEach((grp) => {
          const inds = (STATE.blueprint || [])
            .filter(b => b.subjectCode === grp.subjectCode && String(b.strandNo) === String(grp.strandNo))
            .map(b => b.indicatorCode);
          const ext = extractPracticeItemsFromTutoringDocxXml({
            studentDocXml: grp.studentDocXml,
            teacherDocXml: grp.teacherDocXml,
            subjectCode: grp.subjectCode,
            strandNo: grp.strandNo,
            subStandard: grp.subStandard,
            expectedIndicators: inds
          });
          totalSkippedNoKey += Number(ext.skippedNoKeyCount || 0);
          ext.items.forEach(it => {
            if (grp.teacherName) it.createdBy = `${grp.teacherName} (ดึงอัตโนมัติ)`;
            allExtractedItems.push(it);
          });
        });

        if (!allExtractedItems.length) {
          const warnTxt = totalSkippedNoKey > 0
            ? `พบไฟล์ต้นฉบับ ${docs.length} ไฟล์ และพบข้อคำถาม ${totalSkippedNoKey} ข้อ แต่ยังไม่พบเฉลยตัวเลือก 1–4 ในไฟล์ฉบับครู (กรุณาแนบไฟล์ฉบับครูที่มีตารางสรุปเฉลย ส่วนที่ 3 หรือบรรทัด "เฉลย ข้อ X: ตอบ ...")`
            : `สแกนไฟล์ต้นฉบับ ${docs.length} ไฟล์แล้ว ยังไม่พบข้อสอบปรนัย 4 ตัวเลือกที่กรอกข้อมูลแล้ว (หากไฟล์ยังเป็นข้อความตัวอย่างแม่แบบ กรุณาเติมโจทย์และเฉลยก่อนซิงค์ครับ)`;
          showToast(warnTxt, 'info');
          if (resultBox) resultBox.innerHTML = `<span>⚠️ ${escHtml(warnTxt)}</span>`;
          return;
        }

        const saveRes = await callGas('apiBulkUpsertPracticeItems', {
          authToken: STATE.authToken || '',
          items: allExtractedItems
        });
        if (!saveRes || !saveRes.ok) {
          const errTxt = (saveRes && saveRes.error) || 'บันทึกโจทย์ที่สกัดไม่สำเร็จ';
          showToast(errTxt, 'error');
          if (resultBox) resultBox.innerHTML = `<span class="text-rose-500 font-bold">❌ ${escHtml(errTxt)}</span>`;
          return;
        }

        const okTxt = `ซิงค์สำเร็จ! สกัดจากไฟล์ต้นฉบับ ${docs.length} ไฟล์ ได้โจทย์พร้อมสรุปความรู้ ${saveRes.totalProcessed} ข้อ (เพิ่มใหม่ ${saveRes.addedCount} ข้อ | อัปเดต ${saveRes.updatedCount} ข้อ)`;
        showToast(okTxt, 'success');
        if (resultBox) resultBox.innerHTML = `<span class="font-bold" style="color:var(--gw-accent);">✅ ${escHtml(okTxt)}</span>`;
        await loadPracticeBankList();
      } catch (err) {
        showToast('ซิงค์ข้อมูลไม่สำเร็จ: ' + err.message, 'error');
        if (resultBox) resultBox.innerHTML = `<span class="text-rose-500 font-bold">❌ ${escHtml(err.message)}</span>`;
      }
    });
  }

  async function importPracticeFromLocalDocxFiles(inputEl) {
    const files = inputEl && inputEl.files ? Array.from(inputEl.files) : [];
    if (!files.length) return;
    const resultBox = document.getElementById('pbAutoSyncResultBox');
    const subjectCode = (document.getElementById('pbSubject') && document.getElementById('pbSubject').value) || '61';
    const strandNo = (document.getElementById('pbStrand') && document.getElementById('pbStrand').value) || '1';
    const inds = (STATE.blueprint || [])
      .filter(b => b.subjectCode === subjectCode && String(b.strandNo) === String(strandNo))
      .map(b => b.indicatorCode);

    return withButtonBusy('btnPbLocalDocxImport', 'กำลังอ่านไฟล์ .docx...', async () => {
      try {
        let studentDocXml = '';
        let teacherDocXml = '';
        for (let i = 0; i < files.length; i++) {
          const ab = await files[i].arrayBuffer();
          const xmls = await extractDocxXmlInBrowser(ab);
          const docXml = xmls.documentXml || '';
          if (/ฉบับครูผู้สอน|ส่วนที่\s*3\s*[:\-]?\s*เฉลย|คำตอบที่ถูก/i.test(docXml)) {
            teacherDocXml += '\n' + docXml;
          } else {
            studentDocXml += '\n' + docXml;
          }
        }
        /* If only one file was selected and classified as student, also pass as teacher in case inline keys exist */
        if (!teacherDocXml && studentDocXml) teacherDocXml = studentDocXml;

        const ext = extractPracticeItemsFromTutoringDocxXml({
          studentDocXml,
          teacherDocXml,
          subjectCode,
          strandNo,
          expectedIndicators: inds
        });
        if (!ext.items.length) {
          const msg = ext.skippedNoKeyCount > 0
            ? `พบโจทย์ ${ext.skippedNoKeyCount} ข้อในไฟล์ที่เลือก แต่ยังไม่พบเฉลยตัวเลือก 1–4 (สามารถเลือกคู่ทั้งไฟล์ฉบับนักเรียน + ไฟล์ฉบับครูพร้อมกันได้เลยครับ)`
            : 'ไม่พบโจทย์ปรนัย 4 ตัวเลือกพร้อมเฉลยในไฟล์ .docx ที่เลือก';
          showToast(msg, 'error');
          if (resultBox) {
            resultBox.classList.remove('hidden');
            resultBox.innerHTML = `<span class="text-amber-600 font-bold">⚠️ ${escHtml(msg)}</span>`;
          }
          return;
        }

        const saveRes = await callGas('apiBulkUpsertPracticeItems', {
          authToken: STATE.authToken || '',
          items: ext.items
        });
        if (!saveRes || !saveRes.ok) {
          showToast((saveRes && saveRes.error) || 'นำเข้าไม่สำเร็จ', 'error');
          return;
        }
        const okMsg = `นำเข้าจากไฟล์ .docx สำเร็จ ${saveRes.totalProcessed} ข้อ (เพิ่มใหม่ ${saveRes.addedCount} ข้อ | อัปเดต ${saveRes.updatedCount} ข้อ)`;
        showToast(okMsg, 'success');
        if (resultBox) {
          resultBox.classList.remove('hidden');
          resultBox.innerHTML = `<span class="font-bold" style="color:var(--gw-accent);">✅ ${escHtml(okMsg)}</span>`;
        }
        await loadPracticeBankList();
      } finally {
        inputEl.value = '';
      }
    });
  }

  async function loadPracticeBankList() {
    const filterEl = document.getElementById('pbFilterSubject');
    const subjectCode = filterEl ? filterEl.value : 'ALL';
    const res = await callGas('apiListPracticeItems', { subjectCode });
    const listBox = document.getElementById('pbItemsListBody');
    const countBadge = document.getElementById('pbCountBadge');
    if (!res || !res.ok) {
      if (listBox) listBox.innerHTML = '<div class="text-xs gw-text-danger">โหลดรายการข้อสอบไม่สำเร็จ</div>';
      return;
    }
    const items = res.items || [];
    STATE.practiceBankCache = items;
    if (countBadge) countBadge.textContent = `จำนวน ${items.length} ข้อ`;
    if (!listBox) return;
    if (!items.length) {
      listBox.innerHTML = '<div class="gw-subcard text-xs" style="color: var(--gw-muted);">ยังไม่มีข้อสอบในหมวดวิชานี้ สามารถกดปุ่ม <b>"ดึงโจทย์จากไฟล์ที่ครูส่งแล้วอัตโนมัติ"</b> ด้านบน หรือเพิ่มโจทย์ด้านซ้ายได้เลยครับ</div>';
      return;
    }

    listBox.innerHTML = items.map((it, idx) => `
      <div class="gw-subcard space-y-2">
        <div class="flex items-start justify-between gap-2 flex-wrap">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold" style="background: var(--gw-accent-soft); color: var(--gw-accent);">
              ${idx + 1}. ${escHtml(SUBJECT_NAMES[it.subjectCode] || it.subjectCode)}
            </span>
            <span class="text-[11px] font-bold" style="color: var(--gw-muted);">
              สาระที่ ${escHtml(it.strandNo || '-')} | ${escHtml(it.indicatorCode || '-')}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="editPracticeBankItem('${escHtml(it.itemId)}')" class="gw-btn-soft !py-1 !px-2.5 text-[11px] font-bold">แก้ไข</button>
            <button type="button" onclick="deletePracticeBankItem('${escHtml(it.itemId)}')" class="gw-btn-soft !py-1 !px-2.5 text-[11px] font-bold" style="color: var(--gw-danger-ink);">ลบ</button>
          </div>
        </div>
        <div class="text-xs font-bold">${escHtml(it.summaryTitle)}</div>
        <div class="text-xs" style="color: var(--gw-muted);">คำถาม: ${escHtml(it.questionText)}</div>
        <div class="text-[11px]" style="color: var(--gw-accent);">
          เฉลยข้อ ${escHtml(it.correctChoice)} | ตัวเลือก 1) ${escHtml(it.choice1)} • 2) ${escHtml(it.choice2)} • 3) ${escHtml(it.choice3)} • 4) ${escHtml(it.choice4)}
        </div>
      </div>
    `).join('');
  }

  function editPracticeBankItem(itemId) {
    const it = (STATE.practiceBankCache || []).find(x => x.itemId === itemId);
    if (!it) return;
    document.getElementById('pbEditItemId').value = it.itemId;
    document.getElementById('pbSubject').value = it.subjectCode || '61';
    onPbSubjectChange();
    if (it.strandNo) document.getElementById('pbStrand').value = String(it.strandNo);
    onPbStrandChange();
    if (it.indicatorCode) document.getElementById('pbIndicator').value = it.indicatorCode;

    document.getElementById('pbSummaryTitle').value = it.summaryTitle || '';
    document.getElementById('pbSummaryText').value = it.summaryText || '';
    document.getElementById('pbQuestionText').value = it.questionText || '';
    document.getElementById('pbChoice1').value = it.choice1 || '';
    document.getElementById('pbChoice2').value = it.choice2 || '';
    document.getElementById('pbChoice3').value = it.choice3 || '';
    document.getElementById('pbChoice4').value = it.choice4 || '';
    document.getElementById('pbCorrectChoice').value = String(it.correctChoice || '1');
    document.getElementById('pbExplanation').value = it.explanation || '';

    const titleEl = document.getElementById('pbFormTitle');
    const cancelBtn = document.getElementById('btnPbCancelEdit');
    const saveBtn = document.getElementById('btnPbSave');
    if (titleEl) titleEl.textContent = '✏️ แก้ไขบทเรียน & โจทย์ฝึกออนไลน์';
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i><span>อัปเดตโจทย์ในคลังฝึกออนไลน์</span>';
      refreshIcons();
    }
    const formTitle = document.getElementById('pbFormTitle');
    if (formTitle && formTitle.scrollIntoView) formTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function savePracticeBankItem() {
    const itemId = document.getElementById('pbEditItemId').value.trim();
    const subjectCode = document.getElementById('pbSubject').value;
    const strandNo = document.getElementById('pbStrand').value;
    const indicatorCode = document.getElementById('pbIndicator').value;
    const summaryTitle = document.getElementById('pbSummaryTitle').value.trim();
    const summaryText = document.getElementById('pbSummaryText').value.trim();
    const questionText = document.getElementById('pbQuestionText').value.trim();
    const choice1 = document.getElementById('pbChoice1').value.trim();
    const choice2 = document.getElementById('pbChoice2').value.trim();
    const choice3 = document.getElementById('pbChoice3').value.trim();
    const choice4 = document.getElementById('pbChoice4').value.trim();
    const correctChoice = document.getElementById('pbCorrectChoice').value;
    const explanation = document.getElementById('pbExplanation').value.trim();

    if (!summaryTitle || !questionText || !choice1 || !choice2 || !choice3 || !choice4) {
      showToast('กรุณากรอกชื่อเรื่อง คำถาม และตัวเลือก 1–4 ให้ครบถ้วนครับ', 'error');
      return;
    }

    const btn = document.getElementById('btnPbSave');
    if (btn) btn.disabled = true;
    try {
      const res = await callGas('apiSavePracticeItem', {
        authToken: STATE.authToken || '',
        itemId,
        subjectCode,
        strandNo,
        indicatorCode,
        summaryTitle,
        summaryText,
        questionText,
        choice1,
        choice2,
        choice3,
        choice4,
        correctChoice,
        explanation
      });
      if (!res || !res.ok) {
        showToast((res && res.error) || 'บันทึกโจทย์ไม่สำเร็จ', 'error');
        return;
      }
      showToast(itemId ? 'อัปเดตข้อสอบในคลังเรียบร้อยแล้วครับ' : 'เพิ่มข้อสอบใหม่เข้าคลังฝึกออนไลน์เรียบร้อยแล้วครับ', 'success');
      resetPracticeBankForm();
      await loadPracticeBankList();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function deletePracticeBankItem(itemId) {
    const it = (STATE.practiceBankCache || []).find(x => x.itemId === itemId);
    openCustomModal({
      title: 'ลบข้อสอบออกจากคลังฝึกออนไลน์',
      subtitle: 'ข้อสอบที่ลบจะไม่แสดงในห้องเรียนนักเรียน ป.6 อีกต่อไป',
      bodyHtml: `<div class="text-xs leading-relaxed">ต้องการลบโจทย์เรื่อง <b>${escHtml(it ? it.summaryTitle : itemId)}</b> ใช่หรือไม่ครับ?</div>`,
      confirmText: 'ยืนยันลบโจทย์',
      danger: true,
      onConfirm: async () => {
        const res = await callGas('apiDeletePracticeItem', {
          authToken: STATE.authToken || '',
          itemId
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'ลบโจทย์ไม่สำเร็จ', 'error');
          return false;
        }
        if (document.getElementById('pbEditItemId').value === itemId) resetPracticeBankForm();
        showToast('ลบข้อสอบออกจากคลังเรียบร้อยแล้วครับ', 'success');
        await loadPracticeBankList();
      }
    });
  }

  /* ========================================================================
   * 7B. TAB 3: P.6 SUBJECT TEACHER / INSTRUCTOR WORKSPACE
   *     (1. DOWNLOAD 15-STRAND DOCS, 2. WEAKNESS <50%, 3. ONLINE PRACTICE)
   * ======================================================================== */
  function switchInstructorSubTab(sub) {
    ['MATERIALS', 'WEAKNESS', 'PRACTICE'].forEach(k => {
      const panel = document.getElementById('instPanel_' + k);
      if (panel) panel.classList.toggle('hidden', k !== sub);
      const btn = document.getElementById('instSub_' + k);
      if (btn) btn.classList.toggle('is-active', k === sub);
    });
    if (sub === 'MATERIALS') loadInstructorMaterials();
    if (sub === 'WEAKNESS') loadInstructorWeaknessView();
    if (sub === 'PRACTICE') loadInstructorPracticeTracking();
  }

  async function loadInstructorMaterials() {
    const res = await callGas('apiGetSubmissionsList', { authToken: STATE.authToken || '' });
    if (res && res.ok) {
      STATE.cachedSubmissions = res.submissions || [];
    }
    renderInstructorMaterialsGrid();
  }

  function filterInstructorMaterials(subCode) {
    STATE.instructorSubFilter = subCode || 'ALL';
    ['ALL', '61', '64', '65', '63'].forEach(code => {
      const btn = document.getElementById('instMatSub_' + code);
      if (btn) btn.classList.toggle('is-active', code === STATE.instructorSubFilter);
    });
    renderInstructorMaterialsGrid();
  }

  function filterInstructorMaterialCategory(cat) {
    STATE.instMatCatFilter = cat || 'ALL';
    ['ALL', 'MERGED_BOOK', 'PREPOST_EXAM', 'TUTORING_STRAND'].forEach(k => {
      const btn = document.getElementById('instMatCat_' + k);
      if (!btn) return;
      btn.className = (k === STATE.instMatCatFilter ? 'gw-btn-primary' : 'gw-btn-soft') + ' !py-1.5 !px-3 text-xs';
    });
    renderInstructorMaterialsGrid();
  }

  function renderInstructorMaterialsGrid() {
    const grid = document.getElementById('instMaterialsGrid');
    const summaryBar = document.getElementById('instMaterialsSummaryBar');
    const featuredBox = document.getElementById('instFeaturedMaterials');
    if (!grid || !summaryBar) return;

    const filterSub = STATE.instructorSubFilter || 'ALL';
    const catFilter = STATE.instMatCatFilter || 'ALL';
    const subs = (STATE.cachedSubmissions || []).map(normalizeSubMetaClient_);

    if (featuredBox) {
      const featured = subs.filter(s => {
        if (s.reviewStatus === 'ส่งแก้') return false;
        if (filterSub !== 'ALL' && String(s.subjectCode) !== filterSub) return false;
        if (catFilter === 'TUTORING_STRAND') return false;
        if (catFilter !== 'ALL' && s.docCategory !== catFilter) return false;
        return s.docCategory === 'MERGED_BOOK' || s.docCategory === 'PREPOST_EXAM';
      }).sort((a, b) => (isApprovedSubmissionStatus_(b.reviewStatus) ? 1 : 0) - (isApprovedSubmissionStatus_(a.reviewStatus) ? 1 : 0));

      if (featured.length) {
        featuredBox.classList.remove('hidden');
        featuredBox.innerHTML = `
          <div class="text-xs font-bold" style="color: var(--gw-accent);">⭐ เอกสารรวมเล่มสมบูรณ์ และ ข้อสอบคู่ขนาน Pre-Post O-NET (${featured.length} รายการ)</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${featured.map(doc => {
              const isOk = isApprovedSubmissionStatus_(doc.reviewStatus);
              return `
                <div class="gw-subcard space-y-2 border-2" style="border-color: ${doc.targetAudience === 'STUDENT' ? 'var(--gw-accent-soft)' : '#FECACA'};">
                  <div class="flex flex-wrap items-center justify-between gap-1.5">
                    <span class="font-bold text-xs">${escHtml(SUBJECT_NAMES[doc.subjectCode] || doc.subjectCode)} | ${escHtml(doc.strandNo)}</span>
                    <div class="flex flex-wrap gap-1">${formatSubmissionCardBadges_(doc)} <span class="${isOk ? 'gw-badge-success' : 'gw-badge-warn'}">${escHtml(isOk ? '✓ พร้อมใช้' : (doc.reviewStatus || 'รอตรวจ'))}</span></div>
                  </div>
                  <div class="text-xs font-bold">${escHtml(doc.fileName)}</div>
                  <div class="text-[11px]" style="color: var(--gw-muted);">${escHtml(doc.subStandard || '')} | จัดทำโดย: ${escHtml(doc.teacherName)}</div>
                  <div class="flex flex-wrap gap-2">
                    ${doc.pdfFileUrl ? `<a href="${escHtml(doc.pdfFileUrl)}" target="_blank" class="gw-btn-primary !py-1.5 !px-3 text-xs">📄 โหลด PDF (${doc.targetAudience === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู'})</a>` : ''}
                    <a href="${escHtml(doc.driveFileUrl)}" target="_blank" class="${doc.pdfFileUrl ? 'gw-btn-soft' : 'gw-btn-primary'} !py-1.5 !px-3 text-xs !font-bold">📝 โหลด Word (.docx)</a>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else {
        featuredBox.classList.add('hidden');
        featuredBox.innerHTML = '';
      }
    }

    const subjectOrder = ['61', '64', '65', '63'];
    const strandGroups = [];
    subjectOrder.forEach(subCode => {
      const bpRows = (STATE.blueprint || []).filter(r => String(r.subjectCode) === subCode);
      const mapByStrand = new Map();
      bpRows.forEach(r => {
        const key = String(r.strandNo);
        if (!mapByStrand.has(key)) {
          mapByStrand.set(key, {
            subjectCode: subCode,
            subjectName: SUBJECT_NAMES[subCode] || subCode,
            strandNo: key,
            strandName: r.strandName || '',
            indicators: []
          });
        }
        mapByStrand.get(key).indicators.push(r.indicatorCode);
      });
      mapByStrand.forEach(val => strandGroups.push(val));
    });

    let totalUploadedStrands = 0;
    let totalApprovedStrands = 0;

    strandGroups.forEach(g => {
      const matching = subs
        .filter(s => String(s.subjectCode) === g.subjectCode && String(s.strandNo) === g.strandNo && s.reviewStatus !== 'ส่งแก้' && (catFilter === 'ALL' || s.docCategory === catFilter))
        .sort((a, b) => (isApprovedSubmissionStatus_(a.reviewStatus) ? 0 : 1) - (isApprovedSubmissionStatus_(b.reviewStatus) ? 0 : 1));
      const approved = matching.filter(s => isApprovedSubmissionStatus_(s.reviewStatus));
      g.allUploads = matching;
      g.hasApproved = approved.length > 0;
      if (matching.length > 0) totalUploadedStrands++;
      if (approved.length > 0) totalApprovedStrands++;
    });

    const visibleStrands = filterSub === 'ALL'
      ? strandGroups
      : strandGroups.filter(g => g.subjectCode === filterSub);

    summaryBar.textContent =
      `สรุปคลังเอกสารติวรายสาระ: มีไฟล์เข้าระบบแล้ว ${totalUploadedStrands} / ${strandGroups.length} สาระ | ตรวจผ่านพร้อมนำไปสอนแล้ว ${totalApprovedStrands} สาระ`;

    if (!visibleStrands.length) {
      grid.innerHTML = '<div class="gw-subcard text-xs" style="color: var(--gw-muted);">กำลังโหลดโครงสร้าง 15 สาระการเรียนรู้...</div>';
      return;
    }

    grid.innerHTML = visibleStrands.map(g => {
      const uploads = g.allUploads || [];
      const indPreview = g.indicators.slice(0, 6).join(', ') + (g.indicators.length > 6 ? ` (+อีก ${g.indicators.length - 6})` : '');
      if (!uploads.length) {
        return `
          <div class="gw-subcard flex flex-col justify-between space-y-2.5 opacity-85">
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style="background: var(--gw-input-bg); border: 1px solid var(--gw-line);">
                  ${escHtml(g.subjectName)} (${escHtml(g.subjectCode)}) | สาระที่ ${escHtml(g.strandNo)}
                </span>
                <span class="text-[11px] font-bold" style="color: var(--gw-muted);">ยังไม่มีไฟล์ในหมวดนี้</span>
              </div>
              <div class="text-sm font-bold">${escHtml(g.strandName)}</div>
              <div class="text-xs" style="color: var(--gw-muted);">ตัวชี้วัด (${g.indicators.length}): ${escHtml(indPreview)}</div>
            </div>
            <div class="text-xs pt-1 border-t" style="border-color: var(--gw-line); color: var(--gw-muted);">
              เมื่อคณะกรรมการจัดทำเอกสารอัปโหลดไฟล์สาระนี้แล้ว ปุ่มดาวน์โหลดฉบับนักเรียนและฉบับครูจะแสดงที่นี่ทันทีครับ
            </div>
          </div>
        `;
      }

      const filesHtml = uploads.map(doc => {
        const isDocApproved = isApprovedSubmissionStatus_(doc.reviewStatus);
        const badgeClass = isDocApproved ? 'gw-badge-success' : 'gw-badge-warn';
        const badgeText = isDocApproved ? '✓ ผ่านพร้อมใช้สอน' : (doc.reviewStatus || 'รอตรวจ');
        const subStdLabel = doc.subStandard && doc.subStandard !== 'ALL' ? `มาตรฐาน ${doc.subStandard} • ` : '';
        const edBtnLabel = doc.targetAudience === 'STUDENT' ? '📘 ฉบับนักเรียน' : '📕 ฉบับครู (มีเฉลย)';
        return `
          <div class="pt-2 border-t space-y-2" style="border-color: var(--gw-line);">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span style="color: var(--gw-muted);">
                ${escHtml(subStdLabel)}จัดทำโดย: <b style="color: var(--gw-ink);">${escHtml(doc.teacherName)}</b> (${escHtml(getSchoolShortName(doc.schoolId))})
              </span>
              <div class="flex flex-wrap gap-1">${formatSubmissionCardBadges_(doc)} <span class="${badgeClass}">${escHtml(badgeText)}</span></div>
            </div>
            <div class="flex flex-wrap gap-2">
              ${doc.pdfFileUrl ? `
                <a href="${escHtml(doc.pdfFileUrl)}" target="_blank" class="gw-btn-primary !py-2 !px-3 text-xs">
                  <span>📄 PDF ${edBtnLabel}</span>
                </a>
              ` : ''}
              <a href="${escHtml(doc.driveFileUrl)}" target="_blank" class="${doc.pdfFileUrl ? 'gw-btn-soft' : 'gw-btn-primary'} !py-2 !px-3 text-xs !font-bold">
                <span>📝 Word (.docx) ${edBtnLabel}</span>
              </a>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="gw-subcard flex flex-col justify-between space-y-2.5" style="${g.hasApproved ? 'border-color: var(--gw-accent-soft);' : ''}">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style="background: var(--gw-accent-soft); color: var(--gw-accent);">
                ${escHtml(g.subjectName)} (${escHtml(g.subjectCode)}) | สาระที่ ${escHtml(g.strandNo)}
              </span>
              <span class="${g.hasApproved ? 'gw-badge-success' : 'gw-badge-warn'}">
                มี ${uploads.length} ไฟล์
              </span>
            </div>
            <div class="text-sm font-bold">${escHtml(g.strandName)}</div>
            <div class="text-xs" style="color: var(--gw-muted);">ตัวชี้วัด (${g.indicators.length}): ${escHtml(indPreview)}</div>
          </div>
          <div class="space-y-2">${filesHtml}</div>
        </div>
      `;
    }).join('');
  }

  async function loadInstructorWeaknessView() {
    const schoolEl = document.getElementById('instWeakSchoolId');
    const subEl = document.getElementById('instWeakSubjectCode');
    if (!schoolEl || !subEl) return;
    const schoolId = schoolEl.value || 'ALL';
    const subjectCode = subEl.value || '61';

    const res = await callGas('apiGetSchoolAnalytics', { schoolId, subjectCode });
    if (!res || !res.ok) return;
    const r = res.report;
    const inds = r.indicatorBreakdown || [];
    const weakCount = inds.filter(i => i.isWeak).length;

    const rAvgGain = hasFiniteNumber(r.avgGain) ? Number(r.avgGain) : 0;
    document.getElementById('instWeakKpiCards').innerHTML = `
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">คะแนนเฉลี่ย Pre O-NET (<span class="gw-tabular">${r.preCount}</span> คน)</div>
        <div class="text-2xl font-bold mt-1 gw-tabular">${fmtFixed(r.preAvg, 2, '0.00')}</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">คะแนนเฉลี่ย Post O-NET (<span class="gw-tabular">${r.postCount}</span> คน)</div>
        <div class="text-2xl font-bold mt-1 gw-tabular" style="color: var(--gw-accent);">${fmtFixed(r.postAvg, 2, '0.00')}</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">ค่าพัฒนาการเฉลี่ย (Gain)</div>
        <div class="text-2xl font-bold mt-1 gw-tabular" style="color: ${rAvgGain >= 0 ? 'var(--gw-accent)' : 'var(--gw-danger-ink)'};">${rAvgGain >= 0 ? '+' : ''}${fmtFixed(rAvgGain, 2, '0.00')}</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">ตัวชี้วัดจุดอ่อน (&lt;50%)</div>
        <div class="text-2xl font-bold mt-1 gw-tabular" style="color: ${weakCount > 0 ? 'var(--gw-danger-ink)' : 'var(--gw-accent)'};">${weakCount} / ${inds.length} ตัวชี้วัด</div>
      </div>
    `;

    const indBox = document.getElementById('instWeakIndicatorsBox');
    if (!inds.length) {
      indBox.innerHTML = '<div class="gw-subcard text-xs" style="color: var(--gw-muted);">ยังไม่มีข้อมูลผลคะแนนสอบในวิชานี้ (เมื่อครูวิชาการบันทึกกระดาษคำตอบแล้ว ระบบจะจัดลำดับตัวชี้วัดจุดอ่อนให้ทันทีครับ)</div>';
    } else {
      indBox.innerHTML = inds.map((ind, idx) => {
        const latestPct = Number((r.postCount > 0 ? ind.postMasteryPct : ind.preMasteryPct) || 0);
        const desc = getIndicatorDesc(ind.indicatorCode);
        return `
          <div class="gw-subcard space-y-1.5" style="${ind.isWeak ? 'border-color: var(--gw-danger-border);' : ''}">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="font-bold text-xs">
                ${idx + 1}. ${escHtml(ind.indicatorCode)}
                <span class="font-normal opacity-75">| สาระที่ ${escHtml(ind.strandNo)}</span>
              </div>
              <span class="${ind.isWeak ? 'gw-badge-danger' : 'gw-badge-success'}">
                ${ind.isWeak ? 'ควรเร่งติวเสริม (<50%)' : 'ผ่านเกณฑ์ (≥50%)'}
              </span>
            </div>
            ${desc ? `<div class="text-xs leading-relaxed" style="color: var(--gw-muted);">${escHtml(desc)}</div>` : ''}
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs gw-tabular" style="color: var(--gw-muted);">
              <span>ก่อนติว (Pre): <b style="color: var(--gw-ink);">${fmtFixed(ind.preMasteryPct, 1, '0.0')}%</b></span>
              <span>หลังติว (Post): <b style="color: var(--gw-accent);">${fmtFixed(ind.postMasteryPct, 1, '0.0')}%</b></span>
            </div>
            <div class="gw-progress-track">
              <div class="gw-progress-fill" style="width: ${Math.min(100, Math.max(0, latestPct))}%; ${ind.isWeak ? 'background: var(--gw-danger-ink);' : ''}"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const stuBox = document.getElementById('instWeakStudentsTable');
    const stus = r.allStudents || [];
    if (!stus.length) {
      stuBox.innerHTML = '<div class="gw-subcard text-xs" style="color: var(--gw-muted);">ยังไม่มีคะแนนสอบรายบุคคลในโรงเรียนและรายวิชานี้</div>';
    } else {
      stuBox.innerHTML = `
        <table class="gw-table">
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>ชื่อ - นามสกุลนักเรียน</th>
              <th class="text-center">Pre O-NET</th>
              <th class="text-center">Post O-NET</th>
              <th class="text-center">พัฒนาการ</th>
            </tr>
          </thead>
          <tbody>
            ${stus.map((st, idx) => `
              <tr>
                <td class="text-center font-bold gw-tabular">${idx + 1}</td>
                <td class="font-semibold">${escHtml(st.studentName || st.studentId)}</td>
                <td class="text-center gw-tabular">${fmtFixed(st.preScore, 2, '-')}</td>
                <td class="text-center font-bold gw-tabular" style="color: var(--gw-accent);">${fmtFixed(st.postScore, 2, '-')}</td>
                <td class="text-center font-bold gw-tabular" style="color: ${hasFiniteNumber(st.gain) && Number(st.gain) < 0 ? 'var(--gw-danger-ink)' : 'var(--gw-accent)'};">
                  ${hasFiniteNumber(st.gain) ? ((Number(st.gain) >= 0 ? '+' : '') + fmtFixed(st.gain, 2, '0.00')) : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  async function loadInstructorPracticeTracking() {
    const schoolEl = document.getElementById('instPracSchoolId');
    const subEl = document.getElementById('instPracSubjectCode');
    if (!schoolEl || !subEl) return;
    const schoolId = schoolEl.value || 'ALL';
    const subjectCode = subEl.value || 'ALL';

    const res = await callGas('apiGetSchoolPracticeOverview', { schoolId, subjectCode });
    if (!res || !res.ok) return;
    const sum = res.summary || {};
    STATE.instructorPracticeCache = {
      schoolId,
      summary: sum,
      students: res.students || []
    };

    document.getElementById('instPracKpiCards').innerHTML = `
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">นักเรียน ป.6 ทั้งหมด</div>
        <div class="text-2xl font-bold mt-1 gw-tabular">${sum.totalStudents || 0} คน</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">เข้าฝึกทำโจทย์ออนไลน์แล้ว</div>
        <div class="text-2xl font-bold mt-1 gw-tabular" style="color: var(--gw-accent);">${sum.activeStudentsCount || 0} / ${sum.totalStudents || 0} คน</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">จำนวนครั้งที่ทำโจทย์รวม</div>
        <div class="text-2xl font-bold mt-1 gw-tabular">${sum.totalAttemptsAll || 0} ครั้ง</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">ความแม่นยำเฉลี่ย</div>
        <div class="text-2xl font-bold mt-1 gw-tabular" style="color: var(--gw-accent);">${sum.avgAccuracyPct || 0}%</div>
      </div>
    `;

    renderInstructorPracticeTable();
  }

  function renderInstructorPracticeTable() {
    const tblBox = document.getElementById('instPracStudentsTable');
    if (!tblBox) return;
    const cache = STATE.instructorPracticeCache || { schoolId: 'ALL', students: [] };
    const schoolId = cache.schoolId || 'ALL';
    const baseStudents = cache.students || [];

    if (!baseStudents.length) {
      tblBox.innerHTML = '<div class="gw-subcard text-xs" style="color: var(--gw-muted);">ยังไม่มีรายชื่อนักเรียน ป.6 ในโรงเรียนที่เลือก (คุณครูวิชาการสามารถนำเข้ารายชื่อจากไฟล์ Excel ได้ที่เมนู 4. ครูวิชาการ)</div>';
      return;
    }

    const compFilterEl = document.getElementById('instPracCompletionFilter');
    const sortByEl = document.getElementById('instPracSortBy');
    const compMode = compFilterEl ? compFilterEl.value : 'ALL';
    const sortMode = sortByEl ? sortByEl.value : 'NO_ASC';

    let rows = baseStudents.filter(st => {
      const att = Number(st.attemptCount || 0);
      const pct = Number(st.progressPct || 0);
      if (compMode === 'NOT_STARTED' || compMode === 'NONE' || compMode === 'ZERO') return att === 0;
      if (compMode === 'ACTIVE' || compMode === 'STARTED') return att > 0;
      if (compMode === 'COMPLETE' || compMode === 'COMPLETED' || compMode === 'DONE') return pct >= 100;
      if (compMode === 'IN_PROGRESS' || compMode === 'PARTIAL') return att > 0 && pct < 100;
      return true;
    });

    rows = rows.slice().sort((a, b) => {
      if (sortMode === 'PROGRESS_DESC' || sortMode === 'PCT_DESC') {
        return (Number(b.progressPct || 0) - Number(a.progressPct || 0)) || (Number(b.accuracyPct || 0) - Number(a.accuracyPct || 0));
      }
      if (sortMode === 'PROGRESS_ASC' || sortMode === 'PCT_ASC') {
        return (Number(a.progressPct || 0) - Number(b.progressPct || 0)) || (Number(a.studentNo || 0) - Number(b.studentNo || 0));
      }
      if (sortMode === 'ACCURACY_DESC' || sortMode === 'ACC_DESC') {
        return (Number(b.accuracyPct || 0) - Number(a.accuracyPct || 0)) || (Number(b.progressPct || 0) - Number(a.progressPct || 0));
      }
      if (sortMode === 'ATTEMPTS_DESC') {
        return Number(b.attemptCount || 0) - Number(a.attemptCount || 0);
      }
      return (Number(a.studentNo || 0) - Number(b.studentNo || 0)) || String(a.fullName || '').localeCompare(String(b.fullName || ''), 'th');
    });

    if (!rows.length) {
      tblBox.innerHTML = '<div class="gw-subcard text-xs" style="color: var(--gw-muted);">ไม่พบรายชื่อนักเรียนที่ตรงกับตัวกรองสถานะการฝึกทำ</div>';
      return;
    }

    tblBox.innerHTML = `
      <table class="gw-table">
        <thead>
          <tr>
            <th class="text-center">เลขที่</th>
            <th>ชื่อ - นามสกุลนักเรียน</th>
            <th class="text-center">ห้อง</th>
            <th class="text-center">บทเรียนที่ตอบถูก</th>
            <th class="text-center">ฝึกสะสม</th>
            <th class="text-center">ตอบถูกเฉลี่ย</th>
            <th class="text-center">เข้าฝึกล่าสุด</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(st => {
            const lastStr = st.lastPracticedAt ? formatThaiDateFull(String(st.lastPracticedAt).slice(0, 10)) : 'ยังไม่เข้าฝึก';
            return `
              <tr>
                <td class="text-center font-bold gw-tabular">${escHtml(st.studentNo)}</td>
                <td class="font-semibold">
                  ${escHtml(st.fullName)}
                  ${schoolId === 'ALL' ? `<span class="text-[11px] opacity-70">(${escHtml(getSchoolShortName(st.schoolId))})</span>` : ''}
                </td>
                <td class="text-center">${escHtml(st.room)}</td>
                <td class="text-center font-bold gw-tabular" style="color: var(--gw-accent);">${st.doneCount} / ${st.totalItems} (${st.progressPct}%)</td>
                <td class="text-center gw-tabular">${st.attemptCount} ครั้ง</td>
                <td class="text-center font-bold gw-tabular">${st.attemptCount > 0 ? st.accuracyPct + '%' : '-'}</td>
                <td class="text-center" style="color: ${st.attemptCount > 0 ? 'var(--gw-ink)' : 'var(--gw-muted)'};">${escHtml(lastStr)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  /* ========================================================================
   * 8. TAB 3: SCHOOL ACADEMIC TEACHER (DIGITAL ANSWER SHEET, ROSTER, A4 REPORT)
   * ======================================================================== */
  function switchAcademicSubTab(sub) {
    ['GRADING', 'REPORT', 'ROSTER', 'MATERIALS'].forEach(k => {
      const panel = document.getElementById('acadPanel_' + k);
      if (panel) panel.classList.toggle('hidden', k !== sub);
      const btn = document.getElementById('acadSub_' + k);
      if (btn) btn.classList.toggle('is-active', k === sub);
    });
    if (sub === 'REPORT') loadSchoolAnalyticsReport();
    if (sub === 'ROSTER') refreshRosterTable();
    if (sub === 'MATERIALS') loadAcademicMaterials();
  }

  async function loadAcademicMaterials() {
    const res = await callGas('apiGetSubmissionsList', { authToken: STATE.authToken || '' });
    if (res && res.ok) {
      STATE.cachedSubmissions = res.submissions || [];
    }
    renderAcademicMaterialsGrid();
  }

  function filterAcademicMaterials(subCode) {
    STATE.acadSubFilter = subCode || 'ALL';
    ['ALL', '61', '64', '65', '63'].forEach(k => {
      const btn = document.getElementById('acadMatSub_' + k);
      if (btn) btn.classList.toggle('is-active', k === STATE.acadSubFilter);
    });
    renderAcademicMaterialsGrid();
  }

  function filterAcademicMaterialCategory(cat) {
    STATE.acadCatFilter = cat || 'ALL';
    ['ALL', 'MERGED_BOOK', 'PREPOST_EXAM', 'TUTORING_STRAND'].forEach(k => {
      const btn = document.getElementById('acadMatCat_' + k);
      if (!btn) return;
      btn.className = (k === STATE.acadCatFilter ? 'gw-btn-primary' : 'gw-btn-soft') + ' !py-1.5 !px-3 text-xs';
    });
    renderAcademicMaterialsGrid();
  }

  function renderAcademicMaterialsGrid() {
    const grid = document.getElementById('acadMaterialsGrid');
    const summaryBar = document.getElementById('acadMaterialsSummaryBar');
    if (!grid || !summaryBar) return;

    const subFilter = STATE.acadSubFilter || 'ALL';
    const catFilter = STATE.acadCatFilter || 'ALL';
    const allSubs = (STATE.cachedSubmissions || []).map(normalizeSubMetaClient_).filter(s => s.reviewStatus !== 'ส่งแก้');
    const rank = (x) => (x.docCategory === 'MERGED_BOOK' ? 0 : (x.docCategory === 'PREPOST_EXAM' ? 1 : 2));
    const filtered = allSubs.filter(s => {
      if (subFilter !== 'ALL' && String(s.subjectCode) !== subFilter) return false;
      if (catFilter !== 'ALL' && s.docCategory !== catFilter) return false;
      return true;
    }).sort((a, b) => {
      const aOk = isApprovedSubmissionStatus_(a.reviewStatus) ? 0 : 1;
      const bOk = isApprovedSubmissionStatus_(b.reviewStatus) ? 0 : 1;
      return aOk - bOk || rank(a) - rank(b) || Number(a.strandNo || 99) - Number(b.strandNo || 99);
    });

    const approvedCount = filtered.filter(s => isApprovedSubmissionStatus_(s.reviewStatus)).length;
    summaryBar.textContent = `พบไฟล์เอกสารในคลังกลาง ${filtered.length} รายการ (ตรวจผ่านพร้อมพิมพ์แจก/ใช้สอนแล้ว ${approvedCount} รายการ)`;

    if (!filtered.length) {
      grid.innerHTML = '<div class="gw-subcard md:col-span-2 text-xs" style="color: var(--gw-muted);">ยังไม่มีไฟล์เอกสารหรือข้อสอบ Pre-Post ในหมวดที่เลือกครับ</div>';
      return;
    }

    grid.innerHTML = filtered.map(doc => {
      const isOk = isApprovedSubmissionStatus_(doc.reviewStatus);
      const isStu = doc.targetAudience === 'STUDENT';
      const usageHint = isStu ? '📘 ใช้พิมพ์แจก/ส่งให้นักเรียน' : '📕 สำหรับครูผู้สอน (ห้ามแจกนักเรียน)';
      return `
        <div class="gw-subcard space-y-2 border" style="border-color: ${isStu ? 'var(--gw-accent-soft)' : '#FECACA'};">
          <div class="flex flex-wrap items-center justify-between gap-1.5">
            <span class="font-bold text-xs">${escHtml(SUBJECT_NAMES[doc.subjectCode] || doc.subjectCode)} | สาระ ${escHtml(doc.strandNo)}</span>
            <div class="flex flex-wrap gap-1">${formatSubmissionCardBadges_(doc)} <span class="${isOk ? 'gw-badge-success' : 'gw-badge-warn'}">${escHtml(isOk ? '✓ พร้อมใช้' : (doc.reviewStatus || 'รอตรวจ'))}</span></div>
          </div>
          <div class="text-xs font-bold">${escHtml(doc.fileName)}</div>
          <div class="text-[11px]" style="color: var(--gw-muted);">${escHtml(usageHint)} | ${escHtml(doc.subStandard || '')} | ผู้จัดทำ: ${escHtml(doc.teacherName)} (${escHtml(getSchoolShortName(doc.schoolId))})</div>
          <div class="flex flex-wrap gap-2">
            ${doc.pdfFileUrl ? `<a href="${escHtml(doc.pdfFileUrl)}" target="_blank" class="gw-btn-primary !py-1.5 !px-3 text-xs">📄 ดาวน์โหลด PDF พร้อมพิมพ์</a>` : ''}
            <a href="${escHtml(doc.driveFileUrl)}" target="_blank" class="${doc.pdfFileUrl ? 'gw-btn-soft' : 'gw-btn-primary'} !py-1.5 !px-3 text-xs !font-bold">📝 ดาวน์โหลด Word (.docx)</a>
          </div>
        </div>
      `;
    }).join('');
  }

  function applyGradingSheetInitData_(res, prevSelected = '') {
    const sel = document.getElementById('gradeStudentId');
    if (!sel || !res || !res.ok) return;
    const list = res.students || [];
    STATE.gradingStudents = list;
    STATE.gradingSavedByStudent = res.savedByStudent || {};
    STATE.gradingDirty = false;

    if (!list.length) {
      sel.innerHTML = '<option value="">-- ยังไม่มีรายชื่อนักเรียน (เพิ่มที่แท็บย่อยที่ 3) --</option>';
      STATE.gradingLastStudentId = '';
      renderDigitalAnswerSheetGrid();
      return;
    }

    sel.innerHTML = list.map(s => {
      const saved = STATE.gradingSavedByStudent[s.studentId];
      const suffix = saved ? ` — ✓ ตรวจแล้ว (${fmtFixed(saved.totalScore, 2, '0.00')})` : '';
      return `<option value="${escHtml(s.studentId)}" data-name="${escHtml(s.fullName)}">เลขที่ ${escHtml(s.studentNo)} ${escHtml(s.fullName)}${escHtml(suffix)}</option>`;
    }).join('');

    if (prevSelected && list.some(s => s.studentId === prevSelected)) {
      sel.value = prevSelected;
    } else {
      const firstUngraded = list.find(s => !STATE.gradingSavedByStudent[s.studentId]);
      sel.value = firstUngraded ? firstUngraded.studentId : list[0].studentId;
    }
    STATE.gradingLastStudentId = sel.value;
    loadSelectedStudentGradingAnswers();
  }

  async function loadGradingSheetData() {
    const schoolEl = document.getElementById('gradeSchoolId');
    const roundEl = document.getElementById('gradeRound');
    const subEl = document.getElementById('gradeSubjectCode');
    const sel = document.getElementById('gradeStudentId');
    if (!schoolEl || !roundEl || !subEl || !sel) return;
    const schoolId = schoolEl.value;
    const round = roundEl.value;
    const subjectCode = subEl.value;
    if (!schoolId) return;

    const prevSelected = sel.value;
    const res = await callGas('apiGetGradingSheetInit', {
      authToken: STATE.authToken || '',
      schoolId,
      round,
      subjectCode
    });
    if (!res || !res.ok) {
      showToast((res && res.error) || 'โหลดข้อมูลรายชื่อกระดาษคำตอบไม่สำเร็จ', 'error');
      return;
    }
    applyGradingSheetInitData_(res, prevSelected);
  }
  const loadGradingStudentOptions = loadGradingSheetData;

  function onGradeStudentChange() {
    const sel = document.getElementById('gradeStudentId');
    if (!sel) return;
    const nextId = sel.value;
    if (STATE.gradingDirty && STATE.gradingLastStudentId && nextId !== STATE.gradingLastStudentId) {
      const prevId = STATE.gradingLastStudentId;
      sel.value = prevId;
      openCustomModal({
        title: 'พบคำตอบที่ยังไม่ได้บันทึก',
        subtitle: 'คุณครูยังไม่ได้กดบันทึกคะแนนของนักเรียนคนปัจจุบัน',
        bodyHtml: '<div class="text-xs leading-relaxed">หากเปลี่ยนไปตรวจนักเรียนคนอื่นตอนนี้ คำตอบที่กรอกค้างไว้จะไม่ถูกบันทึก ต้องการเปลี่ยนคนตรวจใช่หรือไม่ครับ?</div>',
        confirmText: 'เปลี่ยนคน (ไม่บันทึก)',
        danger: true,
        onConfirm: () => {
          STATE.gradingDirty = false;
          sel.value = nextId;
          STATE.gradingLastStudentId = nextId;
          loadSelectedStudentGradingAnswers();
        }
      });
      return;
    }
    STATE.gradingLastStudentId = nextId;
    loadSelectedStudentGradingAnswers();
  }

  function loadSelectedStudentGradingAnswers() {
    const sel = document.getElementById('gradeStudentId');
    const studentId = sel ? sel.value : '';
    const savedMap = STATE.gradingSavedByStudent || {};
    const savedRec = studentId ? savedMap[studentId] : null;
    let parsed = {};
    if (savedRec && savedRec.answersJson) {
      try {
        const obj = JSON.parse(savedRec.answersJson);
        if (obj && typeof obj === 'object') parsed = obj;
      } catch (e) {}
    }
    STATE.currentAnswers = parsed;
    STATE.gradingDirty = false;

    const badge = document.getElementById('gradeExistingBadge');
    if (badge) {
      if (savedRec) {
        badge.className = 'gw-badge-success gw-tabular';
        badge.textContent = `✓ เคยบันทึกแล้ว (${fmtFixed(savedRec.totalScore, 2, '0.00')} คะแนน — แก้ไขทับได้)`;
        badge.classList.remove('hidden');
      } else if (studentId) {
        badge.className = 'gw-badge-warn';
        badge.textContent = 'ยังไม่ได้บันทึกคะแนน';
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    renderDigitalAnswerSheetGrid();
  }

  function renderDigitalAnswerSheetGrid() {
    const round = document.getElementById('gradeRound').value;
    const subjectCode = document.getElementById('gradeSubjectCode').value;
    const items = (STATE.examStructure || [])
      .filter(k => k.round === round && k.subjectCode === subjectCode)
      .sort((a, b) => a.itemNo - b.itemNo);
    STATE.gradingItems = items;
    if (!STATE.currentAnswers || typeof STATE.currentAnswers !== 'object') {
      STATE.currentAnswers = {};
    }

    const container = document.getElementById('digitalAnswerSheetContainer');
    container.innerHTML = items.map(it => {
      const savedVal = STATE.currentAnswers[it.itemNo] !== undefined && STATE.currentAnswers[it.itemNo] !== null
        ? String(STATE.currentAnswers[it.itemNo])
        : '';
      let controlHtml = '';
      if (it.itemType === 'MC4') {
        controlHtml = `<div class="flex gap-2 mt-2">
          ${[1, 2, 3, 4].map(c => `<button type="button" id="bub_${it.itemNo}_${c}" onclick="selectMcBubble(${it.itemNo}, '${c}')" class="mc-bubble${savedVal === String(c) ? ' active' : ''}">${c}</button>`).join('')}
        </div>`;
      } else if (it.itemType === 'NUMERIC') {
        controlHtml = `<div class="mt-2 space-y-1">
          <div class="text-[11px] font-semibold opacity-85">${subjectCode === '64' ? 'ระบายตัวเลข 0–999 (7.125 คะแนน)' : `ระบายตัวเลข 0–999 (${it.weight} คะแนน)`}</div>
          <input type="text" id="ansInp_${it.itemNo}" value="${escHtml(savedVal)}" placeholder="0-999"
            onfocus="focusGradingItem(${it.itemNo}, false)"
            oninput="onGradeTextAnswerInput(${it.itemNo}, this.value)"
            class="gw-input !py-1.5 text-sm font-bold gw-tabular">
        </div>`;
      } else if (it.itemType === 'ORDER') {
        if (subjectCode === '61' && Number(it.itemNo) === 21) {
          const ordParts = savedVal ? savedVal.split('|') : [];
          const ord1 = ordParts[0] || '';
          const ord2 = ordParts[1] || '';
          controlHtml = `<div class="mt-2 space-y-1.5 text-xs">
            <div class="px-2 py-1.5 rounded-xl border space-y-1" style="background: var(--gw-input-bg); border-color: var(--gw-line);">
              <div class="font-bold opacity-85">21.1 เรียง 10 คำ • 2 คะแนน</div>
              <input type="text" id="ansInp_21_1" value="${escHtml(ord1)}" placeholder="เช่น 1-2-3-4-5-6-7-8-9-10"
                onfocus="focusGradingItem(${it.itemNo}, false)"
                oninput="onGradeDualOrderInput(21)"
                class="gw-input !py-1 text-xs font-bold gw-tabular">
            </div>
            <div class="px-2 py-1.5 rounded-xl border space-y-1" style="background: var(--gw-input-bg); border-color: var(--gw-line);">
              <div class="font-bold opacity-85">21.2 เรียง 13 คำ • 3 คะแนน</div>
              <input type="text" id="ansInp_21_2" value="${escHtml(ord2)}" placeholder="เช่น 1-2-3-4-5-6-7-8-9-10-11-12-13"
                onfocus="focusGradingItem(${it.itemNo}, false)"
                oninput="onGradeDualOrderInput(21)"
                class="gw-input !py-1 text-xs font-bold gw-tabular">
            </div>
          </div>`;
        } else {
          controlHtml = `<input type="text" id="ansInp_${it.itemNo}" value="${escHtml(savedVal)}" placeholder="ลำดับ เช่น 3-1-4-2"
            onfocus="focusGradingItem(${it.itemNo}, false)"
            oninput="onGradeTextAnswerInput(${it.itemNo}, this.value)"
            class="gw-input mt-2 !py-1.5 text-sm font-bold gw-tabular">`;
        }
      } else if (it.itemType === 'ESSAY') {
        controlHtml = `<input type="number" id="ansInp_${it.itemNo}" value="${escHtml(savedVal)}" min="0" max="${it.weight}" step="0.5" placeholder="กรอกคะแนนอัตนัย 0 ถึง ${it.weight}"
          onfocus="focusGradingItem(${it.itemNo}, false)"
          oninput="onGradeTextAnswerInput(${it.itemNo}, this.value)"
          class="gw-input mt-2 !py-1.5 text-sm font-bold gw-tabular">`;
      } else if (it.itemType === 'COMPLEX_MC') {
        const cmxParts = savedVal ? savedVal.split('|') : [];
        controlHtml = `<div class="mt-2 space-y-1.5 text-xs">
          <div class="text-[11px] font-semibold opacity-85">ถูก 3/3 = 5 | 2/3 = 2.5 | 0–1 = 0 คะแนน</div>
          ${[1, 2, 3].map(subIdx => {
            const subVal = cmxParts[subIdx - 1] || '';
            return `
              <div class="flex items-center justify-between px-2.5 py-1.5 rounded-xl border" style="background: var(--gw-input-bg); border-color: var(--gw-line);">
                <span>ข้อย่อย ${subIdx}</span>
                <select onfocus="focusGradingItem(${it.itemNo}, false)" onchange="updateComplexMcAnswer(${it.itemNo})" id="cmx_${it.itemNo}_${subIdx}" class="rounded-lg border px-2 py-0.5 font-bold" style="background: var(--gw-input-bg); color: var(--gw-ink); border-color: var(--gw-line);">
                  <option value=""${subVal === '' ? ' selected' : ''}>--เลือก--</option>
                  <option value="ใช่"${subVal === 'ใช่' ? ' selected' : ''}>ใช่</option>
                  <option value="ไม่ใช่"${subVal === 'ไม่ใช่' ? ' selected' : ''}>ไม่ใช่</option>
                </select>
              </div>
            `;
          }).join('')}
        </div>`;
      }

      return `<div id="ansCard_${it.itemNo}" onclick="focusGradingItem(${it.itemNo}, false)" class="gw-subcard ans-item-card cursor-pointer">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold">ข้อที่ ${it.itemNo} (${escHtml(it.indicatorCode)})</span>
          <span class="px-2 py-0.5 rounded-lg font-bold gw-tabular" style="background: var(--gw-accent-soft); color: var(--gw-accent);">${it.weight} คะแนน</span>
        </div>
        ${controlHtml}
      </div>`;
    }).join('');

    updateGradingCounters();
    if (items.length) focusGradingItem(items[0].itemNo, false);
  }

  function onGradeTextAnswerInput(itemNo, val) {
    if (val === '' || val === null || val === undefined) {
      delete STATE.currentAnswers[itemNo];
    } else {
      STATE.currentAnswers[itemNo] = String(val);
    }
    STATE.gradingDirty = true;
    updateGradingCounters();
  }

  function onGradeDualOrderInput(itemNo) {
    const el1 = document.getElementById(`ansInp_${itemNo}_1`);
    const el2 = document.getElementById(`ansInp_${itemNo}_2`);
    const v1 = el1 ? String(el1.value).trim() : '';
    const v2 = el2 ? String(el2.value).trim() : '';
    if (!v1 && !v2) {
      delete STATE.currentAnswers[itemNo];
    } else {
      STATE.currentAnswers[itemNo] = `${v1}|${v2}`;
    }
    STATE.gradingDirty = true;
    updateGradingCounters();
  }

  function focusGradingItem(itemNo, shouldScroll = true) {
    STATE.gradingFocusedItemNo = Number(itemNo);
    document.querySelectorAll('.ans-item-card.is-focused').forEach(el => el.classList.remove('is-focused'));
    const card = document.getElementById('ansCard_' + itemNo);
    if (card) {
      card.classList.add('is-focused');
      if (shouldScroll && card.scrollIntoView) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function getAdjacentGradingItem(currentItemNo, delta) {
    const items = STATE.gradingItems || [];
    if (!items.length) return null;
    const idx = items.findIndex(it => Number(it.itemNo) === Number(currentItemNo));
    const curIdx = idx >= 0 ? idx : 0;
    const nextIdx = Math.max(0, Math.min(items.length - 1, curIdx + delta));
    return items[nextIdx] || null;
  }

  function updateGradingCounters() {
    const items = STATE.gradingItems || [];
    const answers = STATE.currentAnswers || {};
    let answeredCount = 0;
    items.forEach(it => {
      const v = answers[it.itemNo];
      if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '|' && String(v) !== '?|?|?') {
        answeredCount++;
      }
    });
    const ansEl = document.getElementById('gradeAnsweredCounter');
    if (ansEl) ansEl.textContent = `ฝนแล้ว ${answeredCount} / ${items.length} ข้อ`;

    const students = STATE.gradingStudents || [];
    const savedMap = STATE.gradingSavedByStudent || {};
    const gradedCount = students.filter(s => !!savedMap[s.studentId]).length;
    const sessEl = document.getElementById('gradeSessionCounter');
    if (sessEl) sessEl.textContent = `ตรวจแล้ว ${gradedCount} / ${students.length} คน`;
  }

  function applyMcBubbleChoice(itemNo, choice, allowToggleOff) {
    const currentlyActive = String(STATE.currentAnswers[itemNo] || '') === String(choice);
    if (allowToggleOff && currentlyActive) {
      delete STATE.currentAnswers[itemNo];
    } else {
      STATE.currentAnswers[itemNo] = String(choice);
    }
    STATE.gradingDirty = true;
    [1, 2, 3, 4].forEach(c => {
      const b = document.getElementById(`bub_${itemNo}_${c}`);
      if (b) b.classList.toggle('active', String(STATE.currentAnswers[itemNo] || '') === String(c));
    });
    updateGradingCounters();
  }

  function selectMcBubble(itemNo, choice) {
    applyMcBubbleChoice(itemNo, choice, true);
    focusGradingItem(itemNo, false);
  }

  function updateComplexMcAnswer(itemNo) {
    const parts = [1, 2, 3].map(i => {
      const el = document.getElementById(`cmx_${itemNo}_${i}`);
      return (el && el.value) ? el.value : '?';
    });
    if (parts.every(p => p === '?')) {
      delete STATE.currentAnswers[itemNo];
    } else {
      STATE.currentAnswers[itemNo] = parts.join('|');
    }
    STATE.gradingDirty = true;
    updateGradingCounters();
  }

  (function bindRapidGradingKeyboard() {
    if (window._rapidGradingBound) return;
    window._rapidGradingBound = true;
    document.addEventListener('keydown', (e) => {
      if (STATE.activeTab !== 'ACADEMIC') return;
      const gradePanel = document.getElementById('acadPanel_GRADING');
      const modal = document.getElementById('customActionModal');
      if (!gradePanel || gradePanel.classList.contains('hidden')) return;
      if (modal && !modal.classList.contains('hidden')) return;
      if (!STATE.gradingItems || !STATE.gradingItems.length) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        submitAnswerSheet(true);
        return;
      }

      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const activeId = document.activeElement ? (document.activeElement.id || '') : '';
      const isTextControl = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if (e.key === 'ArrowDown' || (e.key === 'ArrowRight' && !isTextControl)) {
        if (activeTag === 'SELECT' && !activeId.startsWith('cmx_')) return;
        e.preventDefault();
        const curNo = STATE.gradingFocusedItemNo || STATE.gradingItems[0].itemNo;
        const nextIt = getAdjacentGradingItem(curNo, 1);
        if (nextIt) {
          focusGradingItem(nextIt.itemNo, true);
          const nextInp = document.getElementById('ansInp_' + nextIt.itemNo) || document.getElementById('ansInp_' + nextIt.itemNo + '_1');
          if (nextInp) nextInp.focus();
          else if (isTextControl && document.activeElement.blur) document.activeElement.blur();
        }
        return;
      }

      if (e.key === 'ArrowUp' || (e.key === 'ArrowLeft' && !isTextControl)) {
        if (activeTag === 'SELECT' && !activeId.startsWith('cmx_')) return;
        e.preventDefault();
        const curNo = STATE.gradingFocusedItemNo || STATE.gradingItems[0].itemNo;
        const prevIt = getAdjacentGradingItem(curNo, -1);
        if (prevIt) {
          focusGradingItem(prevIt.itemNo, true);
          const prevInp = document.getElementById('ansInp_' + prevIt.itemNo) || document.getElementById('ansInp_' + prevIt.itemNo + '_1');
          if (prevInp) prevInp.focus();
          else if (isTextControl && document.activeElement.blur) document.activeElement.blur();
        }
        return;
      }

      if (isTextControl) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const curNo = STATE.gradingFocusedItemNo || STATE.gradingItems[0].itemNo;
        const curIt = STATE.gradingItems.find(it => Number(it.itemNo) === Number(curNo));
        if (!curIt) return;
        if (curIt.itemType === 'MC4') {
          e.preventDefault();
          applyMcBubbleChoice(curIt.itemNo, e.key, false);
          const nextIt = getAdjacentGradingItem(curIt.itemNo, 1);
          if (nextIt) {
            focusGradingItem(nextIt.itemNo, true);
            const nextInp = document.getElementById('ansInp_' + nextIt.itemNo) || document.getElementById('ansInp_' + nextIt.itemNo + '_1');
            if (nextInp && nextIt.itemNo !== curIt.itemNo) nextInp.focus();
          }
        }
        return;
      }

      if (e.key === 'Backspace') {
        const curNo = STATE.gradingFocusedItemNo || STATE.gradingItems[0].itemNo;
        const curIt = STATE.gradingItems.find(it => Number(it.itemNo) === Number(curNo));
        if (!curIt) return;
        e.preventDefault();
        delete STATE.currentAnswers[curIt.itemNo];
        [1, 2, 3, 4].forEach(c => {
          const b = document.getElementById(`bub_${curIt.itemNo}_${c}`);
          if (b) b.classList.remove('active');
        });
        STATE.gradingDirty = true;
        updateGradingCounters();
        const prevIt = getAdjacentGradingItem(curIt.itemNo, -1);
        if (prevIt) focusGradingItem(prevIt.itemNo, true);
      }
    });
  })();

  async function submitAnswerSheet(goNext = false) {
    const schoolId = document.getElementById('gradeSchoolId').value;
    const stuSel = document.getElementById('gradeStudentId');
    const studentId = stuSel ? stuSel.value : '';
    if (!schoolId || !studentId) {
      showToast('กรุณาเลือกโรงเรียนและนักเรียนก่อนบันทึกคะแนน', 'error');
      return;
    }
    const curOpt = stuSel.options[stuSel.selectedIndex];
    const studentName = curOpt ? (curOpt.getAttribute('data-name') || '') : '';
    const nextBtn = document.getElementById('btnSaveAndNextStudent');
    if (nextBtn) nextBtn.disabled = true;

    try {
      const res = await callGas('apiSubmitDigitalAnswerSheet', {
        authToken: STATE.authToken || '',
        round: document.getElementById('gradeRound').value,
        subjectCode: document.getElementById('gradeSubjectCode').value,
        schoolId,
        studentId,
        studentName,
        answers: STATE.currentAnswers,
        gradedBy: STATE.currentTeacher ? STATE.currentTeacher.fullName : ''
      });
      if (!res || !res.ok) { showToast((res && res.error) || 'บันทึกไม่สำเร็จ', 'error'); return; }

      STATE.gradingDirty = false;
      if (!STATE.gradingSavedByStudent) STATE.gradingSavedByStudent = {};
      STATE.gradingSavedByStudent[studentId] = res.savedRecord || {
        studentId,
        totalScore: res.totalScore,
        maxScore: res.maxScore,
        answersJson: JSON.stringify(STATE.currentAnswers)
      };

      const stuObj = (STATE.gradingStudents || []).find(s => s.studentId === studentId);
      if (curOpt) {
        const noTxt = stuObj ? `เลขที่ ${stuObj.studentNo} ` : '';
        curOpt.textContent = `${noTxt}${studentName} — ✓ ตรวจแล้ว (${fmtFixed(res.totalScore, 2, '0.00')})`;
      }
      const badge = document.getElementById('gradeExistingBadge');
      if (badge) {
        badge.className = 'gw-badge-success gw-tabular';
        badge.textContent = `✓ บันทึกแล้ว (${fmtFixed(res.totalScore, 2, '0.00')} คะแนน)`;
        badge.classList.remove('hidden');
      }
      updateGradingCounters();

      const msg = `บันทึกสำเร็จ! ${studentName} ได้คะแนนรวม ${res.totalScore} / ${res.maxScore} คะแนน`;
      const banner = document.getElementById('lastGradedScoreBanner');
      if (banner) banner.textContent = msg;
      showToast(msg, 'success');

      if (goNext && stuSel.options.length > 1) {
        const curIdx = stuSel.selectedIndex;
        let targetIdx = -1;
        for (let i = curIdx + 1; i < stuSel.options.length; i++) {
          const sid = stuSel.options[i].value;
          if (sid && !STATE.gradingSavedByStudent[sid]) { targetIdx = i; break; }
        }
        if (targetIdx === -1 && curIdx + 1 < stuSel.options.length) {
          targetIdx = curIdx + 1;
        }
        if (targetIdx === -1) {
          for (let i = 0; i < curIdx; i++) {
            const sid = stuSel.options[i].value;
            if (sid && !STATE.gradingSavedByStudent[sid]) { targetIdx = i; break; }
          }
        }
        if (targetIdx >= 0 && targetIdx !== curIdx) {
          stuSel.selectedIndex = targetIdx;
          STATE.gradingLastStudentId = stuSel.value;
          loadSelectedStudentGradingAnswers();
          const gradeGrid = document.getElementById('digitalAnswerSheetContainer');
          if (gradeGrid && gradeGrid.scrollIntoView) {
            gradeGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          showToast('🎉 ตรวจกระดาษคำตอบครบทุกคนในรายชื่อนี้แล้วครับ!', 'success');
        }
      }
    } finally {
      if (nextBtn) nextBtn.disabled = false;
    }
  }

  async function loadSchoolAnalyticsReport() {
    const schoolId = document.getElementById('repSchoolId').value;
    const subjectCode = document.getElementById('repSubjectCode').value;
    const res = await callGas('apiGetSchoolAnalytics', { schoolId, subjectCode });
    if (!res || !res.ok) return;

    const r = res.report;
    const schoolObj = STATE.schools.find(s => s.schoolId === schoolId);
    const schoolTitle = schoolId === 'ALL'
      ? 'กลุ่มโรงเรียนศรีเสาวภาค สพป.สระบุรี เขต 2 (รวมทั้ง 8 โรงเรียน)'
      : schoolObj ? schoolObj.schoolName : schoolId;

    STATE.lastAnalyticsPayload = { schoolTitle, subjectName: res.subjectName, subjectCode, r };

    const kpiGain = hasFiniteNumber(r.avgGain) ? Number(r.avgGain) : 0;
    document.getElementById('analyticsKpiCards').innerHTML = `
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">คะแนนเฉลี่ย Pre O-NET (<span class="gw-tabular">${r.preCount}</span> คน)</div>
        <div class="text-3xl font-bold mt-1 gw-tabular">${fmtFixed(r.preAvg, 2, '0.00')}</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">คะแนนเฉลี่ย Post O-NET (<span class="gw-tabular">${r.postCount}</span> คน)</div>
        <div class="text-3xl font-bold mt-1 gw-tabular" style="color: var(--gw-accent);">${fmtFixed(r.postAvg, 2, '0.00')}</div>
      </div>
      <div class="gw-subcard">
        <div class="text-xs font-bold" style="color: var(--gw-muted);">ค่าพัฒนาการเฉลี่ย (Gain Score)</div>
        <div class="text-3xl font-bold mt-1 gw-tabular" style="color: ${kpiGain >= 0 ? 'var(--gw-accent)' : 'var(--gw-danger-ink)'};">${kpiGain >= 0 ? '+' : ''}${fmtFixed(kpiGain, 2, '0.00')}</div>
      </div>
    `;

    const reportHtml = buildOfficialA4AnalyticsHtml(schoolTitle, res.subjectName, subjectCode, r);
    document.getElementById('liveReportPaperPreview').innerHTML = reportHtml;
    document.getElementById('printArea').innerHTML = reportHtml;
  }

  function buildOfficialA4AnalyticsHtml(schoolTitle, subjectName, subjectCode, r) {
    const introText = `ตามที่${schoolTitle} กลุ่มโรงเรียนศรีเสาวภาค สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสระบุรี เขต 2 ได้ดำเนินการจัดสอบวัดผลก่อนติว (Pre O-NET) และหลังติว (Post O-NET) รายวิชา${subjectName} (รหัสวิชา ${subjectCode}) ชั้นประถมศึกษาปีที่ 6 ปีการศึกษา 2569 เพื่อวิเคราะห์จุดควรพัฒนารายตัวชี้วัดตามผังการสร้างข้อสอบของสถาบันทดสอบทางการศึกษาแห่งชาติ (องค์การมหาชน) นั้น สรุปผลการวิเคราะห์ได้ดังต่อไปนี้`;

    const indRows = (r.indicatorBreakdown || []).slice(0, 15).map((ind, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; font-weight:700;">${escHtml(ind.indicatorCode)}</td>
        <td style="text-align:center;">สาระที่ ${escHtml(ind.strandNo)}</td>
        <td style="text-align:center;">${fmtFixed(ind.preMasteryPct, 2, '0.00')}%</td>
        <td style="text-align:center;">${fmtFixed(ind.postMasteryPct, 2, '0.00')}%</td>
        <td style="text-align:center; font-weight:700;">${ind.isWeak ? 'ควรเร่งเสริมเข้ม (<50%)' : 'ผ่านเกณฑ์'}</td>
      </tr>
    `).join('');

    const stuRows = (r.allStudents || []).map((st, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${escHtml(st.studentName || st.studentId)}</td>
        <td style="text-align:center;">${fmtFixed(st.preScore, 2, '-')}</td>
        <td style="text-align:center;">${fmtFixed(st.postScore, 2, '-')}</td>
        <td style="text-align:center; font-weight:700;">${hasFiniteNumber(st.gain) ? ((Number(st.gain) >= 0 ? '+' : '') + fmtFixed(st.gain, 2, '0.00')) : '-'}</td>
      </tr>
    `).join('');

    const a4AvgGain = hasFiniteNumber(r.avgGain) ? Number(r.avgGain) : 0;

    return `
      <div style="text-align:center; font-size:19.5pt; font-weight:700; line-height:1.25;">
        รายงานผลการวิเคราะห์คะแนนทดสอบคู่ขนาน Pre O-NET และ Post O-NET ปีการศึกษา 2569
      </div>
      <div style="text-align:center; font-size:15.5pt; font-weight:700; line-height:1.3;">
        โครงการยกระดับผลสัมฤทธิ์ผลการทดสอบทางการศึกษาระดับชาติขั้นพื้นฐาน (O-NET)
      </div>
      <div style="text-align:center; font-size:16.5pt; font-weight:700; margin-bottom:8pt;">
        รายวิชา${escHtml(subjectName)} (รหัสวิชา ${escHtml(subjectCode)}) | ${escHtml(schoolTitle)}
      </div>
      <p style="text-indent:2.5cm; text-align:justify; margin:6pt 0;">
        ${thaiDistributeHtml(introText)}
      </p>
      <table>
        <thead>
          <tr>
            <th>จำนวนผู้เข้าสอบ Pre O-NET</th>
            <th>คะแนนเฉลี่ย Pre O-NET</th>
            <th>จำนวนผู้เข้าสอบ Post O-NET</th>
            <th>คะแนนเฉลี่ย Post O-NET</th>
            <th>ค่าพัฒนาการเฉลี่ย (Gain)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center;">${r.preCount} คน</td>
            <td style="text-align:center; font-weight:700;">${fmtFixed(r.preAvg, 2, '0.00')}</td>
            <td style="text-align:center;">${r.postCount} คน</td>
            <td style="text-align:center; font-weight:700;">${fmtFixed(r.postAvg, 2, '0.00')}</td>
            <td style="text-align:center; font-weight:700;">${a4AvgGain >= 0 ? '+' : ''}${fmtFixed(a4AvgGain, 2, '0.00')}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:16pt; font-weight:700; margin-top:8pt;">1. ลำดับตัวชี้วัดที่ต้องเร่งยกระดับผลสัมฤทธิ์ (เรียงจากจุดอ่อนสูงสุด)</div>
      <table>
        <thead>
          <tr>
            <th style="width:8%;">ลำดับ</th>
            <th style="width:20%;">รหัสตัวชี้วัด</th>
            <th style="width:14%;">สาระ</th>
            <th style="width:18%;">ร้อยละก่อนติว</th>
            <th style="width:18%;">ร้อยละหลังติว</th>
            <th style="width:22%;">การแปลผล</th>
          </tr>
        </thead>
        <tbody>${indRows || '<tr><td colspan="6" style="text-align:center;">ยังไม่มีข้อมูลการตรวจกระดาษคำตอบ</td></tr>'}</tbody>
      </table>

      <div style="font-size:16pt; font-weight:700; margin-top:8pt;">2. ตารางเปรียบเทียบคะแนนรายบุคคล (Pre O-NET vs Post O-NET)</div>
      <table>
        <thead>
          <tr>
            <th style="width:10%;">ลำดับ</th>
            <th style="width:42%;">ชื่อ - นามสกุลนักเรียน</th>
            <th style="width:16%;">Pre O-NET</th>
            <th style="width:16%;">Post O-NET</th>
            <th style="width:16%;">พัฒนาการ</th>
          </tr>
        </thead>
        <tbody>${stuRows || '<tr><td colspan="5" style="text-align:center;">ยังไม่มีข้อมูลคะแนนรายบุคคล</td></tr>'}</tbody>
      </table>

      <div style="margin-top:22pt; text-align:right; padding-right:1.5cm;">
        <div>ลงชื่อ .......................................................... ผู้รายงานผล</div>
        <div>(${escHtml(STATE.currentTeacher ? STATE.currentTeacher.fullName : '..........................................................')})</div>
        <div>วันที่พิมพ์รายงาน: ${escHtml(formatThaiDateFull(new Date().toISOString().slice(0, 10)))}</div>
      </div>
    `;
  }

  async function exportOfficialAnalyticsDocx() {
    const btn = document.getElementById('btnExportAnalyticsDocx');
    if (btn) btn.disabled = true;
    try {
      if (!STATE.lastAnalyticsPayload) {
        await loadSchoolAnalyticsReport();
      }
      const p = STATE.lastAnalyticsPayload;
      if (!p) {
        showToast('ยังไม่มีข้อมูลรายงานให้ส่งออก กรุณาเลือกโรงเรียนและรายวิชาครับ', 'error');
        return;
      }
      if (typeof JSZip === 'undefined') {
        showToast('ไม่สามารถโหลด JSZip สำหรับสร้างไฟล์ .docx ได้ กรุณาลองรีเฟรชหน้าเว็บครับ', 'error');
        return;
      }

      const indDescMap = {};
      (STATE.blueprint || []).forEach(row => {
        if (row.indicatorCode && row.indicatorDesc) {
          indDescMap[String(row.indicatorCode).trim()] = String(row.indicatorDesc).trim();
        }
      });

      const bodyXml = buildOfficialReportDocumentXml({
        schoolTitle: p.schoolTitle,
        subjectName: p.subjectName,
        subjectCode: p.subjectCode,
        report: p.r,
        reporterName: STATE.currentTeacher ? STATE.currentTeacher.fullName : '..........................................................',
        reportDateText: formatThaiDateFull(new Date().toISOString().slice(0, 10)),
        indicatorDescriptions: indDescMap
      });

      const binStr = atob(REPORT_DOCX_SKELETON_B64.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

      const zip = await JSZip.loadAsync(bytes);
      const docFile = zip.file('word/document.xml');
      if (!docFile) throw new Error('ไม่พบโครงสร้าง word/document.xml ในเทมเพลต');

      let docXml = await docFile.async('string');
      const placeholderRx = /<w:p\b[\s\S]*?__SKELETON_BODY__[\s\S]*?<\/w:p>/;
      if (!placeholderRx.test(docXml)) throw new Error('ไม่พบตำแหน่งวางเนื้อหา __SKELETON_BODY__');
      docXml = docXml.replace(placeholderRx, bodyXml);
      zip.file('word/document.xml', docXml);

      const outBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE'
      });

      const safeSchool = String(p.schoolTitle || 'กลุ่มศรีเสาวภาค').replace(/[^\u0E00-\u0E7FA-Za-z0-9_-]+/g, '_').slice(0, 40);
      const fileName = `รายงานผล_ONET_วิชา${p.subjectCode}_${safeSchool}_2569.docx`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(outBlob);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      showToast('ส่งออกรายงานวิเคราะห์ผลฉบับ Word (.docx) มาตรฐานราชการเรียบร้อยแล้วครับ!', 'success');
    } catch (err) {
      showToast('ส่งออกไฟล์ Word ไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function triggerPrintA4Report() {
    window.print();
  }

  function normalizeClientThaiPrefix(rawPrefix) {
    const p = String(rawPrefix || '').trim();
    if (/^(ด\.?\s*ช\.?|เด็กชาย)$/i.test(p)) return 'เด็กชาย';
    if (/^(ด\.?\s*ญ\.?|เด็กหญิง)$/i.test(p)) return 'เด็กหญิง';
    if (/^นาย$/.test(p)) return 'นาย';
    if (/^(น\.?\s*ส\.?|นางสาว)$/i.test(p)) return 'นางสาว';
    return p;
  }

  function splitCombinedThaiStudentName(rawText) {
    const s = String(rawText || '').replace(/\s+/g, ' ').trim();
    if (!s) return null;
    const m = s.match(/^(เด็กชาย|เด็กหญิง|ด\.?\s*ช\.?|ด\.?\s*ญ\.?|นางสาว|น\.?\s*ส\.?|นาย)\s*([^\s]+)(?:\s+(.+))?$/i);
    if (m) {
      return {
        prefix: normalizeClientThaiPrefix(m[1]),
        firstName: String(m[2] || '').trim(),
        lastName: String(m[3] || '').trim()
      };
    }
    const parts = s.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return {
        prefix: '',
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      };
    }
    return { prefix: '', firstName: s, lastName: '' };
  }

  function normalizeClientRoom(rawRoom) {
    const r = String(rawRoom || '').trim();
    if (!r) return 'ป.6/1';
    if (/^\d+$/.test(r)) return 'ป.6/' + r;
    if (/^6\/\d+$/.test(r)) return 'ป.' + r;
    if (/^ป\.?\s*6$/i.test(r)) return 'ป.6/1';
    return r.replace(/^ป\.?\s*6\s*\/\s*(\d+)$/i, 'ป.6/$1');
  }

  function parseSmartStudentRows(rows2D) {
    if (!Array.isArray(rows2D)) return [];
    let colMap = null;
    const results = [];

    for (let rIdx = 0; rIdx < rows2D.length; rIdx++) {
      const rawRow = (rows2D[rIdx] || []).map(c => String(c == null ? '' : c).trim());
      const nonEmpty = rawRow.filter(Boolean);
      if (!nonEmpty.length) continue;

      const joinedLower = nonEmpty.join(' ').toLowerCase();
      /* Detect header row from standard template, DMC, or school register */
      const hasHeaderKeywords =
        (joinedLower.includes('คำนำหน้า') || joinedLower.includes('นามสกุล') || joinedLower.includes('ชื่อ-สกุล') || joinedLower.includes('ชื่อ - นามสกุล') || joinedLower.includes('เลขประจำตัว')) ||
        (nonEmpty.some(c => /^(ลำดับ|ลำดับที่|เลขที่|no\.?)$/i.test(c)) && nonEmpty.some(c => /ชื่อ/.test(c)));

      if (hasHeaderKeywords) {
        colMap = { no: -1, prefix: -1, first: -1, last: -1, full: -1, room: -1 };
        rawRow.forEach((cell, idx) => {
          const cl = cell.replace(/\s+/g, '');
          if (colMap.no === -1 && /^(ลำดับ|ลำดับที่|เลขที่|no\.?)$/i.test(cl)) colMap.no = idx;
          else if (colMap.prefix === -1 && /คำนำหน้า/.test(cl)) colMap.prefix = idx;
          else if (colMap.full === -1 && /(ชื่อ-สกุล|ชื่อ-นามสกุล|ชื่อสกุล)/.test(cl)) colMap.full = idx;
          else if (colMap.first === -1 && /^(ชื่อ|ชื่อตัว|ชื่อนักเรียน)$/.test(cl)) colMap.first = idx;
          else if (colMap.last === -1 && /(นามสกุล|สกุล)/.test(cl)) colMap.last = idx;
          else if (colMap.room === -1 && /(ห้อง|ชั้น)/.test(cl)) colMap.room = idx;
        });
        continue;
      }

      /* Skip summary or title rows (e.g. "รายชื่อนักเรียนชั้น ป.6...", "รวมทั้งสิ้น 25 คน") */
      if (/^(รายชื่อนักเรียน|ข้อมูลนักเรียน|โรงเรียน|ปีการศึกษา|รวมทั้งสิ้น|สรุปจำนวน)/.test(nonEmpty[0]) && nonEmpty.length <= 2) {
        continue;
      }

      let studentNo = '';
      let prefix = '';
      let firstName = '';
      let lastName = '';
      let room = 'ป.6/1';

      if (colMap && (colMap.first !== -1 || colMap.full !== -1)) {
        if (colMap.no !== -1 && rawRow[colMap.no]) studentNo = rawRow[colMap.no].replace(/[^\d]/g, '');
        if (colMap.room !== -1 && rawRow[colMap.room]) room = normalizeClientRoom(rawRow[colMap.room]);

        if (colMap.full !== -1 && rawRow[colMap.full]) {
          const sp = splitCombinedThaiStudentName(rawRow[colMap.full]);
          if (sp) {
            prefix = colMap.prefix !== -1 && rawRow[colMap.prefix] ? normalizeClientThaiPrefix(rawRow[colMap.prefix]) : sp.prefix;
            firstName = sp.firstName;
            lastName = colMap.last !== -1 && rawRow[colMap.last] ? rawRow[colMap.last] : sp.lastName;
          }
        } else {
          const rawFirst = rawRow[colMap.first] || '';
          const rawLast = colMap.last !== -1 ? (rawRow[colMap.last] || '') : '';
          const rawPref = colMap.prefix !== -1 ? (rawRow[colMap.prefix] || '') : '';
          const spFirst = splitCombinedThaiStudentName(rawFirst);
          if (!rawPref && spFirst && spFirst.prefix) {
            prefix = spFirst.prefix;
            firstName = spFirst.firstName;
            lastName = rawLast || spFirst.lastName;
          } else {
            prefix = normalizeClientThaiPrefix(rawPref);
            firstName = rawFirst;
            lastName = rawLast;
          }
        }
      } else {
        /* Headerless smart row parsing (Excel copy-paste, CSV, or DMC snippet) */
        let tokens = rawRow.filter(Boolean);
        /* Strip leading student number (1..200) if present */
        if (tokens.length >= 2 && /^\d{1,3}$/.test(tokens[0])) {
          studentNo = tokens[0];
          tokens = tokens.slice(1);
        }
        /* Strip 5-13 digit DMC student code / citizen ID columns if present before prefix/name */
        while (tokens.length >= 2 && /^\d{4,13}$/.test(tokens[0].replace(/-/g, ''))) {
          tokens = tokens.slice(1);
        }
        /* Check trailing room token (e.g. ป.6/1, ป.6/2, 6/1) */
        if (tokens.length >= 2 && /^(ป\.?\s*6(\/\d+)?|6\/\d+)$/i.test(tokens[tokens.length - 1])) {
          room = normalizeClientRoom(tokens[tokens.length - 1]);
          tokens = tokens.slice(0, -1);
        }

        if (tokens.length >= 3 && /^(เด็กชาย|เด็กหญิง|ด\.?\s*ช\.?|ด\.?\s*ญ\.?|นางสาว|น\.?\s*ส\.?|นาย)$/i.test(tokens[0])) {
          prefix = normalizeClientThaiPrefix(tokens[0]);
          firstName = tokens[1];
          lastName = tokens.slice(2).join(' ');
        } else if (tokens.length === 2) {
          const sp0 = splitCombinedThaiStudentName(tokens[0]);
          if (sp0 && sp0.prefix && !sp0.lastName) {
            prefix = sp0.prefix;
            firstName = sp0.firstName;
            lastName = tokens[1];
          } else if (sp0 && sp0.prefix && sp0.lastName) {
            prefix = sp0.prefix;
            firstName = sp0.firstName;
            lastName = sp0.lastName;
            room = normalizeClientRoom(tokens[1]);
          } else {
            firstName = tokens[0];
            lastName = tokens[1];
          }
        } else if (tokens.length === 1) {
          const sp = splitCombinedThaiStudentName(tokens[0]);
          if (sp) {
            prefix = sp.prefix;
            firstName = sp.firstName;
            lastName = sp.lastName;
          }
        } else if (tokens.length > 3) {
          const prefIdx = tokens.findIndex(t => /^(เด็กชาย|เด็กหญิง|ด\.?\s*ช\.?|ด\.?\s*ญ\.?|นางสาว|น\.?\s*ส\.?|นาย)/i.test(t));
          if (prefIdx !== -1) {
            const spP = splitCombinedThaiStudentName(tokens[prefIdx]);
            if (spP && spP.prefix && spP.firstName && tokens[prefIdx] !== spP.prefix) {
              prefix = spP.prefix;
              firstName = spP.firstName;
              lastName = spP.lastName || tokens[prefIdx + 1] || '';
            } else {
              prefix = normalizeClientThaiPrefix(tokens[prefIdx]);
              firstName = tokens[prefIdx + 1] || '';
              lastName = tokens[prefIdx + 2] || '';
            }
          }
        }
      }

      firstName = String(firstName || '').trim();
      lastName = String(lastName || '').trim();
      if (!firstName || /^\d+$/.test(firstName)) continue;

      results.push({
        studentNo: studentNo || String(results.length + 1),
        prefix: normalizeClientThaiPrefix(prefix),
        firstName,
        lastName,
        room: normalizeClientRoom(room)
      });
    }
    return results;
  }

  function renderRosterPreviewUI(parsedList, sourceLabel) {
    STATE.parsedRosterPreview = parsedList || [];
    const wrap = document.getElementById('rosterPreviewWrap');
    const titleEl = document.getElementById('rosterPreviewTitle');
    const tableEl = document.getElementById('rosterPreviewTable');
    if (!wrap || !titleEl || !tableEl) return;

    if (!parsedList || !parsedList.length) {
      wrap.classList.add('hidden');
      tableEl.innerHTML = '';
      return;
    }

    titleEl.textContent = `✓ ตรวจสอบรูปแบบมาตรฐานสำเร็จ: พร้อมนำเข้า ${parsedList.length} คน ${sourceLabel ? '(' + sourceLabel + ')' : ''}`;
    tableEl.innerHTML = `<table class="gw-table text-xs">
      <thead><tr>
        <th>เลขที่</th>
        <th>คำนำหน้า (มาตรฐาน)</th>
        <th class="text-left">ชื่อ</th>
        <th class="text-left">นามสกุล</th>
        <th>ชั้น/ห้อง</th>
      </tr></thead>
      <tbody>${parsedList.map(st => `
        <tr>
          <td class="text-center font-bold">${escHtml(st.studentNo)}</td>
          <td class="text-center">${escHtml(st.prefix || '-')}</td>
          <td class="font-bold">${escHtml(st.firstName)}</td>
          <td class="font-bold">${escHtml(st.lastName)}</td>
          <td class="text-center">${escHtml(st.room)}</td>
        </tr>
      `).join('')}</tbody>
    </table>`;
    wrap.classList.remove('hidden');
  }

  function excelColToIndex(colLetters) {
    let idx = 0;
    const s = String(colLetters || '').toUpperCase();
    for (let i = 0; i < s.length; i++) {
      idx = idx * 26 + (s.charCodeAt(i) - 64);
    }
    return Math.max(0, idx - 1);
  }

  async function readXlsxBufferViaJsZip(buf) {
    const zip = await JSZip.loadAsync(buf);
    const sharedStrings = [];
    const ssFile = zip.file('xl/sharedStrings.xml');
    if (ssFile) {
      const ssXml = await ssFile.async('string');
      const ssDoc = new DOMParser().parseFromString(ssXml, 'application/xml');
      const siNodes = ssDoc.getElementsByTagName('si');
      for (let i = 0; i < siNodes.length; i++) {
        const tNodes = siNodes[i].getElementsByTagName('t');
        let txt = '';
        for (let j = 0; j < tNodes.length; j++) txt += tNodes[j].textContent || '';
        sharedStrings.push(txt);
      }
    }
    const sheetNames = Object.keys(zip.files).filter(k => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k)).sort();
    if (!sheetNames.length) return [];
    const wsXml = await zip.file(sheetNames[0]).async('string');
    const wsDoc = new DOMParser().parseFromString(wsXml, 'application/xml');
    const rowNodes = wsDoc.getElementsByTagName('row');
    const rows2D = [];
    for (let r = 0; r < rowNodes.length; r++) {
      const rowArr = [];
      const cNodes = rowNodes[r].getElementsByTagName('c');
      for (let c = 0; c < cNodes.length; c++) {
        const cell = cNodes[c];
        const ref = cell.getAttribute('r') || '';
        const colMatch = ref.match(/^[A-Z]+/i);
        const colIdx = colMatch ? excelColToIndex(colMatch[0]) : c;
        const type = cell.getAttribute('t') || '';
        let val = '';
        if (type === 's') {
          const vNode = cell.getElementsByTagName('v')[0];
          const sIdx = vNode ? parseInt(vNode.textContent || '0', 10) : 0;
          val = sharedStrings[sIdx] != null ? sharedStrings[sIdx] : '';
        } else if (type === 'inlineStr') {
          const tNodes = cell.getElementsByTagName('t');
          for (let k = 0; k < tNodes.length; k++) val += tNodes[k].textContent || '';
        } else {
          const vNode = cell.getElementsByTagName('v')[0];
          val = vNode ? (vNode.textContent || '') : '';
        }
        rowArr[colIdx] = val;
      }
      for (let i = 0; i < rowArr.length; i++) {
        if (rowArr[i] == null) rowArr[i] = '';
      }
      rows2D.push(rowArr);
    }
    return rows2D;
  }

  async function downloadStandardRosterExcelTemplate() {
    const schoolId = document.getElementById('rosterSchoolId').value || 'SCH01';
    const schoolShort = getSchoolShortName(schoolId);
    const aoa = [
      ['เลขที่', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ห้องเรียน'],
      ['1', 'เด็กชาย', 'กิตติ', 'ใจดี', 'ป.6/1'],
      ['2', 'เด็กหญิง', 'มานี', 'มีสุข', 'ป.6/1']
    ];
    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      const colLetters = ['A', 'B', 'C', 'D', 'E'];
      const rowsXml = aoa.map((row, rIdx) => {
        const rNum = rIdx + 1;
        const cellsXml = row.map((val, cIdx) => {
          const ref = colLetters[cIdx] + rNum;
          if (rIdx > 0 && cIdx === 0) {
            return `<c r="${ref}"><v>${escHtml(String(val))}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escHtml(String(val))}</t></is></c>`;
        }).join('');
        return `<row r="${rNum}">${cellsXml}</row>`;
      }).join('');

      const xmlDecl = '<' + '?xml version="1.0" encoding="UTF-8" standalone="yes"?' + '>';
      zip.file('[Content_Types].xml',
        xmlDecl +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '</Types>');
      zip.file('_rels/.rels',
        xmlDecl +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>');
      zip.file('xl/workbook.xml',
        xmlDecl +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="รายชื่อนักเรียน_ป6" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>');
      zip.file('xl/_rels/workbook.xml.rels',
        xmlDecl +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '</Relationships>');
      zip.file('xl/worksheets/sheet1.xml',
        xmlDecl +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="4" width="22" customWidth="1"/><col min="5" max="5" width="14" customWidth="1"/></cols>' +
        `<sheetData>${rowsXml}</sheetData>` +
        '</worksheet>');

      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        compression: 'DEFLATE'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `แม่แบบรายชื่อนักเรียน_ป6_${schoolShort}_2569.xlsx`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      showToast('ดาวน์โหลดแม่แบบ Excel (.xlsx) มาตรฐานเรียบร้อยแล้วครับ', 'success');
    }
  }

  function decodeThaiTextBuffer(buf) {
    let txt = new TextDecoder('utf-8').decode(buf);
    if (txt.includes('\uFFFD')) {
      try { txt = new TextDecoder('windows-874').decode(buf); } catch (e) {}
    }
    return txt;
  }

  function parseCsvLineSmart(line) {
    if (line.includes('\t')) return line.split('\t').map(s => s.replace(/^"|"$/g, '').trim());
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  async function handleRosterExcelUpload() {
    const inp = document.getElementById('rosterExcelFile');
    if (!inp || !inp.files || !inp.files.length) return;
    const file = inp.files[0];
    try {
      const buf = await file.arrayBuffer();
      const headBytes = new Uint8Array(buf.slice(0, 8));
      const isZip = headBytes.length >= 2 && headBytes[0] === 0x50 && headBytes[1] === 0x4B;
      const isOldBiffXls = headBytes.length >= 4 && headBytes[0] === 0xD0 && headBytes[1] === 0xCF && headBytes[2] === 0x11 && headBytes[3] === 0xE0;

      if (isOldBiffXls) {
        showToast('ไฟล์นี้เป็น Excel รุ่นเก่า (.xls 97-2003) กรุณาบันทึกเป็น .xlsx / .csv หรือคัดลอกตารางมาวางในช่องด้านขวาได้เลยครับ', 'error');
        return;
      }

      let rows2D = [];
      if (isZip) {
        rows2D = await readXlsxBufferViaJsZip(buf);
      } else {
        const txt = decodeThaiTextBuffer(buf).trim();
        if (/^<\s*(!doctype|html|table|meta|xml)/i.test(txt)) {
          const doc = new DOMParser().parseFromString(txt, 'text/html');
          const trs = doc.querySelectorAll('tr');
          trs.forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('th, td')).map(td => (td.textContent || '').trim());
            if (cells.some(Boolean)) rows2D.push(cells);
          });
        } else {
          rows2D = txt.split(/\r?\n/).map(parseCsvLineSmart);
        }
      }

      const parsed = parseSmartStudentRows(rows2D);
      if (!parsed.length) {
        showToast('ไม่พบแถวรายชื่อนักเรียนในไฟล์ กรุณาตรวจสอบคอลัมน์ชื่อ-นามสกุล', 'error');
        return;
      }
      const textarea = document.getElementById('bulkStudentsTextarea');
      if (textarea) {
        textarea.value = parsed.map(s => `${s.studentNo}\t${s.prefix}\t${s.firstName}\t${s.lastName}\t${s.room}`).join('\n');
      }
      renderRosterPreviewUI(parsed, `จากไฟล์ ${file.name}`);
      showToast(`อ่านไฟล์ ${file.name} สำเร็จ! จัดรูปแบบตรงกัน ${parsed.length} คน (ตรวจตารางตัวอย่างก่อนกดบันทึกได้เลยครับ)`, 'success');
    } catch (err) {
      showToast('อ่านไฟล์ Excel ไม่สำเร็จ: ' + err.message, 'error');
    }
  }

  function previewBulkStudents() {
    const raw = (document.getElementById('bulkStudentsTextarea').value || '').trim();
    if (!raw) {
      renderRosterPreviewUI([], '');
      return;
    }
    const rows2D = raw.split(/\r?\n/).map(line =>
      line.includes('\t') ? line.split('\t') : (line.includes(',') ? line.split(',') : line.trim().split(/\s{2,}|\s+/))
    );
    const parsed = parseSmartStudentRows(rows2D);
    renderRosterPreviewUI(parsed, 'จากการวางข้อความ');
  }

  function clearRosterImportPreview() {
    STATE.parsedRosterPreview = [];
    const inp = document.getElementById('rosterExcelFile');
    if (inp) inp.value = '';
    const ta = document.getElementById('bulkStudentsTextarea');
    if (ta) ta.value = '';
    renderRosterPreviewUI([], '');
  }

  async function submitBulkStudents() {
    const schoolId = document.getElementById('rosterSchoolId').value;
    let list = STATE.parsedRosterPreview && STATE.parsedRosterPreview.length ? STATE.parsedRosterPreview : [];
    if (!list.length) {
      const raw = (document.getElementById('bulkStudentsTextarea').value || '').trim();
      if (!raw) {
        showToast('กรุณาอัปโหลดไฟล์ Excel (.xlsx/.csv) หรือวางรายชื่อนักเรียนก่อนกดบันทึก', 'error');
        return;
      }
      const rows2D = raw.split(/\r?\n/).map(line =>
        line.includes('\t') ? line.split('\t') : (line.includes(',') ? line.split(',') : line.trim().split(/\s{2,}|\s+/))
      );
      list = parseSmartStudentRows(rows2D);
    }
    if (!list.length) {
      showToast('ไม่สามารถแปลงรายชื่อนักเรียนได้ กรุณาตรวจสอบรูปแบบข้อมูล', 'error');
      return;
    }

    const chkUpdate = document.getElementById('chkUpdateExistingRoom');
    const updateExistingRoomNo = !!(chkUpdate && chkUpdate.checked);

    const res = await callGas('apiBulkAddStudents', {
      authToken: STATE.authToken || '',
      schoolId,
      studentsList: list,
      updateExistingRoomNo
    });
    if (!res || !res.ok) { showToast((res && res.error) || 'นำเข้ารายชื่อไม่สำเร็จ', 'error'); return; }
    const updNote = res.updatedCount > 0 ? ` | อัปเดตห้อง/เลขที่เดิม ${res.updatedCount} คน` : '';
    const dupNote = res.skippedCount > 0 ? ` | ข้ามชื่อซ้ำ ${res.skippedCount} คน` : '';
    showToast(`นำเข้ารายชื่อนักเรียนสำเร็จ ${res.addedCount} คน${updNote}${dupNote}`, 'success');
    clearRosterImportPreview();
    refreshRosterTable();
    loadGradingSheetData();
  }

  function applyAcademicRosterList_(schoolId, list) {
    if (!schoolId) return;
    const safeList = Array.isArray(list) ? list : [];
    STATE.studentListCache[schoolId] = safeList;
    STATE.students = (STATE.students || []).filter(s => s.schoolId !== schoolId).concat(safeList);
    STATE.rosterCache = { schoolId, list: safeList };
    const badge = document.getElementById('rosterCountBadge');
    if (badge) badge.textContent = `รวม ${safeList.length} คน`;
    filterAcademicRosterTable();
  }

  async function refreshRosterTable() {
    const schoolEl = document.getElementById('rosterSchoolId');
    if (!schoolEl) return;
    const schoolId = schoolEl.value;
    if (!schoolId) return;
    const list = (await callGas('apiListStudentsBySchool', schoolId)) || [];
    applyAcademicRosterList_(schoolId, list);
  }

  function filterAcademicRosterTable() {
    const box = document.getElementById('rosterTableContainer');
    if (!box) return;
    const cache = STATE.rosterCache || { schoolId: '', list: [] };
    const schoolId = cache.schoolId || (document.getElementById('rosterSchoolId') ? document.getElementById('rosterSchoolId').value : '');
    const list = cache.list || [];

    if (!list.length) {
      box.innerHTML = '<div class="text-xs py-4" style="color: var(--gw-muted);">ยังไม่มีรายชื่อนักเรียนในโรงเรียนนี้</div>';
      return;
    }

    const qEl = document.getElementById('acadRosterSearch');
    const q = qEl ? qEl.value.trim().toLowerCase() : '';
    const filtered = !q
      ? list
      : list.filter(s =>
          String(s.fullName || '').toLowerCase().includes(q) ||
          String(s.studentNo || '').includes(q) ||
          String(s.room || '').toLowerCase().includes(q)
        );

    if (!filtered.length) {
      box.innerHTML = '<div class="text-xs py-4" style="color: var(--gw-muted);">ไม่พบชื่อนักเรียนที่ค้นหา</div>';
      return;
    }

    box.innerHTML = `<table class="gw-table">
      <thead><tr>
        <th>เลขที่</th>
        <th class="text-left">ชื่อ-นามสกุล</th>
        <th>ห้อง</th>
        <th>สถานะรหัสผ่าน</th>
        <th>จัดการรายชื่อ</th>
      </tr></thead>
      <tbody>${filtered.map(s => `
        <tr>
          <td class="text-center gw-tabular">${escHtml(s.studentNo)}</td>
          <td class="font-bold">${escHtml(s.fullName)}</td>
          <td class="text-center">${escHtml(s.room)}</td>
          <td class="text-center">${s.needsPasswordSetup ? '<span class="gw-badge-warn">ยังไม่ตั้งรหัส</span>' : '<span class="gw-badge-success">ตั้งรหัสแล้ว</span>'}</td>
          <td class="text-center">
            <div class="flex flex-wrap justify-center gap-1.5">
              <button type="button" onclick="openEditStudentModal('${escHtml(schoolId)}', '${escHtml(s.studentId)}')"
                class="gw-btn-soft !py-1 !px-2.5 text-xs">
                แก้ไข
              </button>
              <button type="button" onclick="resetStudentPass('${escHtml(schoolId)}', '${escHtml(s.studentId)}')"
                class="gw-btn-soft !py-1 !px-2.5 text-xs">
                รีเซ็ตรหัส
              </button>
              <button type="button" onclick="confirmDeleteStudent('${escHtml(schoolId)}', '${escHtml(s.studentId)}')"
                class="gw-btn-soft !py-1 !px-2.5 text-xs" style="color: var(--gw-danger-ink);">
                ลบ
              </button>
            </div>
          </td>
        </tr>
      `).join('')}</tbody>
    </table>`;
  }

  function openEditStudentModal(schoolId, studentId) {
    const list = STATE.studentListCache[schoolId] || (STATE.rosterCache && STATE.rosterCache.list) || [];
    const stu = list.find(s => s.studentId === studentId);
    if (!stu) return;

    const prefixes = ['เด็กชาย', 'เด็กหญิง', 'ด.ช.', 'ด.ญ.', 'นาย', 'นางสาว', ''];
    const curPrefix = String(stu.prefix || '').trim();
    const prefixOptions = (prefixes.includes(curPrefix) ? prefixes : [curPrefix].concat(prefixes))
      .map(p => `<option value="${escHtml(p)}"${p === curPrefix ? ' selected' : ''}>${p || '(ไม่ระบุคำนำหน้า)'}</option>`)
      .join('');

    openCustomModal({
      title: 'แก้ไขข้อมูลนักเรียน ป.6',
      subtitle: `${stu.fullName} | ${getSchoolShortName(schoolId)}`,
      bodyHtml: `
        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="font-bold block mb-1">เลขที่</label>
              <input type="text" data-field="studentNo" value="${escHtml(stu.studentNo)}" class="gw-input !py-1.5 text-xs gw-tabular">
            </div>
            <div>
              <label class="font-bold block mb-1">ห้อง</label>
              <input type="text" data-field="room" value="${escHtml(stu.room || 'ป.6/1')}" class="gw-input !py-1.5 text-xs">
            </div>
          </div>
          <div>
            <label class="font-bold block mb-1">คำนำหน้า</label>
            <select data-field="prefix" class="gw-input !py-1.5 text-xs">${prefixOptions}</select>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="font-bold block mb-1">ชื่อ</label>
              <input type="text" data-field="firstName" value="${escHtml(stu.firstName || '')}" class="gw-input !py-1.5 text-xs">
            </div>
            <div>
              <label class="font-bold block mb-1">นามสกุล</label>
              <input type="text" data-field="lastName" value="${escHtml(stu.lastName || '')}" class="gw-input !py-1.5 text-xs">
            </div>
          </div>
        </div>
      `,
      confirmText: 'บันทึกการแก้ไข',
      onConfirm: async (modal) => {
        const studentNo = modal.querySelector('[data-field="studentNo"]').value.trim();
        const room = modal.querySelector('[data-field="room"]').value.trim();
        const prefix = modal.querySelector('[data-field="prefix"]').value;
        const firstName = modal.querySelector('[data-field="firstName"]').value.trim();
        const lastName = modal.querySelector('[data-field="lastName"]').value.trim();
        if (!firstName) {
          showToast('กรุณาระบุชื่อจริงของนักเรียนครับ', 'error');
          return false;
        }
        const res = await callGas('apiUpdateStudent', {
          authToken: STATE.authToken || '',
          schoolId,
          studentId,
          studentNo,
          prefix,
          firstName,
          lastName,
          room
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'อัปเดตข้อมูลนักเรียนไม่สำเร็จ', 'error');
          return false;
        }
        showToast('บันทึกข้อมูลนักเรียนเรียบร้อยแล้วครับ', 'success');
        await refreshRosterTable();
        loadGradingSheetData();
      }
    });
  }

  function resetStudentPass(schoolId, studentId) {
    const list = STATE.studentListCache[schoolId] || [];
    const stu = list.find(s => s.studentId === studentId);
    openCustomModal({
      title: 'ยืนยันรีเซ็ตรหัสผ่านนักเรียน',
      subtitle: 'รหัสผ่านเดิมจะถูกล้างออกเพื่อให้นักเรียนตั้งรหัสใหม่ได้ทันที',
      bodyHtml: `<div class="text-xs leading-relaxed">ต้องการรีเซ็ตรหัสผ่านของ <b>${escHtml(stu ? stu.fullName : studentId)}</b> ใช่หรือไม่ครับ? (ครั้งต่อไปที่นักเรียนเข้าสู่ระบบจะสามารถตั้งรหัสผ่านใหม่ได้เอง)</div>`,
      confirmText: 'รีเซ็ตรหัสผ่าน',
      onConfirm: async () => {
        const res = await callGas('apiResetStudentPassword', {
          authToken: STATE.authToken || '',
          schoolId,
          studentId
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'รีเซ็ตรหัสผ่านไม่สำเร็จ', 'error');
          return false;
        }
        showToast(res.message || 'รีเซ็ตรหัสผ่านเรียบร้อยแล้วครับ', 'success');
        refreshRosterTable();
      }
    });
  }

  function confirmDeleteStudent(schoolId, studentId) {
    const list = STATE.studentListCache[schoolId] || [];
    const stu = list.find(s => s.studentId === studentId);
    openCustomModal({
      title: 'ยืนยันลบรายชื่อนักเรียน',
      subtitle: 'ใช้เฉพาะกรณีรายชื่อซ้ำหรือย้ายออก',
      bodyHtml: `<div class="text-xs leading-relaxed">ต้องการลบรายชื่อ <b>${escHtml(stu ? stu.fullName : studentId)}</b> ออกจากทะเบียนโรงเรียนใช่หรือไม่ครับ?</div>`,
      confirmText: 'ยืนยันลบรายชื่อ',
      danger: true,
      onConfirm: async () => {
        const res = await callGas('apiDeleteStudent', {
          authToken: STATE.authToken || '',
          schoolId,
          studentId
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'ลบรายชื่อไม่สำเร็จ', 'error');
          return false;
        }
        showToast('ลบรายชื่อนักเรียนออกจากระบบเรียบร้อยแล้วครับ', 'success');
        await refreshRosterTable();
        loadGradingSheetData();
      }
    });
  }

  /* ========================================================================
   * 9. TAB 5: SUPER ADMIN PORTAL
   * ======================================================================== */
  async function refreshSuperAdminDashboard(preloadedRes = null) {
    if (!STATE.currentTeacher || STATE.currentTeacher.role !== 'SUPER_ADMIN') return;
    const subFilterEl = document.getElementById('adminNetSubjectFilter');
    const subjectFilter = subFilterEl ? subFilterEl.value : 'ALL';
    const curIocRound = (document.getElementById('adminIocRound') && document.getElementById('adminIocRound').value) || 'PRE';
    const curIocSub = (document.getElementById('adminIocSubject') && document.getElementById('adminIocSubject').value) || '61';
    const res = (preloadedRes && preloadedRes.ok)
      ? preloadedRes
      : await callGas('apiGetSuperAdminData', {
          authToken: STATE.authToken || '',
          adminId: STATE.currentTeacher.teacherId,
          subjectFilter,
          iocRound: curIocRound,
          iocSubject: curIocSub
        });
    if (!res || !res.ok) { showToast((res && res.error) || 'โหลดข้อมูลผู้ดูแลไม่สำเร็จ', 'error'); return; }
    STATE.adminData = res;
    if (res.submissions) STATE.cachedSubmissions = res.submissions;

    document.getElementById('adminDriveFolderInput').value = res.config.DRIVE_ROOT_FOLDER_ID || '';
    if (res.config.DRIVE_ROOT_FOLDER_ID) {
      document.getElementById('driveSubfoldersStatus').textContent = '✓ เชื่อมต่อโฟลเดอร์รับงาน Google Drive เรียบร้อยแล้ว';
    }

    document.getElementById('adminNetworkTable').innerHTML = `<table class="gw-table">
      <thead><tr>
        <th>รหัส</th>
        <th class="text-left">โรงเรียน (8 โรงเรียนกลุ่มศรีเสาวภาค)</th>
        <th>จำนวน นร. ป.6</th>
        <th>ส่งผล Pre (ชุด)</th>
        <th>เฉลี่ย Pre</th>
        <th>ส่งผล Post (ชุด)</th>
        <th>เฉลี่ย Post</th>
        <th>พัฒนาการ (Gain)</th>
      </tr></thead>
      <tbody>${(res.networkSummary || []).map(s => {
        const gNum = hasFiniteNumber(s.gain) ? Number(s.gain) : 0;
        return `
        <tr>
          <td class="text-center font-bold gw-tabular">${escHtml(s.schoolId)}</td>
          <td class="font-bold">${escHtml(s.schoolName)}</td>
          <td class="text-center gw-tabular">${s.studentCountP6}</td>
          <td class="text-center gw-tabular">${s.preSubmissions}</td>
          <td class="text-center font-bold gw-tabular">${fmtFixed(s.preAvg, 2, '0.00')}</td>
          <td class="text-center gw-tabular">${s.postSubmissions}</td>
          <td class="text-center font-bold gw-tabular" style="color: var(--gw-accent);">${fmtFixed(s.postAvg, 2, '0.00')}</td>
          <td class="text-center font-bold gw-tabular" style="color: ${gNum >= 0 ? 'var(--gw-accent)' : 'var(--gw-danger-ink)'};">${gNum >= 0 ? '+' : ''}${fmtFixed(gNum, 2, '0.00')}</td>
        </tr>
      `;
      }).join('')}</tbody>
    </table>`;

    const sortedTeachers = (res.teachers || []).slice().sort((a, b) => {
      const aP = a.status !== 'APPROVED' ? 0 : 1;
      const bP = b.status !== 'APPROVED' ? 0 : 1;
      return aP - bP;
    });
    STATE.adminTeachersCache = sortedTeachers;

    const pendingTeachersCount = sortedTeachers.filter(t => t.status !== 'APPROVED').length;
    const btnAll = document.getElementById('btnApproveAllPending');
    if (btnAll) {
      if (pendingTeachersCount > 0) {
        btnAll.textContent = `✓ อนุมัติที่รอทั้งหมด (${pendingTeachersCount} คน)`;
        btnAll.classList.remove('hidden');
      } else {
        btnAll.classList.add('hidden');
      }
    }

    /* Keep STATE.teachers in sync so quick-select chips & dropdowns reflect latest status immediately */
    STATE.teachers = (res.teachers || []).map(t => ({
      teacherId: t.teacherId,
      usernameOrEmail: t.usernameOrEmail,
      fullName: t.fullName,
      schoolId: t.schoolId,
      role: t.role,
      subjectCode: t.subjectCode,
      status: t.status
    }));
    renderRoleTeacherSelect('COMMITTEE');
    renderRoleTeacherSelect('INSTRUCTOR');
    renderRoleTeacherSelect('ACADEMIC');
    renderNotificationsPopover();

    document.getElementById('adminTeachersApprovalList').innerHTML = sortedTeachers.map(t => {
      const roleTh = ROLE_LABELS_TH[t.role] || t.role;
      const subTh = t.subjectCode === 'ALL' ? 'ครบ 4 วิชา' : (SUBJECT_NAMES[t.subjectCode] || t.subjectCode);
      const isPending = t.status !== 'APPROVED';
      const isSelfAdmin = t.teacherId === STATE.currentTeacher.teacherId || t.role === 'SUPER_ADMIN';
      return `
      <div class="${isPending ? 'gw-alert-warn' : 'gw-subcard'} flex flex-wrap items-center justify-between gap-2">
        <div>
          <div class="font-bold text-xs">
            ${escHtml(t.fullName)} (${escHtml(getSchoolShortName(t.schoolId))})
            ${isPending ? '<span class="ml-1 gw-badge-warn">รอครูเกียรติศักดิ์อนุมัติ</span>' : ''}
          </div>
          <div class="text-xs" style="color: var(--gw-muted);">${escHtml(roleTh)} | วิชา: ${escHtml(subTh)} | ${escHtml(t.usernameOrEmail)}</div>
        </div>
        <div class="flex flex-wrap gap-1.5 items-center">
          ${isPending
            ? `<button type="button" onclick="approveTeacher('${escHtml(t.teacherId)}', 'APPROVED')" class="gw-btn-primary !py-1.5 !px-3 text-xs">✓ อนุมัติให้เข้าใช้งาน</button>`
            : `<span class="gw-badge-success">อนุมัติแล้ว</span>`}
          ${!isSelfAdmin ? `
            <button type="button" onclick="openEditTeacherModal('${escHtml(t.teacherId)}')" class="gw-btn-soft !py-1 !px-2.5 text-xs">แก้ไข</button>
            <button type="button" onclick="openResetTeacherPassModal('${escHtml(t.teacherId)}')" class="gw-btn-soft !py-1 !px-2.5 text-xs">เปลี่ยนรหัส</button>
            <button type="button" onclick="confirmDeleteTeacher('${escHtml(t.teacherId)}')" class="gw-btn-soft !py-1 !px-2.5 text-xs" style="color: var(--gw-danger-ink);">ลบ</button>
          ` : ''}
        </div>
      </div>
    `;
    }).join('');

    const chkAllowEl = document.getElementById('chkAllowStudentPrePost');
    const lblAllowEl = document.getElementById('lblAllowStudentPrePost');
    const allowStuPrePost = String((res.config && res.config.ALLOW_STUDENT_PREPOST_DOWNLOAD) || 'FALSE').toUpperCase() === 'TRUE';
    if (chkAllowEl) chkAllowEl.checked = allowStuPrePost;
    if (lblAllowEl) {
      lblAllowEl.textContent = allowStuPrePost ? 'เปิดให้นักเรียนโหลด Pre-Post แล้ว' : 'ปิดไว้ (เห็นเฉพาะครู/วิชาการ)';
      lblAllowEl.className = allowStuPrePost
        ? 'px-2.5 py-0.5 rounded-full text-[11px] font-bold gw-badge-success'
        : 'px-2.5 py-0.5 rounded-full text-[11px] font-bold gw-badge-warn';
    }

    renderAdminReviewList();
    refreshAdminMergeReadiness();
    renderAdminIocOverview();
    const curRound = (document.getElementById('adminIocRound') && document.getElementById('adminIocRound').value) || 'PRE';
    const curSub = (document.getElementById('adminIocSubject') && document.getElementById('adminIocSubject').value) || '61';
    if (
      res.initialIocDetail &&
      res.initialIocDetail.ok &&
      String(res.initialIocDetail.round || 'PRE').toUpperCase() === curRound.toUpperCase() &&
      String(res.initialIocDetail.subjectCode || '61') === String(curSub)
    ) {
      renderAdminIocDetailData_(res.initialIocDetail);
    } else {
      loadAdminIocDetail();
    }
    renderAdminKeyEditor();
  }

  function renderAdminIocOverview() {
    const grid = document.getElementById('adminIocOverviewGrid');
    if (!grid) return;
    const rows = (STATE.adminData && STATE.adminData.iocOverview) || [];
    if (!rows.length) {
      grid.innerHTML = '<div class="col-span-full text-xs opacity-75">ยังไม่มีข้อมูลสรุป IOC (กำลังรอคณะกรรมการตรวจประเมิน หรือคลิกเลือกวิชาเพื่อเปิดตรวจ)</div>';
      return;
    }
    const selRound = (document.getElementById('adminIocRound') && document.getElementById('adminIocRound').value) || 'PRE';
    const selSub = (document.getElementById('adminIocSubject') && document.getElementById('adminIocSubject').value) || '61';
    grid.innerHTML = rows.map(r => {
      const subName = SUBJECT_NAMES[r.subjectCode] || r.subjectCode;
      const isActiveCard = String(r.round || '').toUpperCase() === selRound.toUpperCase() && String(r.subjectCode || '') === String(selSub);
      const badge = r.allItemsPass && r.quorumMet
        ? '<span class="gw-badge-success whitespace-nowrap shrink-0">พร้อมรวมเล่ม</span>'
        : `<span class="gw-badge-warn whitespace-nowrap shrink-0">${r.quorumMet ? 'รอปรับปรุง' : 'รอตรวจ'}</span>`;
      const avgLabel = Number(r.evaluatedCount || 0) > 0
        ? fmtFixed(r.overallAvgIoc, 2, '0.00')
        : '- (รอตรวจ)';
      const revWarn = (r.needsRevisionItems && r.needsRevisionItems.length)
        ? `<div class="text-[10px] text-rose-600 font-bold">ข้อควรแก้: ${escHtml(r.needsRevisionItems.join(', '))}</div>`
        : '';
      return `
        <button type="button" onclick="selectAdminIocCard('${escHtml(r.round)}', '${escHtml(r.subjectCode)}')" class="gw-subcard text-left space-y-1.5 hover:opacity-95 transition cursor-pointer" style="${isActiveCard ? 'border-color: var(--gw-accent); box-shadow: 0 0 0 2px var(--gw-accent-soft);' : ''}">
          <div class="flex items-start justify-between gap-2">
            <span class="font-bold text-xs min-w-0 leading-snug">${escHtml(r.round)} • ${escHtml(subName)}</span>
            ${badge}
          </div>
          <div class="text-[11px] opacity-85">กรรมการ: <b class="gw-tabular">${r.evaluatedCount}/${r.totalCommitteeCount}</b> | ผ่าน: <b class="gw-tabular">${r.passingItemsCount}/${r.totalItems}</b></div>
          <div class="text-[11px]">IOC เฉลี่ย: <b class="gw-tabular" style="color:${Number(r.evaluatedCount || 0) > 0 ? 'var(--gw-accent)' : 'var(--gw-muted)'};">${escHtml(avgLabel)}</b></div>
          ${revWarn}
        </button>
      `;
    }).join('');
  }

  function selectAdminIocCard(round, subjectCode) {
    const rEl = document.getElementById('adminIocRound');
    const sEl = document.getElementById('adminIocSubject');
    if (rEl) rEl.value = round === 'POST' ? 'POST' : 'PRE';
    if (sEl) sEl.value = String(subjectCode || '61');
    renderAdminIocOverview();
    loadAdminIocDetail();
  }

  function renderAdminIocDetailData_(res) {
    const box = document.getElementById('adminIocDetailBox');
    if (!box) return;
    if (!res || !res.ok) {
      box.innerHTML = `<div class="text-xs text-rose-500">${escHtml((res && res.error) || 'โหลดข้อมูล IOC ไม่สำเร็จ')}</div>`;
      return;
    }
    STATE.adminIocCurrentData = res;
    const summary = res.iocSummary || { totalItems: 0, passingItemsCount: 0, overallAvgIoc: 0, evaluatedCount: 0, totalCommitteeCount: 0, needsRevisionItems: [], items: [] };
    const reviews = res.reviews || [];
    const revItems = (summary.items || []).filter(it => hasFiniteNumber(it.ioc) && (!it.passed || it.minusOneCount > 0));
    const avgIocTxt = Number(summary.evaluatedCount || 0) > 0
      ? fmtFixed(summary.overallAvgIoc, 2, '0.00')
      : '- (รอตรวจ)';
    const schoolMap = {};
    (STATE.schools || []).forEach(s => { schoolMap[s.schoolId] = s.schoolName; });

    const statusNoticeHtml = revItems.length
      ? `<div class="rounded-lg px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600">⚠️ พบข้อสอบที่มีทักท้วงหรือ IOC &lt; 0.50: ${revItems.map(x => `ข้อ ${x.itemNo} (IOC=${fmtFixed(x.ioc, 2, '-')})`).join(', ')}</div>`
      : (Number(summary.evaluatedCount || 0) > 0
          ? '<div class="text-xs font-bold text-emerald-600">✓ ไม่มีข้อสอบที่ต่ำกว่าเกณฑ์ในรายการที่ประเมินแล้ว</div>'
          : '<div class="text-xs font-semibold" style="color: var(--gw-muted);">⏳ ยังไม่มีคณะกรรมการบันทึกผลประเมิน IOC ในชุดวิชานี้ (รอคณะกรรมการเข้าตรวจที่แท็บ 2)</div>');

    box.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b" style="border-color:var(--gw-line);">
        <div class="font-bold">
          สรุปผล ${escHtml(res.subjectName)} (${escHtml(res.round)}) — องค์ประชุม <span class="gw-tabular">${summary.evaluatedCount}/${summary.totalCommitteeCount}</span> ท่าน | ผ่านเกณฑ์ <span class="gw-tabular">${summary.passingItemsCount}/${summary.totalItems}</span> ข้อ | ค่าเฉลี่ย IOC = <span class="gw-tabular" style="color:var(--gw-accent);">${escHtml(avgIocTxt)}</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button type="button" onclick="openSplitScreenIocFromAdmin('${escHtml(res.round)}', '${escHtml(res.subjectCode)}')" class="gw-btn-soft text-xs !py-1.5 !px-3 font-bold" style="color:var(--gw-accent);">🔍 เปิดตรวจ 2 หน้าจอคู่ขนาน</button>
          <button type="button" onclick="previewAndPrintIocA4Report('ADMIN')" class="gw-btn-soft text-xs !py-1.5 !px-3 font-bold">🖨️ พิมพ์รายงาน IOC (A4)</button>
          <button type="button" onclick="exportOfficialIocDocx('ADMIN')" class="gw-btn-soft text-xs !py-1.5 !px-3 font-bold">📄 ดาวน์โหลดรายงาน IOC (.docx)</button>
          <button type="button" id="btnBulkApproveIoc" onclick="bulkApproveExamSetAfterIoc()" class="gw-btn-primary text-xs !py-1.5 !px-3">✅ อนุมัติชุดข้อสอบเข้าพร้อมรวมเล่ม (Bulk Approve หลังผ่าน IOC)</button>
        </div>
      </div>
      ${statusNoticeHtml}
      <div class="text-xs">
        <b>ผู้ตรวจประเมินที่บันทึกผลแล้ว (${reviews.length} ท่าน):</b>
        ${reviews.length ? reviews.map(rv => `${escHtml(rv.teacherName)} (${escHtml(schoolMap[rv.schoolId] || rv.schoolId || '-')})${rv.summaryNote ? ` — "${escHtml(rv.summaryNote)}"` : ''}`).join(' | ') : '<span class="opacity-70">ยังไม่มีผู้บันทึกผล</span>'}
      </div>
      <div class="overflow-x-auto max-h-[260px]">
        <table class="gw-table text-xs">
          <thead><tr>
            <th>ข้อ</th>
            <th class="text-left">ตัวชี้วัด</th>
            <th>ผู้ตรวจ</th>
            <th>+1 / 0 / -1</th>
            <th>ค่า IOC</th>
            <th class="text-left">ข้อเสนอแนะ</th>
          </tr></thead>
          <tbody>
            ${(summary.items || []).map(it => {
              const hasIoc = hasFiniteNumber(it.ioc);
              const iocTxt = fmtFixed(it.ioc, 2, '-');
              const iocColorCls = !hasIoc ? 'opacity-65' : (!it.passed ? 'text-rose-600' : 'text-emerald-600');
              const cmtTxt = (it.comments || []).map(c => `${c.teacherName}: ${c.comment}`).join(' ; ') || '-';
              return `<tr>
                <td class="text-center font-bold gw-tabular">${it.itemNo}</td>
                <td>${escHtml(it.indicatorCode || '-')}</td>
                <td class="text-center gw-tabular">${it.evaluatorCount}</td>
                <td class="text-center gw-tabular">${it.plusOneCount} / ${it.zeroCount} / ${it.minusOneCount}</td>
                <td class="text-center font-bold gw-tabular ${iocColorCls}">${iocTxt}</td>
                <td>${escHtml(cmtTxt)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function openSplitScreenIocFromAdmin(round, subjectCode) {
    switchMainTab('COMMITTEE');
    const rSel = document.getElementById('iocRound');
    const sSel = document.getElementById('iocSubject');
    if (rSel && round) rSel.value = String(round).toUpperCase();
    if (sSel && subjectCode) sSel.value = String(subjectCode);
    switchCommSubtab('IOC');
    await loadExamIocData();
  }

  async function loadAdminIocDetail() {
    const box = document.getElementById('adminIocDetailBox');
    if (!box) return;
    const round = (document.getElementById('adminIocRound') && document.getElementById('adminIocRound').value) || 'PRE';
    const subjectCode = (document.getElementById('adminIocSubject') && document.getElementById('adminIocSubject').value) || '61';
    renderAdminIocOverview();
    box.innerHTML = '<div class="text-xs opacity-75">กำลังโหลดรายละเอียดผลการประเมิน IOC...</div>';
    try {
      const res = await callGas('apiGetExamIocData', {
        authToken: STATE.authToken || '',
        teacherId: STATE.currentTeacher && STATE.currentTeacher.teacherId,
        round,
        subjectCode
      });
      renderAdminIocDetailData_(res);
    } catch (err) {
      box.innerHTML = `<div class="text-xs text-rose-500">โหลดผล IOC ผิดพลาด: ${escHtml(err.message)}</div>`;
    }
  }

  async function bulkApproveExamSetAfterIoc() {
    const round = (document.getElementById('adminIocRound') && document.getElementById('adminIocRound').value) || 'PRE';
    const subjectCode = (document.getElementById('adminIocSubject') && document.getElementById('adminIocSubject').value) || '61';
    const btn = document.getElementById('btnBulkApproveIoc');
    if (btn) btn.disabled = true;
    try {
      const res = await callGas('apiBulkApproveExamSetAfterIoc', {
        authToken: STATE.authToken || '',
        teacherId: STATE.currentTeacher && STATE.currentTeacher.teacherId,
        subjectCode,
        round
      });
      if (!res || !res.ok) {
        showToast((res && res.error) || 'อนุมัติชุดข้อสอบไม่สำเร็จ', 'error');
        return;
      }
      showToast(`อนุมัติข้อสอบเข้าพร้อมรวมเล่มเรียบร้อยแล้ว จำนวน ${res.approvedCount || 0} ไฟล์!`, 'success');
      refreshSuperAdminDashboard();
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการอนุมัติชุดข้อสอบ: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function renderAdminReviewList() {
    const box = document.getElementById('adminSubmissionsReviewList');
    if (!box) return;
    const rawSubs = ((STATE.adminData && STATE.adminData.submissions) || []).map(normalizeSubMetaClient_);
    const filterEl = document.getElementById('adminRevFilter');
    const fVal = filterEl ? filterEl.value : 'ALL';
    const filtered = rawSubs.filter(s => {
      if (fVal === 'ALL') return true;
      if (fVal === 'รอตรวจ' || fVal === 'รอกรรมการตรวจ IOC' || fVal === 'ผ่านพร้อมรวมเล่ม' || fVal === 'ส่งแก้') return s.reviewStatus === fVal;
      if (fVal === 'PREPOST_EXAM' || fVal === 'TUTORING_STRAND' || fVal === 'MERGED_BOOK') return s.docCategory === fVal;
      if (fVal === 'STUDENT' || fVal === 'TEACHER') return s.targetAudience === fVal;
      return true;
    });

    box.innerHTML = filtered.map(s => {
      const isOk = isApprovedSubmissionStatus_(s.reviewStatus);
      const badgeCls = isOk ? 'gw-badge-success' : (s.reviewStatus === 'ส่งแก้' ? 'gw-badge-danger' : 'gw-badge-warn');
      const isPrePostKeyCandidate = s.docCategory === 'PREPOST_EXAM' && s.targetAudience === 'TEACHER';
      const isPrePostExam = s.docCategory === 'PREPOST_EXAM';
      return `
      <div class="gw-subcard space-y-1.5">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <a href="${escHtml(s.driveFileUrl)}" target="_blank" class="font-bold underline" style="color: var(--gw-accent);">${escHtml(s.fileName)}</a>
          <div class="flex flex-wrap gap-1">${formatSubmissionCardBadges_(s)} <span class="${badgeCls}">${escHtml(s.reviewStatus || 'รอตรวจ')}</span></div>
        </div>
        ${s.pdfFileUrl ? `<div><a href="${escHtml(s.pdfFileUrl)}" target="_blank" class="text-xs font-bold underline" style="color: var(--gw-info-ink);">📄 เปิดไฟล์ PDF ล็อกหน้าคู่ขนาน (รวมเล่มไม่เพี้ยน 100%)</a></div>` : ''}
        <div class="text-xs" style="color: var(--gw-muted);">${escHtml(s.teacherName)} (${escHtml(getSchoolShortName(s.schoolId))}) | ${escHtml(s.preCheckSummary)}</div>
        ${s.adminComment ? `<div class="text-xs gw-text-danger font-bold">หมายเหตุ: ${escHtml(s.adminComment)}</div>` : ''}
        <div class="flex flex-wrap gap-1.5 pt-1">
          <button type="button" onclick="reviewSubmissionStatus('${escHtml(s.submissionId)}', 'ผ่านพร้อมรวมเล่ม')" class="gw-btn-primary !py-1 !px-3 text-xs">ผ่านพร้อมรวมเล่ม</button>
          ${isPrePostExam ? `<button type="button" onclick="reviewSubmissionStatus('${escHtml(s.submissionId)}', 'รอกรรมการตรวจ IOC')" class="gw-btn-soft !py-1 !px-2.5 text-xs" style="color: var(--gw-accent);">ส่งตรวจ IOC</button>` : ''}
          <button type="button" onclick="reviewSubmissionStatus('${escHtml(s.submissionId)}', 'ส่งแก้')" class="gw-btn-soft !py-1 !px-3 text-xs" style="color: var(--gw-danger-ink);">ส่งแก้</button>
          ${isPrePostKeyCandidate ? `<button type="button" onclick="jumpToAdminKeyEditor('${escHtml(s.subjectCode)}', '${escHtml(s.examRound || 'PRE')}')" class="gw-btn-soft !py-1 !px-2.5 text-xs">🔑 ตั้งค่าผังเฉลยดิจิทัล</button>` : ''}
        </div>
      </div>
    `;
    }).join('') || '<div class="text-xs" style="color: var(--gw-muted);">ยังไม่มีรายการที่ตรงกับตัวกรองนี้</div>';
  }

  async function toggleStudentPrePostVisibility(allow) {
    const res = await callGas('apiSetStudentPrePostVisibility', {
      authToken: STATE.authToken || '',
      allowStudentPrePost: Boolean(allow)
    });
    if (!res || !res.ok) {
      showToast((res && res.error) || 'อัปเดตสิทธิ์การเห็นข้อสอบไม่สำเร็จ', 'error');
      const chk = document.getElementById('chkAllowStudentPrePost');
      if (chk) chk.checked = !allow;
      return;
    }
    const lbl = document.getElementById('lblAllowStudentPrePost');
    if (lbl) {
      lbl.textContent = res.allowStudentPrePost ? 'เปิดให้นักเรียนโหลด Pre-Post แล้ว' : 'ปิดไว้ (เห็นเฉพาะครู/วิชาการ)';
      lbl.className = res.allowStudentPrePost
        ? 'px-2.5 py-0.5 rounded-full text-[11px] font-bold gw-badge-success'
        : 'px-2.5 py-0.5 rounded-full text-[11px] font-bold gw-badge-warn';
    }
    showToast(res.allowStudentPrePost ? 'เปิดให้นักเรียนดาวน์โหลด Pre-Post ฉบับนักเรียนแล้ว' : 'ปิดการแสดงข้อสอบ Pre-Post ในหน้าของนักเรียนแล้ว', 'success');
  }

  function jumpToAdminKeyEditor(subjectCode, examRound) {
    const roundEl = document.getElementById('adminKeyRound');
    const subEl = document.getElementById('adminKeySubject');
    if (roundEl) roundEl.value = examRound === 'POST' ? 'POST' : 'PRE';
    if (subEl && subjectCode) subEl.value = String(subjectCode);
    renderAdminKeyEditor();
    if (subEl) subEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('เปิดผังเฉลยดิจิทัลของวิชานี้เรียบร้อย (กรอกจากตารางผังในไฟล์ฉบับครูได้เลย)', 'info');
  }

  function refreshAdminMergeReadiness() {
    const box = document.getElementById('adminMergeReadinessBox');
    if (!box) return;
    const subCode = (document.getElementById('mergeSubjectCode') && document.getElementById('mergeSubjectCode').value) || '61';
    const docGroup = (document.getElementById('mergeDocGroup') && document.getElementById('mergeDocGroup').value) || 'TUTORING_STRAND';
    const aud = (document.getElementById('mergeTargetAudience') && document.getElementById('mergeTargetAudience').value) || 'STUDENT';
    const roundWrap = document.getElementById('mergeExamRoundWrap');
    const roundEl = document.getElementById('mergeExamRound');
    if (roundWrap) roundWrap.classList.toggle('hidden', docGroup !== 'PREPOST_EXAM');
    const examRound = docGroup === 'PREPOST_EXAM' ? ((roundEl && roundEl.value) || 'PRE') : 'ALL';

    const sortMergeParts_ = (a, b) => {
      const sDiff = (Number(a.strandNo || 99) || 99) - (Number(b.strandNo || 99) || 99);
      if (sDiff !== 0) return sDiff;
      const aAll = !a.subStandard || /ครบทั้งสาระ|ALL/i.test(String(a.subStandard));
      const bAll = !b.subStandard || /ครบทั้งสาระ|ALL/i.test(String(b.subStandard));
      if (aAll !== bAll) return aAll ? -1 : 1;
      return String(a.subStandard || a.fileName || '').localeCompare(String(b.subStandard || b.fileName || ''), 'th', { numeric: true });
    };

    const allSubs = ((STATE.adminData && STATE.adminData.submissions) || []).map(normalizeSubMetaClient_);
    const approved = allSubs.filter(s =>
      String(s.subjectCode) === subCode &&
      isApprovedSubmissionStatus_(s.reviewStatus) &&
      s.docCategory === docGroup &&
      s.targetAudience === aud &&
      (docGroup !== 'PREPOST_EXAM' || examRound === 'ALL' || !s.examRound || s.examRound === examRound || s.examRound === 'PRE_POST')
    ).sort(sortMergeParts_);

    const bpStrands = new Map();
    (STATE.blueprint || []).filter(r => String(r.subjectCode) === subCode).forEach(r => {
      if (!bpStrands.has(String(r.strandNo))) bpStrands.set(String(r.strandNo), r.strandName);
    });

    const strandPills = Array.from(bpStrands.entries()).map(([no, name]) => {
      const count = approved.filter(a => String(a.strandNo) === no || a.strandNo === 'ทั้งวิชา').length;
      return `<span class="inline-block rounded-lg px-2 py-1 mr-1 mb-1 font-bold ${count > 0 ? 'gw-badge-success' : 'gw-badge-warn'}">${count > 0 ? '✓' : '⏳'} สาระที่ ${escHtml(no)} (${count})</span>`;
    }).join('');

    const roundLabel = docGroup === 'PREPOST_EXAM' ? ` • ชุด ${examRound === 'ALL' ? 'ทุกรอบ' : examRound}` : '';
    box.innerHTML = `
      <div class="font-bold">ความพร้อมสำหรับการรวมเล่ม (${escHtml(SUBJECT_NAMES[subCode] || subCode)}${escHtml(roundLabel)} • ${aud === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู'} • อนุมัติแล้ว ${approved.length} ไฟล์)</div>
      <div>${strandPills || 'กำลังโหลดโครงสร้างสาระ...'}</div>
      ${approved.length ? `<div class="text-[11px]" style="color: var(--gw-muted);">ลำดับไฟล์ที่จะถูกรวม: ${approved.map((x, i) => `${i + 1}) ${escHtml(x.fileName)}`).join(' → ')}</div>` : '<div class="text-[11px]" style="color: var(--gw-muted);">ยังไม่มีไฟล์ที่อนุมัติแล้วในหมวดนี้ — คุณครูสามารถกดปุ่ม "🧪 ทดลองสร้างไฟล์ตัวอย่าง & รวมเล่มจำลอง" ด้านขวาบนเพื่อดูผลจริงทันทีครับ</div>'}
    `;
  }

  async function assembleMergedDocxBlob_({ subjectCode, subjectName, sourceCategory, targetAudience, examRound = 'PRE', fileName, parts }) {
    if (typeof JSZip === 'undefined') throw new Error('ไลบรารี JSZip ยังไม่พร้อมทำงาน กรุณารีเฟรชหน้าเว็บ');
    parts = Array.from(parts || []).sort((a, b) => {
      const sDiff = (Number(a.strandNo || 99) || 99) - (Number(b.strandNo || 99) || 99);
      if (sDiff !== 0) return sDiff;
      const aAll = !a.subStandard || /ครบทั้งสาระ|ALL/i.test(String(a.subStandard));
      const bAll = !b.subStandard || /ครบทั้งสาระ|ALL/i.test(String(b.subStandard));
      if (aAll !== bAll) return aAll ? -1 : 1;
      return String(a.subStandard || a.fileName || '').localeCompare(String(b.subStandard || b.fileName || ''), 'th', { numeric: true });
    });
    const binStr = atob(REPORT_DOCX_SKELETON_B64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

    const outZip = await JSZip.loadAsync(bytes);
    let baseRels = await outZip.file('word/_rels/document.xml.rels').async('string');
    let contentTypes = await outZip.file('[Content_Types].xml').async('string');

    const catLabel = sourceCategory === 'PREPOST_EXAM' ? 'ข้อสอบคู่ขนาน Pre-Post O-NET' : 'เอกสารยกระดับผลสัมฤทธิ์ตามสาระและตัวชี้วัด';
    const edLabel = targetAudience === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู (มีเฉลยและวิธีคิดละเอียด)';
    const chapters = parts.map(p => ({
      strandNo: p.strandNo,
      strandLabel: p.strandNo === 'ทั้งวิชา' ? 'แบบทดสอบครบชุดทั้งรายวิชา' : `สาระที่ ${p.strandNo}`,
      subStandard: p.subStandard || p.fileName,
      fileName: p.fileName,
      authorSchool: `${p.teacherName || 'คณะกรรมการ'}${p.schoolId ? ' (' + getSchoolShortName(p.schoolId) + ')' : ''}`
    }));

    const isExam = sourceCategory === 'PREPOST_EXAM';
    const roundKey = String(examRound || 'PRE').toUpperCase() === 'POST' ? 'POST' : 'PRE';
    const frontMatterXml = isExam
      ? buildNietsExamBookletFrontMatterXml({
          subjectCode,
          subjectName,
          examRound: roundKey,
          editionLabel: edLabel,
          targetAudience,
          chapters
        })
      : buildMergedBookFrontMatterXml({
          subjectName,
          docCategoryLabel: catLabel,
          editionLabel: edLabel,
          academicYearBE: '2569',
          chapters
        });

    let nextRId = 20;
    const allNewRels = [];
    const remappedParts = [];
    let mediaCount = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const remapped = sanitizeAndRemapDocxBodyForMerge(part.documentXml, part.relsXml || '', i + 1, nextRId);
      nextRId = remapped.nextRId;
      allNewRels.push(...remapped.newRelationships);

      for (const m of remapped.mediaToCopy) {
        if (!part.zip) continue;
        let mediaEntry = part.zip.file(m.oldZipPath) || part.zip.file(m.oldTarget) || part.zip.file('word/' + m.oldTarget);
        if (!mediaEntry) {
          const baseName = m.oldTarget.split('/').pop();
          const candidates = part.zip.file(new RegExp('media/' + baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'));
          if (candidates && candidates.length) mediaEntry = candidates[0];
        }
        if (mediaEntry) {
          const mediaBytes = await mediaEntry.async('uint8array');
          outZip.file(m.newZipPath, mediaBytes);
          mediaCount++;
          const ext = (m.newZipPath.split('.').pop() || '').toLowerCase();
          if (ext === 'emf' && !contentTypes.includes('Extension="emf"')) {
            contentTypes = contentTypes.replace('</Types>', '<Default ContentType="image/x-emf" Extension="emf"/></Types>');
          } else if (ext === 'wmf' && !contentTypes.includes('Extension="wmf"')) {
            contentTypes = contentTypes.replace('</Types>', '<Default ContentType="image/x-wmf" Extension="wmf"/></Types>');
          } else if (ext === 'webp' && !contentTypes.includes('Extension="webp"')) {
            contentTypes = contentTypes.replace('</Types>', '<Default ContentType="image/webp" Extension="webp"/></Types>');
          }
        }
      }

      remappedParts.push({
        strandNo: part.strandNo,
        subStandard: part.subStandard,
        fileName: part.fileName,
        bodyXml: remapped.bodyXml
      });
    }

    const bodySections = [frontMatterXml];
    let smartSummary = null;
    if (isExam) {
      const smartRes = assembleSmartExamBodyXml(remappedParts, { subjectCode, targetAudience });
      bodySections.push(smartRes.bodyXml);
      const bpExpected = (NIETS_2569_EXAM_ITEMS[String(subjectCode)] || []).map(x => Number(x.itemNo));
      const sortedSet = new Set(smartRes.sortedItemNos || []);
      const missingItemNos = bpExpected.filter(n => !sortedSet.has(n));
      smartSummary = {
        mode: smartRes.usedFallback ? 'RAW_FALLBACK' : 'SMART_SORTED',
        usedFallback: !!smartRes.usedFallback,
        itemCount: smartRes.itemCount || 0,
        sortedItemNos: smartRes.sortedItemNos || [],
        missingItemNos
      };
    } else {
      remappedParts.forEach((rp, idx) => {
        if (idx > 0) bodySections.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
        bodySections.push(rp.bodyXml);
      });
    }

    const extraRelsXml = allNewRels.map(rel => {
      const modeAttr = rel.targetMode ? ` TargetMode="${escapeDocxXmlText(rel.targetMode)}"` : '';
      return `<Relationship Id="${escapeDocxXmlText(rel.rId)}" Type="${escapeDocxXmlText(rel.type)}" Target="${escapeDocxXmlText(rel.target)}"${modeAttr}/>`;
    }).join('');
    baseRels = baseRels.replace('</Relationships>', `${extraRelsXml}</Relationships>`);

    const mergedDocXml = [
      '<' + '?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" ',
      'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ',
      'xmlns:o="urn:schemas-microsoft-com:office:office" ',
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ',
      'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ',
      'xmlns:v="urn:schemas-microsoft-com:vml" ',
      'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" ',
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ',
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ',
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ',
      'xmlns:w10="urn:schemas-microsoft-com:office:word" ',
      'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ',
      'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ',
      'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" ',
      'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" ',
      'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" ',
      'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">',
      '<w:body>',
      bodySections.join(''),
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="2160" w:right="1440" w:bottom="1440" w:left="2160" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>',
      '</w:body></w:document>'
    ].join('');

    outZip.file('word/document.xml', mergedDocXml);
    outZip.file('word/_rels/document.xml.rels', baseRels);
    outZip.file('[Content_Types].xml', contentTypes);

    const outBytes = await outZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const outBlob = new Blob([outBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    return {
      blob: outBlob,
      base64Data: uint8ToBase64_(outBytes),
      partCount: parts.length,
      mediaCount,
      fileName,
      smartSummary
    };
  }

  function formatSmartMergeSummaryHtml_(smartSummary) {
    if (!smartSummary) return '';
    if (smartSummary.usedFallback) {
      return '<div>• โหมดจัดรูปเล่มข้อสอบ: <b>RAW_FALLBACK</b> (ไม่พบเลข "ข้อ 1..N" ชัดเจน จึงคงลำดับหน้าตามไฟล์ต้นฉบับ)</div>';
    }
    const missHtml = (smartSummary.missingItemNos && smartSummary.missingItemNos.length)
      ? ` <span class="gw-text-warn font-bold">| ยังขาดข้อ: ${escHtml(smartSummary.missingItemNos.join(', '))}</span>`
      : ' <span class="gw-text-success font-bold">| ครบทุกข้อตามผัง สทศ.</span>';
    return `<div>• โหมดจัดรูปเล่มข้อสอบ: <b>SMART_SORTED (ปก สทศ. + จัดเรียงข้อ 1..N อัตโนมัติ)</b> — พบ <b>${smartSummary.itemCount}</b> ข้อ${missHtml}</div>`;
  }

  async function runAdminAutoMergeDocx(publishToDrive = false) {
    const subCode = (document.getElementById('mergeSubjectCode') && document.getElementById('mergeSubjectCode').value) || '61';
    const docCategory = (document.getElementById('mergeDocGroup') && document.getElementById('mergeDocGroup').value) || 'TUTORING_STRAND';
    const targetAudience = (document.getElementById('mergeTargetAudience') && document.getElementById('mergeTargetAudience').value) || 'STUDENT';
    const examRound = docCategory === 'PREPOST_EXAM'
      ? ((document.getElementById('mergeExamRound') && document.getElementById('mergeExamRound').value) || 'PRE')
      : 'ALL';
    const logEl = document.getElementById('adminMergeLog');
    const btnLocal = document.getElementById('btnMergeDownloadLocal');
    const btnPub = document.getElementById('btnMergePublishDrive');

    const setLog = (cls, msg) => {
      if (!logEl) return;
      logEl.className = `${cls} rounded-xl border p-3 text-xs space-y-1`;
      logEl.innerHTML = msg;
      logEl.classList.remove('hidden');
    };

    if (btnLocal) btnLocal.disabled = true;
    if (btnPub) btnPub.disabled = true;
    setLog('gw-alert-warn', 'กำลังดึงไฟล์ .docx ที่อนุมัติแล้วจาก Google Drive เพื่อเตรียมรวมเล่มอัตโนมัติ...');

    try {
      const fetchRes = await callGas('apiGetApprovedDocsForMerge', {
        authToken: STATE.authToken || '',
        subjectCode: subCode,
        docCategory,
        targetAudience,
        examRound
      });
      if (!fetchRes || !fetchRes.ok) {
        setLog('gw-alert-danger', `ดึงไฟล์ไม่สำเร็จ: ${escHtml((fetchRes && fetchRes.error) || 'ไม่ทราบสาเหตุ')}`);
        return;
      }

      const validDocs = (fetchRes.docs || []).filter(d => d.base64Data || d.base64);
      const skipped = (fetchRes.docs || []).filter(d => !d.base64Data && !d.base64);
      if (!validDocs.length) {
        setLog('gw-alert-warn', 'ไม่พบไฟล์ .docx ที่อนุมัติแล้วในหมวดและฉบับนี้ (แนะนำอนุมัติไฟล์ก่อน หรือกดปุ่ม "ทดลองสร้างไฟล์ตัวอย่าง & รวมเล่มจำลอง" เพื่อดูผลการทำงาน)');
        return;
      }

      setLog('gw-alert-warn', `กำลังถอดรหัส ${validDocs.length} ไฟล์ สร้างหน้าปก สารบัญ และล็อกภาพประกอบใน Word...`);
      const parsedParts = [];
      for (const doc of validDocs) {
        const binStr = atob(doc.base64Data || doc.base64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        const z = await JSZip.loadAsync(bytes);
        const docXml = z.file('word/document.xml') ? await z.file('word/document.xml').async('string') : '';
        const relsXml = z.file('word/_rels/document.xml.rels') ? await z.file('word/_rels/document.xml.rels').async('string') : '';
        parsedParts.push(Object.assign({}, doc, { zip: z, documentXml: docXml, relsXml }));
      }

      const subName = SUBJECT_NAMES[subCode] || subCode;
      const catSlug = docCategory === 'PREPOST_EXAM' ? `ข้อสอบ_${examRound}` : 'เอกสารยกระดับ';
      const edSlug = targetAudience === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู_มีเฉลย';
      const outName = `รวมเล่ม_${catSlug}_${subName}_${edSlug}_ศรีเสาวภาค2569.docx`;

      const merged = await assembleMergedDocxBlob_({
        subjectCode: subCode,
        subjectName: subName,
        sourceCategory: docCategory,
        targetAudience,
        examRound,
        fileName: outName,
        parts: parsedParts
      });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(merged.blob);
      a.download = merged.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);

      let pubInfo = '';
      if (publishToDrive) {
        setLog('gw-alert-warn', 'สร้างไฟล์รวมเล่มเสร็จแล้ว กำลังบันทึกขึ้น Google Drive เพื่อเผยแพร่ให้โรงเรียนในกลุ่ม...');
        const pubRes = await callGas('apiSaveMergedBookToDrive', {
          authToken: STATE.authToken || '',
          subjectCode: subCode,
          sourceCategory: docCategory,
          targetAudience,
          fileName: merged.fileName,
          base64Data: merged.base64Data,
          chapterSummary: `รวม ${merged.partCount} ตอน + ภาพประกอบ ${merged.mediaCount} ภาพ`
        });
        if (!pubRes || !pubRes.ok) {
          setLog('gw-alert-warn', `ดาวน์โหลดลงเครื่องแล้ว แต่บันทึกขึ้น Drive ไม่สำเร็จ: ${escHtml((pubRes && pubRes.error) || '')}`);
          return;
        }
        pubInfo = `<div>• เผยแพร่ขึ้น Google Drive แล้ว: <a href="${escHtml(pubRes.driveFileUrl)}" target="_blank" class="underline font-bold">เปิดดูไฟล์บน Drive</a></div>`;
        refreshSuperAdminDashboard();
      }

      const skipMsg = skipped.length ? `<div class="gw-text-danger">• ข้าม ${skipped.length} ไฟล์: ${skipped.map(s => escHtml(s.fileName + ' (' + s.error + ')')).join(', ')}</div>` : '';
      const smartInfo = formatSmartMergeSummaryHtml_(merged.smartSummary);
      setLog('gw-alert-success', `
        <div class="font-bold">✅ รวมเล่มสำเร็จ ${merged.partCount} ตอน + ปก + สารบัญ + ภาพประกอบ ${merged.mediaCount} ภาพ!</div>
        ${smartInfo}
        <div>• ดาวน์โหลดไฟล์แล้ว: <b>${escHtml(merged.fileName)}</b></div>
        ${pubInfo}${skipMsg}
      `);
      showToast('รวมเล่มเอกสาร .docx เสร็จสมบูรณ์แล้วครับ!', 'success');
    } catch (err) {
      setLog('gw-alert-danger', 'เกิดข้อผิดพลาดขณะรวมเล่ม: ' + escHtml(err.message || String(err)));
    } finally {
      if (btnLocal) btnLocal.disabled = false;
      if (btnPub) btnPub.disabled = false;
    }
  }

  async function runSampleDemoAutoMergeDocx() {
    const subCode = (document.getElementById('mergeSubjectCode') && document.getElementById('mergeSubjectCode').value) || '61';
    const docCategory = (document.getElementById('mergeDocGroup') && document.getElementById('mergeDocGroup').value) || 'TUTORING_STRAND';
    const targetAudience = (document.getElementById('mergeTargetAudience') && document.getElementById('mergeTargetAudience').value) || 'STUDENT';
    const examRound = docCategory === 'PREPOST_EXAM'
      ? ((document.getElementById('mergeExamRound') && document.getElementById('mergeExamRound').value) || 'PRE')
      : 'PRE';
    const roundKey = examRound === 'POST' ? 'POST' : 'PRE';
    const demoExamItems = (STATE.examStructure || []).filter(k => String(k.subjectCode) === subCode && k.round === roundKey);
    const subName = SUBJECT_NAMES[subCode] || subCode;
    const bpRows = (STATE.blueprint || []).filter(r => String(r.subjectCode) === subCode);
    const s1Rows = bpRows.filter(r => String(r.strandNo) === '1');
    const s2Rows = bpRows.filter(r => String(r.strandNo) === '2');

    const part1Xml = buildManuscriptTemplateDocumentXml({
      subjectCode: subCode,
      subjectName: subName,
      strandNo: '1',
      strandName: (s1Rows[0] && s1Rows[0].strandName) || 'สาระที่ 1',
      subStandard: 'ครบทั้งสาระ',
      expectedIndicators: (s1Rows.length ? s1Rows : bpRows).slice(0, 4).map(r => r.indicatorCode),
      docCategory,
      targetAudience,
      examRound: roundKey,
      examScope: 'BY_STRAND',
      examItems: demoExamItems
    });
    const part2Xml = buildManuscriptTemplateDocumentXml({
      subjectCode: subCode,
      subjectName: subName,
      strandNo: s2Rows.length ? '2' : '1',
      strandName: (s2Rows[0] && s2Rows[0].strandName) || 'สาระที่ 2 (ตัวอย่างเนื้อหาส่วนที่ 2)',
      subStandard: 'ตัวอย่างทดสอบการจัดหน้ารวมเล่มอัตโนมัติ',
      expectedIndicators: (s2Rows.length ? s2Rows : bpRows).slice(0, 4).map(r => r.indicatorCode),
      docCategory,
      targetAudience,
      examRound: roundKey,
      examScope: 'BY_STRAND',
      examItems: demoExamItems
    });

    const edSlug = targetAudience === 'STUDENT' ? 'ฉบับนักเรียน' : 'ฉบับครู';
    const catSlug = docCategory === 'PREPOST_EXAM' ? `ข้อสอบ_${roundKey}` : 'เอกสารยกระดับ';
    const outName = `ตัวอย่างรวมเล่มจำลอง_${catSlug}_${subName}_${edSlug}_2569.docx`;
    const merged = await assembleMergedDocxBlob_({
      subjectCode: subCode,
      subjectName: subName,
      sourceCategory: docCategory,
      targetAudience,
      examRound: roundKey,
      fileName: outName,
      parts: [
        { strandNo: '1', subStandard: 'สาระที่ 1 (จำลอง)', fileName: 'ตัวอย่างส่วนที่_1.docx', teacherName: 'ครูจำลอง ก.', schoolId: 'SCH01', documentXml: part1Xml, relsXml: '' },
        { strandNo: s2Rows.length ? '2' : '1', subStandard: 'สาระที่ 2 (จำลอง)', fileName: 'ตัวอย่างส่วนที่_2.docx', teacherName: 'ครูจำลอง ข.', schoolId: 'SCH02', documentXml: part2Xml, relsXml: '' }
      ]
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(merged.blob);
    a.download = merged.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);

    const logEl = document.getElementById('adminMergeLog');
    if (logEl) {
      logEl.className = 'gw-alert-success rounded-xl border p-3 text-xs space-y-1';
      logEl.innerHTML = `<div class="font-bold">🧪 สร้างไฟล์รวมเล่มจำลองสำเร็จ: ${escHtml(merged.fileName)}</div>${formatSmartMergeSummaryHtml_(merged.smartSummary)}<div>เปิดดูใน Microsoft Word ได้ทันที (ประกอบด้วย หน้าปก + สารบัญอัตโนมัติ + เอกสาร 2 ส่วนจำลอง ฟอนต์ TH SarabunPSK ขนาด A4 ไม่เคลื่อน)</div>`;
      logEl.classList.remove('hidden');
    }
    showToast('ดาวน์โหลดไฟล์รวมเล่มจำลอง (.docx) เพื่อทดลองเปิดดูเรียบร้อยแล้วครับ!', 'success');
  }

  function openEditTeacherModal(teacherId) {
    const t = (STATE.adminTeachersCache || []).find(x => x.teacherId === teacherId);
    if (!t) return;
    const roleOpts = ['COMMITTEE_TEACHER', 'SUBJECT_TEACHER', 'SCHOOL_ACADEMIC']
      .map(r => `<option value="${r}"${t.role === r ? ' selected' : ''}>${escHtml(ROLE_LABELS_TH[r] || r)}</option>`)
      .join('');
    const schoolOpts = (STATE.schools || [])
      .map(s => `<option value="${escHtml(s.schoolId)}"${t.schoolId === s.schoolId ? ' selected' : ''}>${escHtml(s.schoolNo)}. ${escHtml(s.schoolName)}</option>`)
      .join('');
    const subOpts = ['ALL', '61', '64', '65', '63']
      .map(c => `<option value="${c}"${String(t.subjectCode || 'ALL') === c ? ' selected' : ''}>${c === 'ALL' ? 'ครบทั้ง 4 วิชา' : escHtml(SUBJECT_NAMES[c])}</option>`)
      .join('');
    const statusOpts = ['APPROVED', 'PENDING', 'SUSPENDED']
      .map(st => `<option value="${st}"${t.status === st ? ' selected' : ''}>${st === 'APPROVED' ? 'อนุมัติแล้ว (ใช้งานได้)' : (st === 'PENDING' ? 'รออนุมัติ' : 'ระงับชั่วคราว')}</option>`)
      .join('');

    openCustomModal({
      title: 'แก้ไขสิทธิ์ & ข้อมูลบัญชีครู',
      subtitle: `${t.fullName} (${t.usernameOrEmail})`,
      bodyHtml: `
        <div class="space-y-3 text-xs">
          <div>
            <label class="font-bold block mb-1">สถานะบัญชี</label>
            <select data-field="newStatus" class="gw-input !py-1.5 text-xs">${statusOpts}</select>
          </div>
          <div>
            <label class="font-bold block mb-1">บทบาทหน้าที่</label>
            <select data-field="newRole" class="gw-input !py-1.5 text-xs">${roleOpts}</select>
          </div>
          <div>
            <label class="font-bold block mb-1">สังกัดโรงเรียน</label>
            <select data-field="newSchoolId" class="gw-input !py-1.5 text-xs">${schoolOpts}</select>
          </div>
          <div>
            <label class="font-bold block mb-1">รายวิชาที่รับผิดชอบ</label>
            <select data-field="newSubjectCode" class="gw-input !py-1.5 text-xs">${subOpts}</select>
          </div>
        </div>
      `,
      confirmText: 'บันทึกการแก้ไข',
      onConfirm: async (modal) => {
        const res = await callGas('apiApproveOrUpdateTeacher', {
          authToken: STATE.authToken || '',
          adminId: STATE.currentTeacher.teacherId,
          targetTeacherId: teacherId,
          newStatus: modal.querySelector('[data-field="newStatus"]').value,
          newRole: modal.querySelector('[data-field="newRole"]').value,
          newSchoolId: modal.querySelector('[data-field="newSchoolId"]').value,
          newSubjectCode: modal.querySelector('[data-field="newSubjectCode"]').value
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'บันทึกการแก้ไขไม่สำเร็จ', 'error');
          return false;
        }
        showToast('อัปเดตข้อมูลสิทธิ์คุณครูเรียบร้อยแล้วครับ', 'success');
        refreshSuperAdminDashboard();
      }
    });
  }

  function openResetTeacherPassModal(teacherId) {
    const t = (STATE.adminTeachersCache || []).find(x => x.teacherId === teacherId);
    if (!t) return;
    openCustomModal({
      title: 'ตั้งรหัสผ่านใหม่ให้บัญชีครู',
      subtitle: `${t.fullName} (${t.usernameOrEmail})`,
      bodyHtml: `
        <div class="space-y-2 text-xs">
          <label class="font-bold block">รหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)</label>
          <input type="password" data-field="newPassword" placeholder="ระบุรหัสผ่านใหม่" class="gw-input !py-2 text-xs">
        </div>
      `,
      confirmText: 'บันทึกรหัสผ่านใหม่',
      onConfirm: async (modal) => {
        const newPassword = modal.querySelector('[data-field="newPassword"]').value;
        if (!newPassword || newPassword.length < 4) {
          showToast('กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษรครับ', 'error');
          return false;
        }
        const res = await callGas('apiAdminResetTeacherPassword', {
          authToken: STATE.authToken || '',
          adminId: STATE.currentTeacher.teacherId,
          targetTeacherId: teacherId,
          newPassword
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
          return false;
        }
        showToast(res.message || 'เปลี่ยนรหัสผ่านเรียบร้อยแล้วครับ', 'success');
      }
    });
  }

  function confirmDeleteTeacher(teacherId) {
    const t = (STATE.adminTeachersCache || []).find(x => x.teacherId === teacherId);
    if (!t) return;
    openCustomModal({
      title: 'ยืนยันลบบัญชีครู',
      subtitle: 'ใช้สำหรับลบรายชื่อซ้ำหรือบัญชีที่ไม่ได้ใช้งาน',
      bodyHtml: `<div class="text-xs leading-relaxed">ต้องการลบบัญชีของ <b>${escHtml(t.fullName)}</b> (${escHtml(getSchoolShortName(t.schoolId))}) ออกจากระบบใช่หรือไม่ครับ?</div>`,
      confirmText: 'ยืนยันลบบัญชี',
      danger: true,
      onConfirm: async () => {
        const res = await callGas('apiDeleteTeacher', {
          authToken: STATE.authToken || '',
          adminId: STATE.currentTeacher.teacherId,
          targetTeacherId: teacherId
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'ลบบัญชีไม่สำเร็จ', 'error');
          return false;
        }
        showToast('ลบบัญชีครูเรียบร้อยแล้วครับ', 'success');
        refreshSuperAdminDashboard();
      }
    });
  }

  async function approveTeacher(targetTeacherId, newStatus) {
    const res = await callGas('apiApproveOrUpdateTeacher', {
      authToken: STATE.authToken || '',
      adminId: STATE.currentTeacher.teacherId,
      targetTeacherId,
      newStatus
    });
    if (res && res.ok) {
      showToast('อนุมัติสิทธิ์บัญชีครูเรียบร้อยแล้ว! ครูสามารถเข้าใช้งานได้ทันทีครับ', 'success');
      refreshSuperAdminDashboard();
    } else if (res && res.error) {
      showToast(res.error, 'error');
    }
  }

  async function approveAllPendingTeachers() {
    const res = await callGas('apiApproveAllPendingTeachers', {
      authToken: STATE.authToken || '',
      adminId: STATE.currentTeacher.teacherId
    });
    if (!res || !res.ok) { showToast((res && res.error) || 'อนุมัติไม่สำเร็จ', 'error'); return; }
    showToast(`อนุมัติบัญชีครูที่รอทั้งหมด ${res.approvedCount} คนเรียบร้อยแล้วครับ!`, 'success');
    refreshSuperAdminDashboard();
  }

  async function connectDriveFolders() {
    const rootFolderId = document.getElementById('adminDriveFolderInput').value;
    const res = await callGas('apiConnectAndSetupDriveFolders', {
      authToken: STATE.authToken || '',
      adminId: STATE.currentTeacher.teacherId,
      rootFolderId
    });
    if (!res || !res.ok) { showToast((res && res.error) || 'เชื่อม Drive ไม่สำเร็จ', 'error'); return; }
    showToast(`เชื่อมต่อโฟลเดอร์ "${res.rootFolderName}" และสร้างโฟลเดอร์ย่อย 4 วิชาเรียบร้อย!`, 'success');
    document.getElementById('driveSubfoldersStatus').innerHTML =
      `✓ เชื่อมต่อ <b>${escHtml(res.rootFolderName)}</b> สำเร็จ พร้อมโฟลเดอร์ย่อยครบทั้ง 4 วิชา!`;
  }

  function reviewSubmissionStatus(submissionId, reviewStatus) {
    const sub = (STATE.adminData && STATE.adminData.submissions || []).find(s => s.submissionId === submissionId);
    const isRevision = reviewStatus === 'ส่งแก้';
    const isIocWait = reviewStatus === 'รอกรรมการตรวจ IOC';
    const modalTitle = isRevision
      ? 'ส่งแก้ไขต้นฉบับ (.docx)'
      : (isIocWait ? 'ส่งต่อเข้าสู่ขั้นตอน "รอกรรมการตรวจ IOC"' : 'อนุมัติต้นฉบับ "ผ่านพร้อมรวมเล่ม"');
    const modalBody = isRevision
      ? `
          <div class="space-y-2 text-xs">
            <label class="font-bold block">ข้อเสนอแนะสำหรับคณะกรรมการนำไปปรับปรุง</label>
            <textarea rows="3" data-field="adminComment" placeholder="ระบุจุดที่ควรแก้ไข เช่น ฟอนต์ ข้อสอบ หรือเลขตัวชี้วัด..." class="gw-input text-xs"></textarea>
          </div>
        `
      : (isIocWait
          ? `
            <div class="space-y-2 text-xs">
              <div class="leading-relaxed">ยืนยันปรับสถานะข้อสอบชุดนี้เป็น <b>"รอกรรมการตรวจ IOC"</b> เพื่อให้คณะกรรมการรายวิชาร่วมให้คะแนนความสอดคล้อง (+1 / 0 / -1) ที่เมนู <b>ตรวจประเมิน IOC</b> ก่อนอนุมัติรวมเล่มใช่หรือไม่ครับ?</div>
              <input type="text" data-field="adminComment" value="ส่งต่อคณะกรรมการประจำวิชาตรวจประเมินค่า IOC (+1 / 0 / -1)" class="gw-input !py-1.5 text-xs">
            </div>
          `
          : `
            <div class="space-y-2 text-xs">
              <div class="leading-relaxed">ยืนยันปรับสถานะเอกสารชุดนี้เป็น <b>"ผ่านพร้อมรวมเล่ม"</b> เพื่อให้ครูผู้สอน ป.6 ทั้ง 8 โรงเรียนนำไปสอนได้ทันทีใช่หรือไม่ครับ?</div>
              <input type="text" data-field="adminComment" value="ตรวจผ่านเรียบร้อย พร้อมนำมารวมเล่ม" class="gw-input !py-1.5 text-xs">
            </div>
          `);
    const confirmLabel = isRevision ? 'ยืนยันส่งกลับแก้ไข' : (isIocWait ? 'ยืนยันส่งตรวจ IOC' : 'อนุมัติผ่านพร้อมรวมเล่ม');

    openCustomModal({
      title: modalTitle,
      subtitle: sub ? `${sub.fileName} (${sub.teacherName})` : submissionId,
      bodyHtml: modalBody,
      confirmText: confirmLabel,
      danger: isRevision,
      onConfirm: async (modal) => {
        const comment = modal.querySelector('[data-field="adminComment"]').value.trim();
        if (isRevision && !comment) {
          showToast('กรุณาระบุข้อเสนอแนะสิ่งที่ต้องการให้แก้ไขก่อนกดยืนยันครับ', 'error');
          return false;
        }
        const res = await callGas('apiReviewSubmission', {
          authToken: STATE.authToken || '',
          adminId: STATE.currentTeacher.teacherId,
          submissionId,
          reviewStatus,
          adminComment: comment || (isIocWait ? 'รอกรรมการตรวจประเมิน IOC' : 'ตรวจผ่านเรียบร้อย พร้อมนำมารวมเล่ม')
        });
        if (!res || !res.ok) {
          showToast((res && res.error) || 'บันทึกผลไม่สำเร็จ', 'error');
          return false;
        }
        showToast('บันทึกผลการตรวจต้นฉบับเรียบร้อยแล้วครับ', 'success');
        refreshSuperAdminDashboard();
      }
    });
  }

  function renderAdminKeyEditor() {
    if (!STATE.adminData) return;
    const round = document.getElementById('adminKeyRound').value;
    const subCode = document.getElementById('adminKeySubject').value;
    const items = (STATE.adminData.examKeys || [])
      .filter(k => k.round === round && k.subjectCode === subCode)
      .sort((a, b) => Number(a.itemNo) - Number(b.itemNo));

    document.getElementById('adminKeyEditorGrid').innerHTML = items.map(it => {
      if (subCode === '61' && Number(it.itemNo) === 21 && it.itemType === 'ORDER') {
        const parts = String(it.correctKey || '').split('|');
        const p1 = parts[0] || '';
        const p2 = parts[1] || '';
        return `
          <div class="gw-subcard !p-2.5 text-xs col-span-2 sm:col-span-2">
            <div class="font-bold">ข้อ 21 (ORDER แยก 21.1 และ 21.2)</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
              <div>
                <label class="text-[10px] font-bold opacity-80">21.1 (10 คำ • 2 คะแนน)</label>
                <input type="text" id="admKey_21_1" value="${escHtml(p1)}" placeholder="1-2-3-4-5-6-7-8-9-10" class="gw-input mt-0.5 !py-1 !px-2 text-xs font-bold gw-tabular">
              </div>
              <div>
                <label class="text-[10px] font-bold opacity-80">21.2 (13 คำ • 3 คะแนน)</label>
                <input type="text" id="admKey_21_2" value="${escHtml(p2)}" placeholder="1-2-3-4-5-6-7-8-9-10-11-12-13" class="gw-input mt-0.5 !py-1 !px-2 text-xs font-bold gw-tabular">
              </div>
            </div>
          </div>
        `;
      }
      const placeholder = it.itemType === 'NUMERIC' && subCode === '64'
        ? '0-999'
        : (it.itemType === 'COMPLEX_MC' ? 'ใช่|ไม่ใช่|ใช่' : '');
      return `
        <div class="gw-subcard !p-2.5 text-xs">
          <div class="font-bold">ข้อ ${escHtml(it.itemNo)} (${escHtml(it.itemType)})</div>
          <input type="text" id="admKey_${escHtml(it.itemNo)}" data-itemtype="${escHtml(it.itemType)}" value="${escHtml(it.correctKey)}" placeholder="${escHtml(placeholder)}"
            class="gw-input mt-1 !py-1 !px-2 font-bold gw-tabular">
        </div>
      `;
    }).join('');
  }

  async function importAnswerKeysFromTeacherDocx() {
    const roundEl = document.getElementById('adminKeyRound');
    const subEl = document.getElementById('adminKeySubject');
    const round = roundEl ? roundEl.value : 'PRE';
    const subjectCode = subEl ? subEl.value : '61';
    const btn = document.getElementById('btnImportKeysFromTeacherDocx');
    if (btn) btn.disabled = true;
    try {
      if (typeof JSZip === 'undefined') {
        showToast('ไลบรารี JSZip ยังไม่พร้อมทำงาน กรุณารีเฟรชหน้าเว็บ', 'error');
        return;
      }
      const res = await callGas('apiGetApprovedDocsForMerge', {
        authToken: STATE.authToken || '',
        teacherId: STATE.currentTeacher && STATE.currentTeacher.teacherId,
        subjectCode,
        docCategory: 'PREPOST_EXAM',
        targetAudience: 'TEACHER',
        examRound: round,
        includeDraftForKeyImport: true
      });
      if (!res || !res.ok) {
        showToast((res && res.error) || 'ดึงไฟล์ฉบับครูไม่สำเร็จ', 'error');
        return;
      }
      const teacherDocs = (res.docs || []).filter(d => d.base64Data || d.base64);
      if (!teacherDocs.length) {
        showToast('ยังไม่มีไฟล์ข้อสอบฉบับครู (TEACHER) ในรอบและรายวิชานี้ครับ', 'error');
        return;
      }

      const mergedKeys = {};
      const allWarnings = [];
      for (const doc of teacherDocs) {
        const binStr = atob(doc.base64Data || doc.base64);
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        const zip = await JSZip.loadAsync(bytes);
        const docXml = zip.file('word/document.xml') ? await zip.file('word/document.xml').async('string') : '';
        const extRes = extractAnswerKeysFromTeacherDocxXml(docXml, subjectCode);
        Object.keys(extRes.keys || {}).forEach(kNo => {
          mergedKeys[kNo] = extRes.keys[kNo];
        });
        if (extRes.warnings && extRes.warnings.length) {
          allWarnings.push(...extRes.warnings);
        }
      }

      let filledCount = 0;
      Object.keys(mergedKeys).forEach(kNo => {
        const val = mergedKeys[kNo];
        if (subjectCode === '61' && Number(kNo) === 21) {
          const el1 = document.getElementById('admKey_21_1');
          const el2 = document.getElementById('admKey_21_2');
          const parts = String(val || '').split('|');
          if (el1) {
            el1.value = parts[0] || '';
            el1.style.borderColor = 'var(--gw-accent)';
          }
          if (el2) {
            el2.value = parts[1] || '';
            el2.style.borderColor = 'var(--gw-accent)';
          }
          if (el1 || el2) filledCount++;
        } else {
          const el = document.getElementById('admKey_' + kNo);
          if (el) {
            el.value = val;
            el.style.borderColor = 'var(--gw-accent)';
            filledCount++;
          }
        }
      });

      if (filledCount === 0) {
        showToast('ไม่พบบรรทัด "เฉลย ข้อ ..." ที่อ่านค่าได้ในไฟล์ฉบับครู (แนะนำตรวจสอบรูปแบบตามแม่แบบ สทศ.)', 'error');
      } else {
        showToast(`ดึงเฉลยจากไฟล์ฉบับครูสำเร็จ ${filledCount} ข้อ (จาก ${teacherDocs.length} ไฟล์) กรุณาตรวจทานแล้วกด "บันทึกเฉลยชุดนี้"`, 'success');
      }
    } catch (err) {
      showToast('ดึงเฉลยจากไฟล์ Word ไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function saveAdminExamKeys() {
    if (!STATE.adminData) return;
    const round = document.getElementById('adminKeyRound').value;
    const subjectCode = document.getElementById('adminKeySubject').value;
    const items = (STATE.adminData.examKeys || []).filter(k => k.round === round && k.subjectCode === subjectCode);
    const keysMap = {};
    const errors = [];

    items.forEach(it => {
      if (subjectCode === '61' && Number(it.itemNo) === 21 && it.itemType === 'ORDER') {
        const el1 = document.getElementById('admKey_21_1');
        const el2 = document.getElementById('admKey_21_2');
        if (!el1 && !el2) return;
        const v1 = el1 ? el1.value.trim() : '';
        const v2 = el2 ? el2.value.trim() : '';
        if (el1) el1.style.borderColor = '';
        if (el2) el2.style.borderColor = '';
        let combined = '';
        if (v1 && v2) combined = `${v1}|${v2}`;
        else if (v1 || v2) combined = v1 || v2;
        if (combined) {
          const chk = validateExamKeyByType(it.itemType, combined, subjectCode);
          if (!chk.ok) {
            errors.push(`ข้อ 21 (${chk.reason})`);
            if (el1) el1.style.borderColor = 'var(--gw-danger-ink)';
            if (el2) el2.style.borderColor = 'var(--gw-danger-ink)';
          } else {
            keysMap[it.itemNo] = chk.normalized;
            return;
          }
        }
        keysMap[it.itemNo] = combined;
        return;
      }

      const el = document.getElementById('admKey_' + it.itemNo);
      if (!el) return;
      const val = el.value.trim();
      el.style.borderColor = '';
      if (val) {
        const chk = validateExamKeyByType(it.itemType, val, subjectCode);
        if (!chk.ok) {
          errors.push(`ข้อ ${it.itemNo} (${chk.reason})`);
          el.style.borderColor = 'var(--gw-danger-ink)';
        } else {
          keysMap[it.itemNo] = chk.normalized;
          return;
        }
      }
      keysMap[it.itemNo] = val;
    });

    if (errors.length) {
      showToast('รูปแบบเฉลยไม่ถูกต้อง: ' + errors.slice(0, 3).join(', '), 'error');
      return;
    }

    const res = await callGas('apiSaveExamAnswerKeys', {
      authToken: STATE.authToken || '',
      adminId: STATE.currentTeacher.teacherId,
      round,
      subjectCode,
      keysMap
    });
    if (!res || !res.ok) { showToast((res && res.error) || 'บันทึกเฉลยไม่สำเร็จ', 'error'); return; }
    const regradeNote = res.regradedCount > 0 ? ` และคำนวณคะแนนนักเรียนใหม่ ${res.regradedCount} รายการ` : '';
    showToast(`บันทึกเฉลยสำเร็จ ${res.updatedCount} ข้อ${regradeNote}`, 'success');
    refreshSuperAdminDashboard();
  }
