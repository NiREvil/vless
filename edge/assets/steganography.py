from PIL import Image

# --- توابع کمکی برای تبدیل متن و باینری ---


def text_to_binary(text):
    """هر کاراکتر در متن ورودی را به یک رشته باینری ۸ بیتی تبدیل می‌کند."""
    binary_message = ""
    for char in text:
        # کد اسکی کاراکتر را گرفته و به فرمت باینری ۸ بیتی تبدیل می‌کنیم
        binary_message += format(ord(char), "08b")
    return binary_message


def binary_to_text(binary_data):
    """یک رشته باینری را به متن معمولی تبدیل می‌کند."""
    text_message = ""
    # رشته باینری را به قطعات ۸ بیتی تقسیم می‌کنیم
    for i in range(0, len(binary_data), 8):
        byte = binary_data[i : i + 8]
        # هر قطعه ۸ بیتی را به عدد و سپس به کاراکتر تبدیل می‌کنیم
        text_message += chr(int(byte, 2))
    return text_message


# --- توابع اصلی برای پنهان‌سازی و بازیابی ---


def hide_message(image_filename, secret_message):
    """یک پیام متنی را در یک تصویر با استفاده از روش LSB پنهان می‌کند."""
    print(f"درحال پنهان‌سازی پیام در تصویر: {image_filename}...")

    try:
        # باز کردن تصویر اصلی
        image = Image.open(image_filename)
    except FileNotFoundError:
        print(
            f"خطا: فایل تصویر '{image_filename}' پیدا نشد. لطفاً مطمئن شوید فایل در کنار اسکریپت قرار دارد."
        )
        return

    # یک جداکننده خاص به انتهای پیام اضافه می‌کنیم تا هنگام بازیابی، پایان آن را تشخیص دهیم
    delimiter = "1111111100000000"
    binary_message_with_delimiter = text_to_binary(secret_message) + delimiter

    # بررسی اینکه آیا تصویر ظرفیت کافی برای پنهان کردن پیام را دارد یا نه
    width, height = image.size
    image_capacity = width * height * 3
    if len(binary_message_with_delimiter) > image_capacity:
        print("خطا: پیام برای این تصویر بیش از حد طولانی است.")
        return

    pixels = image.load()
    data_index = 0

    # پیمایش تمام پیکسل‌های تصویر
    for y in range(height):
        for x in range(width):
            # دریافت مقادیر رنگی پیکسل (R, G, B)
            r, g, b = pixels[x, y]

            # تغییر کم‌ارزش‌ترین بیت کانال قرمز (R)
            if data_index < len(binary_message_with_delimiter):
                r_bin = list(format(r, "08b"))
                r_bin[-1] = binary_message_with_delimiter[data_index]
                r = int("".join(r_bin), 2)
                data_index += 1

            # تغییر کم‌ارزش‌ترین بیت کانال سبز (G)
            if data_index < len(binary_message_with_delimiter):
                g_bin = list(format(g, "08b"))
                g_bin[-1] = binary_message_with_delimiter[data_index]
                g = int("".join(g_bin), 2)
                data_index += 1

            # تغییر کم‌ارزش‌ترین بیت کانال آبی (B)
            if data_index < len(binary_message_with_delimiter):
                b_bin = list(format(b, "08b"))
                b_bin[-1] = binary_message_with_delimiter[data_index]
                b = int("".join(b_bin), 2)
                data_index += 1

            # ذخیره پیکسل تغییر یافته
            pixels[x, y] = (r, g, b)

            # اگر تمام پیام پنهان شد، کار تمام است
            if data_index >= len(binary_message_with_delimiter):
                output_filename = "encoded_" + image_filename
                image.save(output_filename)
                print(
                    f"پیام با موفقیت پنهان شد. تصویر جدید در '{output_filename}' ذخیره شد."
                )
                return


def retrieve_message(image_filename):
    """پیام پنهان شده در یک تصویر را بازیابی می‌کند."""
    print(f"درحال بازیابی پیام از تصویر: {image_filename}...")

    try:
        image = Image.open(image_filename)
    except FileNotFoundError:
        print(f"خطا: فایل تصویر '{image_filename}' پیدا نشد.")
        return None

    pixels = image.load()
    width, height = image.size
    binary_data = ""
    delimiter = "1111111100000000"

    # پیمایش پیکسل‌ها و استخراج کم‌ارزش‌ترین بیت از هر کانال رنگی
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            binary_data += format(r, "08b")[-1]
            binary_data += format(g, "08b")[-1]
            binary_data += format(b, "08b")[-1]

            # اگر جداکننده پیدا شد، پیام را استخراج کن
            if delimiter in binary_data:
                # جدا کردن پیام از بقیه داده‌ها با استفاده از جداکننده
                message_part = binary_data.split(delimiter)[0]
                secret_message = binary_to_text(message_part)
                print("پیام با موفقیت بازیابی شد.")
                return secret_message

    print("هشدار: پایان پیام در تصویر پیدا نشد. ممکن است پیام کامل نباشد.")
    return None


# --- بخش اصلی برنامه ---
def main():
    # پیامی که می‌خواهیم پنهان کنیم
    my_secret_message = "This is a test for my university assignment."

    # لیستی از نام فایل‌های تصویری که باید در کنار اسکریپت باشند
    # شما باید این فایل‌ها را خودتان تهیه و نام‌گذاری کنید
    image_filenames = [
        "image_solid_color.png",
        "image_gradient.png",
        "image_complex.png",
        "image_noisy.png",
    ]

    print("--- شروع عملیات پنهان‌نگاری ---")
    # پنهان‌سازی پیام در تمام تصاویر
    for filename in image_filenames:
        hide_message(filename, my_secret_message)

    print("\n--- شروع عملیات بازیابی ---")
    # بازیابی پیام از تمام تصاویر کدگذاری شده
    for filename in image_filenames:
        encoded_filename = "encoded_" + filename
        retrieved_text = retrieve_message(encoded_filename)
        if retrieved_text:
            print(f"پیام بازیابی شده از {encoded_filename}: '{retrieved_text}'\n")


# این خط تضمین می‌کند که تابع main() فقط زمانی اجرا شود که فایل مستقیماً اجرا شود
if __name__ == "__main__":
    main()
