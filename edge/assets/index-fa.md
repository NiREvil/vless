---
layout: doc
outline: deep
title: 'فعال‌ساز ویندوز و آفیس با hwid'
description: 'یک جعبه ابزار فعال‌سازی قابل اعتماد و متن باز برای ویندوز و آفیس.'
date: 2023-08-19
editLink: true
head:
  - - meta
    - name: keywords
      content: فعال ساز, لایسنس, ویندوز, آفیس, اسکریپت, kms, hwid
---

<div class="rtl">
  
# راهنمای جامع فعال‌سازی ویندوز 10 و 11

این پروژه مجموعه‌ای از ابزارهای فعال‌سازی قابل اعتماد و متن‌باز برای `ویندوز` و `آفیس` را فراهم می‌کند.
اسکریپت‌های ما از روش‌های مختلفی برای کمک به شما در فعال‌سازی سریع و ایمن محصولاتتان استفاده می‌کنند. <br/>

::: tip چند نکته از نویسنده

- بعد از فعال‌سازی با روش `hwid` ممکن است مشکلاتی با لاگین کردن در اکانت مایکروسافت در تنظیمات مرورگر Microsoft Edge داشته باشید!!
- راهکار اول: رد شدن از این متود فعال‌سازی و فعال کردن ویندوز به روش [KMS](./kms-fa) هر 6 ماه یکبار، بیشتر از دو دقیقه طول نمی‌کشه.
- راهکار دوم: کنار گذاشتن مرورگر Edge و استفاده از مرورگرهای دیگه مانند Chrome, Firefox و ...

::: details برای مشاهده طومار کلیک کنید

- **برای ویندوز:** شخصاً از روش KMS ([راهنما](./kms-fa)) برای فعال‌سازی win 10 / 11 خودم استفاده می‌کنم. این روش رسمی مایکروسافت است، هیچ فایلی روی سیستم ذخیره نمیشود و در کل کمتر از ۳ دقیقه زمان می‌برد. اگر به هر دلیلی این روش شکست خورد، انتخاب بعدی من HWID است، زیرا آن هم رسمی و بدون ذخیره و اجرای فایلی در لوکال سیستم من است، تنها ضعف آن چیزی بود که در بخش بالا توضیح دادم، مشکل با مایکروسافت اکانت در مروگر پیشفرض ویندوز.
- **برای آفیس:** من از Ohook، TSforge یا Online KMS استفاده می‌کنم. تفاوت‌های جزئی بین آن‌ها در جدول خلاصه بالا ذکر شده است.
- **نیاز به کمک دارید؟** اگر با مشکلی مواجه شدید، می‌توانید در بخش [بحث‌های گیت‌هاب][2] سوال خود را مطرح کرده و یا مستقیماً به من [ایمیل بزنید][3].  
  :::

:::tip پیش‌نیازها

- اتصال پایدار به اینترنت
- دسترسی ادمین (Administrator) داشتن پاورشل یا cmd در کامپیوتر شما
- فعال‌ کردن VPN درصورت اجرا نشدن فرامین. `فعلا دامنه ‌ها فیلتر نشدن پس طبیعتا نیازی به فعال کردن vpn نیست.`

:::

<br/>

## خلاصه‌ی روش‌های فعال‌سازی

در یک نگاه کلی، در ادامه خلاصه‌ای از روش‌های فعال‌سازی ارائه‌شده آمده است:

</div>

| نوع فعال‌سازی  | محصولات پشتیبانی شده |       مدت زمان فعال‌سازی       |      نیاز به اینترنت؟      |       اطلاعات بیشتر       |
| :------------: | :------------------: | :----------------------------: | :------------------------: | :-----------------------: |
|    **HWID**    |    ویندوز ۱۰ و ۱۱    |             دائمی              |            بله             |    [جزئیات](./hwid-fa)    |
|    **KMS**     |    ویندوز ۱۰ و ۱۱    |         ۱۸۰ روز (دستی)         |            بله             |    [جزئیات](./kms-fa)     |
|   **Ohook**    |         آفیس         |             دائمی              |            خیر             |             -             |
|  **TSforge**   | ویندوز / ESU / آفیس  |             دائمی              | بله (در بیلد ۱۹۰۴۱ به بعد) |  [جزئیات](./tsforge-fa)   |
|   **KMS38**    | ویندوز ۱۰-۱۱-Server  |          تا سال ۲۰۳۸           |            خیر             |   [جزئیات](./kms38-fa)    |
| **Online KMS** |    ویندوز / آفیس     | ۱۸۰ روز (مادام‌العمر با تمدید) |            بله             | [جزئیات](./online_kms-fa) |

<p style="text-align: center;">
  برای مقایسه دقیق تمام روش‌ها، به <a href="./chart">جدول مقایسه روش‌های فعال‌سازی</a> مراجعه کنید.
  
