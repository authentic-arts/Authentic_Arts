import zipfile, xml.etree.ElementTree as ET

def extract_docx_text(path):
    with zipfile.ZipFile(path) as z:
        with z.open('word/document.xml') as f:
            tree = ET.parse(f)
    root = tree.getroot()
    paragraphs = []
    for para in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        texts = []
        for r in para.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
            if r.text:
                texts.append(r.text)
        line = ''.join(texts).strip()
        if line:
            paragraphs.append(line)
    return '\n'.join(paragraphs)

text = extract_docx_text('Authentic-Arts-SRS.docx')
print(text)
