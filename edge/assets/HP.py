print(
    "============================ Insyde H2O BIOS 'i'/'I' error-code ============================"
)
print(
    "= Insyde H2O BIOS (Acer, HP) System Disabled 'i'/'I' error-code response generator."
)
print(
    "= this script meant to solve https://github.com/bacher09/pwgen-for-bios/issues/52 in Python 3"
)
print("= ")
print(
    "= HP official response to BIOS Password reset: https://support.hp.com/us-en/document/c06368824"
)
print("============ Start Quote ============")
print(
    "= A forgotten BIOS password cannot be reset by HP. HP is committed to the security and privacy of"
)
print(
    "= our customers. To resolve a forgotten BIOS password issue, a system board replacement is required,"
)
print(
    "= and additional customer costs apply. For more information, go to HP Worldwide Limited Warranty and Technical Support."
)
print("= https://www8.hp.com/us/en/privacy/limited_warranty.html")
print("============= End Quote =============")
print("= ")
print(
    "= There ARE multiple online services that provides a working code for money (10$-25$) in eBay and many private sketchy sites."
)
print(
    "= I had personally (!) to pay to these sketchy people to regain control on my OWN laptop"
)
print(
    "= Yet, this is still better than HP's brilliant idea of buying a new motherboard..."
)
print("= ")
print(
    "= If you though to pay for it - use my script and donate something for a good cause."
)
print("= ")
print(
    "= NOTE: if you see a question mark ('?') as part of the result - it means that this specific digit is unknown."
)
print("=       simply guess it (0-9)! and you might succeed.")
print("= ")
print("= RDP3389 2020-01-19 MIT")
print(
    "========================================================================================================"
)


char1lower = {
    "0": "?",
    "1": "?",
    "2": "?",
    "3": "0",
    "4": "?",
    "5": "6",
    "6": "5",
    "7": "4",
    "8": "1",
    "9": "0",
}
char2lower = {
    "0": "7",
    "1": "6",
    "2": "5",
    "3": "4",
    "4": "3",
    "5": "2",
    "6": "1",
    "7": "0",
    "8": "5",
    "9": "4",
}
char3lower = {
    "0": "6",
    "1": "7",
    "2": "8",
    "3": "9",
    "4": "2",
    "5": "3",
    "6": "4",
    "7": "5",
    "8": "4",
    "9": "5",
}
char4lower = {
    "0": "9",
    "1": "8",
    "2": "7",
    "3": "6",
    "4": "5",
    "5": "4",
    "6": "3",
    "7": "2",
    "8": "1",
    "9": "0",
}
char5lower = {
    "0": "5",
    "1": "4",
    "2": "3",
    "3": "2",
    "4": "9",
    "5": "8",
    "6": "7",
    "7": "6",
    "8": "7",
    "9": "6",
}
char6lower = {
    "0": "4",
    "1": "5",
    "2": "6",
    "3": "7",
    "4": "8",
    "5": "9",
    "6": "0",
    "7": "1",
    "8": "6",
    "9": "7",
}
char7lower = {
    "0": "4",
    "1": "5",
    "2": "6",
    "3": "7",
    "4": "0",
    "5": "1",
    "6": "2",
    "7": "3",
    "8": "2",
    "9": "3",
}
char8lower = {
    "0": "5",
    "1": "4",
    "2": "3",
    "3": "2",
    "4": "1",
    "5": "0",
    "6": "9",
    "7": "8",
    "8": "7",
    "9": "6",
}
lowerSwitcher = {
    0: char1lower,
    1: char2lower,
    2: char3lower,
    3: char4lower,
    4: char5lower,
    5: char6lower,
    6: char7lower,
    7: char8lower,
}


