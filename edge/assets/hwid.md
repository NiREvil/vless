# Instant Windows and Office Activation: 40-Second Solution   

> A reliable, open-source activation tools for `Windows` and `Office`, featuring KMS, Ohook, TSforge, KMS38, and HWID—activate in under 40 seconds!  

</br>  

## Activations Summary

| Activation Type | Supported Product      | Activation Period                    | Is Internet Needed? |
|-----------------|------------------------|--------------------------------------|---------------------|
| HWID            | Windows 10-11          | Permanent                            | Yes                 |
| KMS             | Windows 10-11          | 180 Days                       | Yes                 |
| Ohook           | Office                 | Permanent                            | No                  |
| TSforge         | Windows / ESU / Office | Permanent                            | Yes, needed on build 19041 and later 
| KMS38           | Windows 10-11-Server   | Till the Year 2038                   | No                  |
| Online KMS      | Windows / Office       | 180 Days. Lifetime With Renewal Task | Yes                 |

![rainbow]  

> [!CAUTION]  
> - Remember **connect** to the **Internet**  
>   - VPN is **not necessary**  

<br>  

## Table of contents    

- [Activation using HWID](#Method-1)  
- [Activating Using KMS](en/kms.md)  
- [Supported Products](#Supported-Products)  
- [Activation methods chart](en/chart.md)   
- [Files will be stored on](#The-files-will-be-stored-on)  
- [Fix wpa registry files](en/fix-wpa-registry.md)  
- [How to Remove](#How-to-remove)  
- [Clean install windows](en/clean_install_windows.md)  
- [Removing Malware](en/remove_malware.md)  
- [Office C2R Custom install](en/office_c2r.md)  
- [A genuine Windows ISO files](en/clean_install_windows.md#prerequisites)  

<br>   

## Features   

- **HWID (Digital License)** Method to Permanently Activate Windows. [Technical details](en/hwid.md)  
- **KMS** Method to Active Windows manually for 180 Days. [Details](en/kms.md)  
- **Ohook** Method to Permanently Activate Office  
- **TSforge** Method to Permanently Activate Windows/ESU/Office. [Details](en/tsforge.md)   
- **KMS38** Method to Activate Windows Till the Year 2038. [Details](en/kms38.md)
- **Online KMS** Method to Activate Windows/Office For 180 Days (Lifetime With Renewal Task)  
- Advanced Activation Troubleshooting  
- OEM Folders For Preactivation    
- Change Windows Edition  
- Change Office Edition  
- Check Windows/Office Activation Status  
- Available in All In One and Separate Files Versions  
- Fully Open Source and Based on Batch Scripts  
- Fewer Antivirus Detections <br></br>  

> [!IMPORTANT]  
> 
> <details>  
> <summary> Here’s my suggestion for you guys </summary>  
>  
> - Since I use the same methods for activating my Microsoft products like you do, I wanted to share a tip.  
> I personally use the second method for activating my Windows 10 and 11, which is the [KMS method](en/kms.md). It takes less than 3 minutes, but only because you have to copy and paste three short commands.  
> It’s official and recognized worldwide, and nothing gets stored on my system—so I'm totally chill about it.   
> 
> - If for some crazy reason the KMS method doesn’t work (which is super unlikely), then I’ll go for the first method, which is [HWI](../../README.md).  
> That one takes less than 40 seconds, This method is also official from Microsoft and.    
>  just like the first one, it doesn’t save anything on your system. 
> 
> For activating Office, I use the activation method with Ohook, TSforge, or Online KMS—they’re pretty similar. I’ve noted the slight differences in the activation summary section.    
>   
>  
> If you run into any issues or have questions at any step, definitely share with me and our friends in the [Discussion][2] section. And if you need to reach out urgently, here’s my email: [diana.cl@gmail.com][3]  
>  
> </details>  

<br></br>   


> [!NOTE]  
> 
> <details>  
> <summary> Read Overview</summary>  
> 
> - HWID activation method supports Windows 10/11 only. [more details](en/hwid.md)   
> - This activation method does [not store](README.md#The-files-will-be-stored-on) or modify any files in your system.  
> - This activation method gives you permanent Windows activation for your system hardware.  
> - All activations can be linked to a Microsoft account without any issues.  
> - Once the system is activated, this activation cannot be removed because the license is stored on Microsoft's servers, not on the user's system. Microsoft checks the hardware ID (HWID), and if a license is found in their database, the system will automatically activate. This is how all digital licenses work.  
> - Any significant changes to the hardware (such as a motherboard) may deactivate the system. It is possible to reactivate a system that was deactivated because of significant hardware changes, IF your activation, was linked to an online Microsoft account.  
> - For activation to succeed, Internet connectivity must be enabled. If you are trying to activate without these conditions being met, then the system will auto-activate later when the conditions are met.  
> - The following is required for Windows to reactivate itself after Windows reinstall:  
>   - Internet connectivity is required. (Only at the time of activation)  
>   - The system will auto-activate only if Retail (Consumer) media was used for installing Windows.  
>   - The system will NOT auto-activate if VL (Business) media was used for the installation. In this case, the user will have to insert the generic Retail/OEM key corresponding to the Windows edition currently running to activate if the user doesn't want to use the script again. (Those keys can be found below on this page).   
>  
>  </details>   

> [!WARNING]
> 
> <details>  
> <summary> Batch Scripts Are Not Official </summary>  
>   
> - KMS commands are **developed by Microsoft** but batch scripts are custom-written.  
>   - They are just contain a batch of commands and written by individuals like me.  
>
> - Our purpose of creating the scripts is help you guys save your time instead of running all commands, one by one in the command prompt or Windows power shell.   
>   - But this method has never been treated as an official method because opening batch file with admin rights is not recommended by Microsoft.   
>   - **Security Warning:** For example, if the author inserts the command formatting your disk (e.g., disk formatting) into the script, all your data loss could occur.    
>
> </details>  

</br>    

## Method 1  

**Instant Windows activation via HWID**     
> We have many ways to run powershell in windowss 10 and 11. [^1] [^2]


### Step 1  
 
- All you need to do: 
- Click Start/Search icon.
  - Type **PowerShell** and select **Run as Administrator**.
- Alternative:
  - Right-click the **Start menu**  
  - Select **Windows Terminal (Admin)** Win 11 OR  
  - **Select Windows PowerShell (Admin)** Win 10   
- in this case we need to run with **administrative privileges**.  
 
<br>  

<p align="center">
  <img src="https://github.com/user-attachments/assets/5638557d-9bfe-4e7c-a851-218bec6559bf" width="680px">
</p><br>   

### Step 2    
**Now, `Copy` the following command:** 

```CSS
irm https://get.activated.win | iex
```  

Alternative (Deprecated Soon):

```CSS
irm https://massgrave.dev/get | iex
```  

</br>   

<p align="center">
  <br><img src="https://github.com/user-attachments/assets/dfaa3f27-efb8-4979-bc32-081362274a2e" width="680px">
</p></br  >   

### Step 3    

To Run the activator, paste it (with right-click) and hit the enter key. In the newly opened window, there are several options available:    

You will see the activation options:  
  -  Press `[1]` HWID for Windows activation.  
  -  Press `[2]` Ohook for Office activation.
  -  Press `[3]` TSforge for Windows activation. 
from which we must select option <mark>[1]</mark> and wait a few seconds to complete.  

</br>     

<p align="center">
  <img src="https://github.com/user-attachments/assets/c4289236-1d5d-421f-984f-5b3816575273" width="680px">
</p></br>  


**Congratulations!** Windows is now activated!   

To check the activation status of `Windows 10`, navigate to **Settings → Update & Security → Activation.** [^3]   

To check the activation status of `Windows 11`, open Settings by clicking the Start button and then selecting **Settings → System → Activation.** [^4]   

<br></br>  

## Troubleshooting  

Did HWID not work for you? well,  
then [click here](en/kms.md) to proceed with the KMS method.  

For additional help, visit the [Discussion Section][2] Or reach out via email: [diana.clk01@gmail.com][3].    

</br>   

## The files will be stored on  

> [!CAUTION]
> 
> **❖ HWID**   
> When using HWID activation, no files are stored on the system, and Windows 10-11 will be activated when connected to the internet for the first time.  
>  
> **❖ Ohook**  
> If Office is preinstalled then Ohook method will activate the Office immediately without Internet. This activation uses custom sppc.dll file for the activation.    
>  
> **❖ TSforge**  
> When using TSforge activation, no files are stored on the system, and Windows / ESU / Office (preinstalled) becomes activated immediately without Internet.  
>   
> **❖ KMS38**     
> When using KMS38 activation, no files are stored on the system, and Windows 10-11-Server becomes activated immediately without Internet.  
>   
> **❖ Online KMS**     
> When using Online KMS activation, Windows-Server and Office (Preinstalled) both will be activated when connected to the internet for the first time. This option uses a renewal task for lifetime activation.  
>   
> **❖ HWID + Ohook**     
> In this method, Windows 10-11 will be activated with HWID, and **Office** (Preinstalled) will be activated using Ohook.  
>    
> **❖ HWID + Ohook + TSforge**    
> In this method, Windows 10-11 will be activated with HWID, and **Office** (Preinstalled) will be activated using Ohook and Windows ESU will be activated with TSforge.    
>     
> **❖ TSforge + Online KMS**    
In this method, Windows will be activated with TSforge, and **Office** (Preinstalled) will be activated using Online KMS.   

</br>    

## Supported Products  

| Windows 10/11 Product Names           | EditionID                | Generic Retail/OEM/MAK Key    |
|---------------------------------------|--------------------------|-------------------------------|
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
| Home China  [^5]                      | CoreCountrySpecific      | N2434-X9D7W-8PF6X-8DV9T-8TYMD |
| Home Single Language  [^6]            | CoreSingleLanguage       | BT79Q-G7N6G-PGBYW-4YWX6-6F4BT |
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
![rainbow]  

</br>  

> [!TIP]  
> 
> <details>  
> <summary> System in all architecture are suppurted </summary>  
> 
> ◍ Systems in all architectures (x86, x64 and arm64) are supported.  
> ◍ Any evaluation version of Windows (i.e. 'EVAL' LTSB/C) beyond the evaluation period. You can use TSforge option in MAS to reset the activation any given time.   
> ◍ IoTEnterpriseS (LTSC) 2021 key will be used to activate the unsupported EnterpriseS (LTSC) 2021 edition.   
> ◍ IoTEnterpriseS (LTSC) 2024 key will be used to activate the unsupported EnterpriseS (LTSC) 2024 edition.  
> ◍ Windows Server does not support HWID activation.  
>  
> ◍ Enterprise multi-session (ServerRdsh) edition can be activated with only a key NJCF7-PW8QT-3324D-688JX-2YV66, but it does not support real digital license activation.  
>  
> </details>  

</br>  

## How to remove

> [!IMPORTANT]
> 
> **⨻ How to remove HWID?**
> 
> HWID [Digital license](en/hwid.md) activation cannot be removed.    
> Because the license is stor in the Microsoft servers and not in the user's system.     
> Microsoft checks the hardware ID (HWID) and if a license is found in their database, the system will automatically activate.   
> This is how the official digital license activation process works.   
>  
> <details>  
> <summary>  What if you still want to remove it ? </summary>
> 
> As explained above, you cannot remove it for your hardware,   
> only major hardware change such as CPU, motherboard can remove the activation.    
>   
> What if you just want to keep Windows in the unactivated stage?  
> To do that, you can install the [KMS key](en/kms38.md#supported-products) in the Windows settings activation page OR  
> Change the edition using Change Windows edition option in MAS.   
> 
> </details>
> 
> ⬩
>
> ⬩
>
> **⨻ How to remove Online KMS?**   
>   
> In MAS, goto Online KMS activation and apply Uninstall option.    
> After that, In MAS, goto Troubleshoot and apply Fix Licensing option. Done ✔️   
>   
> ⬩
>
> ⬩
>
> **⨻ How to remove Ohook?**   
> 
> In MAS, goto Ohook Activation and apply Uninstall option.   
> After that, In MAS, goto Troubleshoot and apply Fix Licensing option. Done ✔️  
>
> ⬩
>
> ⬩
> 
> **⨻	How to remove KMS38?**    
> 
> In MAS, go to KMS38 Activation and apply the Remove KM38 Protection option.   
> After that, In MAS, go to Troubleshoot and apply the Fix Licensing option. Done ✔️   
> 
> ⬩
> 
> ⬩
> 
>  **⨻	How to remove TSforge?**   
> This activation method doesn't modify any Windows components and doesn't install any new files.  
> Instead, it appends data to one of data files used by Software Protection Platform.   
>
> If you want to reset the activation status,    
> In MAS script, goto Troubleshoot and apply Fix Licensing option. Done ✔️   

</br  >  

> [!NOTE]
>
> **HWID Activation Notes**  
> Windows settings will instantly show that Windows is not activated but it usually takes 3 hours for the Activation Watermark to appear.   
>   
> These options will simply hide the HWID activation.    
> If you reinstall Windows with the same edition or restore the default generic Retail/OEM keys, the system will  automatically activate again if an Internet connection is found.

----  

[^1]: [10 Ways to run PowerShell in windows][1]  

[^2]: Another easiest way to run PowerShell: **Right-click** on your Start menu to trigger the quick link menu and select **Windows Terminal (admin)** at win11 or **Windows powershell (admin)** at win 10 in the menu list.  

[^3]: To check the activation status of Windows 10, navigate to Settings → Update & Security → Activation. You will see your activation status listed there. If Windows is activated, you should see "Activated" with a green checkmark.  

[^4]: To check the activation status of Windows 11, open Settings by clicking the Start button and then selecting Settings → System → Activation. The activation status will be displayed, showing whether Windows is activated, along with details about the activation method and any linked Microsoft account.  

[^5]: Home Country Specific version.  

[^6]: Home Single language version.   

[^7]: Professional for Workstations & Professional N for Workstations   

[1]: https://www.minitool.com/news/open-windows-11-powershell.html  

[2]: https://github.com/NiREvil/windows-activation/discussions/new/choose   

[3]: <mailto:diana.clk01@gmail.com>  
[rainbow]: https://github.com/NiREvil/vless/assets/126243832/1aca7f5d-6495-44b7-aced-072bae52f256
