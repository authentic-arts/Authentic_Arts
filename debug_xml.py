import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile('Authentic-Arts-SRS.docx') as z:
    tree = ET.parse(z.open('word/document.xml'))
root = tree.getroot()
body = root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
print("Body children:")
for idx, child in enumerate(body):
    tag = child.tag.split('}')[-1]
    texts = ''.join(node.text for node in child.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text).strip()
    print(f"{idx}: tag={tag}, text_len={len(texts)}, text={texts[:50]}")