# this function was taken from
# http://sites.google.com/site/dogber1/blag/pwgen-insyde.py
# Copyright (C) 2009-2011 dogbert <dogber1@gmail.com>
def calcPasswordWithCapitalI(strHash):
    salt = "Iou|hj&Z"

    pwd = ""
    for i in range(0, 8):
        b = ord(salt[i]) ^ ord(strHash[i])
        a = b
        a = (a * 0x66666667) >> 32
        a = (a >> 2) | (a & 0xC0)
        if a & 0x80000000:
            a += 1
        a *= 10
        pwd += str(b - a)
    return pwd


def generateResult(serial):
    if len(serial) != 9 or serial[0] not in ("i", "I"):
        return "ERROR - invalid serial. should start with i or I, and have 9 chars in length"

    result = []
    if serial[0] == "i":
        for i, c in enumerate(serial[1:]):
            charDict = lowerSwitcher.get(i)
            result.append(charDict.get(c))
        return "".join(result)

    elif serial[0] == "I":
        return calcPasswordWithCapitalI(serial[1:])
    else:
        return "Unknown serial - unsupported"


def testResult(serial, expected):
    result = generateResult(serial)
    if len(result) == 0 or len(serial) == 0:
        print("invalid input/output")
        return

    if serial[0] == "i" or serial[0] == "I":
        if expected == result:
            print("Valid result for input '{0}' - '{1}'".format(serial, result))
        else:
            print(
                "ERROR: INVALID result for input {0} is {1}. but expected {2}".format(
                    serial, result, expected
                )
            )


