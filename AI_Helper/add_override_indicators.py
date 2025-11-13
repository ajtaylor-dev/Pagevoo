import re

# Read the file
file_path = r'D:\Pagevoo\pagevoo-frontend\src\components\StyleEditor.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# H2 Padding
content = re.sub(
    r"(h2Padding === undefined && inherited\.source.*?\n\s+return null\s+\}\)\(\)\})\n(\s+</div>)",
    r"\1\n\2{properties.h2Padding !== undefined && getHeaderOverriddenBy('h2', 'padding') && (\n\2  <span className=\"text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 line-through\">\n\2    overridden\n\2  </span>\n\2)}\n\2",
    content,
    flags=re.DOTALL
)

# H2 Margin
content = re.sub(
    r"(h2Margin === undefined && inherited\.source.*?\n\s+return null\s+\}\)\(\)\})\n(\s+</div>)",
    r"\1\n\2{properties.h2Margin !== undefined && getHeaderOverriddenBy('h2', 'margin') && (\n\2  <span className=\"text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 line-through\">\n\2    overridden\n\2  </span>\n\2)}\n\2",
    content,
    flags=re.DOTALL
)

# H2 Color
content = re.sub(
    r"(h2Color === undefined && inherited\.source.*?\n\s+return null\s+\}\)\(\)\})\n(\s+\{properties\.h2Color)",
    r"\1\n\2{properties.h2Color !== undefined && getHeaderOverriddenBy('h2', 'color') && (\n\2  <span className=\"text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 line-through\">\n\2    overridden\n\2  </span>\n\2)}\n\2{properties.h2Color",
    content,
    flags=re.DOTALL
)

# Write the file back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating H2 properties")
