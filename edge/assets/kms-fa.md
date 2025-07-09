---
layout: doc
outline: deep
title: "روش فعال‌سازی ویندوز با KMS"
description: "راهنمای فعال‌سازی ویندوز و آفیس با استفاده از روش KMS"
date: 2023-08-17
editLink: true
head:
  - - meta
    - name: keywords
      content: KMS, فعال‌ساز آفیس، ویندوز 10، ویندوز 11
---

<div class="rtl">
  
# فعال‌سازی دستی با KMS  

> این راهنما نحوه فعال‌سازی ویندوز به‌مدت ۱۸۰ روز را با استفاده از روش KMS (خدمات مدیریت کلید) توضیح می‌دهد.
>
> این روش، یکی از کانال‌های رسمی فعال‌سازی توسط مایکروسافت برای لایسنس‌های حجمی است و روشی موقتی، ایمن و قابل‌اعتماد محسوب می‌شود.

::: danger پیش‌نیازها  
- اتصال پایدار به اینترنت  
- دسترسی ادمین (Administrator) داشتن پاورشل یا cmd در کامپیوتر شما  
- فعال‌ کردن VPN درصورت اجرا نشدن فرامین. `فعلا دامنه ‌ها فیلتر نشدن پس طبیعتا نیازی به فعال کردن vpn نیست.`

:::

</div><br/>

## مرحله ۱. اجرای Command Prompt با دسترسی ادمین

1. روی دکمه `Start` یا آیکون جستجو کلیک کنید.  
2. عبارت `cmd` یا `Command Prompt` را تایپ کنید.  
3. روی گزینه **Run as administrator** کلیک نمایید.

<p align="center">
  <img src="https://github.com/user-attachments/assets/4465a2d3-6c93-4ee1-bb63-94ab7b8e06ac" alt="اجرای cmd با حالت ادمین" width="540px" /></p><br/>  

## مرحله ۲. نصب کلید عمومی KMS

در پنجره‌ی Command Prompt، دستور زیر را وارد کنید. حتماً عبارت `yourlicensekey` را با یکی از کلیدهای مناسب (از جدول زیر) که با نسخه ویندوز شما هم‌خوانی دارد جایگزین نمایید.

```powershell
slmgr /ipk yourlicensekey
```

<br/>  

::: tip یافتن نسخه ویندوز شما  

برای مشاهده نسخه ویندوز:

روی منوی Start کلیک راست کرده، گزینه **System** را انتخاب کنید و در بخش "Windows specifications" نسخه دقیق سیستم‌عامل را بررسی نمایید.

کلید مناسب نسخه ویندوز خود را از جدول زیر انتخاب کرده و جایگزین عبارت `yourlicensekey` در دستور بالا کنید.   
برای جزئیات بیشتر، راهنمای بررسی نسخه ویندوز را ببینید. [^3] <br/> 

:::

### لیست کلیدها (GVLK)

| نسخه ویندوز        | کلیدهای عمومی نسخه‌های حجمی                      |
|:-----------------------|:------------------------------|
| TX9XD-98N7V-6WMQ6-BX7FG-H8Q99 	|       Home       	|
| 3KHY7-WNT83-DGQKR-F7HPR-844BM 	|      Home N      	|
| 7HNRX-D7KGG-3K4RQ-4WPJ4-YTDFH 	|   Home sl [^6]   	|
| PVMJN-6DFY6–9CCP6–7BKTT-D3WVR 	|   Home cs [^7]   	|
| W269N-WFGWX-YVC9B-4J6C9-T83GX 	|        Pro       	|
| MH37W-N47XK-V7XM9-C7227-GCQG9 	|       Pro N      	|
| YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY 	|     Education    	|
| 84NGF-MHBT6-FXBX8-QWJK7-DRR8H 	|    Education N   	|
| NW6C2-QMPVW-D7KKK-3GKT6-VCFB2 	|   Pro Education  	|
| 2WH4N-8QGBV-H22JP-CT43Q-MDWWJ 	|  Pro Education N 	|
| DXG7C-N36C4-C4HTG-X4T3X-2YV77 	|  Pro for W [^8]  	|
| WYPNQ-8C467-V2W6J-TX4WX-WT2RQ 	| Pro N for W [^8] 	|
| NPPR9-FWDCX-D2C8J-H872K-2YT43 	|    Enterprise    	|
| DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4 	|   Enterprise N   	|
| XKCNC-J26Q9-KFHD2-FKTHY-KD72Y 	|       Team       	|
| V3WVW-N2PV2-CGWC3-34QGF-VMJ2C 	|         S        	|
| KY7PN-VR6RX-83W6Y-6DDYQ-T6R4W 	|        SE        	|

