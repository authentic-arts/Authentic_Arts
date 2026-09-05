import zipfile
import xml.etree.ElementTree as ET

def extract_docx(path):
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }
    with zipfile.ZipFile(path) as z:
        with z.open('word/document.xml') as f:
            tree = ET.parse(f)
    root = tree.getroot()
    
    out = []
    
    body = root.find('w:body', namespaces)
    if body is None:
        return "No body found"
        
    for child in body:
        tag = child.tag.split('}')[-1]
        if tag == 'p':
            texts = [node.text for node in child.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            text = ''.join(texts).strip()
            if text:
                out.append(text)
        elif tag == 'tbl':
            out.append("\n--- TABLE ---")
            for row in child.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tr'):
                row_cells = []
                for cell in row.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tc'):
                    cell_text = ''.join(node.text for node in cell.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text).strip()
                    row_cells.append(cell_text)
                out.append(" | ".join(row_cells))
            out.append("-------------\n")
            
    return '\n'.join(out)

text = extract_docx('Authentic-Arts-SRS.docx')
with open('srs_full.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print("Extracted successfully!")
