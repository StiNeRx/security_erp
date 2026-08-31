const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const outputDir = path.resolve('C:/Users/rajea/.gemini/antigravity/brain/1dad4690-1757-426b-9479-0accd19a5064');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log(`Launching browser using: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1500,1000',
      '--force-device-scale-factor=1.5'
    ],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 }
  });

  const page = await browser.newPage();

  async function takeScreenshot(name, description) {
    const filePath = path.join(outputDir, name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`[CAPTURED] ${name} - ${description}`);
    return filePath;
  }

  // 1. Login Page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('01_login_portal.png', 'Cyberpunk Authentication Portal with 1-click personas');

  // Select Admin Demo Persona
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.textContent.includes('Admin'));
    if (adminBtn) adminBtn.click();
  });
  await sleep(400);
  // Click Authenticate
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(1500);

  // 2. Dashboard Overview
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await sleep(1200);
  await takeScreenshot('02_dashboard_overview.png', 'Command Center HUD Overview with live telemetry');

  // 3. Command Palette (Ctrl+K)
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await sleep(700);
  await takeScreenshot('03_command_palette.png', 'Global Command Palette spotlight search');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 4. Personnel Grid View
  await page.goto('http://localhost:5173/personnel', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('04_personnel_grid.png', 'Security Operatives Force Grid View');

  // 5. Personnel Table View
  await page.evaluate(() => {
    const viewButtons = document.querySelectorAll('.flex.items-center.rounded-lg.bg-slate-900\\/80 button');
    if (viewButtons.length > 1) viewButtons[1].click();
  });
  await sleep(600);
  await takeScreenshot('05_personnel_table.png', 'Security Operatives Force Table View');

  // 6. Operative Dossier Slide-Over Drawer
  await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    if (firstRow) firstRow.click();
  });
  await sleep(800);
  await takeScreenshot('06_guard_dossier_drawer.png', 'Operative Dossier Slide-Over Telemetry Drawer');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 7. Register Operative Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Register Operative'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await takeScreenshot('07_guard_modal.png', 'Register Security Operative Modal');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 8. Clients Matrix View
  await page.goto('http://localhost:5173/clients', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('08_clients_view.png', 'Enterprise Clients Management Matrix');

  // 9. Onboard Client Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Onboard Client'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await takeScreenshot('09_client_modal.png', 'Onboard Enterprise Client Modal');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 10. Sites Facilities View
  await page.goto('http://localhost:5173/sites', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('10_sites_view.png', 'Deployment Facilities & Site Monitoring');

  // 11. Deploy Site Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Deploy Site'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await takeScreenshot('11_site_modal.png', 'Deploy New Facility Modal');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 12. Rosters Matrix View
  await page.goto('http://localhost:5173/rosters', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('12_rosters_view.png', 'Tactical Shift Schedule & Roster Matrix');

  // 13. Schedule Shift Modal (Batch/Single)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Schedule Shift'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await takeScreenshot('13_roster_modal.png', 'Schedule Shift Roster Modal (Single & Batch)');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 14. Attendance Radar View
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('14_attendance_view.png', 'Real-Time Attendance Radar & Check-In Tracker');

  // 15. Bulk Attendance Logger Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Log Daily Roster'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await takeScreenshot('15_bulk_attendance_modal.png', 'Bulk Attendance Logger Modal');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 16. Invoices Dashboard View
  await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('16_invoices_view.png', 'Financial Studio & Automated Invoicing');

  // 17. Generate Invoice Modal
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const addBtn = buttons.find(b => b.textContent.includes('Generate Invoice'));
    if (addBtn) addBtn.click();
  });
  await sleep(600);
  await takeScreenshot('17_generate_invoice_modal.png', 'Automated GST Invoice Generator Modal');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 18. Printable Invoice Statement Modal
  await page.evaluate(() => {
    const printButtons = Array.from(document.querySelectorAll('button')).filter(b => b.title === 'View / Print PDF Receipt');
    if (printButtons.length > 0) printButtons[0].click();
    else {
      const allBtns = Array.from(document.querySelectorAll('tbody button'));
      if (allBtns.length > 0) allBtns[0].click();
    }
  });
  await sleep(600);
  await takeScreenshot('18_invoice_print_modal.png', 'Printable Enterprise Tax Invoice & Receipt Statement');
  await page.keyboard.press('Escape');
  await sleep(400);

  // 19. Switch to Client Persona
  await page.evaluate(() => {
    const rawUser = {
      id: 2,
      email: 'client@apex.com',
      full_name: 'Acme Corp Operations',
      role: 'CLIENT',
      phone_number: '+91 98765 00002',
      is_active: true
    };
    localStorage.setItem('user', JSON.stringify(rawUser));
    localStorage.setItem('access_token', 'demo-client-token');
  });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('19_client_persona_dashboard.png', 'Client Persona Scoped View with custom access control');

  // 20. Switch to Staff Persona
  await page.evaluate(() => {
    const rawUser = {
      id: 3,
      email: 'staff@apex.com',
      full_name: 'Ramesh Kumar (Guard)',
      role: 'STAFF',
      phone_number: '+91 98765 00003',
      is_active: true
    };
    localStorage.setItem('user', JSON.stringify(rawUser));
    localStorage.setItem('access_token', 'demo-staff-token');
  });
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle0' });
  await sleep(1000);
  await takeScreenshot('20_staff_persona_attendance.png', 'Field Staff Persona Daily Operations View');

  await browser.close();
  console.log('ALL 20 SCREENSHOTS CAPTURED WITH FULL TAILWIND STYLING!');
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
