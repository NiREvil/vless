import numpy as np
from PIL import Image
import logging

# --- تنظیمات لاگ ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("steganography.log"),
        logging.StreamHandler()
    ]
)

def text_to_binary(text):
    """یه رشته متنی رو به یه رشته باینری تبدیل می‌کنه."""
    # هر کاراکتر به نمایش باینری ۸ بیتی تبدیل میشه.
    return ''.join(format(ord(char), '08b') for char in text)

def binary_to_text(binary_data):
    """یک رشته باینری را به رشته متنی تبدیل می‌کند."""
    # هر ۸ بیت به یه کاراکتر تبدیل میشه.
    chars = [binary_data[i:i+8] for i in range(0, len(binary_data), 8)]
    return "".join(chr(int(char, 2)) for char in chars)

def encode_image(image, secret_message):
    """یک پیام مخفی رو در یک تصویر با استفاده از تکنیک LSB پنهان می‌کنه."""
    logging.info(f"شروع فرآیند پنهان‌سازی پیام در تصویر...")

    # کپی از تصویر برای جلوگیری از تغییر نسخه اصلی
    encoded_image = image.copy()
    width, height = image.size

    # تبدیل پیام به باینری و افزودن یه جداکننده برای تشخیص پایان پیام
    # از '1111111100000000' به عنوان یه جداکننده غیرمحتمل استفاده می‌کنیم.
    delimiter = '1111111100000000'
    binary_secret_message = text_to_binary(secret_message) + delimiter
    message_length = len(binary_secret_message)
    
    logging.info(f"طول پیام (باینری): {message_length} بیت")

    # بررسی ظرفیت تصویر واسع پنهان‌سازی پیام
    image_capacity = width * height * 3  # هر پیکسل ۳ کانال رنگی داره
    if message_length > image_capacity:
        logging.error("ظرفیت تصویر برای پنهان کردن این پیام کافی نیست.")
        raise ValueError("پیام بیش از حد طولانی است و در تصویر جا نمی‌شود.")

    data_index = 0
    pixels = encoded_image.load()

    for y in range(height):
        for x in range(width):
            # دریافت مقادیر RGB پیکسل
            r, g, b = pixels[x, y]

            # پنهان‌سازی بیت‌های پیام در هر کانال رنگی
            # کانال قرمز (R)
            if data_index < message_length:
                # مقدار فعلی رو به باینری تبدیل کرده، بیت آخر رو با بیت پیام جایگزین می‌کنیم
                r_binary = list(format(r, '08b'))
                r_binary[-1] = binary_secret_message[data_index]
                r = int("".join(r_binary), 2)
                data_index += 1
            
            # کانال سبز (G)
            if data_index < message_length:
                g_binary = list(format(g, '08b'))
                g_binary[-1] = binary_secret_message[data_index]
                g = int("".join(g_binary), 2)
                data_index += 1

            # کانال آبی (B)
            if data_index < message_length:
                b_binary = list(format(b, '08b'))
                b_binary[-1] = binary_secret_message[data_index]
                b = int("".join(b_binary), 2)
                data_index += 1

            # به‌روزرسانی پیکسل با مقادیر جدید
            pixels[x, y] = (r, g, b)

            # اگر پیام تمام شد، از حلقه خارج شو
            if data_index >= message_length:
                logging.info("پیام با موفقیت در تصویر پنهان شد.")
                return encoded_image

    return encoded_image

def decode_image(image):
    """پیام مخفی رو از تصویر استخراج می‌کنه."""
    logging.info("شروع فرآیند بازیابی پیام از تصویر...")
    width, height = image.size
    pixels = image.load()
    
    binary_data = ""
    delimiter = '1111111100000000'

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            
            # استخراج کم‌ارزش‌ترین بیت از هر کانال رنگی
            binary_data += format(r, '08b')[-1]
            binary_data += format(g, '08b')[-1]
            binary_data += format(b, '08b')[-1]
            
            # بررسی وجود جداکننده در داده‌های استخراج شده
            if delimiter in binary_data:
                # حذف جداکننده و بازیابی پیام اصلی
                message = binary_to_text(binary_data.split(delimiter)[0])
                logging.info("پیام با موفقیت بازیابی شد.")
                return message
                
    logging.warning("جداکننده پایان پیام یافت نشد. ممکنه پیام کامل نباشه.")
    return None

def create_sample_images(width=300, height=300):
    """چهار تصویر نمونه با ویژگی‌های مختلف تولید میکنه."""
    images = {}

    # 1. تصویر با رنگ ثابت (آبی)
    solid_color_img = Image.new('RGB', (width, height), color = 'blue')
    images['solid_color'] = solid_color_img

    # 2. تصویر گرادیان خاکستری
    gradient_data = np.zeros((height, width, 3), dtype=np.uint8)
    for i in range(width):
        gradient_data[:, i] = int(i / width * 255)
    gradient_img = Image.fromarray(gradient_data)
    images['gradient'] = gradient_img
    
    # 3. تصویر نویز تصادفی
    noise_data = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    noise_img = Image.fromarray(noise_data)
    images['random_noise'] = noise_img

    # 4. تصویر رنگارنگ با اشکال
    colorful_img = Image.new('RGB', (width, height), 'white')
    pixels = colorful_img.load()
    for x in range(width):
        for y in range(height):
            if (x // 50 + y // 50) % 2 == 0:
                pixels[x, y] = (x % 256, y % 256, (x+y) % 256)
    images['colorful_pattern'] = colorful_img

    logging.info("چهار تصویر نمونه با موفقیت تولید شدن.")
    return images

def main():
    """تابع اصلی برای اجرای کل فرآیند."""
    secret_message = "This is a secret message hidden inside an image using LSB steganography, Im Mercedeh Rasnavad."
    logging.info(f"پیام مخفی: '{secret_message}'")
    
    # تولید تصاویر نمونه
    original_images = create_sample_images()

    for name, img in original_images.items():
        logging.info(f"\n--- پردازش تصویر: {name} ---")
        
        # ذخیره تصویر اصلی
        original_path = f"original_{name}.png"
        img.save(original_path)
        logging.info(f"تصویر اصلی در {original_path} ذخیره شد.")

        # پنهان‌سازی پیام
        try:
            encoded_img = encode_image(img, secret_message)
            encoded_path = f"encoded_{name}.png"
            encoded_img.save(encoded_path)
            logging.info(f"تصویر کدگذاری‌شده در {encoded_path} ذخیره شد.")
            
            # نمایش تصاویر (اختیاری)
            # img.show(title=f"Original - {name}")
            # encoded_img.show(title=f"Encoded - {name}")

            # بازیابی پیام
            decoded_message = decode_image(encoded_img)
            
            if decoded_message:
                logging.info(f"پیام بازیابی شده: '{decoded_message}'")
                if decoded_message == secret_message:
                    logging.info("تایید: پیام بازیابی شده با پیام اصلی یکسان است.")
                else:
                    logging.error("خطا: پیام بازیابی شده با پیام اصلی مغایرت دارد!")
            else:
                logging.error("بازیابی پیام با شکست مواجه شد.")

        except ValueError as e:
            logging.error(f"خطا در حین پردازش تصویر {name}: {e}")

if __name__ == "__main__":
    main()
