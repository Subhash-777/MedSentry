from PIL import Image, ImageDraw
import os
import glob

# Paths
BASE_DIR = '/home/subhash/projects/MedSentry/mobile-app'
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
RES_DIR = os.path.join(BASE_DIR, 'android/app/src/main/res')
LOGO_PATH = os.path.join(ASSETS_DIR, 'logo.png')

# Colors
BG_COLOR_HEX = '#F5F0E6'  # Warm Cream
BG_COLOR_RGB = (245, 240, 230)
BG_COLOR_RGBA = (245, 240, 230, 255)

print(f"Loading logo from {LOGO_PATH}...")
logo = Image.open(LOGO_PATH).convert("RGBA")

# Extract the emblem crop (820, 110, 1620, 1060)
emblem = logo.crop((820, 110, 1620, 1060))
emblem_w, emblem_h = emblem.size
print(f"Extracted emblem size: {emblem_w}x{emblem_h}")

def create_square_icon(emblem_img, size, fill_color, logo_scale=0.68):
    """
    Creates a square icon of (size x size) with emblem_img centered and scaled to logo_scale * size.
    """
    canvas = Image.new("RGBA", (size, size), fill_color)
    
    # Calculate target dimensions for emblem maintaining aspect ratio
    target_h = int(size * logo_scale)
    target_w = int(emblem_w * (target_h / emblem_h))
    
    resized_emblem = emblem_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    offset_x = (size - target_w) // 2
    offset_y = (size - target_h) // 2
    
    canvas.paste(resized_emblem, (offset_x, offset_y), resized_emblem)
    return canvas

def create_transparent_foreground(emblem_img, size, logo_scale=0.60):
    """
    Creates a transparent adaptive foreground icon where emblem is centered within Android's safe mask circle.
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    target_h = int(size * logo_scale)
    target_w = int(emblem_w * (target_h / emblem_h))
    
    resized_emblem = emblem_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    offset_x = (size - target_w) // 2
    offset_y = (size - target_h) // 2
    
    canvas.paste(resized_emblem, (offset_x, offset_y), resized_emblem)
    return canvas

# 1. Generate icon.png (1024x1024)
icon_1024 = create_square_icon(emblem, 1024, BG_COLOR_RGBA, logo_scale=0.65)
icon_1024.convert("RGB").save(os.path.join(ASSETS_DIR, 'icon.png'), "PNG")
print("✅ Generated assets/icon.png (1024x1024)")

# 2. Generate splash-icon.png (1024x1024)
splash_1024 = create_square_icon(emblem, 1024, BG_COLOR_RGBA, logo_scale=0.55)
splash_1024.save(os.path.join(ASSETS_DIR, 'splash-icon.png'), "PNG")
print("✅ Generated assets/splash-icon.png (1024x1024)")

# 3. Generate android-icon-foreground.png (512x512)
fg_512 = create_transparent_foreground(emblem, 512, logo_scale=0.58)
fg_512.save(os.path.join(ASSETS_DIR, 'android-icon-foreground.png'), "PNG")
print("✅ Generated assets/android-icon-foreground.png (512x512)")

# 4. Generate android-icon-background.png (512x512)
bg_512 = Image.new("RGBA", (512, 512), BG_COLOR_RGBA)
bg_512.save(os.path.join(ASSETS_DIR, 'android-icon-background.png'), "PNG")
print("✅ Generated assets/android-icon-background.png (512x512)")

# 5. Generate android-icon-monochrome.png (432x432)
mono_432 = create_transparent_foreground(emblem, 432, logo_scale=0.58)
mono_432.save(os.path.join(ASSETS_DIR, 'android-icon-monochrome.png'), "PNG")
print("✅ Generated assets/android-icon-monochrome.png (432x432)")

# 6. Generate favicon.png (48x48)
favicon_48 = create_square_icon(emblem, 48, BG_COLOR_RGBA, logo_scale=0.75)
favicon_48.save(os.path.join(ASSETS_DIR, 'favicon.png'), "PNG")
print("✅ Generated assets/favicon.png (48x48)")

# ==============================================================================
# NATIVE ANDROID RESOURCES GENERATION
# ==============================================================================
densities_splash = {
    'mdpi': 288,
    'hdpi': 432,
    'xhdpi': 576,
    'xxhdpi': 864,
    'xxxhdpi': 1152
}

for density, sz in densities_splash.items():
    folder = os.path.join(RES_DIR, f'drawable-{density}')
    os.makedirs(folder, exist_ok=True)
    splash_img = create_square_icon(emblem, sz, BG_COLOR_RGBA, logo_scale=0.50)
    splash_path = os.path.join(folder, 'splashscreen_logo.png')
    splash_img.save(splash_path, "PNG")
    print(f"✅ Generated native Android {folder}/splashscreen_logo.png ({sz}x{sz})")

densities_mipmap = {
    'mdpi': (48, 108),
    'hdpi': (72, 162),
    'xhdpi': (96, 216),
    'xxhdpi': (144, 324),
    'xxxhdpi': (192, 432)
}

for density, (icon_sz, fg_sz) in densities_mipmap.items():
    folder = os.path.join(RES_DIR, f'mipmap-{density}')
    os.makedirs(folder, exist_ok=True)
    
    # ic_launcher.webp
    launcher_img = create_square_icon(emblem, icon_sz, BG_COLOR_RGBA, logo_scale=0.68)
    launcher_img.save(os.path.join(folder, 'ic_launcher.webp'), "WEBP")
    
    # ic_launcher_round.webp
    mask = Image.new('L', (icon_sz, icon_sz), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, icon_sz, icon_sz), fill=255)
    round_img = Image.new('RGBA', (icon_sz, icon_sz), (0, 0, 0, 0))
    round_img.paste(launcher_img, (0, 0), mask)
    round_img.save(os.path.join(folder, 'ic_launcher_round.webp'), "WEBP")
    
    # ic_launcher_foreground.webp
    fg_img = create_transparent_foreground(emblem, fg_sz, logo_scale=0.58)
    fg_img.save(os.path.join(folder, 'ic_launcher_foreground.webp'), "WEBP")
    
    # ic_launcher_background.webp
    bg_img = Image.new("RGBA", (fg_sz, fg_sz), BG_COLOR_RGBA)
    bg_img.save(os.path.join(folder, 'ic_launcher_background.webp'), "WEBP")
    
    # ic_launcher_monochrome.webp
    fg_img.save(os.path.join(folder, 'ic_launcher_monochrome.webp'), "WEBP")
    
    print(f"✅ Generated native launcher icons in {folder} (icon: {icon_sz}x{icon_sz}, fg: {fg_sz}x{fg_sz})")

print("\n🎉 All app icons and splash screen graphics generated successfully!")
