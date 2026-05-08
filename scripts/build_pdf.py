"""Render a multi-column color-coded PDF from ingredients_raw.json."""
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).parent
RAW = ROOT / "ingredients_raw.json"
OUT_PDF = ROOT / "incibeauty_ingredients.pdf"

COLOR_ORDER = ["Vert", "Jaune", "Orange", "Rouge"]
HEADER_BG = {
    "Vert":   colors.HexColor("#2E7D32"),
    "Jaune":  colors.HexColor("#F9A825"),
    "Orange": colors.HexColor("#EF6C00"),
    "Rouge":  colors.HexColor("#C62828"),
}
ROW_BG = {
    "Vert":   colors.HexColor("#E8F5E9"),
    "Jaune":  colors.HexColor("#FFF8E1"),
    "Orange": colors.HexColor("#FFE0B2"),
    "Rouge":  colors.HexColor("#FFCDD2"),
}


def load_rows() -> list[dict]:
    return json.loads(RAW.read_text(encoding="utf-8"))


def main() -> None:
    rows = load_rows()
    by_color: dict[str, list[str]] = {c: [] for c in COLOR_ORDER}
    for r in rows:
        by_color.setdefault(r["color"], []).append(r["name"])
    for c in by_color:
        by_color[c].sort(key=str.upper)
    counts = {c: len(by_color[c]) for c in COLOR_ORDER}

    page_size = landscape(A4)
    margin = 12 * mm
    doc = BaseDocTemplate(
        str(OUT_PDF),
        pagesize=page_size,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
        title="INCI Beauty - Ingrédients par couleur",
        author="incibeauty.com",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        showBoundary=0,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame])])

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Title"],
        fontSize=16,
        spaceAfter=4,
        textColor=colors.HexColor("#1F2937"),
    )
    sub_style = ParagraphStyle(
        "sub",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#555555"),
        spaceAfter=8,
    )
    section_style = ParagraphStyle(
        "section",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=2,
        spaceAfter=4,
        textColor=colors.white,
    )

    story = []
    story.append(Paragraph("INCI Beauty - Ingrédients cosmétiques par classification couleur", title_style))
    story.append(
        Paragraph(
            f"Source: incibeauty.com/ingredients - {sum(counts.values())} ingrédients uniques "
            f"(Vert: {counts['Vert']}, Jaune: {counts['Jaune']}, "
            f"Orange: {counts['Orange']}, Rouge: {counts['Rouge']})",
            sub_style,
        )
    )

    # Legend
    legend = Table(
        [
            [
                "Vert - Excellent",
                "Jaune - Satisfaisant",
                "Orange - Médiocre",
                "Rouge - À éviter",
            ]
        ],
        colWidths=[doc.width / 4] * 4,
    )
    legend.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), ROW_BG["Vert"]),
                ("BACKGROUND", (1, 0), (1, 0), ROW_BG["Jaune"]),
                ("BACKGROUND", (2, 0), (2, 0), ROW_BG["Orange"]),
                ("BACKGROUND", (3, 0), (3, 0), ROW_BG["Rouge"]),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.grey),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.grey),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(legend)
    story.append(Spacer(1, 6))

    # One section per color, multi-column layout (4 columns)
    name_style = ParagraphStyle(
        "name",
        parent=styles["Normal"],
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor("#222222"),
    )

    n_cols = 4
    for color_name in COLOR_ORDER:
        names = by_color[color_name]
        if not names:
            continue

        # section banner
        banner = Table(
            [[f"{color_name} ({len(names)})"]],
            colWidths=[doc.width],
        )
        banner.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), HEADER_BG[color_name]),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 12),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(banner)
        story.append(Spacer(1, 3))

        # arrange names in column-major order so each "page worth" of rows fits
        # use single big table that splits across pages automatically
        # row_height ~= 9pt; pick rows_per_chunk such that each chunk fits on page
        rows_per_chunk = 70  # tuned for landscape A4 with 7pt font
        chunks = [names[i : i + rows_per_chunk * n_cols] for i in range(0, len(names), rows_per_chunk * n_cols)]
        col_w = doc.width / n_cols
        for chunk in chunks:
            # arrange chunk in column-major: fill first column top-down, then next
            n = len(chunk)
            rows_in_chunk = (n + n_cols - 1) // n_cols
            grid = [["" for _ in range(n_cols)] for _ in range(rows_in_chunk)]
            for idx, value in enumerate(chunk):
                col = idx // rows_in_chunk
                row = idx % rows_in_chunk
                grid[row][col] = Paragraph(value, name_style)

            tbl = Table(grid, colWidths=[col_w] * n_cols)
            style = [
                ("BACKGROUND", (0, 0), (-1, -1), ROW_BG[color_name]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ("INNERGRID", (0, 0), (-1, -1), 0.2, colors.HexColor("#FFFFFF")),
                ("BOX", (0, 0), (-1, -1), 0.3, colors.HexColor("#BDBDBD")),
            ]
            tbl.setStyle(TableStyle(style))
            story.append(tbl)
            story.append(Spacer(1, 2))

        story.append(PageBreak())

    doc.build(story)
    print(f"Wrote {OUT_PDF} ({OUT_PDF.stat().st_size/1024:.0f} KiB)")


if __name__ == "__main__":
    main()