</p><br/>

## روش ۱. فعال‌سازی دائمی با HWID

برای اکثر کاربران، روش **HWID (Hardware ID)** ساده‌ترین راه برای دریافت لایسنس دیجیتال دائمی برای ویندوز ۱۰ و ۱۱ است. <br/>

## مرحله ۱. اجرای PowerShell به صورت Administrator

۱. روی **منوی استارت** راست‌کلیک کنید.
۲. در ویندوز ۱۱ گزینه **Windows Terminal (Admin)** یا در ویندوز ۱۰ گزینه **Windows PowerShell (Admin)** را انتخاب کنید. [^1] [^2] <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/9b27cd4b-21d8-4970-98bb-3c97010e09bf" alt="اجرای پاورشل با حالت ادمین" width="540px" /></p><br/>

## مرحله ۲. اجرای اسکریپت فعال‌سازی

دستور زیر را کپی کرده، با راست‌کلیک در پنجره PowerShell جای‌گذاری کنید و کلید `Enter` را فشار دهید. <br/>

::: code-group

```powershell [پیشنهادی]
irm https://get.activated.win | iex
```

```powershell [جایگذین]
irm https://massgrave.dev/get | iex
```

:::

<br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/6b72787e-f5ad-47a2-ab2b-ae93de9f70bc" alt="اجرای اسکریپت اصلی" width="540px" /></p><br/>
  
## مرحله ۳. انتخاب گزینه HWID

یک منو در پنجره جدید ظاهر می‌شود. کلید 1 را روی کیبورد خود فشار دهید تا گزینه HWID Activation انتخاب شود و چند لحظه منتظر بمانید تا فرآیند کامل شود.  
تبریک می‌گوییم! ویندوز شما اکنون با یک لایسنس دیجیتال به صورت دائمی فعال شده است. <br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/8b119e05-d506-4c42-91cb-ac58c9a2f189" alt="فعال‌سازی با موفقیت انجام شد" width="540px" /></p><br/>

برای بررسی وضعیت فعال‌سازی در ویندوز ۱۰، به مسیر Settings → Update & Security → Activation بروید. [^3]

برای بررسی وضعیت فعال‌سازی در ویندوز ۱۱، با کلیک روی دکمه استارت و سپس انتخاب Settings، به مسیر System → Activation بروید. [^4] <br/>

## اطلاعات تکمیلی

<br/>

::: tip چگونه فعال‌سازی را حذف کنیم؟

::: details برای مشاهده جزئیات اینجا کلیک کنید

**HWID:** لایسنس دیجیتال روی سرورهای مایکروسافت ذخیره شده و به سخت‌افزار شما گره خورده است. این نوع فعال‌سازی به معنای سنتی "قابل حذف" نیست. یک تغییر سخت‌افزاری بزرگ (مانند مادربرد) آن را باطل می‌کند. برای بازگشت به حالت غیرفعال، می‌توانید یک کلید عمومی KMS نصب کنید. [جزئیات فنی hwid](./hwid-fa)
**Online KMS / Ohook / KMS38:** از گزینه مربوط به "Uninstall" یا "Remove" در منوی اسکریپت MAS استفاده کنید، سپس گزینه "Fix Licensing" را از منوی Troubleshoot اجرا نمایید. [جزئیات فنی kms](./kms-fa) and [جزئیات فنی kms38](./kms38-fa)
**TSforge:** این روش فقط داده‌هایی را اضافه می‌کند و فایلی نصب نمی‌کند. برای بازنشانی آن، کافی است گزینه "Fix Licensing" را از منوی Troubleshoot در اسکریپت MAS اجرا کنید. [جزئیات فنی tsforge](./tsforge-fa)

:::

<br/>

::: info نسخه‌های ویندوز ۱۰/۱۱ که توسط HWID پشتیبانی می‌شوند

::: details برای مشاهده جزئیات اینجا کلیک کنید

