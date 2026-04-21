from PIL import Image
import os
import shutil
img = Image.open("Icon.png").convert("RGBA")

# Caminhos dos icones do Capacitor
sizes = {
    "android/app/src/main/res/mipmap-mdpi/ic_launcher.png": 48,
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png": 48,
    "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png": 48,
    "android/app/src/main/res/mipmap-hdpi/ic_launcher.png": 72,
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png": 72,
    "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png": 72,
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png": 96,
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png": 96,
    "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png": 96,
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png": 144,
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png": 144,
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png": 144,
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png": 192,
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png": 192,
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png": 192,
}

for path, size in sizes.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path)
    print(f"Gerado: {path}")

# Substituir também o ic_launcher.webp se existir
for dirpath, dirnames, filenames in os.walk("android/app/src/main/res"):
    for filename in filenames:
        if filename.endswith(".webp") and "ic_launcher" in filename:
            filepath = os.path.join(dirpath, filename)
            dirname = os.path.dirname(filepath)
            size_map = {
                "mipmap-mdpi": 48,
                "mipmap-hdpi": 72,
                "mipmap-xhdpi": 96,
                "mipmap-xxhdpi": 144,
                "mipmap-xxxhdpi": 192,
            }
            for folder, size in size_map.items():
                if folder in filepath:
                    img.resize((size, size), Image.LANCZOS).save(filepath.replace(".webp", ".png"))
                    os.remove(filepath)
                    print(f"Substituido webp: {filepath}")

print("Icones prontos!")
