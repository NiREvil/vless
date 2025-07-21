# DoH - DNS over HTTPS

DoH queries resolve over HTTPS for privacy, performance, and security. DoH also makes it easier to use a name server of your choice instead of the one configured for your system.

# Spec

[RFC 8484 - DNS Queries over HTTPS (DoH)](https://tools.ietf.org/html/rfc8484)

# Publicly available servers

| Who runs it | Base URL | Working*| Comment** |
|-------------|----------|---------|---------|
| **A**
|[Absolight](https://www.absolight.fr/)|https://resolver1.absolight.net/dns-query<br>https://resolver2.absolight.net/dns-query<br>https://resolver3.absolight.net/dns-query|:heavy_check_mark:|Also support DoT
|[AdFilter](https://adfilter.net/)|Perth: https://per.adfilter.net/dns-query<br>Sydney: https://syd.adfilter.net/dns-query<br>Adelaide: https://adl.adfilter.net/dns-query|:heavy_check_mark:<br>:heavy_check_mark:<br>:heavy_check_mark:|Adblocking, aggregated statistics kept for 30 days. Also support DoT
|Adfreedns|https://adfreedns.top/dns-query|:heavy_check_mark:|Adblocking. Also support DoT & DoQ
| [AdGuard](https://adguard-dns.io/en/public-dns.html)     | Default: https://dns.adguard-dns.com/dns-query <br> Family protection: https://family.adguard-dns.com/dns-query <br> Uncensored: https://unfiltered.adguard-dns.com/dns-query <br> | :heavy_check_mark: <br>  :heavy_check_mark: <br> :heavy_check_mark: |Default provides ad-blocking at DNS level, while Family protection adds adult site blocking. DNSSEC enabled and TLS 1.3. Also support DoT & DoQ | 
|[AKBXR DNS](https://dns.akbxr.com/#dns) | https://dns.akbxr.com/dns-query | :heavy_check_mark:|Block ads and gambling, also support DoT
|[AliDNS](https://alidns.com)|https://dns.alidns.com/dns-query|:heavy_check_mark:|Also support DoT & DoQ
|[André Kelpe](https://kel.pe)|https://doh.kel.pe|:heavy_check_mark:|Block ads, also support DoT
|[Andrews & Arnold](https://aa.net.uk/dns) | https://dns.aa.net.uk/dns-query | :heavy_check_mark: | no logging (see [DNS Disclaimer](https://www.aa.net.uk/legal/dohdot-disclaimer/)), also support DoT|
|[Angry.im](https://angry.im)|https://doh.angry.im/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, OpenNIC
|anon.no|https://dns.anon.no/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, also support DoT & DoQ
| [Anudeep](https://anudeep.me) | https://secure.anudeep.me/dns-query | :heavy_check_mark: | Adblocking, use Cloudflare upstream and AdGuard browsing security web service, also support DoT
|applewebkit.dev|https://dns.applewebkit.dev/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, also support DoT
[Aquilenet DNS](https://dns.aquilenet.fr/)|https://dns.aquilenet.fr/dns-query|:heavy_check_mark:| Non profit ISP DIY in France. Support IPv4+IPv6, DoT, uncensored, unfiltered, encrypted, DNSSEC|
|[Arashi DNS](https://arashi.net.eu.org)|https://arashi.net.eu.org/dns-query<br>https://ns.net.kg/dns-query|:heavy_check_mark:|
|[arnor.org](https://arnor.org)|https://nsec.arnor.org/dns-query|:heavy_check_mark:|Block ads, malware, phishing. support DoT, DoQ & DoH3. Only logs filtered URLs. Redirects some URLs for privacy. DNSSEC is enforced. (see [DNS Disclaimer](https://arnor.org/nsec_disclaimer.txt))
|Asteri Moon|https://dns.asterimoon.com/dns-query| :heavy_check_mark: | Adblocking, also support DoT
|[Avast DNS](https://www.avast.com/dns)|https://secure.avastdns.com/dns-query|:heavy_check_mark:|
|a47.me|https://dns.a47.me/dns-query|:heavy_check_mark:|
| **B**
|bazooki-infra.dev|https://bazooki-infra.dev/dns-query|:heavy_check_mark:|
|[Belnet](https://dns.belnet.be)|https://dns.belnet.be/dns-query|:heavy_check_mark:|
|[Ben Hocking](https://bmwhocking.com)|https://dns.bmwhocking.com/dns-query|:heavy_check_mark:|
| Bitdefender | https://dns.bitdefender.net/dns-query | :heavy_check_mark: |Also support DoT
|[BITServices](https://www.bitservices.io/)|https://dns.bitservices.io/dns-query|:heavy_check_mark:|Adblocking, use Cloudflare upstream, also support DoT & DoQ
| [Blokada DNS](https://community.blokada.org/t/the-benefits-of-blokada-dns/6646) | https://dns.blokada.org/dns-query | :heavy_check_mark: | No logging, also support DoT
|[Blue Shield Umbrella](https://blue-shield.at)|https://rfree1.blue-shield.at/dns-query<br>https://rfree2.blue-shield.at/dns-query|:heavy_check_mark:|Also support DoT
|bonis.de|https://adguard.bonis.de/dns-query|:heavy_check_mark:|Use AdGuard browsing security web service, also support DoT
|[Braene](https://braene.com)|https://dns.braene.com/dns-query|:heavy_check_mark:|Block ads, support DoT
| [Brahma World](https://dns.brahma.world/home.html) | https://dns.brahma.world/dns-query | :heavy_check_mark: | No logging • Blocks Ads + Trackers + Malware + Phishing domains, DNSSEC ready • QNAME Minimization • No EDNS Client-Subnet • Also support DoT
|brembeck.cloud|https://dns.brembeck.cloud/dns-query|:heavy_check_mark:|Block ads & porn, use AdGuard browsing security and parental control web service
|butterfly87.sbs|https://dns.butterfly87.sbs/dns-query|:heavy_check_mark:|
|[busold.ws](https://busold.ws)|https://dns.busold.ws/dns-query|:heavy_check_mark:|Block ads, also support DoT
| **C**
|cabbage.zone|https://dns.cabbage.zone/dns-query|:heavy_check_mark:|Block ads
|[Canarypwn](https://aaaab3n.moe/networks) | https://doh.aaaab3n.moe/dns-query-114514 | :heavy_check_mark: | Use Cloudflare upstream
|caspervk.net|https://dns.caspervk.net/dns-query|:heavy_check_mark:|Block ads, support DoT
|[CCTLD.KG](https://dns.cctld.kg/doc/doh-chrome.html)|https://dns.cctld.kg/dns-query|:heavy_check_mark:|
|[CERT Estonia](https://www.ria.ee/en/news/application-developed-cert-ee-protects-against-phishing-and-malware)|https://dns.cert.ee/dns-query|:heavy_check_mark:|Block phishing, malware, porn & gambling, support DoT
|[Charter](https://corporate.charter.com/)|https://doh-01.spectrum.com/dns-query<br>https://doh-02.spectrum.com/dns-query|:heavy_check_mark:|
|[chenu.ch](https://chenu.ch/)|https://dns.chenu.ch/dns-query|:heavy_check_mark:|Adblocking, support DoT
|[Christer Warén](https://christerwaren.fi) |https://dns.christerwaren.fi|:heavy_check_mark:| Support DoT
|[ChunghwaMC](https://chunghwamc.com)|https://dns.chunghwamc.com/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
| [CIRA Canadian Shield](https://www.cira.ca/cybersecurity-services/canadian-shield) | Private: <br>https://private.canadianshield.cira.ca/dns-query <br> Protected: <br>https://protected.canadianshield.cira.ca/dns-query <br> Family: <br>https://family.canadianshield.cira.ca/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Supports DNSSEC, DoT, keeps DNS traffic inside Canada. <br> Private: DNS resolution service that keeps your DNS data private from third-parties. <br> Protected: Includes Private features and adds malware and phishing blocking. <br> Family: Includes Protected and Private features and blocks pornographic content.
| [Cisco Umbrella (OpenDNS)](https://support.opendns.com/hc/en-us/articles/360038086532-Using-DNS-over-HTTPS-DoH-with-OpenDNS) | Standard: https://doh.opendns.com/dns-query <br> FamilyShield (blocks adult content):  https://doh.familyshield.opendns.com/dns-query <br> Umbrella: https://doh.umbrella.com/dns-query | :heavy_check_mark: <br>:heavy_check_mark:<br> :heavy_check_mark:| DNSSEC, Anycast
| [CleanBrowsing](https://cleanbrowsing.org/help/docs/dnsoverhttps/) | https://doh.cleanbrowsing.org/doh/family-filter/ <br><br> Filter that allows some mixed-content sites: https://doh.cleanbrowsing.org/doh/adult-filter/ <br><br> Malware blocking only: https://doh.cleanbrowsing.org/doh/security-filter/ | :heavy_check_mark: | anycast DoH server with parental control (restricts access to adult content + enforces safe search), support DoT
| [Cloudflare](https://developers.cloudflare.com/1.1.1.1/)  | https://cloudflare-dns.com/dns-query <br><br> Mozilla: https://mozilla.cloudflare-dns.com/dns-query <br><br> Block Malware: https://security.cloudflare-dns.com/dns-query <br><br> Block Malware and Adult Content: https://family.cloudflare-dns.com/dns-query <br><br> DNS64: https://dns64.cloudflare-dns.com/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Supports both -04 and -13 content-types, also support [DoT](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-tls/)
|comff.net|https://dns.comff.net/dns-query|:heavy_check_mark:|Block ads
| [Comss.one DNS](https://www.comss.ru/page.php?id=7315)| Geo-blocking bypass: <br> https://dns.comss.one/dns-query  <br> Geo-blocking bypass with ad filtering: <br> https://router.comss.one/dns-query|:heavy_check_mark:|Comss.one DNS – fast and secure DNS servers based on SmartDNS with access to AI services, protection from advertising, tracking, phishing and malicious sites, and support for encryption of DNS requests-over-HTTPS, DNS-over-TLS and DNS-over-QUIC
| [Control D](https://controld.com/free-dns) | Unfiltered: <br> https://freedns.controld.com/p0 <br> Malware (Block Malware): <br> https://freedns.controld.com/p1 <br> Ads & Tracking (Block Malware + Ads & Tracking): <br> https://freedns.controld.com/p2 <br> Social (Block Malware + Ads & Tracking + Social Networks): <br> https://freedns.controld.com/p3 <br> Family Friendly (Block Malware + Ads & Tracking + Adult Content + Drugs): <br> https://freedns.controld.com/family <br> Uncensored (Unblock censored domains from various countries) <br> https://freedns.controld.com/uncensored <br><br> - 3rd Party Filters - <br><br> OISD - Full: <br> https://freedns.controld.com/x-oisd <br> OISD - Basic: <br> https://freedns.controld.com/x-oisd-basic <br> StevenBlack Unified: <br> https://freedns.controld.com/x-stevenblack <br> Dev Dan's Hosts: <br> https://freedns.controld.com/x-devdan <br> 1Hosts - Mini: <br> https://freedns.controld.com/x-1hosts-mini <br> 1Hosts - Lite: <br> https://freedns.controld.com/x-1hosts-lite <br> 1Hosts - Pro: <br> https://freedns.controld.com/x-1hosts-pro <br> Hagezi's DNS - Light <br> https://freedns.controld.com/x-hagezi-light <br> Hagezi's DNS - Normal: <br> https://freedns.controld.com/x-hagezi-normal <br> Hagezi's DNS - Pro: <br> https://freedns.controld.com/x-hagezi-pro <br> Hagezi's DNS - Pro Plus: <br> https://freedns.controld.com/x-hagezi-proplus <br> Hagezi's DNS - Ultimate: <br> https://freedns.controld.com/x-hagezi-ultimate <br> Hagezi's DNS - TIF (Threat Intelligence Feeds) <br> https://freedns.controld.com/x-hagezi-tif <br> GoodbyeAds: <br> https://freedns.controld.com/x-goodbyeads <br> AdGuard Filter: <br> https://freedns.controld.com/x-adguard <br> | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | ControlD is a fully customizable anycast DNS service that allows you to not only block annoyances like malware, tracking, ads, IoT telemetry, and more but also unblock over 180 services through a network of proxies in over 100 cities, support DoT & DoQ
|[Crystalyx](https://crystalyx.net)|https://dns.crystalyx.net/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream and AdGuard browsing security web service, also support DoT & DoQ
|[CSA-IT](https://csaonline.de)|https://dns.csaonline.de/dns-query|:heavy_check_mark:|Support DoT
|csa-rz.de|https://dns.csa-rz.de/dns-query|:heavy_check_mark:| Support DoT
|[CSS Working Group](https://csswg.org)|https://dns.csswg.org/dns-query|:heavy_check_mark:|Support DoT
|[CynthiaLabs](https://cynthialabs.net/dns/)|https://dns.cynthialabs.net/dns-query|:heavy_check_mark:|Adblocking
| [CZ.NIC](https://www.nic.cz/odvr/) | https://odvr.nic.cz/dns-query | :heavy_check_mark:| Runs on [Knot Resolver](https://www.knot-resolver.cz/) (`doh2`), supports DNSSEC, provided by `.cz` TLD operator, support DoT
| **D**
| [Danielle McLean](https://00dani.me/) | https://ns.00dani.me/dns-query | :heavy_check_mark: |
| [data.haus](https://data.haus/) | https://ns.data.haus/dns-query | :heavy_check_mark: | Adblocking, non-logging, support DoT
|datenquark.de|https://dns.datenquark.de/dns-query|:heavy_check_mark:|Block ads, support DoT
|deep-henchman-excuse.cfd|https://deep-henchman-excuse.cfd/dns-query|:heavy_check_mark:|
|dev-umbrellagov|https://dns.dev-umbrellagov.com/dns-query| :heavy_check_mark: | Support DoT
| [Digitale Gesellschaft](https://www.digitale-gesellschaft.ch/dns/) |  https://dns.digitale-gesellschaft.ch/dns-query | :heavy_check_mark: | No query/IP logging, no filtering, QNAME minimization, TLS 1.3, DNSSEC, DoT; https://www.digitale-gesellschaft.ch/dns/
| Disconnect.app | https://doh.disconnect.app/dns-query | :heavy_check_mark: | Use Cloudflare upstream
| [dns.digitalsize.net](https://dns.digitalsize.net/) | https://dns.digitalsize.net/dns-query | :heavy_check_mark: | A public, non-tracking, non-filtering DNS resolver with DNSSEC enabled, QNAME minimization and no EDNS client subnet. Supports DoT. Hosted in Germany.
| [DNS.SB](https://dns.sb/doh/) | https://doh.dns.sb/dns-query <br> https://doh.sb/dns-query | :heavy_check_mark: <br> :heavy_check_mark:| DNSSEC & QNAME minimization enabled, no logging, also [support DoT](https://dns.sb/dot/) |
| [dns0.eu](https://www.dns0.eu/) | Non-blocking: https://open.dns0.eu<br>Malware blocking: https://dns0.eu<br>Hardened security: https://zero.dns0.eu<br>Child safe: https://kids.dns0.eu | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:| Non-logging, GDPR compliant
|[DNS4all](https://dns4all.eu/)|https://doh.dns4all.eu/dns-query|:heavy_check_mark:| Non-logging, support DoT & DoQ
|[DNS4EU](https://www.joindns4.eu/for-public#resolver-options)|Protective: https://protective.joindns4.eu/dns-query<br>Protective and childsafe: https://child.joindns4.eu/dns-query<br>Protective and adblocking: https://noads.joindns4.eu/dns-query<br>Protective, adblocking, and childsafe: https://child-noads.joindns4.eu/dns-query<br>Unfiltered: https://unfiltered.joindns4.eu/dns-query|:heavy_check_mark:|Co-funded by EU, run by consortium of companies in EU, anonymized and aggregated logging.
|[dns4me](https://dns4me.net)|https://ca01.dns4me.net<br>https://ca02.dns4me.net<br>https://us01.dns4me.net<br>https://us02.dns4me.net<br>https://sg01.dns4me.net<br>https://sa01.dns4me.net<br>https://au01.dns4me.net<br>https://au02.dns4me.net<br>https://uk01.dns4me.net<br>https://nz01.dns4me.net<br>https://ie01.dns4me.net<br>https://de01.dns4me.net|:heavy_check_mark:|Also support DoT
|dns-53|https://dns.dns-53.us/dns-query|:heavy_check_mark:|Support DoT & DoQ
| [dnscry.pt](https://www.dnscry.pt/) |Amsterdam, Netherlands: https://ams01.dnscry.pt/dns-query<br>Ashburn, US: https://abn01.dnscry.pt/dns-query<br>Athens, Greece: https://ath01.dnscry.pt/dns-query<br>Atlanta, US: https://atl01.dnscry.pt/dns-query<br>Bogotá, Colombia: https://bog01.dnscry.pt/dns-query<br>Bratislava, Slovakia: https://bts01.dnscry.pt/dns-query<br>Brisbane, Australia: https://bne01.dnscry.pt/dns-query<br>Brussels, Belgium: https://bru01.dnscry.pt/dns-query<br>Calgary, Canada: https://yyc01.dnscry.pt/dns-query<br>Chișinău, Moldova: https://kiv01.dnscry.pt/dns-query<br>Copenhagen, Norway: https://cph01.dnscry.pt/dns-query<br>Coventry, UK: https://cvt01.dnscry.pt/dns-query<br>Dublin, Ireland: https://dub01.dnscry.pt/dns-query<br>Düsseldorf, Germany: https://dus01.dnscry.pt/dns-query<br>Frankfurt, Germany-vServer: https://fra01.dnscry.pt/dns-query<br>Frankfurt, Germany-xTom:https://fra02.dnscry.pt/dns-query<br>Geneva, Switzerland: https://gva01.dnscry.pt/dns-query<br>Hafnarfjordur, Iceland: https://haf01.dnscry.pt/dns-query<br>Halifax, Canada: https://yhz01.dnscry.pt/dns-query<br>Hanoi, Vietnam: https://han01.dnscry.pt/dns-query<br>Ho-Chi-Minh City, Vietnam: https://sgn01.dnscry.pt/dns-query<br>Istanbul, Turkey: https://ist01.dnscry.pt/dns-query<br>Las Vegas, US: https://las01.dnscry.pt/dns-query<br>Lima Gcore, Colombia: https://lim02.dnscry.pt/dns-query<br>Lisbon, Portugal: https://lis01.dnscry.pt/dns-query<br>London, UK: https://lon01.dnscry.pt/dns-query<br>Madrid, Spain: https://mad01.dnscry.pt/dns-query<br>Milan, Italy: https://mil01.dnscry.pt/dns-query<br>Mumbai, India: https://bom01.dnscry.pt/dns-query<br>Nuremberg, Germany: https://nue01.dnscry.pt/dns-query<br>Oradea, Romania: https://omr01.dnscry.pt/dns-query<br>Paris, France: https://par01.dnscry.pt/dns-query<br>Philadelphia, US: https://phl01.dnscry.pt/dns-query<br>Phoenix, US: https://phx01.dnscry.pt/dns-query<br>Portland, US: https://pdx01.dnscry.pt/dns-query<br>Redditch, UK: https://rdd01.dnscry.pt/dns-query<br>Salt Lake City, US: https://slc01.dnscry.pt/dns-query<br>Sandefjord, Norway: https://trf01.dnscry.pt/dns-query<br>Santa Clara, US: https://sjc01.dnscry.pt/dns-query<br>São Paulo, Brazil: https://gru01.dnscry.pt/dns-query<br>Seattle, US: https://sea01.dnscry.pt/dns-query<br>Singapore Kuroit: https://sin03.dnscry.pt/dns-query<br>Singapore WebHorizon: https://sin02.dnscry.pt/dns-query<br>Sofia: https://sof01.dnscry.pt/dns-query<br>Spokane, US: https://geg01.dnscry.pt/dns-query<br>Stockholm, Sweden: https://sto01.dnscry.pt/dns-query<br>Sydney FlowVPS, Australia: https://syd02.dnscry.pt/dns-query<br>Tallinn, Estonia: https://tll01.dnscry.pt/dns-query<br>Tampa, US: https://tpa01.dnscry.pt/dns-query<br>Taos, US: https://tsm01.dnscry.pt/dns-query<br>Tbilisi, Georgia: https://tbs01.dnscry.pt/dns-query<br>Tel Aviv, Israel: https://tlv01.dnscry.pt/dns-query<br>Toronto, Canada: https://yyz01.dnscry.pt/dns-query<br>Vancouver, Canada: https://yvr01.dnscry.pt/dns-query<br>Vienna, Austria: https://vie01.dnscry.pt/dns-query<br>Vilnius, Lithuania: https://vno01.dnscry.pt/dns-query<br>Warsaw, Poland: https://waw02.dnscry.pt/dns-query<br>Yerevan, Armenia: https://evn01.dnscry.pt/dns-query| :heavy_check_mark:| Support IPv4+IPv6, DoT, uncensored, unfiltered, encrypted, DNSSEC, no logging.
| [dnsforge.de](https://dnsforge.de/) | Adblocking : https://dnsforge.de/dns-query <br> Ads and pornblocking : https://clean.dnsforge.de/dns-query <br> Hard : https://hard.dnsforge.de/dns-query|:heavy_check_mark:<br>:heavy_check_mark:|  No logging. Support DNSSEC. Hosted in Germany, support DoT & DoQ
|[dnsHome.de](https://www.dnshome.de/doh-dot-public-resolver.php)|https://dns.dnshome.de/dns-query|:heavy_check_mark:| Supports DoH/DoH3 DoT/DoQ and DNSCrypt, No logging, No blocking
|[DNSGuard.pub](https://dnsguard.pub)|https://dnsguard.pub/dns-query|:heavy_check_mark:| Protects your privacy: Supports DoH, DoT, DoQ, and DNSCrypt, keeps no logs, and uses a custom blocklist for malware, trackers, and ads.
| [dnslow.me](https://dnslow.me/) | https://dnslow.me/dns-query | :heavy_check_mark: | A protective DNS that blocks Ads, Malware, Trackers, Phishing and Newly Registered Domains. Randomly forward requests to different upstreams for enhanced privacy. Support DoT
|[DNS over Tor](https://www.dnsovertor.cc/?lang=en)|https://japan.dnsovertor.cc/dns-query<br>https://chuncheon.dnsovertor.cc/dns-query<br>https://seoul.dnsovertor.cc/dns-query|:heavy_check_mark:|
| [DNSPod](https://docs.dnspod.cn/public-dns/dot-doh/) | https://dns.pub/dns-query | :heavy_check_mark: | Operated by Tencent Cloud, support DoT
|doh.beauty|https://doh.beauty|:heavy_check_mark:|
|doh.buzz|https://doh.buzz/dns-query|:heavy_check_mark:|
|[Dom!nic](https://dom1nic.eu/)|https://3dns.eu/dns-query|:heavy_check_mark:| Support DoT
|[domreg.lt](https://domreg.lt)|https://doh.domreg.lt/dns-query|:heavy_check_mark:|Block porn & gambling, support DoT
|do-39574-tr.xyz|https://do-39574-tr.xyz/dns-query|:heavy_check_mark:|
|[dremaxx.de](https://dremaxx.de)|https://dns.dremaxx.de/dns-query|:heavy_check_mark:|Support DoT
|droyd.top|https://droyd.top/dns-query|:heavy_check_mark:|Use Cloudflare upstream
|dshubham.xyz|https://agh.dshubham.xyz/dns-query|:heavy_check_mark:|Block ads, support DoT & DoQ
| [Dukun.de](https://dukun.de/) |https://dukun.de/dns-query | :heavy_check_mark: | Support DoT
|[duröhre.de](https://xn--durhre-yxa.de)|https://xn--durhre-yxa.de/dns-query|:heavy_check_mark:|
|[DynX](https://www.dynx.pro/)|Adblock: https://dns.dynx.pro/dns-query<br>Ad & porn blocking: https://dns.dynx.pro/dns-query/family| :heavy_check_mark: | Support DoT & DoQ
|d94.xyz|https://dns.d94.xyz/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
|d96.info|https://dns.d96.info/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
| **E**
|[Egor Glukhikh](https://henek.ovh/)|https://dns.henek.ovh/dns-query|:heavy_check_mark:|Adblocking
|[Elemental Software](https://elemental.software)|https://dns.elemental.software/dns-query|:heavy_check_mark:|Support DoT
|[ELIV DNS](https://dns.eliv.kr)|https://dns.eliv.kr/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, Fast Cloudflare (priority IP) connection, support DoT
| **F**
|faked.org|https://dns.faked.org/dns-query|:heavy_check_mark:|Block ads, support DoT & DoQ
|familiamv.net|https://dnsvps.familiamv.net/dns-query|:heavy_check_mark:|Adblocking, use Cloudflare upstream, support DoT
| Fancyorg.at | https://dns.fancyorg.at/dns-query |  :heavy_check_mark: | Adblocking
|farshidhakimy.de|https://dns.farshidhakimy.de/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, support DoT
|[FBI NICS E-Check](https://nicsezcheckfbi.gov) |https://nicsezcheckfbi.gov|:heavy_check_mark:| Use Cloudflare upstream with malware filtering 
| [FDN](https://www.fdn.fr/) - French Data Network | https://ns0.fdn.fr/dns-query <br> https://ns1.fdn.fr/dns-query |:heavy_check_mark:| No log, no filter, DNSSEC, DoT … ([more informations in French](https://www.fdn.fr/ouverture-des-services-dot-doh/))
|[Feroz](https://padlock.argh.in/2019/07/11/dns-over-https.html)|https://doh.li/dns-query|:heavy_check_mark:|Use Cloudflare upstream
| [ffmuc.net](https://ffmuc.net/wiki/doku.php?id=knb:dohdot_en) | https://doh.ffmuc.net/dns-query | :heavy_check_mark:| DoH & DoT Server of Freifunk München. No logging, no filter, DNSSEC, OpenNIC, own recursion. More in our [wiki](https://ffmuc.net/wiki/doku.php?id=knb:dohdot_en)
|fidelius.top|https://fidelius.top/dns-query|:heavy_check_mark:|
|floriantinney.de|https://dns.floriantinney.de/dns-query|:heavy_check_mark:|Use AdGuard browsing security web service, support DoT
|[FLY_MC](https://flymc.cc/2022/03/%E5%A4%8F%E7%A5%88%E4%BA%91%E5%85%AC%E5%85%B1dns-public-dns%E6%9C%8D%E5%8A%A1%E6%9B%B4%E6%96%B0%E4%B8%8A%E7%BA%BF/)|https://dns.flymc.cc/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream
| [Foundation for Applied Privacy](https://applied-privacy.net/services/dns/) | https://doh.applied-privacy.net/query | :heavy_check_mark:| No query/IP logging, no filtering, QNAME minimization, no EDNS client subnet, TLS 1.3, DNSSEC, RFC7706, RFC8198, DoT
|[Froth.zone](https://dns.froth.zone/resolver/)|https://dns.froth.zone/dns-query|:heavy_check_mark:|OpenNIC, support DoT & DoQ
|[FutaDNS](https://site.futa.gg/)|https://doh.futa.gg/dns-query|:heavy_check_mark:|Block ads, support DoT through `dot.futa.gg`
| **G**
|[Gamban](https://gamban.com/)|https://dns.gamban.com/dns-query|:heavy_check_mark:|
|gibblets.top|https://gibblets.top/dns-query|:heavy_check_mark:|
|[girino.org](https://girino.org)|https://dns.girino.org/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
|glacius.top|https://glacius.top/dns-query|:heavy_check_mark:|
| [Google](https://developers.google.com/speed/public-dns/docs/doh) | https://dns.google/dns-query <br> DNS64: https://dns64.dns.google/dns-query <br> https://8888.google/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:| Full RFC 8484 support, EDNS, DNSSEC, no filtering, support DoT
|[Gottlieb Freitag](https://glf.wtf)|https://dns.glf.wtf/dns-query|:heavy_check_mark:|Block ads, support DoT
|[Green Ping](https://green-ping.shop/)|https://dns.green-ping.lol/dns-query|:heavy_check_mark:|Support DoT & DoQ, block ads & porn
|[Guardio](https://guard.io/)|https://dns.guard.io/dns-query|:heavy_check_mark:|
| **H**
|[Hakase](https://haka.se)|https://dns.haka.se/dns-query|:heavy_check_mark:|Block ads
|home-server.store|https://home-server.store/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, AdGuard browsing security web service, support DoT & DoQ
|[Hoody](https://hoody.com)|https://dns.hoody.com/dns-query|:heavy_check_mark:|Use Cloudflare upstream, support DoT
|[Hostux](https://dns.hostux.net/en/)|https://dns.hostux.net/ads|:heavy_check_mark:|Support DoT
| Huque | https://doth.huque.com/dns-query | :heavy_check_mark: | Support DoT
| **I**
|[immerda.ch](https://docs.immerda.ch/de/services/doh/)|https://doh.immerda.ch/dns-query|:heavy_check_mark:|Block ads
|imperio.top|https://imperio.top/dns-query|:heavy_check_mark:|
| [In-Berlin](https://wiki.in-berlin.de/dns) | https://dns1.in-berlin.de/dns-query<br>https://dns2.in-berlin.de/dns-query | :heavy_check_mark: | Support DoT
|[Inforlogia](https://inforlogia.com)|https://dns.inforlogia.com/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
| [Internet Initiative Japan](https://public.dns.iij.jp/) | https://public.dns.iij.jp/dns-query | :heavy_check_mark: | Planned to run until March 2027, support DoT
|is.my.waifu.cz|https://megumin.is.my.waifu.cz/dns-query<br>https://yunyun.is.my.waifu.cz/dns-query|:heavy_check_mark:|
| **J**
|[Jupitr DNS](https://jupitrdns.com)|https://dns.jupitrdns.com/dns-query|:heavy_check_mark:|Block ads, support DoT & DoQ
| **K**
|kapite.in|https://dns.kapite.in/dns-query|:heavy_check_mark:|Block ads & gambling, use Cloudflare upstream with malware filtering and AdGuard browsing security web service, support DoT & DoQ
|kasbot.net|https://adguard.kasbot.net/dns-query|:heavy_check_mark:|Block ads
|kebree.fr|https://dns.kebree.fr/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, support DoT
|[Kernel Error](https://kernel-error.de)|https://dns.kernel-error.de/dns-query|:heavy_check_mark:| Support DoT
|[kescher](https://dns.kescher.at)|https://dns.kescher.at/dns-query|:heavy_check_mark:|DNSSEC-validating, support DoT & DoQ
|ketan.dev|https://pihole.aws.ketan.dev/dns-query|:heavy_check_mark:|Block ads, support DoT
|khon.dev|https://adg.khon.dev/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream
|[Kidzonet](https://kidzonet.io)|https://doh.kidzonet.io/dns-query|:heavy_check_mark:|
|[Koala](https://koala.us.to)|https://dns.koala.us.to/dns-query|:heavy_check_mark:|Adblocking, support DoT
|[Kosan](https://kosan.moe)|https://dns.kosan.moe/dns-query|:heavy_check_mark:|Block ads
|kpsn.org|https://dart.kpsn.org/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
|krctech.dev|https://adblock.krctech.dev/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
| **L**
| [La Contre-Voie](https://lacontrevoie.fr/en/services/doh/) | https://doh.lacontrevoie.fr/dns-query | :heavy_check_mark: | Supports DNSSEC and IPv6, not logging queries' content, uses [unbound](https://github.com/NLnetLabs/unbound/). Commits for net neutrality, hosted in France.
| [LavaDNS](https://dns.lavate.ch/) | Finland: https://eu1.dns.lavate.ch/dns-query | :heavy_check_mark: | DoH server in Finland. OpenNIC, no logging, no filtering, no ECS, DNSSEC support. |
|[Liberador.net](https://liberador.net)|https://dns.liberador.net|:heavy_check_mark:|Support DoT
|[LibreDNS](https://libredns.gr/) | Non-filtering: https://doh.libredns.gr/dns-query <br> Adblocking: https://doh.libredns.gr/noads| :heavy_check_mark: <br> :heavy_check_mark: | Non-logging, OpenNIC, support DoT
|lifeisa.live|https://lifeisa.live/dns-query|:heavy_check_mark:|
|loadlow.me|https://loadlow.me/dns-query|:heavy_check_mark:|
|[LobbyGod](https://lobbygod.com/)|https://dns.lobbygod.com/dns-query|:heavy_check_mark:| Support DoT
|lukscasino|https://lukscasino-929-tr.xyz/dns-query<br>https://lukscasino-479-tr.xyz/dns-query|:heavy_check_mark:|
|[LuMa Medien](https://luma-medien.com)|https://dns.luma-medien.com/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, support DoT & DoQ
|l337.site|https://dns.l337.site/dns-query|:heavy_check_mark:|Block ads, support DoT & DoQ
| **M**
|mabuktogel|https://mabuktogel.directory/dns-query|:heavy_check_mark:|
|maqgie.xyz|https://maqgie.xyz/dns-query|:heavy_check_mark:|
|marasov.id|https://dns.marasov.id/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream
|[Marco Fox](https://technologycage.com)|https://dns.technologycage.com/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, support DoT
|[Marbled Fennec Networks / FurrIX](https://www.marbledfennec.net/public-dns-server/)|https://dns.marbledfennec.net/dns-query|:heavy_check_mark:|OpenNIC compatible with support for DoT and DoH. Small community project providing two name servers over IPv4/IPv6. Hosted in Kansas City, MO, US.
| [Masters of Cloud](https://www.masters-of-cloud.de/) | https://masters-of-cloud.de/dns-query | :heavy_check_mark: | OpenNIC, support DoT
|mateo.ovh|https://dns.mateo.ovh/dns-query|:heavy_check_mark:|Block ads & porn, use Cloudflare upstream, AdGuard browsing security web service, support DoT & DoQ
|[Mayx](https://mayx.eu.org)|https://dns.mayx.eu.org/dns-query|:heavy_check_mark:|
|[MBRJun](https://mbrjun.cn)|https://dns.mbrjun.cn/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service
|meddy94.de|https://adguard.meddy94.de/dns-query|:heavy_check_mark:|Adblocking, support DoT
|mendozasdelivery.com|https://mendozasdelivery.com/dns-query|:heavy_check_mark:|
|mh4ckt3mh4ckt1c4s.xyz|https://dns.mh4ckt3mh4ckt1c4s.xyz/dns-query|:heavy_check_mark:|Block ads, support DoT
|michelo.cl|https://dns.michelo.cl/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, support DoT & DoQ
|[Mike Zhang](https://mikezhang.xyz)|https://mikezhang.xyz/dns-query|:heavy_check_mark:|
|m-it.ro|https://addns1.m-it.ro/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream and AdGuard browsing security web service
|mmmalia.com|https://doh.mmmalia.com/dns-query|:heavy_check_mark:|Block ads & porn, use AdGuard parental control web service
|mnet-online.de|https://dns.mnet-online.de/dns-query|:heavy_check_mark:| Support DoT
| [Mullvad](https://mullvad.net/en/help/dns-over-https-and-dns-over-tls/) | Non-blocking https://dns.mullvad.net/dns-query <br> Adblocking https://adblock.dns.mullvad.net/dns-query <br> Ad & malware blocking https://base.dns.mullvad.net/dns-query <br> Ad, malware, social media blocking https://extended.dns.mullvad.net/dns-query <br> Ad, malware, social media, adult content and gamble blocking https://all.dns.mullvad.net/dns-query <br> Ad, malware, adult content and gamble blocking https://family.dns.mullvad.net/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:| Public DoH server in US, DE, GB, SG, and SE with QNAME minimization, audited by [Assured](https://www.assured.se/wp-content/uploads/2021/03/Assured_Mullvad_DoH_server_audit_report.pdf), support DoT
|myatris.sbs|https://myatris.sbs/dns-query|:heavy_check_mark:|
| [mydns.network](https://mydns.network) | Uncensored: https://freedom.mydns.network/dns-query <br> Paranoia (no Google/Cloudflare): https://paranoia.mydns.network/dns-query <br> Adblocking: https://adblock.mydns.network/dns-query <br> Family: https://family.mydns.network/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Public DoH server powered by Cloudflare Workers. Uniquely disguises your queries by relaying queries your behalf to upstream DoH servers with no IP address information. [Open source](https://github.com/matthewgall/doh-proxy), deploy your own instance at any time! Also support DoT
|[MZJ Technology](https://mzjtechnology.com)|https://dns.mzjtechnology.com/dns-query|:heavy_check_mark:|Support DoT
| **N**
|nashkan.net|https://ae-fuj-w-p-1.nashkan.net/dns-query<br>https://ae-fuj-w-p-2.nashkan.net/dns-query<br>https://ae-fuj-w-p-3.nashkan.net/dns-query<br>https://au-syd-w-f-1.nashkan.net/dns-query<br>https://gb-lon-w-p-2.nashkan.net/dns-query<br>https://ro-buc-w-p-1.nashkan.net/dns-query<br>https://sg-w-p-1.nashkan.net/dns-query<br>https://us-chi-w-f-1.nashkan.net/dns-query<br>https://us-chi-w-p-1.nashkan.net/dns-query<br>https://us-jac-w-f-1.nashkan.net/dns-query<br>https://us-jac-w-p-1.nashkan.net/dns-query<br>https://us-kan-w-p-1.nashkan.net/dns-query<br>https://us-nyc-w-p-1.nashkan.net/dns-query<br>https://us-saj-w-f-1.nashkan.net/dns-query<br>https://us-saj-w-p-1.nashkan.net/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream with malware filtering
|neeb.it|https://dns.neeb.it/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
| [NextDNS](https://nextdns.io) | https://dns.nextdns.io | :heavy_check_mark: | The first cloud-based private DNS service that gives you full control over what is allowed and what is blocked on the Internet. 300,000 domain resolution per month is free with non-filtering afterward until the end of the month. Granular dashboard, Each account can create multiple configurations, which can be used for multiple devices with prefixes to track activities on the dashboard. [Create a config ID](https://my.nextdns.io/start), support DoT & DoQ
|[Nick Slowinski](https://nick-slowinski.de)|https://dns.nick-slowinski.de/dns-query|:heavy_check_mark:|Block ads
| [NIC.LV](https://doh.lv/) | https://doh.lv/dns-query <br> https://doh.nic.lv/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Run by .lv TLD registry , support DoT
|[Nico Franke](https://zernico.de)|https://adguard-kartoffel.zernico.de/dns-query|:heavy_check_mark:| Support DoT
|[Nicolas Dorriere](https://nicolas-dorriere.fr/dns/)|Adblocking: https://doh-random-upstream.nicolas-dorriere.fr/dns-query<br>Non filtering: https://doh-own-recursion.nicolas-dorriere.fr/dns-query|:heavy_check_mark:|Block ads
|[niko.NWPS.fi](https://niko.nwps.fi/2024/09/01/free-dns-filter/)|Public: https://public.ns.nwps.fi/dns-query<br>Kids: https://kids.ns.nwps.fi/dns-query|:heavy_check_mark:|Block ads, hosted in Helsinki, support DoT, use AdGuard browsing security and parental filtering web service.
|[Ningkelle](https://ningkelle.id/tools/dns/)|Adblock: https://dns.ningkelle.id/dns-query<br>Family: https://family.dns.ningkelle.id/dns-query|:heavy_check_mark:|Block ads. Adblock endpoint uses Cloudflare upstream, Family endpoint uses AdGuard browsing security and parental filtering web service. Support DoT.
| [NiYaWe](https://www.niyawe.de/) | https://doh.niyawe.de/dns-query | :heavy_check_mark: |Support DoT through `dot.niyawe.de`
| [Njalla](https://dns.njal.la/) | https://dns.njal.la/dns-query | :heavy_check_mark: | Non logging, based in Sweden
| [NordVPN](https://nordvpn.com)|https://dns1.nordvpn.com/dns-query <br> https://dns2.nordvpn.com/dns-query| :heavy_check_mark: | Support DoT
|novg.net|https://dns.novg.net/dns-query|:heavy_check_mark:|
|ntwrkh.pro|https://ntwrkh.pro/dns-query|:heavy_check_mark:|Block ads, support DoT
| **O**
|ofdoom.net|https://dns.ofdoom.net/dns-query|:heavy_check_mark:|Block ads, support DoT
|[OpenBLD.net](https://openbld.net/)|https://ada.openbld.net/dns-query|:heavy_check_mark:|Block ads, malicious. Support DoT, DoH - HTTP/2, TLSv1.3. Without DNS leaks. Use own upstreams and update services.
|[OpenLoop](https://openloophealth.com/)|https://ag.apollohct.com/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
|[opennameserver.org](https://opennameserver.org)|Baden-Baden, Germany: https://ns1.opennameserver.org/dns-query|:heavy_check_mark:|DNSSEC enabled, non-logging, OpenNIC support
| **P**
| [PaesaDNS](https://milgradesec.github.io/paesadns/) | https://dns.paesa.es/dns-query | :heavy_check_mark: | Adblocking, non-logging, use Cloudflare upstream with malware filtering
|[Paulo](https://paulo.nom.za)|https://dns.paulo.nom.za/dns-query| :heavy_check_mark: | 
|[Pavol Decky](https://decky.eu)|https://dns.decky.eu/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
|pepetio.xyz|https://pepetio.xyz/dns-query|:heavy_check_mark:|
|petqa.ru|https://dns.petqa.ru/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream and AdGuard browsing security web service, support DoT & DoQ
|pietjacobs.be|https://dns1.pietjacobs.be/dns-query|:heavy_check_mark:|Adblocking, use Cloudflare upstream with malware filtering
|[plan9-dns](https://github.com/jlongua/plan9-dns)|New Jersey: https://kronos.plan9-dns.com/dns-query<br>Mexico: https://helios.plan9-dns.com/dns-query<br>Florida: https://pluton.plan9-dns.com/dns-query|:heavy_check_mark:|
|[PlumeDNS](https://plumedns.com)|https://privacy.plumedns.com/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
|pooblet.co.za|https://pooblet.co.za/dns-query|:heavy_check_mark:|Adblocking, use Cloudflare upstream
|[Privex](https://www.privex.io/articles/public-infra/#standard-dns-servers)|Netherlands: https://nl.dns.privex.io|:heavy_check_mark:|
|propheci.xyz|https://dns.propheci.xyz/dns-query|:heavy_check_mark:|Block ads & porn, use ControlD upstream, support DoT & DoQ
|[Pubhole](https://pubhole.archuser.org/)|https://doh.archuser.org/dns-query|:heavy_check_mark:|Block ads, also resolves OpenNIC, support DoT
| **Q**
| [Quad9](https://quad9.net) | 9.9.9.9 (Secure): A threat-blocking, privacy-first recursive DNS service. <br> https://dns.quad9.net/dns-query <br> https://dns9.quad9.net/dns-query <br><br> 9.9.9.10 (No Threat Blocking): For users who want to take advantage of privacy-first recursive DNS service, but do not want threat blocking. <br> https://dns10.quad9.net/dns-query <br><br> 9.9.9.11 (Secure + ECS): For users who do not route to the closest-possible Quad9 location, use 9.9.9.11 for better CDN performance. <br> https://dns11.quad9.net/dns-query <br><br> 9.9.9.12 (No Threat Blocking + ECS): For users who do not route to the closest-possible Quad9 location, and also do not want threat blocking, use 9.9.9.12 for better CDN performance. <br> https://dns12.quad9.net/dns-query | ✔️ <br> ✔️ <br> ✔️ <br> ✔️ | <br> _dns9.quad9.net is another alias for dns.quad9.net, see: https://quad9.net/news/blog/doh-with-quad9-dns-servers_ <br><br> 9.9.9.9 - Malware blocking, DNSSEC validation <br> 9.9.9.10 - No malware blocking, no DNSSEC validation <br> 9.9.9.11 - Malware blocking, DNSSEC validation, ECS enabled <br> 9.9.9.12 - No malware blocking, no DNSSEC validation, ECS enabled, support DoT
|[Quiet Rocks](https://quiet.rocks)|https://dns.quiet.rocks/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
|[QWER DNS](https://dns.qwer.pw)|https://dog.dns.qwer.pw/dns-query<br>https://lion.dns.qwer.pw/dns-query<br>https://frog.dns.qwer.pw/dns-query<br>https://tiger.dns.qwer.pw/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT on port 853 and DoQ on port 784
| **R**
|[Rabbit DNS](https://rabbitdns.org/install)|Non filtering: https://dns.rabbitdns.org/dns-query<br>Malware filtering: https://security.rabbitdns.org/dns-query<br>Malware and adult filtering: https://family.rabbitdns.org/dns-query|:heavy_check_mark:|Use Cloudflare upstream with malware and family filtering
|redhosting.com.ar|https://dns.redhosting.com.ar/dns-query|:heavy_check_mark:|Block ads & gambling, use Cloudflare upstream, support DoT
|reitmeier.me|https://dns.reitmeier.me/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream , support DoT & DoQ
|reckoningslug.name|https://dns.reckoningslug.name/dns-query|:heavy_check_mark:|Use Cloudflare upstream
|regiopolis.cloud|https://regiopolis.cloud/dns-query|:heavy_check_mark:|
|renardbleu.dev|https://renardbleu.dev/dns-query|:heavy_check_mark:|OpenNIC, support DoT
|[Restena](https://www.restena.lu/en/document/190-configuring-your-server-public-dns-resolver)|https://dnspub.restena.lu/dns-query|:heavy_check_mark:|DNSSEC validation, support DoT
|[RetakeCS](https://retakecs.com/)|https://dns.retakecs.com/dns-query|:heavy_check_mark:|Adblocking, use AdGuard browsing security web service, support DoT & DoQ
| [RethinkDNS](https://www.rethinkdns.com/) | Non-filtering: https://sky.rethinkdns.com/dns-query <br> OISD: https://sky.rethinkdns.com/1:IAAgAA== | :heavy_check_mark: <br> :heavy_check_mark: | [An open-source stub resolver](https://github.com/serverless-dns/serverless-dns) running in 200+ locations world-wide on Cloudfare's network. Fast, secure, private, transparent, configurable DNS resolver. No ECS. Implements CNAME Cloaking. No-logs. [code](https://github.com/celzero/rethink-app). [Configure custom blocklists](https://rethinkdns.com/configure) with DoH and DoT option
|revelio.top|https://revelio.top/dns-query|:heavy_check_mark:|
|[RobinGroppe.de](https://www.robingroppe.de/serverzeug/dns-server)|https://dns.rbn.gr/dns-query|:heavy_check_mark:| Malware blocking, DNSSEC validation, support DoT
|roedel.cloud|https://dns.roedel.cloud/dns-query|:heavy_check_mark:|Block ads, support DoT & DoQ
| **S**
| [SafeServe](https://www.namecheap.com/dns/free-public-dns/) | https://safeservedns.com/dns-query | :heavy_check_mark: | Operated by Namecheap, support DoT
|serdcebolit.ru|https://dns1.serdcebolit.ru/dns-query|:heavy_check_mark:|Block ads & porn, support DoT
|[Sheggi](https://sheggi.ch/)|https://dns.sheggi.ch/dns-query|:heavy_check_mark:|Porn blocking, use Cloudflare upstream with malware and family filtering, support DoT
|shoupperuser.com|https://adguard.shoupperuser.com/dns-query|:heavy_check_mark:|Ad & porn blocking, use AdGuard browsing security and parental control web service, support DoT
|silen.org|https://dns.silen.org/dns-query|:heavy_check_mark:|Block ads
|skrep.eu|https://dns.skrep.eu/dns-query|:heavy_check_mark:|OpenNIC, block ads, support DoT & DoQ
|[Silentlybren](https://silentlybren.com/)|https://dns.silentlybren.com/dns-query|:heavy_check_mark:|Adblocking
| Slinkyman.net | https://dns.slinkyman.net/dns-query | :heavy_check_mark: | Adblocking, use Cloudflare upstream, support DoT
|[SmartGuard](https://www.smartguard.io/en#server)|https://dns.smartguard.io/dns-query|:heavy_check_mark:|Customizable policy and filtering, support DoT
|[smilence](https://geili.me)|https://adg.geili.me/dns-query|:heavy_check_mark:|
|solaxy.live|https://solaxy.live/dns-query|:heavy_check_mark:|
|squidmall.vip|https://squidmall.vip/dns-query|:heavy_check_mark:|
|[Startup Stack](https://startupstack.tech)|https://dns.startupstack.tech/dns-query|:heavy_check_mark:| Support DoT
|[SZ DNS](https://www.sz-dns.com)|https://doh.sz-dns.com/dns-query|:heavy_check_mark:| Block ads, Support DoT & DoQ
|stirringphoto.com|https://dns.stirringphoto.com/dns-query|:heavy_check_mark:| Support DoT
|[StormyCloud](https://stormycloud.org/dns)|https://dns.stormycloud.org/dns-query|:heavy_check_mark:|Support DoT
|[Surfshark DNS](https://dns.surfsharkdns.com/)|https://dns.surfsharkdns.com/dns-query|:heavy_check_mark:| Support DoT & DoQ
|suhaila.dev|https://dns.suhaila.dev/dns-query|:heavy_check_mark:|Block ads
|[Sunet DNS](https://wiki.sunet.se/display/DNS/Sunet+DNS) | https://resolver.sunet.se/dns-query |:heavy_check_mark:| Support DoT
|sunnygyl.com|https://sunnygyl.com/dns-query|:heavy_check_mark:|Adblocking, use Cloudflare upstream, support DoT
|[Sunoaki Network](https://sunoaki.net)|https://doh.sunoaki.net/dns-query|:heavy_check_mark:|
|superstefan.win|https://dns.superstefan.win/dns-query|:heavy_check_mark:|Adblocking, use Cloudflare upstream
|[Svoi](https://svoi.dev/)|https://dns.svoi.dev/dns-query| :heavy_check_mark: | 
|[Switch](https://www.switch.ch/en/switch-public-dns)|https://dns.switch.ch/dns-query|:heavy_check_mark:|Block porn & gambling, support DoT
|szpadel.ovh|https://dns.szpadel.ovh/dns-query|:heavy_check_mark:|Block ads, support DoT
| **T**
| t53.de | https://dns.t53.de/dns-query | :heavy_check_mark: | Support DoT
|tecdrive.site|https://tecdrive.site/dns-query|:heavy_check_mark:|
| [Telekom Deutschland](https://telekomhilft.telekom.de/t5/Offentliche-Tests-Umfragen/Telekom-hilft-Labor-Testet-mit-uns-DNS-over-HTTPS/m-p/5008054) | https://dns.telekom.de/dns-query | :heavy_check_mark: |Support DoT
|thebuckners.org|https://dns.thebuckners.org/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
|thethorsens.org|https://blocker.thethorsens.org/dns-query|:heavy_check_mark:|Block ads, use Cloudflare and ControlD upstream, support DoT & DoQ
|[thiz.top](https://dns.thiz.top)|https://dns.thiz.top/dns-query<br>OISD: https://dns.thiz.top/1:IAAgAA==<br>Hagezi: |:heavy_check_mark:|Use Cloudflare upstream, support blocklist customization through Rethink custom path
|[TipsyCoffee](https://tipsy.coffee)|https://dns.tipsy.coffee/dns-query|:heavy_check_mark:|Block ads & gambling, support DoT
| Tls-data.de | https://dns.tls-data.de/dns-query | :heavy_check_mark: |
|tujenasnaszato.xyz|https://tujenasnaszato.xyz/dns-query|:heavy_check_mark:|
| [TWNIC](https://www.twnic.net.tw/) | https://dns.twnic.tw/dns-query | :heavy_check_mark: | No source IP logging. Operated by [Quad101](https://101.101.101.101/index_en.html) project, according to this [announcement](https://blog.twnic.net.tw/2018/12/28/1803/) |
| [Tiarap](https://doh.tiar.app/) | https://doh.tiar.app/dns-query | :heavy_check_mark: | Block ads, tracking, malware, scam and phising domains. No Logging, [dns0x20](https://tools.ietf.org/html/draft-vixie-dnsext-dns0x20-00), No [ECS](https://tools.ietf.org/html/rfc7871), DNSSEC Validation |
|[Tri-DNS](https://dns.triro.net/)|Canada: https://tri-dns.net/dns-query<br>Switzerland: https://eu.tri-dns.net/dns-query<br>Singapore: https://asia.tri-dns.net/dns-query|Support DoT & DoQ
| **U**
[[UK DNS Privacy Project](https://dnsprivacy.org.uk/)|https://resolver.dnsprivacy.org.uk/dns-query|:heavy_check_mark:| Support DoT
|[UncensoredDNS](https://blog.uncensoreddns.org/dns-servers/)|https://anycast.uncensoreddns.org/dns-query|:heavy_check_mark:| Support DoT & DoQ
|unx.io|https://dns.unx.io/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT
|[Usable Privacy](https://docs.usableprivacy.com/dns)|https://adfree.usableprivacy.net/dns-query|:heavy_check_mark:|Block ads, support DoT
| **V**
|vaioswolke.xyz|https://dns.vaioswolke.xyz/dns-query|:heavy_check_mark:|
|[VIA](https://viatech.com.tw)|https://doh.viatech.com.tw/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream
| **W**
|[wang art](https://wang.art)|https://dns.wang.art/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
|waringer-atg.de|https://abel.waringer-atg.de/dns-query|:heavy_check_mark:|
|[Wikimedia DNS](https://wikitech.wikimedia.org/wiki/Wikimedia_DNS)|https://wikimedia-dns.org/dns-query|:heavy_check_mark:|No filtering, no ECS except for Wikimedia-run servers, QNAME minimization enabled, DNSSEC validation enforced. Requests are served by the nearest Wikimedia data center, support DoT
|[W3C TAG](https://w3ctag.org)|https://dns.w3ctag.org/dns-query|:heavy_check_mark:|Support DoT
| **X**
|xlion.tw|https://dns.xlion.tw/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream and AdGuard browsing security web service
| **Y**
| [Yarp](https://yarp.lefolgoc.net/) | https://yarp.lefolgoc.net/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Hosted in France, no logging, support DoT
|[Yuu528](https://yuu-g.net)|https://dns.yuu-g.net/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream, support DoT & DoQ
| **Z**
|[zdn.ro](https://zdn.ro)|https://zdn.ro/dns-query|:heavy_check_mark:|Block ads, use Cloudflare upstream and AdGuard browsing security web service, support DoT & DoQ
|zknt.org|https://doh.zknt.org/dns-query|:heavy_check_mark:|Support DoT
| **0-9**
|123000123.xyz|https://123000123.xyz/dns-query|:heavy_check_mark:|Block ads, use AdGuard browsing security web service, support DoT
|[4NetGuides](https://4netguides.org)|https://ns2.4netguides.org/dns-query|:heavy_check_mark:|Block ads, support DoT
|688447.xyz|https://dns.688447.xyz/dns-query|:heavy_check_mark:|Use Cloudflare upstream
| **Others**
| [@null31](https://ibuki.cgnat.net)| https://ibuki.cgnat.net/dns-query | :heavy_check_mark: | Based in Brazil / doh-server (nginx - unbound) / dot-server (unbound) / DNSSEC / QNAME minimization / Uncensored / no logging, no ECS, hosted on Oracle Cloud VPS by [null31](https://gitlab.com/null31/DoT-DoH-public-config), support DoT
| @publicarray [dns.seby.io](https://dns.seby.io) | https://doh-2.seby.io/dns-query | :heavy_check_mark: | Australian server that runs [@m13253's Go implementation](https://github.com/m13253/dns-over-https), OpenNIC, Unbound with DNSSEC, No ECS, and No logs. Support DoT


*:Tested via `curl --doh-url <RESOLVER_URI> http://google.com`.*
<br> **: Cloudflare/ControlD** upstream means Cloudflare/ControlD can see the queries content and the DoH's IP, but usually not the client's IP unless the DoH server forwards it.<br> False positives or negatives from Cloudflare filtering can be reported through [Cloudflare Radar](https://radar.cloudflare.com/). <br> AdGuard's web service receives [hash prefixes](https://adguard.com/kb/general/browsing-security/#in-apps) of the requested domain.<br>[DoT](https://en.wikipedia.org/wiki/DNS_over_TLS) is the primary protocol for Android's [Private DNS](https://developers.google.com/speed/public-dns/docs/using#android_9_pie_or_higher).<br> [DoQ](https://datatracker.ietf.org/doc/html/rfc9250) send raw DNS query through QUIC stream, skipping HTTP overhead of DoH3

Download a recent snapshot of the above list as JSON from [here](https://github.com/cslev/encrypted_dns_resolvers).

# Private DNS Server with DoH setup examples
| Base | Source | Comment |
|-------------|----------|---------|
| Docker | https://github.com/satishweb/docker-doh | Complete Docker stack using Star Brilliant's [dns-over-https](https://github.com/m13253/dns-over-https) and [Docker Flow Proxy](https://github.com/docker-flow/docker-flow-proxy)
| Docker | https://github.com/coolquasar/dnsproxy | Complete DoH, DoT, and DoQ stack in docker based on Adguard home dnsproxy project. Could host DoH, DoT and DoQ quickly in a cloud server, and run respective clients in local Docker env. It has been tested in Raspberry PI as well

# Supported in browsers and clients

|Name|Version|Comments|
|----|-------|----|
|Firefox|62| [Firefox DNS-over-HTTPS](https://support.mozilla.org/en-US/kb/dns-over-https#w_configure-doh-protection-settings) |
|[Bromite](https://www.bromite.org/)|67.0.3396.88|[How to enable DoH](https://github.com/bromite/bromite/wiki/Enabling-DNS-over-HTTPS)|
|curl| 7.62.0 | See [DOH-implementation](DOH-implementation) |
|[OkHttp](https://github.com/square/okhttp/tree/master/okhttp-dnsoverhttps)| 3.11 | See [Providers](https://github.com/square/okhttp/blob/master/okhttp-dnsoverhttps/src/test/java/okhttp3/dnsoverhttps/DohProviders.java) |
| [curl-doh](https://github.com/curl/doh) | n/a | basic stand-alone DoH client that uses curl |
| Chrome | 66 | https://support.google.com/chrome/answer/10468685#zippy=%2Cuse-a-secure-connection-to-look-up-sites-ip-addresses |
| Windows | 11 | https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support |
| iOS & macOS | iOS 14 & macOS 11 | https://dns.notjakob.com/ | 
| Android || [Intra](https://github.com/Jigsaw-Code/Intra) & [Nebulo](https://github.com/Ch4t4r/Nebulo)

# DOH Tools

|Name|Author/Organization|Comments|
|----|-------|----|
|[AdGuardHome](https://github.com/AdguardTeam/AdGuardHome)|AdGuard|Network-wide ads & trackers blocking DNS server that can call and provide DoT, DoH & DoQ service
|[bulldohzer](https://github.com/commonshost/bulldohzer) | Commonshost | Benchmark DoH and Do53 servers
|[coredns](https://github.com/coredns/coredns)|Cloudflare| CoreDNS is a DNS server/forwarder, written in Go from the Cloud Native Computing Foundation. |
|[dealdoh](https://github.com/noglitchyo/dealdoh)|Maxime Elomari| a middleware to proxy DoH requests to different DNS upstreams, written in PHP.|
|[dns-over-https](https://github.com/m13253/dns-over-https)|Star Brilliant| server-side and client-side implementation, written in Golang|
|[dns2doh](https://github.com/bagder/dns2doh)|Daniel| tool for generating DOH responses and questions.|
|[dnsproxy](https://github.com/AdguardTeam/dnsproxy)|AdGuard|A simple DNS proxy server written in Go that can forward and serve DoT, DoH & DoQ.
|[dnscrypt-proxy](https://github.com/DNSCrypt/dnscrypt-proxy)|Frank Denis|dnscrypt-proxy 2 - A flexible DNS proxy, with support for encrypted DNS protocols.|
|[dnsdist](https://dnsdist.org/)|PowerDNS|supports doh, see <https://dnsdist.org/guides/dns-over-https.html>|
|[dnss](https://github.com/albertito/dnss)|Alberto Bertogli|daemon written in Go which acts as a proxy (the most common use case), and as a server (in case you want end-to-end control).|
|[dnss](https://github.com/albertito/dnss)|Alberto Bertogli|daemon written in Go which acts as a proxy (the most common use case), and as a server (in case you want end-to-end control).|
|[doh-cf-workers](https://github.com/tina-hello/doh-cf-workers)|tina-hello|A single JS file to forward DoH to DoH on Cloudflare Workers
|[doh-gcf](https://github.com/tina-hello/doh-gcf)|tina-hello|A single C# file to forward DoH to DoH/Do53 on Google Cloud Function 
|[doh-js-client](https://github.com/sc0Vu/doh-js-client)|Peter Lai| client-side implementation of DoH, can be used in nodejs backend.|
|[doh-php-client](https://github.com/dcid/doh-php-client)|Daniel Cid| can be used to test and run DoH requests via PHP applications.|
|[doh-proxy](https://facebookexperimental.github.io/doh-proxy/)|Facebook| tools for DoH|
|[doh-proxy](https://github.com/jedisct1/rust-doh)|Frank Denis| server-side proxy in rust|
|[DOHD](https://github.com/dyne/dohd)|[Dyne.org](https://dyne.org)|Very fast and lightweight daemon written in C functioning as a simple proxy for DNS queries over HTTPS using the HTTP/2 protocol and WolfSSL.
|[dohjs](https://github.com/byu-imaal/dohjs) | [BYU IMAAL](https://imaal.byu.edu) | Client DoH JavaScript library for accessing DNS information from web applications. Can be tested at [dohjs.org](https://dohjs.org)
|[DoH](https://github.com/NotMikeDEV/DoH)|NotMikeDEV|A single PHP file to add DoH forwarder on any PHP-capable server
|[EasyDoH](https://github.com/ElevenPaths/EasyDoH)|ElevenPaths| a simple [add-on for Firefox](https://addons.mozilla.org/es/firefox/addon/easydoh/) that allows one to easily activate DNS over HTTPS and its working mode with just one click.|
|[Encrypted DNS Server](https://github.com/jedisct1/encrypted-dns-server)|Frank Denis|can serve DNSCrypt and DoH traffic simultaneously,  written in Rust.|
|[Encrypted-DNS](https://github.com/Siujoeng-Lau/Encrypted-DNS)|Siujoeng Lau| DNS-over-HTTPS forwarder written in Python|
|[FDNS](https://github.com/netblue30/fdns)|netblue30|Firejail DNS-over-HTTPS Proxy Server|
|[godnsbench](https://github.com/ameshkov/godnsbench) | Andrey Meshkov | Benchmark DoH, Do53, DoT and DoQ servers.
|[h2odoh](https://github.com/xm74/h2odoh)|Max Kostikov| an implementation with H2O HTTP/2 server using embedded mruby.|
|[Intra](https://github.com/Jigsaw-Code/Intra) | Jigsaw | DoH client for Android
|[jDnsProxy](https://github.com/moparisthebest/jDnsProxy)|Travis Burtrum| DNS proxy and cache, implementing [DNS-over-TLS](https://tools.ietf.org/html/rfc7858), [DNS-over-HTTPS](https://tools.ietf.org/html/draft-hoffman-dns-over-https), and [Serve-Stale](https://tools.ietf.org/html/draft-ietf-dnsop-serve-stale)|
|[kdig](https://gitlab.nic.cz/knot/knot-dns)|CZ.NIC|Utility that sends one or more DNS queries to a nameserver. Each query can have individual settings, or it can be specified globally via common settings, which must precede query specification. This utility supports DoH.
|[Nebulo](https://github.com/Ch4t4r/Nebulo) | [Daniel Wolf](https://github.com/Ch4t4r) | DoH client for Android
|[nss-tls](https://github.com/dimkr/nss-tls)|Dima Krasner| a daemon that makes gethostbyname(), getaddrinfo(), etc. happen through DoH, without any change to applications, thus transparently migrating all applications that don't use their own resolver (like some browsers) from DNS to DoH.|
|[quart-doh](https://github.com/treussart/quart-doh)|Matthieu Treussart| HTTP/2 server who serves a DOH proxy written in Python, with [Quart](https://pgjones.gitlab.io/quart/index.html) Python web microframework.|
|[RouteDNS](https://github.com/folbricht/routedns)|Frank Olbricht| a flexible stub resolver, proxy, and router with support for DoH, DoT, and plain DNS written in Go.|
|[serverless-dns](https://github.com/serverless-dns/serverless-dns)|[RethinkDNS](https://rethinkdns.com/)| Host your own RethinkDNS instance on Cloudflare Worker, support customizable filter from URL parameter
|[Technitium DNS Server](https://github.com/TechnitiumSoftware/DnsServer)|Technitium|A FOSS, cross-platform DNS Server written in C# that can consume as well as host DNS-over-HTTPS (DoH) and DNS-over-TLS (DoT) services.



# Other

- [Script to parse DoH provider URLs from this wiki page](https://gist.github.com/kimbo/dd65d539970e3a28a10628f15398247b)
- [DNSCrypt.info: Interactive list of public DNS servers:](https://dnscrypt.info/public-servers/)
- [DoH IP domain list](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/DoH%20IP%20domain%20path)
- [Public resolvers](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/public-resolvers.md)
