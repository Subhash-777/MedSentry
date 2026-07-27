import sys

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 6:
        return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    return None

def calculate_luminance(rgb):
    adjusted = []
    for c in rgb:
        if c <= 0.03928:
            adjusted.append(c / 12.92)
        else:
            adjusted.append(((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * adjusted[0] + 0.7152 * adjusted[1] + 0.0722 * adjusted[2]

def calculate_contrast(hex1, hex2):
    rgb1 = hex_to_rgb(hex1)
    rgb2 = hex_to_rgb(hex2)
    
    if not rgb1 or not rgb2:
        return 0
        
    l1 = calculate_luminance(rgb1)
    l2 = calculate_luminance(rgb2)
    
    light = max(l1, l2)
    dark = min(l1, l2)
    
    return (light + 0.05) / (dark + 0.05)

colors = {
    'sageGreen_adjusted': '#3E8E41', # Even darker sage
    'mutedAccent_adjusted': '#20756C', # Even darker teal
    'dangerClay_adjusted': '#A85A46', # Darker clay (PASS)
    'whiteText': '#FFFFFF'
}

pairs_to_test = [
    ('whiteText', 'sageGreen_adjusted'),
    ('whiteText', 'mutedAccent_adjusted'),
    ('whiteText', 'dangerClay_adjusted'),
]

print(f"{'Foreground':<15} | {'Background':<15} | {'Ratio':<6} | {'Status (AA 4.5:1)':<15}")
print("-" * 60)

for fg, bg in pairs_to_test:
    ratio = calculate_contrast(colors[fg], colors[bg])
    status = "PASS" if ratio >= 4.5 else "FAIL"
    print(f"{fg:<15} | {bg:<15} | {ratio:.2f}:1 | {status}")
