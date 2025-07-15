import { defineConfig } from 'vitepress';
import footnote from 'markdown-it-footnote';
import mathjax3 from 'markdown-it-mathjax3';
import attrs from 'markdown-it-attrs';
import { mermaid } from 'vitepress-plugin-mermaid';
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';

const base = '/windows-activation/';
const siteUrl = `https://sahar-km.github.io${base}`;

export default defineConfig({
  base: base,
  cleanUrls: true,
  ignoreDeadLinks: true,

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
      title: 'Freedom to Dream',
      description: 'Instant Windows and Office Activation Tools',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Docs', link: '/en/' },
          { text: 'FAQ', link: '/en/faq' },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Activation Guides',
              collapsed: false,
              items: [
                { text: 'HWID Activation', link: '/en/' },
                { text: 'KMS Activation', link: '/en/kms' },
                { text: 'Methods Chart', link: '/en/chart' },
              ],
            },
            {
              text: 'Docs',
              collapsed: false,
              items: [
                { text: 'HWID Method Details', link: '/en/hwid' },
                { text: 'Ohook Method Details', link: '/en/ohook' },
                { text: 'TSforge Method Details', link: '/en/tsforge' },
                { text: 'KMS38 Method Details', link: '/en/kms38' },
                { text: 'Online KMS Method Details', link: '/en/online_kms' },
                { text: 'Change Windows Edition', link: '/en/change_windows_edition.' },
                { text: 'Change Office Edition', link: '/en/change_office_edition' },
                { text: 'Fix WPA Registry', link: '/en/fix-wpa-registry' },
                { text: 'Fix Powershell', link: '/en/fix_powershell' },
                { text: '$OEM$ Folders', link: '/en/oem-folder' },
                { text: 'Switches in Command line', link: '/en/command_line_switches' },
                { text: 'Download Windows / Office', link: '/en/genuine-installation-media' },
              ],
            },
            {
              text: 'Technical Details',
              collapsed: true,
              items: [
                { text: 'Win 10 After End-Of-Life', link: '/en/windows10_eol' },
                { text: 'Remove Malware', link: '/en/remove_malware' },
                { text: 'Clean Install Windows', link: '/en/clean_install_windows' },
                {
                  text: 'Office License Is Not Genuine',
                  link: '/en/office-license-is-not-genuine',
                },
                { text: 'Licensing Servers Issue', link: '/en/licensing-servers-issue' },
                {
                  text: 'Issues Due To Gaming Spoofers',
                  link: '/en/issues_due_to_gaming_spoofers',
                },
                { text: 'Change Edition Issues', link: '/en/change_edition_issues' },
                { text: 'Evaluation Editions', link: '/en/evaluation_editions' },
                { text: 'Fix Powershell', link: '/en/fix_powershell' },
                { text: 'Fix Windows Services', link: '/en/fix_service' },
                { text: 'Fix WPA Registry', link: '/en/fix-wpa-registry' },
                { text: 'In-place Repair Upgrade ', link: '/en/in-place_repair_upgrade' },
                { text: 'Office c2r Custom Install', link: '/en/office_c2r' },
                {
                  text: 'Bypass Russian Geoblock',
                  link: 'https://gravesoft.dev/bypass-russian-geoblock',
                },
              ],
            },
            {
              text: 'Manual Activation Guides',
              collapsed: true,
              items: [
                { text: 'Manual HWID activation', link: '/en/manual_hwid_activation' },
                { text: 'Manual Ohook activation', link: '/en/manual_ohook_activation' },
                { text: 'Manual KMS38 activation', link: '/en/manual_kms38_activation' },
              ],
            },
            {
              text: 'Contact Us',
              collapsed: true,
              items: [
                { text: 'Troubleshoot', link: '/en/troubleshoot' },
                { text: 'FAQ', link: '/en/faq' },
                { text: 'Credits', link: '/en/credits' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/sahar-km/windows-activation/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },
        docFooter: {
          prev: 'Previous page',
          next: 'Next page',
        },
        lastUpdated: {
          text: 'Last updated',
          formatOptions: {
            dateStyle: 'medium',
            timeStyle: 'short',
          },
        },
      },
    },
    fa: {
      label: 'فارسی',
      lang: 'fa-IR',
      title: 'Freedom to Dream',
      description: 'ابزارهای فعال‌سازی فوری ویندوز و آفیس',
      themeConfig: {
        nav: [
          { text: 'خانه', link: '/fa/index' },
          { text: 'مستندات', link: '/fa/intro' },
          { text: 'سوالات متداول', link: '/fa/faq' },
        ],
        sidebar: [
          {
            text: 'راهنمای فعال‌سازی',
            collapsed: false,
            items: [
              { text: 'فعال‌سازی با روش HWID', link: '/fa/intro' },
              { text: 'فعال‌سازی با روش KMS', link: '/fa/kms' },
              { text: 'مقایسه انواع روش‌ها', link: '/fa/chart' },
            ],
          },
          {
            text: 'مستندات',
            collapsed: false,
            items: [
              { text: 'جزئیات روش HWID', link: '/fa/hwid' },
              { text: 'جزئیات روش Ohook', link: '/fa/ohook' },
              { text: 'جزئیات روش TSforge', link: '/fa/tsforge' },
              { text: 'جزئیات روش KMS38', link: '/fa/kms38' },
              { text: 'جزئیات روش Online KMS', link: '/fa/online_kms' },
              { text: 'تغییر نسخه ویندوز', link: '/fa/change_windows_edition' },
              { text: 'تغییر نسخه آفیس', link: '/fa/change_office_edition' },
              { text: 'رفع مشکل رجیستری WPA', link: '/fa/fix-wpa-registry' },
              { text: 'رفع مشکل پاورشل', link: '/fa/fix_powershell' },
              { text: 'پوشه‌های $OEM$', link: '/fa/oem-folder' },
              { text: 'سوئیچ‌ها در خط فرمان', link: '/fa/command_line_switches' },
              { text: 'دانلود ویندوز / آفیس', link: '/fa/genuine-installation-media' },
            ],
          },
          {
            text: 'جزئیات فنی',
            collapsed: true,
            items: [
              { text: 'ویندوز ۱۰ بعد از پایان پشتیبانی', link: '/fa/windows10_eol' },
              { text: 'حذف بدافزارها', link: '/fa/remove_malware' },
              { text: 'نصب تمیز ویندوز', link: '/fa/clean_install_windows' },
              { text: 'لایسنس آفیس اصل نیست', link: '/fa/office-license-is-not-genuine' },
              { text: 'مشکل سرورهای لایسنس', link: '/fa/licensing-servers-issue' },
              { text: 'مشکلات ناشی از اسپوفرهای گیم', link: '/fa/issues_due_to_gaming_spoofers' },
              { text: 'مشکلات تغییر نسخه', link: '/fa/change_edition_issues' },
              { text: 'نسخه‌های ارزیابی', link: '/fa/evaluation_editions' },
              { text: 'رفع مشکل پاورشل', link: '/fa/fix_powershell' },
              { text: 'رفع مشکل سرویس‌های ویندوز', link: '/fa/fix_service' },
              { text: 'رفع مشکل رجیستری WPA', link: '/fa/fix-wpa-registry' },
              { text: 'آپگرید تعمیری در محل', link: '/fa/in-place_repair_upgrade' },
              { text: 'نصب سفارشی Office c2r', link: '/fa/office_c2r' },
              {
                text: 'دور زدن مسدودسازی جغرافیایی روسیه',
                link: 'https://gravesoft.dev/bypass-russian-geoblock',
              },
            ],
          },
          {
            text: 'راهنمای فعال‌سازی دستی',
            collapsed: true,
            items: [
              { text: 'نصب دستی HWID', link: '/fa/manual_hwid_activation' },
              { text: 'نصب دستی Ohook', link: '/fa/manual_ohook_activation' },
              { text: 'نصب دستی KMS38', link: '/fa/manual_kms38_activation' },
            ],
          },
          {
            text: 'ارتباط با ما',
            collapsed: true,
            items: [
              { text: 'گزارش مشکلات', link: '/fa/troubleshoot' },
              { text: 'سوالات متداول', link: '/fa/faq' },
              { text: 'منابع', link: '/fa/credits' },
            ],
          },
        ],
        editLink: {
          pattern: 'https://github.com/sahar-km/windows-activation/edit/main/docs/:path',
          text: 'این صفحه را در گیت‌هاب ویرایش کنید',
        },
        docFooter: {
          prev: 'صفحه قبلی',
          next: 'صفحه بعدی',
        },
        lastUpdated: {
          text: 'آخرین بروزرسانی',
        },
      },
    },
  },

  themeConfig: {
    logo: '/logo-h.svg',
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/NiREvil/' },
      { icon: 'telegram', link: 'https://t.me/F_NiREvil/6448' },
    ],
    footer: {
      message: 'Made with using VitePress',
      copyright: '© 2025 REvil — Sharing knowledge, one note at a time',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['video.js'],
    },
  },
});
