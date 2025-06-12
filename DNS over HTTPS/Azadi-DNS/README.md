## Azadi DNS Panel

**KV = SETTINGS**

این یکی از متود‌های ساده و در عین حال حرفه‌ای واسه ساخت DNS شخصی از طریق وورکر کلادفلر هستش، ساخت وورکر رو بعید می‌دونم کسی بلد نباشه دیگه، ب هرحال ویدئو اموزش پایین‌تر قرار داده شده.

**خودم به طور خلاصه بخوام بگم:**

**اول اکانت کلادفلر میسازید**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/Azadi-DNS/_worker.js)

فایل [\_worker.js](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/Azadi-DNS/_worker.js) رو کپی پست می‌کنید داخل ورکری که تازه ایجاد کردید.

**از بخش KV and storage**  
یدونه KV با نام دلخواه ایجاد می‌کنید که مقدارش هم برابر با SETTINGS قرار دادید.

**؛KV رو وصل می‌کنید**  
به وورکری که یکم قبل ایجاد کردید، خودش اتومات Deploy میشه حالا اگه لینک وورکر رو باز کنید پنل تنطیمات DNS قابل مشاهده است براتون.

**به نظر من بذارید همون پیشفرض**  
خودش که DoH کلادفلر هست باقی بمونه و یا نهایتا با DoH گوگل جایگزینش کنید. و درنهایت Save و Copy کنید لینک سرور DNS خودتون رو.

**هرجا که از DNS over HTTPS پشتیبانی کنه**  
می‌تونید استفادش کنید، مثل نکوباکس و هیدیفای و Exclave و پنل bpb و خیلی جاهای دیگه ...

چندتا از DoH های قابل استفاده میذارم انتهای این صفحه.

## Video tutorial

https://github.com/user-attachments/assets/40c59f32-cb5f-44a5-9419-db8bf2e8eec4

## DNS over HTTPS for Azadi DNS Panel

**Adguard**

    https://dns.adguard-dns.com/dns-query

**cloudflare**

    https://cloudflare-dns.com/dns-query

**Google**

    https://dns.google/dns-query

**Clean Browsing**

    https://doh.cleanbrowsing.org/doh/family-filter/

**Mullvad**

    https://doh.mullvad.net/dns-query

**Next DNS**

    https://dns.nextdns.io/

**controlD AdBlock**

    https://freedns.controld.com/p2

**Cisco Open DNS**

    https://doh.opendns.com/dns-query

**Bitdefender**

    https://dns.bitdefender.net/dns-query

**Kernel error**

    https://dns.kernel-error.de/dns-query

**Avast**

    https://secure.avastdns.com/dns-query

All of DoH servers : [Link](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/any%20DNS-over-HTTPS%20server%20you%20want.md)

### Credit

http://github.com/AzadiAzadiAzadi/AzadiDNSPanel
