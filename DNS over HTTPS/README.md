# DoH-cf-workers

> DNS-over-HTTPS

### این مخزن شامل اسکریپت یک دی ان اس پروکسی بسیار ساده قابل اجرا بر روی وورکر کلادفلر می‌باشد

#### نحوه استفاده:

1. یک حساب رایگان Cloudflare Workers بسازید.
2. یک Worker جدید ایجاد کنید.
3. محتویات فایل [index.js](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/index.js) را جایگزین اسکریپت پیشفرض Worker کنید.
4. لاین 3 و 4 کد را با DoH دلخواه خود جایگزین کرده و save and deploy کنید.
5. می‌توانید از آدرس Worker در هر برنامه‌ای که از DoH پشتیبانی می‌کند استفاده کنید (مانند AdGuard، NekoBox, Rethink , تنظیمات DNS امن مرورگرها، YogaDNS، Intra، Nebulo و غیره).
6. در صورت تمایل می‌توانید متغیر doh را با هر سرور [any DNS-over-HTTPS server you want](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/any%20DNS-over-HTTPS%20server%20you%20want.md) جایگزین کنید.

#

طبق نظرات کاربران تأیید شده است که با Cloudflare، Google و [NextDNS](https://my.nextdns.io/signup) و [Adguard](https://adguard-dns.io/en/welcome.html) و controlD به خوبی کار می‌کنند.

> اگر نمیخواستید ثبت نام و شخصی سازی کنید DoH ادگارد، نکست و کنترل دی رو، از DoH های عمومی آن‌ها استفاده کنید برای لاین سوم و چهارم وورکر

**ادگارد:**

    https://dns.adguard-dns.com/dns-query

**نکست:**

    https://dns.nextdns.io/

**کنترل دی:**

    https://freedns.controld.com/p2

**اوپن دی‌ان‌اس سیسکو:**

    https://doh.opendns.com/dns-query

**بیت‌دیفندر:**

    https://dns.bitdefender.net/dns-query

**کلادفلر:**

    https://cloudflare-dns.com/dns-query

**گوگل:**

    https://dns.google/dns-query

**مولواد:**

    https://adblock.dns.mullvad.net/dns-query
    https://doh.mullvad.net/dns-query

**کرنل ارور:**

    https://dns.kernel-error.de/dns-query

**اوست:**

    https://secure.avastdns.com/dns-query

**دی‌ان‌اس 403:**

    https://dns.403.online/dns-query

برخی از ارائه دهندگان از URL یکسان استفاده می‌کنند (Cloudlfare، NextDNS)، برخی دیگر به جای مسیر /dns-query از /resolve استفاده می‌کنند (Google، AdGuard).

**چرا باید DNS شخصی با وورکر ساخت؟**

در صورتی که ارائه دهندگان اینترنت شروع به مسدود کردن ارائه دهندگان DNS شناخته شده کنند؛ دیگر قادر به استفاده از آن ها نخواهید بود، می‌توانید از DNS خود استفاده کنید.

> حتی اگر آن‌ها بطور کامل workers.dev را مسدود کنند، می‌توانید از دامنه خود استفاده کنید (باید روی Cloudflare میزبانی شود).

#

اگر می‌خواهید از دامنه‌ای استفاده کنید که روی Cloudflare میزبانی نشده است، به جای آن از
[doh-cf-pages](https://github.com/tina-hello/doh-cf-pages) استفاده کنید، جایی که حتی رکوردهای CNAME از [FreeDNS](https://freedns.afraid.org/) برای دامنه سفارشی کافی است.

#

تعداد درخواست‌های روزانه در سطح رایگان به ۱۰۰ هزار محدود است، که برای استفاده شخصی یا حتی خانوادگی باید کافی باشد. اگر به بیشتر نیاز دارید، یا باید دامنه خریداری کرده و به اکانت کلادفلر وصل کنید و یا اکانت کلادفلر خود را به paid plan ارتقا دهید، (نیاز به کردیت کارت).
در صورت استفاده از دامنه شخصی در کلادفلر و ساخت ساب‌دامین برای وورکر DNS خود و حتی در سطح رایگان بودن اکانت کلادفلر ، درخواست‌های روزانه نامحدود محاسبه خواهد شد.

#

### Anything

[![icons8-Telegram-64](https://img.icons8.com/arcade/64/telegram-app.png)](https://t.me/NiREvil)

#

[توضیجات انگلیسی منبع اسکریپت](https://github.com/tina-hello/doh-cf-workers)

# doh-cf-workers

A very minimalist DNS-over-HTTPS proxy on Cloudflare Workers.

Sign up for a free [Cloudflare Workers](https://workers.cloudflare.com/) account, create a new worker, replace the Script with the content of [index.js](/index.js), deploy the worker, and you're done, use the address anywhere DoH is accepted (AdGuard, browsers secure DNS settings, YogaDNS, Intra, Nebulo etc). Feel free to replace the `doh` variable with [any DNS-over-HTTPS server you want](https://github.com/curl/curl/wiki/DNS-over-HTTPS). Confirmed to work with Cloudflare itself, Google, and NextDNS. The rarely supported [JSON API](https://developers.google.com/speed/public-dns/docs/doh/json) is available through the `dohjson` variable. Some providers use identical URL (Cloudlfare, NextDNS), some use `/resolve` instead of `/dns-query` for path (Google, AdGuard).

Why? In case ISPs start banning known DoH providers, you can use your own proxy. Even if they block workers.dev wholesale, you can use your own domain (it must be hosted on Cloudflare, add a CNAME record targeting anything and bind the route from your website Workers tab). If you want to use domain not hosted on Cloudflare, use [doh-cf-pages](https://github.com/tina-hello/doh-cf-pages) instead, where even CNAME records from [FreeDNS](https://freedns.afraid.org/) is enough for custom domain.

Daily request on free tier is limited to 100 thousands, should be enough for most personal use, or even a family. If you need more, upgrade to paid plan (card needed) and edit the [wrangler.toml](/wrangler.toml), though with minimum $5 monthly you might be better off just hosting AdGuard Home on a proper VPS ($5 on Vultr, pretty much unlimited request) which you can also put behind Cloudflare to hide your VPS IP. Once Cloudfare Snippet is released and if it's available on free tier, the code will be updated to adopt it for unlimited daily request.

You can also deploy the project using the button below, useful if you want to quickly modify the parameter/code without manually deploying to Cloudflare. Keep in mind the Action logs are visible to public unless you make your repository private (you'll need to [unfork](https://stackoverflow.com/questions/38831301/how-to-un-fork-the-github-repository)), so anyone can see your Cloudflare Worker address. Remember to remove the logs after deploying if you leave the repository public unless you're OK with others using your daily request quota.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/tina-hello/doh-cf-workers)

Want more control of the filter? Use [serverless-dns](https://github.com/serverless-dns/serverless-dns) which powers [RethinkDNS](https://rethinkdns.com/)

Want to host on Google Cloud Function or see how this is implemented in .NET? Use my [doh-gcf](https://github.com/tina-hello/doh-gcf)
