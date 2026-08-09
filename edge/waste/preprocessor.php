 <?php
 function get_optimization_ip($type = 'v4') {
   $KEY = 'o1zrmHAF';
   try {
     $headers = ['Content-Type: application/json'];
     $data = ['key' => $KEY, 'type' => $type];
     $ch = curl_init();
     curl_setopt($ch, CURLOPT_URL, 'https://api.hostmonit.com/get_optimization_ip');
     curl_setopt($ch, CURLOPT_POST, true);
     curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
     curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
     curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
     curl_setopt(
       $ch,
       CURLOPT_USERAGENT,
       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
     );
     $response = curl_exec($ch);
     $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
     if ($http_status == 200) {
       return json_decode($response, true);
     } else {
       echo "CHANGE OPTIMIZATION IP ERROR: REQUEST STATUS CODE IS NOT 200\n";
       return null;
     }
     curl_close($ch);
   } catch (Exception $e) {
     echo 'CHANGE OPTIMIZATION IP ERROR: ' . $e->getMessage() . "\n";
     return null;
   }
 }

 $getListIpv4 = get_optimization_ip();
 $ipv4 = [];
 if (
   isset($getListIpv4['code'], $getListIpv4['total']) &&
   $getListIpv4['code'] === 200 &&
   $getListIpv4['total'] > 0
 ) {
   foreach ($getListIpv4['info'] as $key => $l) {
     $ipv4 = array_merge($ipv4, $l);
   }
   file_put_contents('sub/Cf-ipv4.json', json_encode(array_slice($ipv4, 0, 25), JSON_PRETTY_PRINT));
 }

 $getListIpv6 = get_optimization_ip('v6');
 $ipv6 = [];
 if (
   isset($getListIpv6['code'], $getListIpv6['total']) &&
   $getListIpv6['code'] === 200 &&
   $getListIpv6['total'] > 0
 ) {
   foreach ($getListIpv6['info'] as $key => $l) {
     $ipv6 = array_merge($ipv6, $l);
   }
   file_put_contents('sub/Cf-ipv6.json', json_encode(array_slice($ipv6, 0, 25), JSON_PRETTY_PRINT));
 }

 $ips = [];
 if (!empty($ipv4) && !empty($ipv6)) {
   $ips['ipv4'] = $ipv4;
   $ips['ipv6'] = $ipv6;
   file_put_contents(
     'Cloudflare-IPs.json',
     json_encode(array_slice($ips, 0, 25), JSON_PRETTY_PRINT)
   );
 }
