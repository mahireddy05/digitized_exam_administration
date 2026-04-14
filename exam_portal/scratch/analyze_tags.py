import re

with open('exam_portal/templates/masters/coursereg.html', 'r', encoding='utf-8') as f:
    content = f.read()

tags = re.findall(r'\{%\s*(.*?)\s*%\}', content, re.DOTALL)
stack = []
for tag in tags:
    parts = tag.split()
    if not parts:
        continue
    name = parts[0]
    if name == 'if':
        stack.append('if')
    elif name == 'endif':
        if not stack:
            print("Unexpected endif")
        else:
            stack.pop()
    elif name == 'for':
        stack.append('for')
    elif name == 'endfor':
        if not stack:
             print("Unexpected endfor")
        else:
            stack.pop()
    elif name == 'block':
        stack.append('block')
    elif name == 'endblock':
        if not stack:
             print("Unexpected endblock")
        else:
            stack.pop()

print(f"Remaining stack: {stack}")
