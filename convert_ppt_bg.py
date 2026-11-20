# -*- coding: utf-8 -*-
"""
Convert all PPTX files to a 100% Bright & Clean Modern Executive Theme:
- Background: Soft clean executive off-white (#F8FAFC)
- Content Cards: Pure White (#FFFFFF) with refined subtle borders (#E2E8F0)
- Code Boxes: Soft light developer card (#F1F5F9) with clean border (#CBD5E1) - NO dark black boxes!
- Code Text: Readable dark slate (#1E293B) and syntax blue (#0284C7 / #2563EB)
- Headings & Text: Deep charcoal navy (#0F172A) and slate (#475569)
"""

import glob
import pptx
from pptx import Presentation
from pptx.dml.color import RGBColor

BG_LIGHT = RGBColor(248, 250, 252)       # #F8FAFC (Soft clean off-white)
CARD_WHITE = RGBColor(255, 255, 255)     # #FFFFFF (Pure white card)
CARD_BORDER = RGBColor(226, 232, 240)    # #E2E8F0
CODE_BG = RGBColor(241, 245, 249)        # #F1F5F9 (Soft light code block)
CODE_BORDER = RGBColor(203, 213, 225)    # #CBD5E1
BADGE_BG = RGBColor(239, 246, 255)       # #EFF6FF (Light blue badge)
BADGE_BORDER = RGBColor(191, 219, 254)   # #BFDBFE

TEXT_TITLE = RGBColor(15, 23, 42)        # #0F172A
TEXT_BODY = RGBColor(71, 85, 105)        # #475569
TEXT_MUTED = RGBColor(100, 116, 139)     # #64748B
TEXT_ACCENT = RGBColor(37, 99, 235)      # #2563EB
TEXT_CYAN = RGBColor(2, 132, 199)        # #0284C7
CODE_TEXT = RGBColor(30, 41, 59)         # #1E293B
CODE_COMMENT = RGBColor(5, 150, 105)     # #059669

def convert_presentation(filepath):
    print(f"Converting: {filepath}")
    prs = Presentation(filepath)
    
    for s_idx, slide in enumerate(prs.slides):
        # 1. First shape: Slide background
        bg_shape = slide.shapes[0]
        if bg_shape.fill and bg_shape.fill.type == 1:
            bg_shape.fill.solid()
            bg_shape.fill.fore_color.rgb = BG_LIGHT

        # 2. Iterate all other shapes
        for sh_idx, shape in enumerate(slide.shapes):
            if sh_idx == 0:
                continue

            # Check shape fill
            if shape.fill and shape.fill.type == 1:
                cur_fill = str(shape.fill.fore_color.rgb).upper()
                if cur_fill in ["0F172A", "0B0F19"]:
                    # Was dark background or dark container -> soft clean off-white or code box
                    if s_idx in [3, 4, 5, 6, 7] and sh_idx == 6:
                        shape.fill.fore_color.rgb = CODE_BG
                        if shape.line:
                            shape.line.color.rgb = CODE_BORDER
                    else:
                        shape.fill.fore_color.rgb = BG_LIGHT
                elif cur_fill in ["1E293B", "1A2234"]:
                    # Regular card -> Pure White
                    shape.fill.fore_color.rgb = CARD_WHITE
                    if shape.line and shape.line.fill and shape.line.fill.type == 1:
                        cur_line = str(shape.line.color.rgb).upper()
                        if cur_line in ["334155", "1E293B", "475569"]:
                            shape.line.color.rgb = CARD_BORDER
                elif cur_fill in ["0A0F1E", "0F172A"]:
                    # Code terminal box -> Soft light developer card (#F1F5F9)
                    shape.fill.fore_color.rgb = CODE_BG
                    if shape.line:
                        shape.line.color.rgb = CODE_BORDER
                elif cur_fill in ["1E3A8A", "1E40AF"]:
                    # Top badge on slide 1
                    shape.fill.fore_color.rgb = BADGE_BG
                    if shape.line:
                        shape.line.color.rgb = BADGE_BORDER

            # Check shape line/border for any remaining dark borders
            if shape.line and shape.line.fill and shape.line.fill.type == 1:
                cur_line = str(shape.line.color.rgb).upper()
                if cur_line in ["334155", "1E293B", "0F172A", "475569"]:
                    shape.line.color.rgb = CARD_BORDER

            # Check text inside shape
            if shape.has_text_frame:
                is_code_box = (s_idx in [3, 4, 5, 6, 7] and sh_idx == 7)

                for p in shape.text_frame.paragraphs:
                    p_text = p.text.strip()
                    if is_code_box:
                        if p_text.startswith("//"):
                            p.font.color.rgb = CODE_COMMENT
                        else:
                            p.font.color.rgb = CODE_TEXT
                    else:
                        if p.font and p.font.color and p.font.color.type == 1:
                            c = str(p.font.color.rgb).upper()
                            if c in ["F8FAFC", "FFFFFF", "E2E8F0"]:
                                p.font.color.rgb = TEXT_TITLE
                            elif c in ["94A3B8", "CBD5E1"]:
                                p.font.color.rgb = TEXT_BODY
                            elif c == "3B82F6":
                                p.font.color.rgb = TEXT_ACCENT
                            elif c == "06B6D4":
                                p.font.color.rgb = TEXT_CYAN

                    # Also check runs
                    for r in p.runs:
                        if is_code_box:
                            if p_text.startswith("//"):
                                r.font.color.rgb = CODE_COMMENT
                            else:
                                r.font.color.rgb = CODE_TEXT
                        else:
                            if r.font and r.font.color and r.font.color.type == 1:
                                rc = str(r.font.color.rgb).upper()
                                if rc in ["F8FAFC", "FFFFFF", "E2E8F0"]:
                                    r.font.color.rgb = TEXT_TITLE
                                elif rc in ["94A3B8", "CBD5E1"]:
                                    r.font.color.rgb = TEXT_BODY
                                elif rc == "3B82F6":
                                    r.font.color.rgb = TEXT_ACCENT
                                elif rc == "06B6D4":
                                    r.font.color.rgb = TEXT_CYAN

    prs.save(filepath)
    print(f" -> Saved bright theme to {filepath}")

# Process files
target_files = [
    "3D데이터_시각화_자동보고서_밝은배경.pptx",
    "3D_데이터_시각화_보고서.pptx",
    "3D데이터 시각화 자동보고서.pptx"
]

for f in target_files:
    try:
        convert_presentation(f)
    except Exception as e:
        print(f"Could not convert {f} (might be open in PowerPoint): {e}")

print("All done!")
