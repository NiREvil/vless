# DoH - DNS over HTTPS

DoH queries resolve over HTTPS for privacy, performance, and security. DoH also makes it easier to use a name server of your choice instead of the one configured for your system.

# Spec

[RFC 8484 - DNS Queries over HTTPS (DoH)](https://tools.ietf.org/html/rfc8484)

# Publicly available servers

| Who runs it | Base URL | Working*| Comment |
|-------------|----------|---------|---------|
| **A**
| abel.waringer-atg.de | https://abel.waringer-atg.de/dns-query | :heavy_check_mark:| 
| [ABPVN](https://abpvn.com/)|https://vn.dns.abpvn.com/dns-query| :heavy_check_mark:| Adblocking
| [Aquilenet](https://www.aquilenet.fr/)|https://dns.aquilenet.fr/dns-query| :heavy_check_mark:| info https://dns.aquilenet.fr
|[AdFilter](https://adfilter.net/)|Adelaide: https://adl.adfilter.net/dns-query<br>Perth: https://per.adfilter.net/dns-query<br>Sydney: https://syd.adfilter.net/dns-query|:heavy_check_mark:<br>:heavy_check_mark:<br>:heavy_check_mark:|Adblocking, aggregated statistics kept for 30 days
| [AdGuard](https://adguard-dns.io/en/public-dns.html)     | Default: https://dns.adguard-dns.com/dns-query <br> Family protection: https://family.adguard-dns.com/dns-query <br> Uncensored: https://unfiltered.adguard-dns.com/dns-query <br> | :heavy_check_mark: <br>  :heavy_check_mark: <br> :heavy_check_mark: |Default provides ad-blocking at DNS level, while Family protection adds adult site blocking. DNSSEC enabled and TLS 1.3 | 
|[Adrian Lam](https://adrianlam.com/)|https://dns.adrianlam.com/dns-query|:heavy_check_mark:|Adblocking
|[AhaDNS Blitz](https://ahadns.com/blitz/)| Uncensored : https://blitz.ahadns.com <br> OISD filter : https://blitz.ahadns.com/1:1 | :heavy_check_mark: <br> :heavy_check_mark:| [Customizable](https://blitz-setup.ahadns.com/) globally distributed DoH-only server with no logging |
| [AhaDNS](https://ahadns.com) | Netherland:<br> https://doh.nl.ahadns.net/dns-query | :heavy_check_mark: | Deprecated in favor of AhaDNS Blitz |
| alekberg | Amsterdam Non-filtering: https://dnsnl.alekberg.net/dns-query <br> Sweden Non-filtering: https://dnsse.alekberg.net/dns-query <br> Amsterdam Adblocking: https://dnsnl-noads.alekberg.net/dns-query <br> Sweden Non-filtering: https://dnsse-noads.alekberg.net/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:| DoH Servers in Holland and Sweden. No logging, DNSSEC support.|
|[Alibaba Public DNS](https://www.alidns.com/)| https://dns.alidns.com/dns-query| :heavy_check_mark:| [DoH/DoT/DNS Json API](https://www.alidns.com/knowledge?type=SETTING_DOCS), Best DoH/DoT server in China |
|amlegion.org|https://mailer.amlegion.org/dns-query|:heavy_check_mark:|Adblocking
|[Andrew](https://andrewnw.xyz/)|https://dns.andrewnw.xyz/dns-query|:heavy_check_mark:|Ad & porn blocking
|[Andrews & Arnold](https://aa.net.uk/dns) | https://dns.aa.net.uk/dns-query | :heavy_check_mark: | no logging (see [DNS Disclaimer](https://www.aa.net.uk/legal/dohdot-disclaimer/))|
| [Anudeep](https://anudeep.me) | https://secure.anudeep.me/dns-query | :heavy_check_mark: | Adblocking
| [Artikel10](https://dns.artikel10.org/) | https://dns.artikel10.org/dns-query | :heavy_check_mark: | Non-logging service based in Germany
| [Asteroid B612](https://b612.me/) | https://dns.b612.me/dns-query | :heavy_check_mark: |
| [Avast](https://www.avast.com/dns) | https://secure.avastdns.com/dns-query | :heavy_check_mark: | Non-logging
| [Awan.ftp.sh](https://awan.ftp.sh/) | Ads and gambling blocking : https://awan.ftp.sh/dns-query <br> Ads, gambling, drug, tobacco block : https://awan.ftp.sh/no-vice <br> Porn, ads, gambling, drug, tobacco block : https://awan.ftp.sh/noporn-cl <br> Unblocked : https://awan.ftp.sh/unblocked | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Based in Japan
|aws.ketan.dev|https://pihole.aws.ketan.dev/dns-query|:heavy_check_mark:|Adblocking
| **B**
| [Bancuh](https://blog.bancuh.com/adblock-dns/) | Singapore:<br> https://sg-dns1.bancuh.com/dns-query <br> France:<br> https://fr-dns1.bancuh.com/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Adblocking, porn blocking, log available for originating IP
| [BebasDNS](https://github.com/bebasid/bebasdns) | Ad & malware blocking: https://dns.bebasid.com/dns-query <br> Family filter: https://internetsehat.bebasid.com/dns-query  <br> Unfiltered: https://dns.bebasid.com/unfiltered <br> OISD: https://dns.bebasid.com/dns-oisd <br> Hagezi Multi-Normal: https://dns.bebasid.com/dns-hagezi <br> StevenBlack: https://dns.bebasid.com/dns-stevenblack <br> 1Hosts Lite: https://dns.bebasid.com/dns-1hosts <br> AdGuard: https://dns.bebasid.com/dns-adguard <br> Developer's Dan: https://dns.bebasid.com/dns-devdan   | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | 
|bit-trail.nl|https://ns3.bit-trail.nl/dns-query|:heavy_check_mark:|Adblocking
| Bitdefender | https://dns.bitdefender.net/dns-query | :heavy_check_mark: |
| [Blahdns](https://blahdns.com/) | Switzerland: <br>https://doh-ch.blahdns.com/dns-query <br> Germany: <br>https://doh-de.blahdns.com/dns-query <br> Finland: <br>https://doh-fi.blahdns.com/dns-query <br> Singapore: https://doh-sg.blahdns.com/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:  <br> :heavy_check_mark:  | Based on [Go implementation](https://github.com/m13253/dns-over-https), HAProxy + Dnsdist + Knot-resolver with DNSSEC, No ECS, No logs, Adblock
| [Blokada DNS](https://community.blokada.org/t/the-benefits-of-blokada-dns/6646) | https://dns.blokada.org/dns-query | :heavy_check_mark: | No logging.
| [Bortzmeyer](https://www.bortzmeyer.org/doh-bortzmeyer-fr-policy.html) | https://doh.bortzmeyer.fr | :heavy_check_mark: | French-based, non-logging. 
| [Brahma World](https://dns.brahma.world/home.html) | https://dns.brahma.world/dns-query | :heavy_check_mark: | No logging • Blocks Ads + Trackers + Malware + Phishing domains, DNSSEC ready • QNAME Minimization • No EDNS Client-Subnet
|[BT](https://bt.com)|https://doh.bt.com|:heavy_check_mark:|
| [Bunny](https://bunny.net/) | https://doh1.b-cdn.net/dns-query | :heavy_check_mark: | Adblocking
| **C**
| C-dns | https://www.c-dns.com/dns-query | :heavy_check_mark: | 
|[Canarypwn](https://aaaab3n.moe/networks) | Cloudflare upstream: https://doh.aaaab3n.moe/dns-query-114514 | :heavy_check_mark: | 
|[carson-family.com](https://carson-family.com/)|https://dns.carson-family.com/dns-query|:heavy_check_mark:|Ad & porn blocking
| Ccb-net | https://doh.ccb-net.it | :heavy_check_mark: | Adblocking 
| Charter | California: <br>https://doh-01.spectrum.com/dns-query <br> Texas: <br>https://doh-02.spectrum.com/dns-query |:heavy_check_mark:<br>:heavy_check_mark:| Trial - Testing multiple platforms
|[chenu.ch](https://chenu.ch/)|https://dns.chenu.ch/dns-query|:heavy_check_mark:|Adblocking
| [CIRA Canadian Shield](https://www.cira.ca/cybersecurity-services/canadian-shield) | Private: <br>https://private.canadianshield.cira.ca/dns-query <br> Protected: <br>https://protected.canadianshield.cira.ca/dns-query <br> Family: <br>https://family.canadianshield.cira.ca/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Supports DNSSEC, keeps DNS traffic inside Canada. <br> Private: DNS resolution service that keeps your DNS data private from third-parties. <br> Protected: Includes Private features and adds malware and phishing blocking. <br> Family: Includes Protected and Private features and blocks pornographic content. |
| [CIRCL](https://www.circl.lu/) | https://dns.circl.lu/dns-query  | :heavy_check_mark:| Adblocking
| [Cisco Umbrella (OpenDNS)](https://support.opendns.com/hc/en-us/articles/360038086532-Using-DNS-over-HTTPS-DoH-with-OpenDNS) | Standard: https://doh.opendns.com/dns-query <br> FamilyShield (blocks adult content):  https://doh.familyshield.opendns.com/dns-query | :heavy_check_mark: <br><br> :heavy_check_mark:| DNSSEC, Anycast
| Clanless.ovh | https://dns.clanless.ovh/dns-query | :heavy_check_mark:| Adblocking
| [CleanBrowsing](https://cleanbrowsing.org/help/docs/dnsoverhttps/) | https://doh.cleanbrowsing.org/doh/family-filter/ <br><br> Filter that allows some mixed-content sites: https://doh.cleanbrowsing.org/doh/adult-filter/ <br><br> Malware blocking only: https://doh.cleanbrowsing.org/doh/security-filter/ | :heavy_check_mark: | anycast DoH server with parental control (restricts access to adult content + enforces safe search)
|cloud.198.games|https://cloud.198.games/dns-query|:heavy_check_mark:| Adblocking
| [Cloudflare](https://developers.cloudflare.com/1.1.1.1/)  | https://cloudflare-dns.com/dns-query <br><br> Mozilla: https://mozilla.cloudflare-dns.com/dns-query <br><br> Block Malware: https://security.cloudflare-dns.com/dns-query <br><br> Block Malware and Adult Content: https://family.cloudflare-dns.com/dns-query <br><br> DNS64: https://dns64.cloudflare-dns.com/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Supports both -04 and -13 content-types
| [Control D](https://controld.com/free-dns) | Unfiltered: <br> https://freedns.controld.com/p0 <br> Malware (Block Malware): <br> https://freedns.controld.com/p1 <br> Ads & Tracking (Block Malware + Ads & Tracking): <br> https://freedns.controld.com/p2 <br> Social (Block Malware + Ads & Tracking + Social Networks): <br>https://freedns.controld.com/p3 <br> Family Friendly (Block Malware + Ads & Tracking + Adult Content + Drugs): <br> https://freedns.controld.com/family <br> Uncensored (Unblock censored domains from various countries) <br> https://freedns.controld.com/uncensored <br><br> - 3rd Party Filters - <br><br> OISD - Full: <br> https://freedns.controld.com/x-oisd <br> OISD - Basic: <br> https://freedns.controld.com/x-oisd-basic <br> StevenBlack Unified: <br> https://freedns.controld.com/x-stevenblack <br> Dev Dan's Hosts: <br> https://freedns.controld.com/x-devdan <br> 1Hosts - Mini: <br> https://freedns.controld.com/x-1hosts-mini <br> 1Hosts - Lite: <br> https://freedns.controld.com/x-1hosts-lite <br> 1Hosts - Pro: <br> https://freedns.controld.com/x-1hosts-pro <br> Hagezi's DNS - Light <br> https://freedns.controld.com/x-hagezi-light <br> Hagezi's DNS - Normal: <br> https://freedns.controld.com/x-hagezi-normal <br> Hagezi's DNS - Pro: <br> https://freedns.controld.com/x-hagezi-pro <br> Hagezi's DNS - Pro Plus: <br> https://freedns.controld.com/x-hagezi-proplus <br> Hagezi's DNS - Ultimate: <br> https://freedns.controld.com/x-hagezi-ultimate <br> Hagezi's DNS - TIF (Threat Intelligence Feeds) <br> https://freedns.controld.com/x-hagezi-tif <br> GoodbyeAds: <br> https://freedns.controld.com/x-goodbyeads <br> AdGuard Filter: <br> https://freedns.controld.com/x-adguard <br> | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark:<br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | ControlD is a fully customizable anycast DNS service that allows you to not only block annoyances like malware, tracking, ads, IoT telemetry, and more but also unblock over 180 services through a network of proxies in over 100 cities.
|[CynthiaLabs](https://cynthialabs.net/)|https://dns.cynthialabs.net/dns-query|:heavy_check_mark:|Adblocking
| [CZ.NIC](https://www.nic.cz/odvr/) | https://odvr.nic.cz/dns-query | :heavy_check_mark:| Runs on [Knot Resolver](https://www.knot-resolver.cz/) (`doh2`), supports DNSSEC, provided by `.cz` TLD operator
| **D**
| [Daniel Woffinden](https://daw.dev/) | https://dns.daw.dev/dns-query | :heavy_check_mark: | Adblocking
| [Danielle McLean](https://00dani.me/) | https://ns.00dani.me/dns-query | :heavy_check_mark: |
|darkness.is.my.waifu|https://darkness.is.my.waifu.cz/dns-query|:heavy_check_mark:|
| [data.haus](https://data.haus/) | https://mail.data.haus/dns-query | :heavy_check_mark: | Adblocking, non-logging
| [Datahata.by](https://doh.datahata.by/) | https://doh.datahata.by/dns-query | :heavy_check_mark: |
| [Digitale Gesellschaft](https://www.digitale-gesellschaft.ch/) |  https://dns.digitale-gesellschaft.ch/dns-query | :heavy_check_mark: | No query/IP logging, no filtering, QNAME minimization, TLS 1.3, DNSSEC; https://www.digitale-gesellschaft.ch/dns/ |
| Disconnect.app | https://doh.disconnect.app/dns-query | :heavy_check_mark: | 
| [dns0.eu](https://www.dns0.eu/) | Non-blocking: https://open.dns0.eu<br>Malware blocking: https://dns0.eu<br>Hardened security: https://zero.dns0.eu<br>Child safe: https://kids.dns0.eu | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:| Non-logging, GDPR compliant
| [dnscry.pt](https://www.dnscry.pt/) | Allentown: https://abe01.dnscry.pt/dns-query<br>Amsterdam Terrahost: https://ams01.dnscry.pt/dns-query<br>Amsterdam CrownCloud: https://ams02.dnscry.pt/dns-query<br>Atlanta: https://atl01.dnscry.pt/dns-query<br>Castlegar: https://ycg01.dnscry.pt/dns-query<br>Chicago: https://ord01.dnscry.pt/dns-query<br>Coeur d'Alene: https://coe01.dnscry.pt/dns-query<br>Coventry: https://cvt01.dnscry.pt/dns-query<br>Dallas: https://dfw01.dnscry.pt/dns-query<br>Detroit: https://dtw01.dnscry.pt/dns-query<br>Durham: https://rdu01.dnscry.pt/dns-query<br>Düsseldorf: https://dus01.dnscry.pt/dns-query<br>Frankfurt: https://fra01.dnscry.pt/dns-query<br>Hong Kong: https://hkg01.dnscry.pt/dns-query<br>Johannesburg: https://jnb01.dnscry.pt/dns-query<br>Las Vegas: https://las01.dnscry.pt/dns-query<br>Liberty Lake: https://llk01.dnscry.pt/dns-query<br>London: https://lon01.dnscry.pt/dns-query<br>Los Angeles Webhosting24: https://lax01.dnscry.pt/dns-query<br>Los Angeles CrownCloud: https://lax02.dnscry.pt/dns-query<br>Miami: https://mia01.dnscry.pt/dns-query<br>Munich: https://muc01.dnscry.pt/dns-query<br>Naaldwijk: https://naw01.dnscry.pt/dns-query<br>New York: https://nyc01.dnscry.pt/dns-query<br>Philadelphia: https://phl01.dnscry.pt/dns-query<br>Phoenix: https://phx01.dnscry.pt/dns-query<br>Portland: https://pdx01.dnscry.pt/dns-query<br>Salt Lake City: https://slc01.dnscry.pt/dns-query<br>Sandefjord: https://trf01.dnscry.pt/dns-query<br>Singapore: https://sin01.dnscry.pt/dns-query<br>Sofia: https://sof01.dnscry.pt/dns-query<br>Spokane: https://geg01.dnscry.pt/dns-query<br>Stockholm: https://sto01.dnscry.pt/dns-query<br>Sydney: https://syd01.dnscry.pt/dns-query<br>Tallinn: https://tll01.dnscry.pt/dns-query<br>Tampa: https://tpa01.dnscry.pt/dns-query<br>Valdivia: https://zal01.dnscry.pt/dns-query<br>Vienna: https://vie01.dnscry.pt/dns-query<br>Warsaw Skhron: https://waw02.dnscry.pt/dns-query| :heavy_check_mark:| Support IPv4+IPv6, uncensored, unfiltered, encrypted, DNSSEC, no logging.
| [DNS Free](https://dns-free.link/) | Adblocking: https://dns-free.link/dns-query <br> Ad & porn blocking: https://dns-free.link/family | :heavy_check_mark: <br> :heavy_check_mark: |
| [DNS For Family](https://dnsforfamily.com/#DNS_Servers_DNS_Over_HTTPS) | https://dns-doh.dnsforfamily.com/dns-query | :heavy_check_mark: | Filter websites for family use, and enforces safe search in Google, YouTube, Bing, DuckDuckGo and Yandex. DNSSEC-ready, non-logging
| [dns.digitalsize.net](https://dns.digitalsize.net/) | https://dns.digitalsize.net/dns-query | :heavy_check_mark: | A public, non-tracking, non-filtering DNS resolver with DNSSEC enabled and hosted in Germany |
|dns.expert|https://dns.expert/dns-query| :heavy_check_mark: |
| [DNS.SB](https://dns.sb/doh/) | https://doh.dns.sb/dns-query <br> https://doh.sb/dns-query | :heavy_check_mark: <br> :heavy_check_mark:| DNSSEC & QNAME minimization enabled, no logging |
|[DNS4all](https://dns4all.eu/)|https://doh.dns4all.eu/dns-query|:heavy_check_mark:| Non-logging
| [dnsforge.de](https://dnsforge.de/) | https://dnsforge.de/dns-query |:heavy_check_mark:|  No logging. Support DNSSEC. Hosted in Germany|
| [dnsHome.de](https://www.dnshome.de/doh-dot-public-resolver.php) |  https://dns.dnshome.de/dns-query | :heavy_check_mark:| DoH Server in Germany. No logging, No filtering, DNSSEC and own DNS Resolver |
| [dnslow.me](https://dnslow.me/) | https://dnslow.me/dns-query | :heavy_check_mark: | A protective DNS that blocks Ads, Malware, Trackers, Phishing and Newly Registered Domains. Randomly forward requests to different upstreams for enhanced privacy. |
| [DNSPod](https://docs.dnspod.cn/public-dns/dot-doh/) | https://dns.pub/dns-query | :heavy_check_mark: | Operated by Tencent Cloud
| [dnswarden](https://dnswarden.com)| Adblock - <br> https://dns.dnswarden.com/adblock <br><br> Uncensored -<br> https://dns.dnswarden.com/uncensored <br><br> AdultFilter - <br>  https://dns.dnswarden.com/adultfilter | <br>:heavy_check_mark:<br><br><br> :heavy_check_mark:<br><br><br>:heavy_check_mark: | A zero logging DNS with support for DNS-over-HTTPS (DoH), DNS-over-TLS (DoT) & Dnscrypt. Supports DNSSEC, TLS 1.3, QNAME minimization and does own Recursion. EDNS Client Subnet is disabled.<br> Provides 4 different types of filtering options.<br> Adblock - Blocks ads, trackers, viruses, and telemetry.<br> Adultfilter - Blocks adult content, enforces safe search, and includes all the features from adblock. <br> Uncensored - Unrestricted access/no filtering.<br>[Custom Filter](https://dnswarden.com/customfilter.html) where you can choose your own filter lists! <br>For more information look [here](https://github.com/bhanupratapys/dnswarden) or [here](https://dnswarden.com). |
|doh.best|https://dns.doh.best/dns-query|:heavy_check_mark:|Adblocking
|dscloud.me|https://doh.dscloud.me/dns-query|:heavy_check_mark:|Adblocking
| [Dukun.de](https://dukun.de/) |https://dukun.de/dns-query | :heavy_check_mark: |
| **E**
|[EasyMosdns](https://doh.apad.pro/)|https://doh.apad.pro/dns-query|:heavy_check_mark:|
| [Edgy DNS](https://edgy.network/dns) | https://edgy-dns.com/dns-query | :heavy_check_mark: | Adblocking
| [Emiliyan Parvanov](https://emiliyan.com/) | https://dns.emiliyan.com/dns-query | :heavy_check_mark: | Adblocking
|[Extrawdw](https://extrawdw.net/)|https://dns.extrawdw.net/dns-query|:heavy_check_mark:|Adblocking
| **F**
| [FAELIX](https://faelix.net/) | https://rdns.faelix.net/ <br> Adblocking: https://pdns.faelix.net/ | :heavy_check_mark: <br> :heavy_check_mark: | No logging, based on dnsdist-doh RC querying our powerdns-recursor resolvers, multiple nodes in UK and CH, [more info](https://faelix.net/ref/dns/#resolving-nameservers) |
| Fancyorg.at | https://dns.fancyorg.at/dns-query |  :heavy_check_mark: | Adblocking
| [FDN](https://www.fdn.fr/) - French Data Network | https://ns0.fdn.fr/dns-query <br> https://ns1.fdn.fr/dns-query |:heavy_check_mark:| No log, no filter, DNSSEC, … ([more informations in French](https://www.fdn.fr/ouverture-des-services-dot-doh/)) |
|[ff0x](https://ff0x.ca/)|https://ag.ff0x.ca/dns-query|:heavy_check_mark:|Adblocking
| [ffmuc.net](https://ffmuc.net/wiki/doku.php?id=knb:dohdot_en) | https://doh.ffmuc.net/dns-query | :heavy_check_mark:| DoH-Server of Freifunk München. No logging, no filter, DNSSEC, own recursion. More in our [wiki](https://ffmuc.net/wiki/doku.php?id=knb:dohdot_en) | 
| Flm9.net | https://dns01.flm9.net/dns-query |  :heavy_check_mark: |
| [Foundation for Applied Privacy](https://applied-privacy.net) | https://doh.applied-privacy.net/query | :heavy_check_mark:| No query/IP logging, no filtering, QNAME minimization, no EDNS client subnet, TLS 1.3, DNSSEC, RFC7706, RFC8198; https://applied-privacy.net/services/dns/ |
| [Froth.zone](https://dns.froth.zone/resolver) | https://dns.froth.zone/dns-query | :heavy_check_mark: | OpenNIC
| [FutaDNS](https://site.futa.gg/) | https://doh.futa.gg/dns-query | :heavy_check_mark: | Based in Taiwan, query logged for 24 hours, adblocking.
| **G**
|[Gensokyo](https://freyja.pw/)|https://dns.freyja.pw/dns-query|:heavy_check_mark:|Adblocking
| [Google](https://developers.google.com/speed/public-dns/docs/doh) | https://dns.google/dns-query <br> DNS64: https://dns64.dns.google/dns-query <br> https://8888.google/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark:| Full RFC 8484 support, EDNS, no filtering.
| [Gustavus Adolphus College](https://gustavus.edu/) | https://cluster-0.gac.edu/dns-query <br> https://cluster-1.gac.edu/dns-query | :heavy_check_mark: <br> :heavy_check_mark:| 
| **H**
| [Hostux.net](https://dns.hostux.net) |  Adblocking DNS: <br> https://dns.hostux.net/ads | :heavy_check_mark: |DNSSEC, no EDNS Client-Subnet, not logging queries' content, hosted in Luxembourg.
|[Hurrican Electric](https://forums.he.net/index.php?topic=3996.0) | https://ordns.he.net/dns-query| :heavy_check_mark:| 
| Huque | https://doth.huque.com/dns-query | :heavy_check_mark: | 
| **I**
| ihctw | https://ihctw.synology.me/dns-query | :heavy_check_mark: | Adblocking
| [In-Berlin](https://www.in-berlin.de/) | https://dns1.in-berlin.de/dns-query | :heavy_check_mark: |
| [Institut national de recherche en sciences et technologies du numérique](https://www.inria.fr/fr) | https://qlf-doh.inria.fr/dns-query | :heavy_check_mark: |
| [Institute of Operating Systems and Computer Networks](https://wiki.ibr.cs.tu-bs.de/en/services) | https://doh.ibr.cs.tu-bs.de/dns-query | :heavy_check_mark: |
| [Internet Initiative Japan](https://public.dns.iij.jp/) | https://public.dns.iij.jp/dns-query | :heavy_check_mark: | Planned to run until March 2024 
|[ITXE](https://x.gy/article/moedns) | https://pdns.itxe.net/dns-query|:heavy_check_mark:|Adblocking
|[ivnkn](https://ivnkn.xyz/)|https://ivnkn.xyz/dns-query|:heavy_check_mark:|
| **J**
|[Jack Stockley](https://jstockley.com/)|https://dns.jstockley.com/dns-query|:heavy_check_mark:|Adblocking
| Jackyes.ovh | https://jackyes.ovh/dns-query | :heavy_check_mark: | Adblocking
| Jfchenier.ca | https://adguard.jfchenier.ca/dns-query | :heavy_check_mark: | Adblocking
| [Jonas Hahnfeld](https://www.hahnjo.de/) | https://dns.hahnjo.de/dns-query | :heavy_check_mark: |
| [jp.tiar.app](https://jp.tiar.app/) | https://jp.tiar.app/dns-query <br> https://jp.tiarap.org/dns-query | :heavy_check_mark: | No Censorship, No Logging, No ECS, support DNSSEC in Japan |
| **K**
| [Kamil Szczepański](https://kamilszczepanski.com/) | https://dns.kamilszczepanski.com/dns-query | :heavy_check_mark: | Adblocking
|[Karl.ONE](https://karl.one/)|https://dns.karl.one/dns-query|:heavy_check_mark:|Adblocking
| [Kernel-error](https://www.kernel-error.de/2022/03/18/bind-9-18-mit-doh-und-dot/) | https://dns.kernel-error.de/dns-query | :heavy_check_mark: |
| [kescherDNS](https://dns.kescher.at/) | https://dns.kescher.at/dns-query | :heavy_check_mark: | Non-logging, hosted in Vienna and Düsseldorf
|[Kimiblock](https://blog.kimiblock.top/2023/02/05/MoeDNS-%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8%E5%8A%A0%E5%AF%86%E7%9A%84%E5%AE%89%E5%85%A8-DNS/) | https://blog.kimiblock.top/redirect/resolve | :heavy_check_mark:|
|[Kishore](https://avdkishore.dev/)|https://adguard.avdkishore.dev/dns-query|:heavy_check_mark:|
|Konikoni428|https://adguard.konikoni428.com/dns-query|:heavy_check_mark:|Adblocking
| Krnl.eu | https://xray.krnl.eu/dns-query | :heavy_check_mark: | Adblocking
| **L**
| [La Contre-Voie](https://lacontrevoie.fr/en/services/doh/) | https://doh.lacontrevoie.fr/dns-query | :heavy_check_mark: | Supports DNSSEC and IPv6, not logging queries' content, uses [unbound](https://github.com/NLnetLabs/unbound/). Commits for net neutrality, hosted in France.
| [Lastentarvike](https://lastentarvike.fi) | https://lastentarvike.fi/dns-query | :heavy_check_mark: |
| [LavaDNS](https://dns.lavate.ch/) | Finland: https://eu1.dns.lavate.ch/dns-query | :heavy_check_mark: | DoH server in Finland. No logging, no filtering, no ECS, DNSSEC support. |
|lege.despagne.net|https://adguard.lege.despagne.net/dns-query|:heavy_check_mark:|Adblocking
|[LibreDNS](https://libredns.gr/) | Non-filtering: https://doh.libredns.gr/dns-query <br> Adblocking: https://doh.libredns.gr/noads| :heavy_check_mark: <br> :heavy_check_mark: | Non-logging, OpenNIC.
| [Lindung](https://lindung.pp.ua/) | Adblocking: https://lindung.pp.ua/dns-query <br> Ad & porn blocking: https://lindung.pp.ua/family | :heavy_check_mark: <br> :heavy_check_mark: |
|[loNET](https://dns.lonet.org/) | Germany 1: https://doh.phdns1.lonet.org/dns-query <br>Germany 2: https://doh.phdns2.lonet.org/dns-query <br>United States: https://doh.phdns3.lonet.org/dns-query <br>Spain: https://doh.phdns4.lonet.org/dns-query <br>United Kingdom: https://doh.phdns5.lonet.org/dns-query <br>  | :heavy_check_mark:|Adblocking
| **M**
| [Masters of Cloud](https://www.masters-of-cloud.de/) | https://masters-of-cloud.de/dns-query | :heavy_check_mark: | 
| [Maxindo Mitra Solusi](https://www.maxindo.net.id/) | https://doh.max.net.id/dns-query | :heavy_check_mark: | 
|meddy94.de|https://adguard.meddy94.de/dns-query|:heavy_check_mark:|Adblocking
| [MegaNerd](https://meganerd.nl/encrypted-dns-server) | https://snoke.meganerd.nl/dns-query | :heavy_check_mark: | No logging, no filtering, DNSSEC, based in the Netherlands
| mmmalia | https://doh.mmmalia.com/dns-query | :heavy_check_mark: | Ad & porn blocking
|[modr.club](https://modr.club/)|https://ps1.modr.club/dns-query|:heavy_check_mark:|
| [Molinero](https://molinero.dev/) | https://dns.molinero.dev/dns-query | :heavy_check_mark: | Adblocking
| [Mullvad](https://mullvad.net/en/help/dns-over-https-and-dns-over-tls/) | Non-blocking https://dns.mullvad.net/dns-query <br> Adblocking https://adblock.dns.mullvad.net/dns-query <br> Ad & malware blocking https://base.dns.mullvad.net/dns-query <br> Ad, malware, social media blocking https://extended.dns.mullvad.net/dns-query <br> Ad, malware, social media, adult content and gamble blocking https://all.dns.mullvad.net/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Public DoH server in US, DE, GB, SG, and SE with QNAME minimization, audited by [Assured](https://www.assured.se/wp-content/uploads/2021/03/Assured_Mullvad_DoH_server_audit_report.pdf)
| [mydns.network](https://mydns.network) | Uncensored: https://freedom.mydns.network/dns-query <br> Paranoia (no Google/Cloudflare): https://paranoia.mydns.network/dns-query <br> Adblocking: https://adblock.mydns.network/dns-query <br> Family: https://family.mydns.network/dns-query | :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: <br> :heavy_check_mark: | Public DoH server powered by Cloudflare Workers. Uniquely disguises your queries by relaying queries your behalf to upstream DoH servers with no IP address information. [Open source](https://github.com/matthewgall/doh-proxy), deploy your own instance at any time!
| Myon | https://blackhole.myon.lu/dns-query | :heavy_check_mark: | Adblocking
| **N**
|nas-server.ru|https://dns.nas-server.ru/dns-query|:heavy_check_mark:|Adblocking
|[ndom91](https://ndo.dev/posts/doh)|https://dns.ndo.dev/dns-query|:heavy_check_mark:|Adblocking, non-logging, self recursive resolve, no ECS, QNAME minimization, DNSSEC, hosted in Frankfurt
| Nexific.it | https://doh.luigi.nexific.it/dns-query | :heavy_check_mark:|
| [NextDNS](https://nextdns.io) | https://dns.nextdns.io | :heavy_check_mark: | The first cloud-based private DNS service that gives you full control over what is allowed and what is blocked on the Internet. 300,000 domain resolution per month is free with non-filtering afterward until the end of the month. Granular dashboard, Each account can create multiple configurations, which can be used for multiple devices with prefixes to track activities on the dashboard. [Create a config ID](https://my.nextdns.io/start)
| Nhtsky | https://dns.nhtsky.com/dns-query | :heavy_check_mark: | Adblocking
| [NIC.LV](https://doh.lv/) | https://doh.lv/dns-query <br> https://doh.nic.lv/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Run by .lv TLD registry 
|nielsdb.be|https://dns1.nielsdb.be/dns-query|:heavy_check_mark:|Adblocking
| [NiYaWe](https://www.niyawe.de/) | https://doh.niyawe.de/dns-query | :heavy_check_mark: |
| [Njalla](https://dns.njal.la/) | https://dns.njal.la/dns-query | :heavy_check_mark: | Non logging, based in Sweden
| [No Ad DNS](https://noaddns.com/) | https://resolver.noaddns.com/dns-query | :heavy_check_mark: | Adblocking
| [Node15](https://node15.com/) | https://pi1.node15.com/dns-query | :heavy_check_mark: | Block ads and porn
|[nolo.ltd](https://nolo.ltd/)|https://sink.nolo.ltd/dns-query|:heavy_check_mark:|Adblocking
|[Noridev](https://adblock.noridev.moe/html/dns_android.html) | https://1.dns.noridev.moe/dns-query |:heavy_check_mark:|Adblocking
|[novali.date](https://novali.date/)|https://dns.novali.date/dns-query|:heavy_check_mark:|Adblocking
| **O**
|[ofdoom.net](https://ofdoom.net/)|https://dns.ofdoom.net/dns-query|:heavy_check_mark:|Adblocking
|[OneDNS.cc](https://onedns.cc/)|https://secure.onedns.cc/dns-query|:heavy_check_mark:|Adblocking
|[OpenBLD.net](https://openbld.net/) | Adapted: https://ada.openbld.net/dns-query <br> Strict: https://ric.openbld.net/dns-query |:heavy_check_mark: <br> :heavy_check_mark:|Adblocking
| [Ozérim](https://ozer.im/) | https://1a.ns.ozer.im/dns-query | :heavy_check_mark: | Adblocking
| **P**
| [PaesaDNS](https://milgradesec.github.io/paesadns/) | https://dns.paesa.es/dns-query | :heavy_check_mark: | Adblocking, non-logging
| Path of Grace | https://doh.gcp.pathofgrace.com/dns-query | :heavy_check_mark: | Adblocking
|[PersianNIT](https://persiannit.net/)|https://darya.persiannit.net/dns-query|:heavy_check_mark:|Adblocking
| **Q**
| [Qihoo 360](https://360.cn) | https://doh.360.cn/dns-query | :heavy_check_mark: | Based in China
| [qquackDNS](https://qquack.org/nameserver) | https://ns1.qquack.org/dns-query | :heavy_check_mark: | Adblocking, non-logging
| [Quad9](https://quad9.net) | https://dns.quad9.net/dns-query | ✔️ | Blocks malware
|[QWER DNS](https://dns.qwer.pw/)|https://ant.dns.qwer.pw/dns-query<br>https://dog.dns.qwer.pw/dns-query<br>https://lion.dns.qwer.pw/dns-query<br>https://tiger.dns.qwer.pw/dns-query<br>https://frog.dns.qwer.pw/dns-query|:heavy_check_mark:<br>:heavy_check_mark:<br>:heavy_check_mark:<br>:heavy_check_mark:<br>:heavy_check_mark:|Adblocking
| **R**
| [R0cket](https://resolver.r0cket.net/) | https://resolver.r0cket.net/dns-query | :heavy_check_mark: | Adblocking, queries are logged and monitored when there's abuse
| reckoningslug | https://dns.reckoningslug.name/dns-query | :heavy_check_mark: |
| [Restena](https://www.restena.lu/en/service/public-dns-resolver) | https://kaitain.restena.lu/dns-query | :heavy_check_mark: | Based in Luxembourg, DNSSEC, minimal logging for technical functions
| [RethinkDNS](https://www.rethinkdns.com/) | Non-filtering: https://sky.rethinkdns.com/dns-query <br> OISD: https://sky.rethinkdns.com/1:IAAgAA== | :heavy_check_mark: <br> :heavy_check_mark: | [An open-source stub resolver](https://github.com/serverless-dns/serverless-dns) running in 200+ locations world-wide on Cloudfare's network. Fast, secure, private, transparent, configurable DNS resolver. No ECS. Implements CNAME Cloaking. No-logs. [code](https://github.com/celzero/rethink-app). [Configure custom blocklists](https://rethinkdns.com/configure)
| [Rezhajul](https://doh.rezhajul.io/) | https://doh.rezhajul.io/dns-query | :heavy_check_mark: | No Logging, DNSSEC enabled, 1.7M+ hosts filtered (ads, tracker, malware, spam, coinminer and phising).
| [rferee.dev](https://rferee.dev/setup/dns/) | https://resolver.rferee.dev/dns-query/ |:heavy_check_mark:|Adblocking
| Rin.sh | https://dns.rin.sh/dns-query | :heavy_check_mark: |
| [RoTunneling](https://www.rotunneling.net/rotunneling-doh-free/) | https://dns.rotunneling.net/dns-query/public | :heavy_check_mark: | Adblocking
| **S**
| [SafeServe](https://www.namecheap.com/dns/free-public-dns/) | https://safeservedns.com/dns-query | :heavy_check_mark: | Operated by Namecheap
| [Safe Surfer](https://safesurfer.io/) | https://doh.safesurfer.io/dns-query | :heavy_check_mark: | Filter porn sites, enforce safe search
|[Saikat](https://rsaikat.com/)|https://o.rsaikat.com/dns-query|:heavy_check_mark:|Adblocking
| sarak.as | https://dns.sarak.as/dns-query | :heavy_check_mark:| Ad & porn blocking
|[sev.monster](https://sev.monster/)|https://dns.sev.monster/dns-query|:heavy_check_mark:|
| [Shecan](https://shecan.ir/) | https://free.shecan.ir/dns-query <br> https://dns.shecan.ir/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Based in Iran, proxies sanctioned websites
| Shuting | https://adguard.shuting.idv.tw/dns-query | :heavy_check_mark: | Adblocking
| Silen.org | https://dns.silen.org/dns-query | :heavy_check_mark: | Adblocking
|[Silentlybren](https://silentlybren.com/)|https://dns.silentlybren.com/dns-query|:heavy_check_mark:|Adblocking
|skrep.eu|https://dns.skrep.eu/dns-query|:heavy_check_mark:|Adblocking
| Slinkyman.net | https://dns.slinkyman.net/dns-query | :heavy_check_mark: | Adblocking
| [Softcom](https://www.softcom.net/) | https://clientdns3.softcom.net/dns-query | :heavy_check_mark: |
|[spacedns.org](https://spacedns.org/index.html)| https://spacedns.org/dns-query | :heavy_check_mark: | Adblocking, hosted in Poland
| [Startup Stack](https://startupstack.tech/) | https://dns.startupstack.tech/dns-query | :heavy_check_mark: |
| [Sundalandia](https://sundalandia.pp.ua) | Adblock https://sundalandia.pp.ua/dns-query <br> Family filter https://sundalandia.pp.ua/family | :heavy_check_mark: <br> :heavy_check_mark: |
| [SWITCH](https://www.switch.ch/security/info/public-dns/) | https://dns.switch.ch/dns-query | :heavy_check_mark: | DNSSEC validation protects from forged or manipulated DNS data from upstream servers, DNS Query Name Minimisation to improve privacy, [SWITCH DNS Firewall](https://www.switch.ch/dns-firewall/) blocks access to infected or malicious websites and redirects users to a landing page |
| [Syaifullah](https://blog.syaifullah.com/public-dns-services/) | https://dns.syaifullah.com/dns-query | :heavy_check_mark: | Adblocking
| [Syshero](https://syshero.org/) | https://doh.syshero.org/dns-query | :heavy_check_mark: | 
| **T**
| t53.de | https://dns.t53.de/dns-query | :heavy_check_mark: |
| [Telekom Deutschland](https://telekomhilft.telekom.de/t5/Offentliche-Tests-Umfragen/Telekom-hilft-Labor-Testet-mit-uns-DNS-over-HTTPS/m-p/5008054) | https://dns.telekom.de/dns-query | :heavy_check_mark: | 
| [Tiarap](https://doh.tiar.app) | https://doh.tiar.app/dns-query <br> https://doh.tiarap.org/dns-query | :heavy_check_mark: <br> :heavy_check_mark: |Based in Singapore, No logging, block Ad/Ad-tracking/Malware, No ECS, DNSSEC |
| Timmes.nl | https://timmes.nl/dns-query | :heavy_check_mark: | Adblocking
| Tls-data.de | https://dns.tls-data.de/dns-query | :heavy_check_mark: |
| [TWNIC](https://www.twnic.net.tw/) | https://dns.twnic.tw/dns-query | :heavy_check_mark: | No source IP logging. Operated by [Quad101](https://101.101.101.101/index_en.html) project, according to this [announcement](https://blog.twnic.net.tw/2018/12/28/1803/) |
| **U**
| [Unstoppable Domains](https://docs.unstoppabledomains.com/d-websites/resolving-dwebsites-in-a-browser/) | https://resolver.unstoppable.io/dns-query | :heavy_check_mark: | Also resolve `.crypto` TLD of Unstoppable Domains.
| **V**
| [Virga DNS](https://virga.pp.ua) | Adblocking https://virga.pp.ua/dns-query <br> Adblocking & porn blocking https://virga.pp.ua/porn | :heavy_check_mark: <br> :heavy_check_mark: | Server in Japan
| **W**
|[Wang Art](https://wang.art/)|https://dns.wang.art/dns-query|:heavy_check_mark:|Adblocking
|[Wikimedia DNS](https://wikitech.wikimedia.org/wiki/Wikimedia_DNS)|https://wikimedia-dns.org/dns-query|:heavy_check_mark:|No filtering, no ECS except for Wikimedia-run servers, QNAME minimization enabled, DNSSEC validation enforced. Requests are served by the nearest Wikimedia data center.
| workfordemo.co.in | https://agh.workfordemo.co.in/dns-query |:heavy_check_mark:|Adblocking
| **X**
| [xcom.pro](https://doh.xcom.pro/) | https://doh.xcom.pro/dns-query | :heavy_check_mark: | Adblocking
| **Y**
| [Yandex DNS](https://dns.yandex.com/) | Basic: https://common.dot.dns.yandex.net/dns-query <br> Safe: https://safe.dot.dns.yandex.net/dns-query <br> Family: https://family.dot.dns.yandex.net/dns-query <br>|:heavy_check_mark:<br>:heavy_check_mark:<br>:heavy_check_mark:|
| [Yarp](https://yarp.lefolgoc.net/) | https://yarp.lefolgoc.net/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Hosted in France, no logging.
| **0-9**
|[0ms.dev](https://0ms.dev/)|https://cdn.0ms.dev/dns-query|:heavy_check_mark:|Adblocking
|4-the.win|https://dns.4-the.win/dns-query|:heavy_check_mark:|
|52306.org|https://dns.52306.org/dns-query|:heavy_check_mark:|
| [5ososea](https://www.5ososea.com/) | Ad & porn blocking: https://family.5ososea.com/dns-query <br> Ad & porn blocking with safe search: https://kids.5ososea.com/dns-query | :heavy_check_mark: <br> :heavy_check_mark: | Hosted in Germany, query logged for 24 hours.
| **Others**
| [@null31](https://ibuki.cgnat.net)| https://ibuki.cgnat.net/dns-query | :heavy_check_mark: | Based in Brazil / doh-server (nginx - unbound) / dot-server (unbound) / DNSSEC / QNAME minimization / Uncensored / no logging, no ECS, hosted on Oracle Cloud VPS by [null31](https://gitlab.com/null31/DoT-DoH-public-config). |
| @publicarray [dns.seby.io](https://dns.seby.io) | https://doh-2.seby.io/dns-query | :heavy_check_mark: | Australian server that runs [@m13253's Go implementation](https://github.com/m13253/dns-over-https), Unbound with DNSSEC, No ECS, and No logs|

*: Tested via `curl --doh-url <RESOLVER_URI> http://google.com`.

Download a recent snapshot of the above list as JSON from [here](https://github.com/cslev/encrypted_dns_resolvers).

# Private DNS Server with DoH setup examples
| Base | Source | Comment |
|-------------|----------|---------|
| Docker | https://github.com/satishweb/docker-doh | Complete Docker stack using Star Brilliant's [dns-over-https](https://github.com/m13253/dns-over-https) and [Docker Flow Proxy](https://github.com/docker-flow/docker-flow-proxy)
| Docker | https://github.com/coolquasar/dnsproxy | Complete DoH, DoT, and DoQ stack in docker based on Adguard home dnsproxy project. Could host DoH, DoT and DoQ quickly in a cloud server, and run respective clients in local Docker env. It has been tested in Raspberry PI as well

# Supported in browsers and clients

|Name|Version|Comments|
|----|-------|----|
|Firefox|62| [Firefox DNS-over-HTTPS](https://support.mozilla.org/en-US/kb/firefox-dns-over-https) |
|[Bromite](https://www.bromite.org/)|67.0.3396.88|[How to enable DoH](https://github.com/bromite/bromite/wiki/Enabling-DNS-over-HTTPS)|
|curl| 7.62.0 | See [DOH-implementation](DOH-implementation) |
|[OkHttp](https://github.com/square/okhttp/tree/master/okhttp-dnsoverhttps)| 3.11 | See [Providers](https://github.com/square/okhttp/blob/master/okhttp-dnsoverhttps/src/test/java/okhttp3/dnsoverhttps/DohProviders.java) |
| [curl-doh](https://github.com/curl/doh) | n/a | basic stand-alone DoH client that uses curl |
| Chrome | 66 | https://support.google.com/chrome/answer/10468685 |
| Windows | 11 | https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support |
| iOS & macOS | iOS 14 & macOS 11 | https://dns.notjakob.com/ | 

# DOH Tools

|Name|Author/Organization|Comments|
|----|-------|----|
|[bulldohzer](https://github.com/commonshost/bulldohzer) | Commonshost | Benchmark DoH and Do53 servers
|[coredns](https://github.com/coredns/coredns)|Cloudflare| CoreDNS is a DNS server/forwarder, written in Go from the Cloud Native Computing Foundation. |
|[dealdoh](https://github.com/noglitchyo/dealdoh)|Maxime Elomari| a middleware to proxy DoH requests to different DNS upstreams, written in PHP.|
|[dns-over-https](https://github.com/m13253/dns-over-https)|Star Brilliant| server-side and client-side implementation, written in Golang|
|[dns2doh](https://github.com/bagder/dns2doh)|Daniel| tool for generating DOH responses and questions.|
|[dnscrypt-proxy](https://github.com/DNSCrypt/dnscrypt-proxy)|Frank Denis|dnscrypt-proxy 2 - A flexible DNS proxy, with support for encrypted DNS protocols.|
|[dnsdist](https://dnsdist.org/)|PowerDNS|supports doh, see <https://dnsdist.org/guides/dns-over-https.html>|
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

* [DoH IP domain list](https://github.com/NiREvil/vless/blob/main/DNS%20over%20HTTPS/DoH%20IP%20domain%20path)
* [DNSCrypt.info: Interactive list of public DNS servers:](https://dnscrypt.info/public-servers/)
* [DNS-SP Server Search Engine and Recommender System](https://lrxgoat.github.io/search.html)
* [Centralization Problem](https://lrxgoat.github.io/Centralization.html)


#### 🚬🗿 stay in touch
[![icons8-GitHub-64](https://img.icons8.com/arcade/64/github.png)](https://github.com/NiREvil)
[![icons8-gmail-64](https://img.icons8.com/arcade/64/gmail.png)](mailto:nirevil2020@gmail.com)
[![icons8-Instagram-64](https://img.icons8.com/arcade/64/instagram-new.png)](https://instagram.com/nima_radical_?igshid=OGQ5ZDc2ODk2ZA==)
[![icons8-Telegram-64](https://img.icons8.com/arcade/64/telegram-app.png)](https://t.me/NiREvil)
[![icons8-Twitter-64](https://img.icons8.com/arcade/64/twitter.png)](https://twitter.com/NiREvil_)
[![icons8- Biohazard-644](https://img.icons8.com/arcade/64/poison.png)](https://t.me/F_NiREvil)