<br/>  

<p align="center">
  <img src="https://github.com/user-attachments/assets/d5d93702-7865-4552-85d0-6916b1331bc0" alt="Install KMS Key" width="540px" /></p><br/>

<p align="center">
  <img src="https://github.com/user-attachments/assets/50c23cad-7690-49fb-bf1c-d1c7cc66f0fe" alt="Install KMS Keyyy" width="540px" /></p>

> پس از اجرای دستور، باید پیامی مبنی بر موفقیت‌آمیزبودن عملیات مشاهده کنید.

<br/>


## مرحله ۳. تنظیم آدرس سرور KMS

در این مرحله، با ارسال این دستور، آدرسی از سرورهای عمومی KMS را به ویندوز معرفی کنید:

```powershell
slmgr /skms kms8.msguides.com
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/edd0835f-c314-4ef8-a87d-a33e29f3f7c0" alt="Set KMS Server" width="540px" /></p><br/>


## مرحله ۴. فعال‌سازی نهایی

در پایان، با ارسال این دستور عملیات فعال‌سازی را انجام دهید:

```powershell
slmgr /ato
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/95e014e5-8946-4036-84ca-77ebb6122b1b" alt="Active Windows" width="540px" /></p><br/>

## مرحله ۵. بررسی وضعیت فعال‌سازی

**همه چیز آماده است!** 

برای بررسی وضعیت فعال‌سازی در ویندوز ۱۰، به مسیر زیر بروید:  
Settings → Update & Security → Activation [^4]

برای ویندوز ۱۱، از مسیر زیر وضعیت را بررسی کنید:  
Settings → System → Activation [^5]  

<p align="center">
  <img src="https://github.com/user-attachments/assets/da52f1bb-79c9-45db-bade-a0f56cd0a739" alt="Activation Successful ly" width="540px" /></p><br/>

## رفع خطاهای احتمالی

- **خطای 0xC004F074:** معمولاً به دلیل ناپایداری اینترنت یا شلوغ بودن سرور رخ می‌دهد. مطمئن شوید به اینترنت متصل هستید و مجدداً دستور slmgr /ato را وارد کنید.

- **این روش کار نکرد؟** اگر همچنان با مشکل روبه‌رو هستید، از روش HWID در راهنمای اصلی استفاده کنید.

- **برای دریافت راهنمایی بیشتر**، به بخش [بحث‌های گیت‌هاب][2] مراجعه کرده و یا در صورت بروز مشکل با ارسال [ایمیل][3] با من در تماس باشید.  

<br/>

[^1]: ۱۰ روش آسان برای اجرای PowerShell در ویندوز را از [اینجا بخوانید][1].

[^2]: از جمله روش‌های ساده‌تر: روی منوی Start کلیک راست کنید و از منوی بازشده گزینه Windows Terminal (admin) در ویندوز 11 یا Windows PowerShell (admin) در ویندوز 10 را انتخاب کنید.

[^3]: برای بررسی نسخه ویندوز: روی منوی Start کلیک راست کرده و گزینه System را بزنید. در بخش "Windows specifications" نسخه دقیق سیستم‌عامل را خواهید دید. همچنین می‌توانید دستورهای بالا را کپی کرده و در CMD یا PowerShell با کلیک راست جای‌گذاری کنید.

[^4]: برای ویندوز 10، به Settings → Update & Security → Activation مراجعه کرده و وضعیت فعال‌سازی را بررسی کنید.

[^5]: در ویندوز 11، به Settings → System → Activation بروید. در این بخش، وضعیت فعال‌سازی و اطلاعات مربوط به حساب مایکروسافت نمایش داده می‌شود.

[^6]: نسخه تک‌زبانه (Single Language) ویندوز.

[^7]: نسخه مخصوص کشور خاص (Country Specific).

[^8]: نسخه Pro for Workstations و Pro N for Workstations.

[1]: https://www.minitool.com/news/open-windows-11-powershell.html
[2]: https://github.com/NiREvil/windows-activation/discussions/new/choose
[3]: mailto:diana.clk01@gmail.com
[rainbow]: https://github.com/NiREvil/vless/assets/126243832/1aca7f5d-6495-44b7-aced-072bae52f256
