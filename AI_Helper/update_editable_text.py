import re

# Read the file
with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find EditableText components and add sectionId and field props
# We need to extract the field name from the onSave handler

def add_props(match):
    full_match = match.group(0)

    # Extract field name from onSave handler
    field_match = re.search(r"onSave=\{.*?handleInlineTextEdit\(section\.id,\s*'(\w+)'", full_match)
    if not field_match:
        # Try grid column handler
        field_match = re.search(r"onSave=\{.*?handleGridColumnEdit\(\d+", full_match)
        if field_match:
            return full_match  # Skip grid columns for now
        return full_match

    field_name = field_match.group(1)

    # Check if already has sectionId
    if 'sectionId=' in full_match:
        return full_match

    # Insert sectionId and field props after tag prop or at beginning
    if 'tag=' in full_match:
        result = re.sub(
            r'(tag="[^"]+"\s+)',
            r'\1sectionId={section.id}\n              field="' + field_name + '"\n              ',
            full_match
        )
    else:
        result = re.sub(
            r'(<EditableText\s+)',
            r'\1sectionId={section.id}\n              field="' + field_name + '"\n              ',
            full_match
        )

    return result

# Find all EditableText components
pattern = r'<EditableText[^>]*(?:/>|>[^<]*</EditableText>|\s+value=\{[^}]+\}[^>]*/>)'
content = re.sub(pattern, add_props, content, flags=re.DOTALL)

# Write back
with open(r'D:\Pagevoo\pagevoo-frontend\src\pages\TemplateBuilder.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated all EditableText components")
