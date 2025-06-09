# KMS

> A reliable, open-source activation tool for `Windows`

[Back to main menu](../README.md)

</br>

## Activations Summary

| Activation Type  |    Supported Product      |           Activation Period             |         Is Internet Needed?           |
| :----------------: | :---------------------------: | :--------------------------------------: | :-------------------------------------: |
|      HWID       |       Windows 10-11        |               Permanent               |                  Yes                    |
|     **KMS**     |       Windows 10-11        |                 180 Days               |                  Yes                    |
|      Ohook      |            Office            |               Permanent               |                   No                    |
|     TSforge     |  Windows / ESU / Office   |               Permanent                | Yes, needed on build 19041 and later |
|      KMS38     |   Windows 10-11-Server    |           Till the Year 2038            |                  No                    |
|   Online KMS   |      Windows / Office      | 180 Days. Lifetime With Renewal Task |                  Yes                   |  

![rainbow]

> [!CAUTION]
>
> - Remember **connect** to the **Internet**
>   - VPN is **not necessary**

</br>

## Method 2

**Instant Windows activation manually via KMS**

> We have many ways to run Command promptin windowss 10 and 11. [^1] [^2]

## Step 1

- All you need to do:
- Click **Start / Search** icon.
  - Type **CMD** or **command prompt** and select **Run as Administrator**.
- Alternative:
  - Right-click the **Start Menu**
  - Select **Windows Terminal (Admin)** Win 11 OR
  - Select **Windows command prompt (Admin)** Win 10
- in this case we need to run with **administrative privileges**.

<br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/4465a2d3-6c93-4ee1-bb63-94ab7b8e06ac" width="800px">
</p></br>    

## Step 2

**Install KMS client key.**

Use this command:

```CSS
slmgr /ipk yourlicensekey
```   

> [!NOTE]  
>
> Please select one of the **license keys** from the list that **matches your version of Windows** and replace it with the phrase `yourlicencekey` in the command.  
> How to check version of Windows. [^3]

**List of LICENSE KEYS**

|                   **Key**                   |     **Version**   |
| :-------------------------------------------: | :----------------: |
|  TX9XD-98N7V-6WMQ6-BX7FG-H8Q99  |       Home       |
|  3KHY7-WNT83-DGQKR-F7HPR-844BM  |      Home N     |
|  7HNRX-D7KGG-3K4RQ-4WPJ4-YTDFH  |   Home sl [^6]   |
|  PVMJN-6DFY6–9CCP6–7BKTT-D3WVR |   Home cs [^7]   |
| W269N-WFGWX-YVC9B-4J6C9-T83GX  |        Pro         |
|  MH37W-N47XK-V7XM9-C7227-GCQG9  |       Pro N       |
|  YNMGQ-8RYV3-4PGQ3-C8XTP-7CFBY  |     Education     |
| 84NGF-MHBT6-FXBX8-QWJK7-DRR8H  |   Education N    |
| NW6C2-QMPVW-D7KKK-3GKT6-VCFB2  |  Pro Education   |
| 2WH4N-8QGBV-H22JP-CT43Q-MDWWJ | Pro Education N  |
|  DXG7C-N36C4-C4HTG-X4T3X-2YV77  |  Pro for W [^8]   |
| WYPNQ-8C467-V2W6J-TX4WX-WT2RQ | Pro N for W [^8] |
|  NPPR9-FWDCX-D2C8J-H872K-2YT43  |     Enterprise     |
| DPH2V-TTNVB-4X9Q3-TJR4H-KHJW4  |   Enterprise N    |
|  XKCNC-J26Q9-KFHD2-FKTHY-KD72Y  |       Team        |
| V3WVW-N2PV2-CGWC3-34QGF-VMJ2C |         S          |
| KY7PN-VR6RX-83W6Y-6DDYQ-T6R4W  |         SE         |  

![rainbow]

<br>

<p align="center">
  <img src="https://github.com/user-attachments/assets/3ff5fb18-b7ca-40ec-b125-44e1aa3c0c79" width="800px">
</p>   

<p align="center">
  <img src="https://github.com/user-attachments/assets/0456724e-c37c-4961-8f80-dd1b10354255" width="800px">
</p></br>   

## Step 3

**Set KMS machine address**

Use the command to connect to my KMS server:

```CSS
slmgr /skms kms8.msguides.com
```  

<p align="center">
  <img src="https://github.com/user-attachments/assets/23454c06-b22e-4370-b4d1-8c633f84d34b" width="800px">
</p></br>  

## Step 4

**Activate your Windows**  
The last step is to activate your Windows using the command:

```CSS
slmgr /ato
```

<p align="center">
   <img src="https://github.com/user-attachments/assets/b8abc0ff-0efb-4e06-ac44-b5342e00fbcb" width="800px">
</p></br>   

## Step 5

**And Now check the activation status again**. [^6]

<p align="center">
  <img src="https://github.com/user-attachments/assets/179add25-5bce-4869-8b7e-afd8a20d1c26" width="800px">
</p></br>  

**Done✔️**,  
Windows is now activated!

To check the activation status of `Windows 10`, navigate to **Settings → Update & Security → Activation.** [^4]

To check the activation status of `Windows 11`, open Settings by clicking the Start button and then selecting **Settings → System → Activation.** [^5]

<br></br>

### Troubleshooting

- If you see the error **0xC004F074**, it means that your internet connection is unstable or the server is busy.  
  Please make sure your device is online and try the command “ato” again until you succeed.
- Did KMS not work for you ?
  - So run script again and select [`TSforge`](../README.md) Or [` KMS Online`](../README.md) to proceed activation.
  - For additional help, visit the **[Discussion Section][2]**

</br>

**Be curious 🤍**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/25423296/163456776-7f95b81a-f1ed-45f7-b7ab-8fa810d529fa.png">
  <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png">
  <img alt="Shows an illustrated sun in light mode and a moon with stars in dark mode." src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png">
</picture>

[^1]: 10 Ways to run PowerShell in windows [read here][1]

[^2]: Another easiest way to run PowerShell: **Right-click** on your Start menu to trigger the quick link menu and select **Windows Terminal (admin)** at win11 or **Windows powershell (admin)** at win 10 in the menu list.

[^3]: To check version of your Windows: **Right-click** on your Start menu and select the **system** option. Your Windows version can be seen in the second section under **Edition.**, You can also follow the steps of method 2 by **copy pasting** them. copy the commands and then hit the **Right-click** in the **cmd or powershell** to paste them.

[^4]: To check the activation status of Windows 10, navigate to Settings → Update & Security → Activation. You will see your activation status listed there. If Windows is activated, you should see "Activated" with a green checkmark.

[^5]: To check the activation status of Windows 11, open Settings by clicking the Start button and then selecting Settings → System → Activation. The activation status will be displayed, showing whether Windows is activated, along with details about the activation method and any linked Microsoft account.

[^6]: Home Single language version.

[^7]: Home Country Specific version.

[^8]: Professional for Workstations & Professional N for Workstations.

[rainbow]: https://github.com/NiREvil/vless/assets/126243832/1aca7f5d-6495-44b7-aced-072bae52f256
[1]: https://www.minitool.com/news/open-windows-11-powershell.html
[2]: https://github.com/NiREvil/windows-activation/discussions/new/choose
[3]: mailto:diana.clk01@gmail.com
