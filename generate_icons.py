from PIL import Image
import os

img = Image.open("icon.png").convert("RGBA")
sizes = {
    "android/app/src/main/res/mipmap-mdpi/ic_launcher.png": 48,
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png": 48,
    "android/app/src/main/res/mipmap-hdpi/ic_launcher.png": 72,
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png": 72,
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png": 96,
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png": 96,
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png": 144,
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png": 144,
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png": 192,
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png": 192,
}

for path, size in sizes.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path)
    print(f"Gerado: {path}")

print("Icones prontos!")