def testAllCases():
    print("=== Testing lower case - i ===")
    testResult(
        "i36284445", "01819800"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-CMOS-Reset-502-Error/m-p/6867566
    testResult(
        "i50158071", "67747434"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Forgot-my-administrative-password/m-p/7008668
    testResult(
        "i50477165", "67226520"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Admin-Password-from-pwgen-not-working/m-p/7033904
    testResult(
        "i50829953", "67476712"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-Admin-Password-Forgotten-System-Disabled/m-p/7025350
    testResult(
        "i51120876", "66775639"
    )  # https://h30434.www3.hp.com/t5/Notebook-Software-and-How-To-Questions/HP-stream-11-admin-password-error-code-i51120876/m-p/7034314
    testResult(
        "i51134464", "66769821"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-CMOS-Bios-Password-reset/m-p/7011328
    testResult(
        "i51400001", "66295444"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-enabled-Power-on-Password-unknown/m-p/7009461 !
    testResult(
        "i51596608", "66307047"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BIOS-Password/m-p/7018596
    testResult(
        "i51662144", "66433501"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-password-help/m-p/7035264
    testResult(
        "i51707904", "66596741"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Termination-of-access-to-bios/m-p/7014251
    testResult(
        "i52153665", "65742020"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Bios-Password-Issue/m-p/7008723
    testResult(
        "i52213846", "65882609"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-15-g019wm-Notebook-PC-bios-password/m-p/7007285
    testResult(
        "i52214872", "65889633"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/System-disabled-stream-14/m-p/7030298
    testResult("i52669168", "65436527")
    testResult(
        "i52798248", "65507607"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/System-Disabled-Code-i-52798248/m-p/7032885
    testResult(
        "i54853632", "63442073"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Termination-of-access-to-bios/m-p/7012665
    testResult(
        "i55050240", "62645605"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/forgotten-bios-password/m-p/7011330
    testResult(
        "i55361536", "62934979"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/SYSTEM-DISABLED/m-p/7009248
    testResult(
        "i56700698", "61595037"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-Stream-Bios-Password-Halt-Code-i-56700698/m-p/7034784
    testResult("i57596608", "60307047")
    testResult(
        "i58044249", "65659606"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Hp-250-G6-BIOS-password/m-p/7027277
    testResult(
        "i58205255", "65898610"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Forgot-bios-password/m-p/7030850
    testResult(
        "i58828448", "65477807"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Need-boot-unlock-code-System-Disabled-code-is-i-82498067/m-p/7037464
    testResult(
        "i59146240", "64757605"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-255-G3-BIOS-Password-Reset/m-p/7021527
    testResult(
        "i59170869", "64725626"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BIOS-ask-administrator-password/m-p/7029087
    testResult(
        "i59254432", "64849873"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-System-Disabled-Power-On-Password/m-p/7019117
    testResult(
        "i59340488", "64955827"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Bios-locked-administrator-password/m-p/7019193
    testResult(
        "i59350033", "64945472"
    )  # https://h30434.www3.hp.com/t5/Notebooks-Archive-Read-Only/i-need-to-install-a-operating-system-but-i-forgot-my-bios/m-p/7029833
    testResult(
        "i59755840", "64548605"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/System-Disabled-i-59755840-win10-x64/m-p/7025354
    testResult(
        "i60227584", "57876921"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-255-G3-BIOS-Password-Reset/m-p/7021527
    testResult(
        "i60411719", "57284156"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BOOT-BIOS-PASSWORD-HP-STREAM-14/m-p/7004253
    testResult(
        "i60585629", "57318066"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/HELP-System-disabled-60585629/m-p/7005063
    testResult(
        "i61829943", "56476702"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-ask-administrator-password/m-p/7032574
    testResult(
        "i62433029", "55262466"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Stream-Administrator-or-Power-ON-unlock-code/m-p/7021457
    testResult(
        "i62996480", "55507825"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Bios-Password/m-p/7034248
    testResult(
        "i63121056", "54774419"
    )  # https://h30434.www3.hp.com/t5/Business-Notebooks/system-disable-i-63121056/m-p/7027320
    testResult(
        "i63467458", "54236817"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Stream-Administrator-or-Power-ON-unlock-code/m-p/7020598
    testResult(
        "i67292480", "50803825"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-Password-HP-Notebook-15-ay196nr/m-p/7022970
    testResult(
        "i67819119", "50486556"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BIOS-default-password/m-p/7024592
    testResult("i67943987", "50552728")
    testResult(
        "i67974403", "50529842"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-PASSWORD/m-p/7027272
    testResult(
        "i68105474", "55798831"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-password-reset/m-p/7021474
    testResult(
        "i68241991", "55854734"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-14-ax020wm-power-on-password-system-disabled-code-i/m-p/7010079
    testResult(
        "i68258503", "55847942"
    )  # https://h30434.www3.hp.com/t5/Notebooks-Archive-Read-Only/Hp-stream-14-stuck-on-enter-administator-password-or-power/m-p/7021485
    testResult(
        "i68639651", "55466014"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Bios-password/m-p/7008709
    testResult(
        "i68701505", "55594940"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/I-FORGOT-MU-BIOS-NUMBER-CAN-ANYONE-HELP/m-p/7021491
    testResult(
        "i68852353", "55443712"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/BIOS-Master-Key/m-p/7029787
    testResult(
        "i69439588", "54266927"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-password-reset-for-15-DS026LA/m-p/7007943
    testResult(
        "i69740510", "54555955"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-system-disabled-error-at-boot/m-p/7032554
    testResult(
        "i69779941", "54526704"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/bios-and-power-on-password-needed-system-disabled-code/m-p/7030937
    testResult("i70412809", "47283646")
    testResult(
        "i70621891", "47474634"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/System-disabled/m-p/7000627
    testResult(
        "i71194686", "46709029"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Bios-password-reset/m-p/7034790
    testResult(
        "i73034247", "44669608"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Can-t-enter-the-BIOS/m-p/7004254
    testResult(
        "i74869253", "43436612"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Can-t-reset-BIOS-password/m-p/7008861
    testResult(
        "i75582785", "42313120"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-15-bs005nw-Notebook-bios-password-reset/m-p/7033914
    testResult("i76136275", "41767630")
    testResult("i76205377", "41898738")
    testResult(
        "i76729664", "41576021"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-Password/m-p/7018467
    testResult(
        "i77122234", "40773671"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Forgot-Administrator-Password/m-p/7029704
    testResult(
        "i77319488", "40986827"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/System-disabled-i-77319488/m-p/7030025
    testResult(
        "i77417792", "40286133"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Halt-code-for-m7-notebook/m-p/7008047
    testResult(
        "i81422854", "16273611"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/250-G6-Password-Reset/m-p/7030875
    testResult(
        "i82686008", "15417447"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-15-g019wm-Notebook-PC-bios-password/m-p/7011593
    testResult(
        "i84094334", "13609771"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BIOS-ask-administrator-password/m-p/7030860
    testResult(
        "i84712066", "13583429"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Bios-password-locked/m-p/7019264
    testResult(
        "i85535898", "12368637"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Laptop-start-up-screen-says-enter-administrator-password/m-p/7008712
    testResult(
        "i85866535", "12437970"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-Stream-Administrator-or-power-on-password/m-p/7012648
    testResult(
        "i85871936", "12424779"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Need-boot-unlock-code-System-Disabled-code-is-i-82498067/m-p/7023293
    testResult(
        "i86013615", "11682050"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-Pavilion-X360-m1-ask-for-Administrator-password-or-Power/m-p/7033911
    testResult(
        "i86134036", "11769479"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BOOT-BIOS-PASSWORD-HP-STREAM-14/m-p/7003169
    testResult(
        "i86945909", "11558746"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Forgot-my-administrative-password-HP-Notebook-15-ra058ur/m-p/7008831
    testResult(
        "i87267970", "10836735"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/I-need-bios-administrator-password-for-my-Hp-notebook-15/m-p/7019923
    testResult(
        "i87293029", "10802466"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-Stream-BIOS-password-popped-up-never-set/m-p/7017895
    testResult(
        "i88592323", "15303762"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-15-f272wm-Administrator-Password-or-Power-On-Password/m-p/7011746
    testResult(
        "i91655976", "06448739"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-255-G5-bios-locked/m-p/7011322
    testResult(
        "i92582944", "05313701"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Hi-I-have-an-Hp-Pavilion-x360-and-I-forgot-my-Bios-power-on/m-p/7029727
    testResult("i92709523", "05596962")
    testResult(
        "i93129601", "04776044"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-bios-pwd-forget/m-p/7007949
    testResult(
        "i93151191", "04744534"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-CMOS-Bios-Password-reset/m-p/7011900
    testResult(
        "i93277504", "04826941"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-How-do-i-remove-a-forgotten-bios-password-HP-250-G5/m-p/7012734
    testResult(
        "i93310273", "04985632"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/System-disabled-message/m-p/7018760
    testResult(
        "i93324362", "04979723"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Enter-administrator-password-or-power-on-password/m-p/7024632
    testResult(
        "i93641394", "04454731"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Administrator-power-on-password/m-p/7019332
    testResult(
        "i97341105", "00954540"
    )  # https://h30434.www3.hp.com/t5/Notebook-Software-and-How-To-Questions/System-Disaible/m-p/7032846
    testResult(
        "i97445305", "00258740"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-My-computer-is-asking-for-administrator-or-Power-on/m-p/7010459

    print("=== Testing upper case - I ===")
    testResult("I51085312", "44983934")
    testResult(
        "I51974384", "44652900"
    )  # https://h30434.www3.hp.com/t5/Notebooks-Archive-Read-Only/Re-Hi-I-have-an-Hp-Pavilion-x360-and-I-forgot-my-Bios-power/m-p/7032918
    testResult(
        "I52193395", "43891911"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Bios-administrator/m-p/6997145
    testResult(
        "I54797984", "41695300"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Power-on-Password-problem-Please-Help/m-p/6872164
    testResult(
        "I54929056", "41681098"
    )  # https://h30434.www3.hp.com/t5/Notebook-Software-and-How-To-Questions/HP-250-g5-bios-password-reset-i-54929056-system-disabled/m-p/6992718
    testResult(
        "I55488774", "40580370"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Hp-pavilion-bios-password/m-p/6986299
    testResult(
        "I55508992", "40460314"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/boot-password/m-p/6983497
    testResult(
        "I59111631", "46879217"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Need-a-Master-Bios-Password/m-p/7008169
    testResult(
        "I59170869", "46858269"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BIOS-ask-administrator-password/m-p/7029087
    testResult(
        "I59285006", "46183028"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-hp-stream-11-locked-out-ask-for-administrator-password-an/m-p/7032251
    testResult(
        "I59293696", "46191218"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/System-disabled/m-p/6878299
    testResult(
        "I59340488", "46028408"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Bios-locked-administrator-password/m-p/7019193
    testResult(
        "I59760749", "46648389"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-quot-Enter-Administrator-Password-or-Power-On-Password/m-p/6867486
    testResult(
        "I60579030", "75451016"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-ElitePad-1000-G2-bios-password-reset/m-p/6884350
    testResult(
        "I60585629", "75483209"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/HELP-System-disabled-60585629/m-p/7005063
    testResult(
        "I65355727", "70033309"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-Laptop-requires-BIOS-Passcode/m-p/6999060
    testResult(
        "I68793113", "77691135"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-250-G3-passworld/m-p/6995431
    testResult(
        "I69756392", "76634914"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/forgot-password/m-p/6988324
    testResult(
        "I70724617", "65682239"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/System-disabled-on-my-HP-laptop/m-p/6879912
    testResult(
        "I70798387", "65690909"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-quot-Enter-Administrator-Password-or-Power-On-Password/m-p/6868681
    testResult(
        "I71191371", "64899977"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/System-Disabled/m-p/6094329
    testResult(
        "I74793368", "61691968"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-15-requesting-Admin-Password-when-I-try-to-open-BIOS/m-p/6988249
    testResult(
        "I75746624", "60624200"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Bios-password-bypass/m-p/7003469
    testResult(
        "I76538858", "69490298"
    )  # https://h30434.www3.hp.com/t5/Notebook-Operating-System-and-Recovery/Administer-password-or-power-on-password/m-p/6891575
    testResult(
        "I82586008", "33484028"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-15-g019wm-Notebook-PC-bios-password/m-p/7011593
    testResult(
        "I82686007", "33784029"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-15-g019wm-Notebook-PC-bios-password/m-p/7011593
    testResult(
        "I82686008", "33784028"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-15-g019wm-Notebook-PC-bios-password/m-p/7011647
    testResult(
        "I84281902", "31189324"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Need-administrator-password-for-bias/m-p/6986374
    testResult(
        "I84397376", "31095978"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-HP-Laptop-requires-BIOS-Passcode/m-p/6999224
    testResult(
        "I84712066", "31670068"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-Bios-password-locked/m-p/7019264
    testResult(
        "I84725056", "31683098"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/In-need-of-admin-power-on-password/m-p/7001769
    testResult(
        "I84934656", "31692298"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/BIOS-password-reset/m-p/6983746
    testResult(
        "I85049938", "30921318"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-quot-System-Disabled-quot-message-on-HP-Stream/m-p/6896825
    testResult(
        "I85309877", "30061279"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-BIOS-ask-administrator-password/m-p/6991915
    testResult(
        "I86013615", "39971231"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/HP-Pavilion-X360-m1-ask-for-Administrator-password-or-Power/m-p/7033911
    testResult(
        "I86821673", "39789275"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-master-code-for-administrator-password-or-power-on/m-p/6872080
    testResult(
        "I92705596", "23663518"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Administrator-password-for-HP-250-G4/m-p/6993458
    testResult(
        "I97445305", "28523921"
    )  # https://h30434.www3.hp.com/t5/Notebook-Boot-and-Lockup/Re-My-computer-is-asking-for-administrator-or-Power-on/m-p/7010459


print("Please enter your code: (examples: I86013615, i92582944)")
print("result: " + generateResult(input()))
