import JSZip from "jszip";

/**
 * Extract structured text from a .docx file.
 * Handles:
 * - Text boxes (w:txbxContent) for form-style labels and values
 * - Structured Document Tags / Content Controls (w:sdt) for editable form fields
 * - Regular paragraphs as fallback
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const docXml = zip.file("word/document.xml");
  if (!docXml) {
    throw new Error("Invalid .docx file: word/document.xml not found");
  }

  const xmlContent = await docXml.async("string");

  // Extract text from text boxes (labels + some values)
  const textBoxTexts = extractTextBoxContent(xmlContent);

  // Extract text from SDT content controls (editable form field values)
  const sdtTexts = extractSdtContent(xmlContent);

  // Extract regular paragraph text (fallback)
  const paragraphText = extractParagraphText(xmlContent);

  // If we found text boxes, format them as structured label-value pairs
  if (textBoxTexts.length >= 4) {
    const structured = formatTextBoxPairs(textBoxTexts, sdtTexts);
    return `${structured}\n\n--- Additional Document Text ---\n${paragraphText}`;
  }

  // Include SDT values in paragraph text if no text boxes found
  if (sdtTexts.length > 0) {
    const sdtSection = sdtTexts
      .filter((t) => t.length > 0)
      .map((t) => `Form Field Value: ${t}`)
      .join("\n");
    return `${paragraphText}\n\n--- Form Field Values ---\n${sdtSection}`;
  }

  return paragraphText;
}

/**
 * Extract text content from all text boxes (w:txbxContent elements).
 */
function extractTextBoxContent(xml: string): string[] {
  const results: string[] = [];
  const regex = /<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const inner = match[1];
    const textParts: string[] = [];
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(inner)) !== null) {
      textParts.push(tMatch[1]);
    }
    const text = decodeXmlEntities(textParts.join("")).trim();
    results.push(text);
  }

  return results;
}

/**
 * Extract text from Structured Document Tags (SDT / Content Controls).
 * These are editable form fields in Word that hold user-entered values.
 */
function extractSdtContent(xml: string): string[] {
  const results: string[] = [];
  const regex = /<w:sdt>([\s\S]*?)<\/w:sdt>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const inner = match[1];
    // Extract text from the sdtContent part (skip sdtPr which is metadata)
    const contentMatch = inner.match(
      /<w:sdtContent>([\s\S]*?)<\/w:sdtContent>/
    );
    if (contentMatch) {
      const textParts: string[] = [];
      const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
      let tMatch;
      while ((tMatch = tRegex.exec(contentMatch[1])) !== null) {
        textParts.push(tMatch[1]);
      }
      const text = decodeXmlEntities(textParts.join("")).trim();
      if (text) results.push(text);
    }
  }

  return results;
}

/**
 * Format text box contents as label-value pairs.
 * Uses known labels to pair with following values.
 * Also checks SDT content controls for values when a label has no
 * adjacent value in text boxes (e.g., Consignee field).
 */
function formatTextBoxPairs(
  texts: string[],
  sdtTexts: string[]
): string {
  const knownLabels = new Set([
    "date",
    "name of the bu",
    "shipper",
    "consignee",
    "subject matter insured",
    "purchase order/ invoice no.",
    "purchase order/invoice no.",
    "container no",
    "b/l no",
    "bl no",
    "conveyance (vessel name)",
    "conveyance",
    "sailing date",
    "arrival date",
    "voyage from",
    "voyage to",
    "sum insured",
    "incoterms",
    "l/c details / wording",
    "l/c details",
    "lc details",
    "debit (company name)",
    "currency",
    "remarks",
    "special instructions",
  ]);

  // Track which SDT values have been used
  const usedSdtIndices = new Set<number>();

  const lines: string[] = [];
  let i = 0;

  while (i < texts.length) {
    const current = texts[i];
    const currentLower = current.toLowerCase().trim();

    if (knownLabels.has(currentLower)) {
      // This is a label – check if next text box is a value (not another label)
      const next = i + 1 < texts.length ? texts[i + 1] : "";
      const nextLower = next.toLowerCase().trim();

      if (next && !knownLabels.has(nextLower)) {
        lines.push(`${current}: ${next}`);
        i += 2;
      } else {
        // Next is also a label or empty → check SDT content controls for the value
        const sdtValue = findSdtValueForLabel(
          currentLower,
          sdtTexts,
          usedSdtIndices,
          texts
        );
        if (sdtValue) {
          lines.push(`${current}: ${sdtValue}`);
        } else {
          lines.push(`${current}: (empty)`);
        }
        i += 1;
      }
    } else if (current) {
      lines.push(current);
      i += 1;
    } else {
      i += 1;
    }
  }

  // Append any remaining unused SDT values
  for (let s = 0; s < sdtTexts.length; s++) {
    if (!usedSdtIndices.has(s) && sdtTexts[s]) {
      lines.push(`Form Field: ${sdtTexts[s]}`);
    }
  }

  return lines.join("\n");
}

/**
 * Try to find an SDT value that matches a label missing its value.
 * Uses heuristics: SDT values that aren't already used as text box values.
 */
function findSdtValueForLabel(
  labelLower: string,
  sdtTexts: string[],
  usedSdtIndices: Set<number>,
  allTextBoxTexts: string[]
): string | null {
  // Build a set of all text box values for quick lookup
  const textBoxValues = new Set(
    allTextBoxTexts.map((t) => t.toLowerCase().trim())
  );

  for (let i = 0; i < sdtTexts.length; i++) {
    if (usedSdtIndices.has(i)) continue;
    const val = sdtTexts[i];
    const valLower = val.toLowerCase().trim();

    // Skip if this SDT value is identical to an existing text box value
    // (likely already used for another field like "Name of the BU")
    // But for "consignee" specifically, the value often matches the BU name
    if (labelLower === "consignee") {
      // Consignee is commonly the same company name - take first unused SDT
      usedSdtIndices.add(i);
      return val;
    }

    // For other labels, only use SDT values not already in text boxes
    if (!textBoxValues.has(valLower)) {
      usedSdtIndices.add(i);
      return val;
    }
  }

  return null;
}

/**
 * Extract regular paragraph text, skipping drawing/shape elements.
 */
function extractParagraphText(xml: string): string {
  let cleaned = xml
    .replace(/<mc:AlternateContent[\s\S]*?<\/mc:AlternateContent>/g, "")
    .replace(/<w:drawing[\s\S]*?<\/w:drawing>/g, "")
    .replace(/<w:pict[\s\S]*?<\/w:pict>/g, "");

  cleaned = cleaned
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<\/w:tr>/g, "\n");

  cleaned = cleaned.replace(/<[^>]+>/g, "");
  cleaned = decodeXmlEntities(cleaned);

  return cleaned
    .split("\n")
    .map((line) => line.replace(/\t+/g, "\t").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x[0-9A-Fa-f]+;/g, (match) => {
      const code = parseInt(match.slice(3, -1), 16);
      return String.fromCharCode(code);
    });
}
