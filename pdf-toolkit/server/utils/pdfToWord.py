import sys
import os
from pdf2docx import Converter

def convert_pdf_to_word(pdf_file, docx_file):
    cv = None
    try:
        # Check if file exists
        if not os.path.exists(pdf_file):
            print(f"Error: Input file NOT found: {pdf_file}")
            sys.exit(1)

        print(f"Starting conversion: {pdf_file} -> {docx_file}")
        
        # Convert
        cv = Converter(pdf_file)
        
        # Settings to improve layout fidelity and background handling
        settings = {
            "connected_text": True,      # Merge connected text blocks to prevent fragmentation
            "ocr": 0,                    # Disable OCR to avoid conflicts with image layers
            "ignore_page_error": True    # Continue conversion even if some pages have errors
        }
        
        # Convert start to end, without multi-processing for stability in container
        cv.convert(docx_file, start=0, end=None, **settings)
        
        print("Conversion successful")
        
    except Exception as e:
        sys.stderr.write(f"Error during conversion: {str(e)}\n")
        sys.exit(1)
    finally:
        if cv:
            cv.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 pdfToWord.py <input_pdf> <output_docx>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    convert_pdf_to_word(input_pdf, output_docx)
