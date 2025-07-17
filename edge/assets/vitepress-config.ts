import { defineConfig } from 'vitepress';
import footnote from 'markdown-it-footnote';
import mathjax3 from 'markdown-it-mathjax3';
import attrs from 'markdown-it-attrs';
import { mermaid } from 'vitepress-plugin-mermaid';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';

const base = '/windows-activation/';
const siteUrl = `https://NiREvil.github.io${base}`;

export default defineConfig({
  base: base,
  cleanUrls: true,
  ignoreDeadLinks: true,
  title: 'Freedom to Dream 🦋',
  description: 'Instant Windows & Office Activation: 40–Second Solution',

  head: [
    ['link', { rel: 'icon', href: `${base}favicon.ico` }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap',
        rel: 'stylesheet',
      },
    ],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    [
      'link',
      { rel: 'stylesheet', href: 'https://unpkg.com/video.js@8.17.4/dist/video-js.min.css' },
    ],
    ['script', { src: 'https://unpkg.com/video.js@8.17.4/dist/video.min.js' }],
    [
      'style',
      {},
      `
      .video-js {
        width: 100%;
        max-width: 960px;
        height: auto;
        aspect-ratio: 16/9;
      }
    `,
    ],
  ],

  markdown: {
    config: md => {
      md.use(footnote);
      md.use(mathjax3);
      md.use(attrs);
      md.use(tabsMarkdownPlugin);
    },
    lineNumbers: true,
  },

  mermaid: {},

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      dir: 'ltr',
      themeConfig: {
        nav: [
          { text: '🏠 Home', link: '/' },
          { text: '🗂️ Notes', link: '/wa/' },
          { text: '⚙️ FAQ', link: '/wa/faq' },
        ],
        sidebar: {
          '/wa/': [
            {
              text: 'Activation Guides',
              collapsed: false,
              items: [
                { text: 'HWID Activation', link: '/wa/index' },
                { text: 'KMS Activation', link: '/wa/kms' },
                { text: 'Methods Chart', link: '/wa/chart' },
                { text: 'Download Windows / Office', link: '/wa/genuine-installation-media' },
              ],
            },
            {
              text: 'Activation Methods',
              collapsed: true,
              items: [
                { text: 'HWID Method Details', link: '/wa/hwid' },
                { text: 'Ohook Method Details', link: '/wa/ohook' },
                { text: 'TSforge Method Details', link: '/wa/tsforge' },
                { text: 'KMS38 Method Details', link: '/wa/kms38' },
                { text: 'Online KMS Method Details', link: '/wa/online_kms' },
                { text: 'Change Windows Edition', link: '/wa/change_windows_edition' },
                { text: 'Change Office Edition', link: '/wa/change_office_edition' },
                { text: '$OEM$ Folders', link: '/wa/oem-folder' },
                { text: 'Switches in Command line', link: '/wa/command_line_switches' },
              ],
            },
            {
              text: 'Technical Details',
              collapsed: true,
              items: [
                { text: 'Win 10 After End-Of-Life', link: '/wa/windows10_eol' },
                { text: 'Remove Malware', link: '/wa/remove_malware' },
                { text: 'Clean Install Windows', link: '/wa/clean_install_windows' },
                {
                  text: 'Office License Is Not Genuine',
                  link: '/wa/office-license-is-not-genuine',
                },
                { text: 'Licensing Servers Issue', link: '/wa/licensing-servers-issue' },
                {
                  text: 'Issues Due To Gaming Spoofers',
                  link: '/wa/issues_due_to_gaming_spoofers',
                },
                { text: 'Change Edition Issues', link: '/wa/change_edition_issues' },
                { text: 'Evaluation Editions', link: '/wa/evaluation_editions' },
                { text: 'Fix Powershell', link: '/wa/fix_powershell' },
                { text: 'Fix Windows Services', link: '/wa/fix_service' },
                { text: 'Fix WPA Registry', link: '/wa/fix-wpa-registry' },
                { text: 'In-place Repair Upgrade', link: '/wa/in-place_repair_upgrade' },
                { text: 'Office c2r Custom Install', link: '/wa/office_c2r' },
              ],
            },
            {
              text: 'Manual Activation Guides',
              collapsed: true,
              items: [
                { text: 'Manual HWID activation', link: '/wa/manual_hwid_activation' },
                { text: 'Manual Ohook activation', link: '/wa/manual_ohook_activation' },
                { text: 'Manual KMS38 activation', link: '/wa/manual_kms38_activation' },
              ],
            },
            {
              text: 'Support',
              collapsed: true,
              items: [
                { text: 'Troubleshoot', link: '/wa/troubleshoot' },
                { text: 'FAQ', link: '/wa/faq' },
                { text: 'Credits', link: '/wa/credits' },
              ],
            },
          ],
        },
        logo: '/logo-h.svg',
        search: { provider: 'local' },
        docFooter: { prev: 'Previous page', next: 'Next page' },
        lastUpdated: {
          text: 'Last updated',
          formatOptions: { dateStyle: 'medium', timeStyle: 'short' },
        },
        editLink: {
          pattern: 'https://github.com/NiREvil/windows-activation/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/NiREvil/' },
          { icon: 'telegram', link: 'https://t.me/F_NiREvil/6448' },
        ],
        footer: {
          copyright: '© 2025 REvil — Sharing knowledge, one note at a time',
          message: 'Made with using VitePress',
        },
      },
    },
    fa: {
      label: 'فارسی',
      lang: 'fa-IR',
      dir: 'rtl',
      themeConfig: {
        nav: [
          { text: '🏠 خانه', link: '/fa/' },
          { text: '🗂️ مستندات', link: '/fa/wa/' },
          { text: '⚙️ سوالات متداول', link: '/fa/wa/faq' },
        ],
        sidebar: {
          '/fa/wa/': [
            {
              text: 'راهنمای فعال‌سازی',
              collapsed: false,
              items: [
                { text: 'فعال‌سازی با روش HWID', link: '/fa/wa/index' },
                { text: 'فعال‌سازی با روش KMS', link: '/fa/wa/kms' },
                { text: 'مقایسه انواع روش‌ها', link: '/fa/wa/chart' },
                { text: 'دانلود ویندوز / آفیس', link: '/fa/wa/genuine-installation-media' },
              ],
            },
            {
              text: 'روش‌های فعال‌سازی',
              collapsed: true,
              items: [
                { text: 'جزئیات روش HWID', link: '/fa/wa/hwid' },
                { text: 'جزئیات روش Ohook', link: '/fa/wa/ohook' },
                { text: 'جزئیات روش TSforge', link: '/fa/wa/tsforge' },
                { text: 'جزئیات روش KMS38', link: '/fa/wa/kms38' },
                { text: 'جزئیات روش Online KMS', link: '/fa/wa/online_kms' },
                { text: 'تغییر نسخه ویندوز', link: '/fa/wa/change_windows_edition' },
                { text: 'تغییر نسخه آفیس', link: '/fa/wa/change_office_edition' },
                { text: 'پوشه‌های $OEM$', link: '/fa/wa/oem-folder' },
                { text: 'سوئیچ‌ها در خط فرمان', link: '/fa/wa/command_line_switches' },
              ],
            },
            {
              text: 'جزئیات فنی',
              collapsed: true,
              items: [
                { text: 'ویندوز ۱۰ بعد از پایان پشتیبانی', link: '/fa/wa/windows10_eol' },
                { text: 'حذف بدافزارها', link: '/fa/wa/remove_malware' },
                { text: 'نصب تمیز ویندوز', link: '/fa/wa/clean_install_windows' },
                { text: 'لایسنس آفیس اصل نیست', link: '/fa/wa/office-license-is-not-genuine' },
                { text: 'مشکل سرورهای لایسنس', link: '/fa/wa/licensing-servers-issue' },
                {
                  text: 'مشکلات ناشی از اسپوفرهای گیم',
                  link: '/fa/wa/issues_due_to_gaming_spoofers',
                },
                { text: 'مشکلات تغییر نسخه', link: '/fa/wa/change_edition_issues' },
                { text: 'نسخه‌های ارزیابی', link: '/fa/wa/evaluation_editions' },
                { text: 'رفع مشکل پاورشل', link: '/fa/wa/fix_powershell' },
                { text: 'رفع مشکل سرویس‌های ویندوز', link: '/fa/wa/fix_service' },
                { text: 'رفع مشکل رجیستری WPA', link: '/fa/wa/fix-wpa-registry' },
                { text: 'آپگرید تعمیری در محل', link: '/fa/wa/in-place_repair_upgrade' },
                { text: 'نصب سفارشی Office c2r', link: '/fa/wa/office_c2r' },
              ],
            },
            {
              text: 'راهنمای فعال‌سازی دستی',
              collapsed: true,
              items: [
                { text: 'نصب دستی HWID', link: '/fa/wa/manual_hwid_activation' },
                { text: 'نصب دستی Ohook', link: '/fa/wa/manual_ohook_activation' },
                { text: 'نصب دستی KMS38', link: '/fa/wa/manual_kms38_activation' },
              ],
            },
            {
              text: 'پشتیبانی',
              collapsed: true,
              items: [
                { text: 'گزارش مشکلات', link: '/fa/wa/troubleshoot' },
                { text: 'سوالات متداول', link: '/fa/wa/faq' },
                { text: 'منابع', link: '/fa/wa/credits' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/NiREvil/windows-activation/edit/main/docs/:path',
          text: 'این صفحه را در گیت‌هاب ویرایش کنید',
        },
        docFooter: { prev: 'صفحه قبلی', next: 'صفحه بعدی' },
        lastUpdated: { text: 'آخرین بروزرسانی' },
      },
    },
  },

  vite: {
    optimizeDeps: {
      exclude: ['video.js'],
    },
  },
});
