#  ProxyIP for cloudflare workers & pages-ws-vless

![Image description](https://i.imgur.com/PYV4crq.png)

**~~proxyIP127.0.0.1~~ means that ip now working anymore**

Latest worker.js code for CF-workers [Link](https://rentry.co/8March)

------
## فکر کنم این آسونترین روش برای بدست آوردن proxyIP برای داخل وورکر باشه.
روی هر کدوم از این لینک ها کلیک کنی یه خروار پروکسی میبینی با مشخصاتشون.
تمام `CNAME` رکوردهایی که رو این دامنه ها هست رو میشه ب جای پروکسی آی‌پی داخل وورکر استفاده کرد.


list's 
- https://www.nslookup.io/domains/workers.bestip.one/dns-records/

- https://www.nslookup.io/domains/cdn-all.xn--b6gac.eu.org/dns-records/

- https://www.nslookup.io/domains/cdn.xn--b6gac.eu.org/dns-records/

- https://www.nslookup.io/domains/edgetunnel.anycast.eu.org/dns-records/

- https://www.nslookup.io/domains/proxyip.aliyun.fxxk.dedyn.io/dns-records/

- https://www.nslookup.io/domains/proxyip.multacom.fxxk.dedyn.io/dns-records/



> چندتارو تست کردم همگی سالم بودن میذارمم این پایین برا نمونه.
**Germany, Frankfurt am main**
-     const proxyIPs = ['130.61.23.77'];
-     const proxyIPs = ['23.90.144.167'];
----
**Netherlands.Amsterdam -M247**
-     const proxyIPs = ['146.70.175.100'];
-     const proxyIPs = ['141.148.229.106'];
-     const proxyIPs = ['146.70.175.168'];
-----
**Luxembourg**
-     const proxyIPs = ['107.189.7.254'];
-----
**England, London**
-     const proxyIPs = ['23.162.136.169'];
-----
**Germany,Frankfurt am Main**
-     const proxyIPs = ['150.230.144.235'];
-----
**United States**
-     const proxyIPs = ['23.162.136.169'];
-     const proxyIPs = ['43.153.80.208'];
-     const proxyIPs = ['129.159.38.24'];
-     const proxyIPs = ['107.189.7.254'];
-     const proxyIPs = ['64.112.42.231'];
----
**Singapore**
-     const proxyIPs = ['8.219.54.203'];
-     const proxyIPs = ['47.236.87.206'];
----
**Korea**
-     const proxyIPs = ['144.24.85.158'];
----
**Japan**
-     const proxyIPs = ['141.147.163.68'];
----
**India-oracle**
-     const proxyIPs = ['141.148.212.70'];
----


> **یکم خلاقیت ب خرج بدی** خودت میفهمی چیو باید سرچ بزنی تو سایت

----
#### How to find proxyip for VLESS CF WORKERS using Cyberspace Search Engine [Telegra.ph Link](https://telegra.ph/How-to-find-proxy-ip-for-VLESS-CF-WORKER-01-06)
------

**note:** After connecting to vless every time, the IP is randomly changed and selected from among these countries.

IP's of Luxembourg, UK & ...
-     const proxyIPs = ['workers.bestip.one'];
------
**United States, Alibaba Technology Co. Ltd.**
-     const proxyIPs = ['proxyip.aliyun.fxxk.dedyn.io'];
----
**Sweden, Stockholm , M247 Europe SRL**
-     const proxyIPs = ['176.97.77.32'];
----
**United Kingdom of Great Britain, Oracle Corporation**
-     const proxyIPs = ['143.47.228.52'];
----
**United Arab Emirates, Oracle Corporation**
-     const proxyIPs = ['129.151.152.254'];
------

 #### *NOTE*
**About the next two:** After connecting to vless every time, the IP is randomly changed and selected from among these countries.

IP's of Netherlands, Sweden,, Germany, US & ...
-     const proxyIPs = ['cdn-all.xn--b6gac.eu.org'];

IP's of Singapore, Indonesia, Korea, Japan, Hong Kong & ...
-     const proxyIPs = ['cdn.xn--b6gac.eu.org'];
----
~~United Kingdom of Great Britain - Mythic Beasts Ltd~~
-     const proxyIPs = ["[2a00:1098:2b::1:ac40:6d0a]"];
-     const proxyIPs = ["[2a00:1098:2b::1:ac40:6c0a]"];
-     const proxyIPs = ["[2a00:1098:2c::5:ac40:6c0a]"];
-     const proxyIPs = ["[2a00:1098:2c::5:ac40:6d0a]"];
- - - -
~~Germany, Tencent Computer Systems Company Limited~~
-     const proxyIPs = ['43.157.17.4'];
- - - -
~~Germany, Hetzner Online GmbH~~
-     const proxyIPs = ["[2a01:4f8:c2c:123f:64:5:ac40:6c0a]"];
-     const proxyIPs = ["[2a01:4f8:c2c:123f:64:5:ac40:6d0a]"];
- - - -
~~Istanbul, Turkey Hosting Dunyam~~
-     const proxyIPs = ['2.59.119.35'];
- - - -
~~Finland Helsinki - Hetzner~~
-     const proxyIPs = ['104.28.224.14'];   
-     const proxyIPs = ['65.21.241.202'];
- - - -
~~Austria, vienna-AWYZone~~
-     const proxyIPs = ['94.177.8.51'];
- - - -
~~Nuremberg, Germany Hetzner~~
-     const proxyIPs = ['3.28.118.156'];
-     const proxyIPs = ['5.9.106.85'];
- - - -
~~Stockholm, Sweden 3NT Solutions  L.L.C~~
-     const proxyIPs = ['176.97.77.32'];
- - - -
~~London, England Hostaris~~
-     const proxyIPs = ['23.162.136.169'];
- - - -
~~Virginia, USA Amazon Technologies Inc.~~
-     const proxyIPs = ['3.216.234.194'];
-     const proxyIPs = ['4.4.234.181'];
----
~~Tokyo, Japan Amazon Tech Inc.~~
-     const proxyIPs = ['3.112.21.102'];
----
Australia, Sydney Amazon Tech Inc.
-     const proxyIPs = ['3.105.5.84'];
----
Amsterdam, The Infrastructure Gp
-     const proxyIPs = ['5.2.77.100'];
----
Haifa, Israel BroadBand
-     const proxyIPs = ['5.29.194.1'];
----
~~Tallinn, Estonia PAGM network~~
-     const proxyIPs = ['5.101.180.145'];

and more ["rentry.co/CF-proxyIP"](https://rentry.co/CF-proxyIP)
