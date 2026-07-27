import os
import re

SCREENS_DIR = "/home/subhash/projects/MedSentry/mobile-app/src/screens"

def scan_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find all touchable components
    touchables = re.finditer(r'<(TouchableOpacity|Pressable|Button)[^>]*>', content)
    
    issues = []
    unverifiable = []
    
    for match in touchables:
        tag = match.group(0)
        line_num = content[:match.start()].count('\n') + 1
        
        # Screen readers
        has_accessible = 'accessible={true}' in tag or 'accessible' in tag
        has_role = 'accessibilityRole="button"' in tag
        has_label = 'accessibilityLabel=' in tag
        
        # Touch targets
        has_hitslop = 'hitSlop=' in tag or 'hitSlop={{' in tag
        
        # If it has hitSlop, we assume it's expanded safely.
        # Otherwise, check if it references a style that might be intrinsically sized (like an icon).
        # We can't statically evaluate StyleSheet dimensions easily here without complex AST,
        # so any TouchableOpacity without hitSlop is marked as unverifiable and needing manual review.
        
        if not has_hitslop:
            style_match = re.search(r'style=\{([^}]+)\}', tag)
            style_name = style_match.group(1) if style_match else "No style"
            unverifiable.append(f"Line {line_num}: {tag[:40]}... (Style: {style_name})")
            
        if not has_role and 'Button' not in tag:
            issues.append(f"Line {line_num}: Missing accessibilityRole=\"button\"")
            
    return issues, unverifiable

def main():
    print("--- Accessibility Static Analysis ---")
    
    for root, dirs, files in os.walk(SCREENS_DIR):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                issues, unverifiable = scan_file(path)
                
                if issues or unverifiable:
                    rel_path = os.path.relpath(path, SCREENS_DIR)
                    print(f"\n[{rel_path}]")
                    if issues:
                        print("  Issues (Screen Reader):")
                        for i in issues:
                            print(f"    - {i}")
                    if unverifiable:
                        print("  Unverifiable Touch Targets (Needs Manual/Flexbox Check):")
                        for u in unverifiable:
                            print(f"    - {u}")

if __name__ == '__main__':
    main()