| نام محصول در ویندوز ۱۰/۱۱             | EditionID                | کلید عمومی Retail/OEM/MAK     |
| ------------------------------------- | ------------------------ | ----------------------------- |
| Education                             | Education                | YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY |
| Education N                           | EducationN               | 84NGF-MHBT6-FXBX8-QWJK7-DRR8H |
| Enterprise                            | Enterprise               | XGVPP-NMH47-7TTHJ-W3FW7-8HV2C |
| Enterprise N                          | EnterpriseN              | 3V6Q6-NQXCX-V8YXR-9QCYV-QPFCT |
| Enterprise LTSB 2015                  | EnterpriseS              | FWN7H-PF93Q-4GGP8-M8RF3-MDWWW |
| Enterprise LTSB 2016                  | EnterpriseS              | NK96Y-D9CD8-W44CQ-R8YTK-DYJWX |
| Enterprise LTSC 2019                  | EnterpriseS              | 43TBQ-NH92J-XKTM7-KT3KK-P39PB |
| Enterprise N LTSB 2015                | EnterpriseSN             | NTX6B-BRYC2-K6786-F6MVQ-M7V2X |
| Enterprise N LTSB 2016                | EnterpriseSN             | 2DBW3-N2PJG-MVHW3-G7TDK-9HKR4 |
| Home                                  | Core                     | YTMG3-N6DKC-DKB77-7M9GH-8HVX7 |
| Home N                                | CoreN                    | 4CPRK-NM3K3-X6XXQ-RXX86-WXCHW |
| Home China [^3]                       | CoreCountrySpecific      | N2434-X9D7W-8PF6X-8DV9T-8TYMD |
| Home Single Language [^4]             | CoreSingleLanguage       | BT79Q-G7N6G-PGBYW-4YWX6-6F4BT |
| IoT Enterprise                        | IoTEnterprise            | XQQYW-NFFMW-XJPBH-K8732-CKFFD |
| IoT Enterprise Subscription           | IoTEnterpriseK           | P8Q7T-WNK7X-PMFXY-VXHBG-RRK69 |
| IoT Enterprise LTSC 2021              | IoTEnterpriseS           | QPM6N-7J2WJ-P88HH-P3YRH-YY74H |
| IoT Enterprise LTSC 2024              | IoTEnterpriseS           | CGK42-GYN6Y-VD22B-BX98W-J8JXD |
| IoT Enterprise LTSC Subscription 2024 | IoTEnterpriseSK          | N979K-XWD77-YW3GB-HBGH6-D32MH |
| Pro                                   | Professional             | VK7JG-NPHTM-C97JM-9MPGT-3V66T |
| Pro N                                 | ProfessionalN            | 2B87N-8KFHP-DKV6R-Y2C8J-PKCKT |
| Pro Education                         | ProfessionalEducation    | 8PTT6-RNW4C-6V7J2-C2D3X-MHBPB |
| Pro Education N                       | ProfessionalEducationN   | GJTYN-HDMQY-FRR76-HVGC7-QPF8P |
| Pro for Workstations                  | ProfessionalWorkstation  | DXG7C-N36C4-C4HTG-X4T3X-2YV77 |
| Pro N for Workstations                | ProfessionalWorkstationN | WYPNQ-8C467-V2W6J-TX4WX-WT2RQ |
| S                                     | Cloud                    | V3WVW-N2PV2-CGWC3-34QGF-VMJ2C |
| S N                                   | CloudN                   | NH9J3-68WK7-6FB93-4K3DF-DJ4F6 |
| SE                                    | CloudEdition             | KY7PN-VR6RX-83W6Y-6DDYQ-T6R4W |
| SE N                                  | CloudEditionN            | K9VKN-3BGWV-Y624W-MCRMQ-BHDCD |
| Team                                  | PPIPro                   | XKCNC-J26Q9-KFHD2-FKTHY-KD72Y |

_در صورت نیاز، کلید عمومی به طور خودکار توسط اسکریپت اعمال می‌شود._

<img width="1070" height="791" alt="p2" src="https://github.com/user-attachments/assets/6b72787e-f5ad-47a2-ab2b-ae93de9f70bc" />

:::

<br/>

[^1]: ده روش برای اجرا کردن سریع پاورشل در ویندوز [در اینجا بخوانید][1]

[^2]: از روش های آسان دیگر برای اجرای پاورشل یا cmd این است که بر روی کلید Start در نوار پایین صفحه کلیک راست کرده و سپس بر روی **Windows Terminal (admin)** در ویندوز 11 و یا روی **Windows powershell (admin)** در ویندوز 10 کلیک کنید تا اجرا شود.

[^3]: برای بررسی وضعیت فعال‌سازی ویندوز ۱۰، به مسیر Settings → Update & Security → Activation بروید. شما وضعیت فعال‌سازی خود را در آنجا خواهید دید. اگر ویندوز فعال باشد، باید عبارت "Activated" را با یک تیک سبز مشاهده کنید.

[^4]: برای بررسی وضعیت فعال‌سازی ویندوز ۱۱، با کلیک بر روی دکمه استارت و سپس انتخاب Settings، به مسیر System → Activation بروید. وضعیت فعال‌سازی نمایش داده می‌شود و جزئیات مربوط به روش فعال‌سازی و هر حساب مایکروسافت متصل شده را نشان می‌دهد.

[^5]: نسخه مخصوص کشور چین.

[^6]: نسخه تک‌زبانه.

[1]: https://www.minitool.com/news/open-windows-11-powershell.html
[2]: https://github.com/NiREvil/windows-activation/discussions/new/choose
[3]: mailto:diana.clk01@gmail.com
