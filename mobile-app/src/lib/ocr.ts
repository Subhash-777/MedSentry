import { supabase } from './supabase';
import MlkitOcr, { MlkitOcrResult, MKLBlock } from 'react-native-mlkit-ocr';
import { invokeAIRouter } from './aiRouterClient';

export interface OcrResult {
  text: string;
  lines: string[];
}

interface LineWithCoords {
  text: string;
  top: number;
  left: number;
  height: number;
  width: number;
}

/**
 * 2D Spatial Layout Reconstruction:
 * Group OCR lines into horizontal table rows based on vertical Y-overlap,
 * then sort each row left-to-right by X-coordinate.
 * This fixes multi-column prescription tables being split across disconnected blocks.
 */
function clusterLinesSpatially(blocks: MlkitOcrResult): { lines: string[]; fullText: string } {
  const rawLines: LineWithCoords[] = [];

  for (const block of blocks) {
    if (!block.lines || block.lines.length === 0) {
      if (block.text && block.text.trim()) {
        rawLines.push({
          text: block.text.trim(),
          top: block.bounding?.top ?? 0,
          left: block.bounding?.left ?? 0,
          height: block.bounding?.height ?? 20,
          width: block.bounding?.width ?? 100,
        });
      }
      continue;
    }

    for (const line of block.lines) {
      const text = line.text?.trim();
      if (!text) continue;
      rawLines.push({
        text,
        top: line.bounding?.top ?? block.bounding?.top ?? 0,
        left: line.bounding?.left ?? block.bounding?.left ?? 0,
        height: line.bounding?.height ?? 20,
        width: line.bounding?.width ?? 100,
      });
    }
  }

  if (rawLines.length === 0) return { lines: [], fullText: '' };

  // 1. Sort primarily by Y (top)
  rawLines.sort((a, b) => a.top - b.top);

  // 2. Cluster into horizontal rows
  const rows: LineWithCoords[][] = [];
  let currentRow: LineWithCoords[] = [];
  let currentY = rawLines[0].top;
  let currentHeight = rawLines[0].height;

  for (const item of rawLines) {
    const verticalDiff = Math.abs(item.top - currentY);
    const threshold = Math.max(item.height, currentHeight) * 0.65;

    if (currentRow.length === 0 || verticalDiff <= threshold) {
      currentRow.push(item);
      currentY = currentRow.reduce((acc, l) => acc + l.top, 0) / currentRow.length;
      currentHeight = currentRow.reduce((acc, l) => acc + l.height, 0) / currentRow.length;
    } else {
      rows.push(currentRow);
      currentRow = [item];
      currentY = item.top;
      currentHeight = item.height;
    }
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // 3. Sort each row left-to-right (X-clustering) and combine
  const processedLines: string[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.left - b.left);
    const rowText = row.map(r => r.text).join(' ').trim();
    if (rowText) {
      processedLines.push(rowText);
    }
  }

  return {
    lines: processedLines,
    fullText: processedLines.join(' '),
  };
}

export async function recognizeTextFromImage(uri: string): Promise<OcrResult> {
  try {
    const result = await MlkitOcr.detectFromUri(uri);
    const { lines, fullText } = clusterLinesSpatially(result);

    return {
      text: fullText.trim(),
      lines,
    };
  } catch (err) {
    console.error('OCR recognition error:', err);
    throw err;
  }
}

/**
 * Fast client-side Levenshtein distance for fuzzy matching against drug catalog
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export function calculateSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  return (maxLen - dist) / maxLen;
}

/**
 * Resilient Drug Matcher:
 * 1. Checks PostgreSQL pg_trgm RPC (fuzzy_search_drug)
 * 2. Checks exact Substring ILIKE
 * 3. Fallback: Prefix search with client-side Levenshtein similarity scoring
 */
export async function findDrugFromOcrText(ocrLines: string[]): Promise<{ id: string | null, searchTerms: string }> {
  if (ocrLines.length === 0) return { id: null, searchTerms: '' };

  const stopWords = new Set([
    'caution', 'warning', 'store', 'keep', 'reach', 'children', 'cool', 'dry', 'place',
    'manufactured', 'mfg', 'exp', 'date', 'batch', 'registered', 'trademark', 'under',
    'sold', 'retail', 'prescription', 'only', 'directed', 'physician', 'dosage',
    'private', 'limited', 'pvt', 'ltd', 'pharmaceuticals', 'pharma', 'industries',
    'medicine', 'strip', 'tablets', 'capsules', 'syrup', 'suspension', 'injection',
    'out', 'the', 'not', 'for', 'sale', 'from', 'away', 'protected', 'light', 'moisture',
    'incl', 'all', 'taxes', 'mrp', 'rs', 'tabs', 'caps', 'ip', 'bp', 'usp'
  ]);

  const rawWords = ocrLines
    .join(' ')
    .replace(/[0-9]+/g, ' ') // convert numbers to spaces so "daflon500mg" splits to "daflon" "mg"
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));

  // Expand words to handle common OCR artifacts
  const expandedWords = new Set<string>();
  for (const w of rawWords) {
    let lower = w.toLowerCase();
    expandedWords.add(lower);
    
    if (lower.endsWith('omg') && lower.length > 5) {
      expandedWords.add(lower.slice(0, -3));
    } else if (lower.endsWith('mg') && lower.length > 4) {
      expandedWords.add(lower.slice(0, -2));
    }
    
    // OCR often hallucinates trailing 's' (e.g., 'daflons' instead of 'daflon')
    if (lower.endsWith('s') && lower.length > 4) {
      expandedWords.add(lower.slice(0, -1));
    }
  }

  const words = Array.from(expandedWords);

  if (words.length === 0) return { id: null, searchTerms: '' };

  const searchWords = words.slice(0, 30);
  const searchTerms = searchWords.join(' ');

  try {
    // 1. Try DB RPC fuzzy_search_drug if available (Deviation #14)
    try {
      const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)('fuzzy_search_drug', {
        search_terms: searchWords,
      });
      if (!rpcErr && rpcData && rpcData.length > 0 && rpcData[0].id) {
        return { id: rpcData[0].id, searchTerms };
      }
    } catch (_) {
      // RPC may not exist yet if migration pending approval; proceed seamlessly
    }

    // 2. Direct ILIKE search
    const orQuery = searchWords.map(w => {
      if (w.length > 5) return `name.ilike.%${w}%`;
      return `name.ilike.${w}%`;
    }).join(',');

    const { data, error } = await (supabase
      .from('drugs')
      .select('id, name')
      .or(orQuery)
      .limit(5) as any);

    if (!error && data && data.length > 0) {
      return { 
        id: data[0].id, 
        searchTerms 
      };
    }

    // 3. Fallback: Prefix retrieval + client-side Levenshtein scoring
    // Absorbs typos like "Paracetam0l" -> prefix "para%" -> scored against "Paracetamol"
    const prefixQueries = searchWords
      .filter(w => w.length >= 4)
      .slice(0, 8)
      .map(w => `name.ilike.${w.slice(0, 4)}%`)
      .join(',');

    if (prefixQueries) {
      const { data: candidates } = await (supabase
        .from('drugs')
        .select('id, name')
        .or(prefixQueries)
        .limit(25) as any);

      if (candidates && candidates.length > 0) {
        let bestMatch: { id: string; similarity: number } | null = null;
        for (const candidate of candidates) {
          for (const word of searchWords) {
            const sim = calculateSimilarity(candidate.name, word);
            if (sim >= 0.70 && (!bestMatch || sim > bestMatch.similarity)) {
              bestMatch = { id: candidate.id, similarity: sim };
            }
          }
        }
        if (bestMatch) {
          return { id: bestMatch.id, searchTerms };
        }
      }
    }

    return { id: null, searchTerms };
  } catch (err) {
    console.error('Exception finding drug:', err);
    return { id: null, searchTerms: '' };
  }
}

export interface ParsedMedicine {
  rawText: string;
  name: string;
  dosage: string;
  frequency: string[];
  instructions: string;
  durationDays: number | null;
}

function parseMedicineLine(line: string): ParsedMedicine {
  const lower = line.toLowerCase();
  
  const result: ParsedMedicine = {
    rawText: line.trim(),
    name: line.split(' ')[0] || '', // Very naive name fallback
    dosage: '',
    frequency: [],
    instructions: '',
    durationDays: null
  };

  // 1. Dosage
  const dosageMatch = lower.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|tablet|tab|cap|capsule)s?)/);
  if (dosageMatch) {
    result.dosage = dosageMatch[1];
  }

  // Try to grab name (everything before dosage)
  if (result.dosage) {
    const idx = lower.indexOf(result.dosage.toLowerCase());
    if (idx > 0) {
      result.name = line.substring(0, idx).trim();
    }
  }

  // 2. Frequency
  if (lower.match(/morning|am/)) result.frequency.push('morning');
  if (lower.match(/afternoon|noon/)) result.frequency.push('afternoon');
  if (lower.match(/evening|night|bedtime|sleep|pm|hs/)) result.frequency.push('night');
  
  // Shorthand logic (overrides if found)
  if (lower.includes('1-0-1') || lower.includes('bid') || lower.includes('b.i.d')) {
    result.frequency = ['morning', 'night'];
  } else if (lower.includes('1-1-1') || lower.includes('tid') || lower.includes('t.i.d')) {
    result.frequency = ['morning', 'afternoon', 'night'];
  } else if (lower.includes('1-0-0') || lower.includes('od') || lower.includes('o.d')) {
    result.frequency = ['morning'];
  } else if (lower.includes('0-0-1')) {
    result.frequency = ['night'];
  }
  
  if (result.frequency.length === 0 && lower.includes('daily')) {
    result.frequency = ['morning'];
  }

  // 3. Instructions
  if (lower.includes('before food') || lower.includes('before meal') || lower.includes('empty stomach') || lower.includes('ac')) {
    result.instructions = 'Before food';
  } else if (lower.includes('after food') || lower.includes('after meal') || lower.includes('pc')) {
    result.instructions = 'After food';
  }
  
  // Pick up custom instructions like "Take 30 min before sleep"
  const takeMatch = line.match(/(take .*)/i);
  if (takeMatch) {
    result.instructions = takeMatch[1].trim();
  }

  // 4. Duration
  const durationMatch = lower.match(/(\d+)\s*(days?|weeks?|months?)/);
  if (durationMatch) {
    let days = parseInt(durationMatch[1], 10);
    if (durationMatch[2].startsWith('week')) days *= 7;
    if (durationMatch[2].startsWith('month')) days *= 30;
    result.durationDays = days;
  }

  return result;
}

/**
 * Phase 2 heuristic extraction for prescriptions.
 * A real version will use the AI layer (Phase 3).
 */
export function parsePrescriptionFromOcrText(lines: string[]) {
  const extracted = {
    patientName: '',
    age: '',
    weight: '',
    height: '',           // Item 1 fix: tracked and populated
    conditions: [] as string[],
    medicines: [] as ParsedMedicine[],
    doctorReg: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
  };

  const text = lines.join(' ');

  // ─── Junk line detector ────────────────────────────────────────────────────
  const JUNK_PATTERNS = [
    /^(drug|dosage|frequency|duration|instructions|qty|quantity|tablet|unit|route)s?$/i,
    /^(drug\s+name|med\s*name|medication\s+name)$/i,
    /@/,                          // email addresses
    /^\+?\d[\d\s\-\(\)]{7,}$/,   // phone numbers
    /www\./i,                     // URLs
    /^[A-Z0-9_\-]{10,}$/,        // all-caps junk (codes/ids)
    /^\s*$/,
  ];
  function isJunk(line: string): boolean {
    return JUNK_PATTERNS.some(p => p.test(line.trim()));
  }

  // ─── 1. Line-by-line block heuristics ────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();

    // Patient Name — block header
    if (lower === 'patient' || lower === 'patient name') {
      const nextLine = lines[i + 1]?.trim() || '';
      if (
        nextLine &&
        !nextLine.toLowerCase().includes('age') &&
        !nextLine.toLowerCase().includes('date') &&
        !isJunk(nextLine)
      ) {
        extracted.patientName = nextLine;
      }
    } else if (lower.startsWith('name:')) {
      const candidate = line.replace(/name:/i, '').trim();
      if (!isJunk(candidate)) extracted.patientName = candidate;
    }

    // Diagnosis
    if (lower === 'diagnosis' || lower === 'conditions' || lower === 'dx:' || lower === 'dx') {
      const nextLine = lines[i + 1]?.trim() || '';
      if (nextLine && nextLine.length > 2 && !nextLine.toLowerCase().includes('medication') && !nextLine.toLowerCase().includes('prescription')) {
        extracted.conditions.push(nextLine);
      }
    }

    // ─── Medications block ───────────────────────────────────────────────
    if (lower === 'medications' || lower === 'medication' || lower === 'rx' || lower === 'rx:') {
      // OCR of prescription tables produces lines like:
      //   "Melatonin"  "3mg"  "At bedtime"  "30 days"  "Take 30 min before sleep"
      // all as separate OCR lines. We group them by detecting a new drug name line
      // (starts with capital letter) as the start of a new medicine record, then
      // appending subsequent non-junk lines as extra context.

      let j = i + 1;
      const MAX_LINES_AHEAD = 25;

      // Skip column-header row if present (e.g. "DRUG DOSAGE FREQUENCY DURATION INSTRUCTIONS")
      if (j < lines.length) {
        const headerLine = lines[j].trim().toLowerCase();
        if (
          headerLine.includes('drug') ||
          (headerLine.includes('dosage') && headerLine.includes('frequency'))
        ) {
          j++;
        }
      }

      let currentBlockLines: string[] = [];

      const flushBlock = () => {
        if (currentBlockLines.length === 0) return;
        const merged = currentBlockLines.join(' ');
        const parsed = parseMedicineLine(merged);
        if (parsed.name && parsed.name.length > 1 && !isJunk(parsed.name)) {
          extracted.medicines.push(parsed);
        }
        currentBlockLines = [];
      };

      while (j < lines.length && j < i + 1 + MAX_LINES_AHEAD) {
        const mLine = lines[j].trim();
        const mLower = mLine.toLowerCase();

        // Stop conditions
        if (
          mLower.includes('signature') ||
          mLower.startsWith('dr.') ||
          mLower.startsWith('signed') ||
          /^date[\s:]/i.test(mLine)
        ) break;

        // Skip junk / empty lines
        if (isJunk(mLine) || mLine.length <= 2) {
          j++;
          continue;
        }

        // A new drug starts when a line begins with a Capital letter word
        // and we already have content in the current block, EXCEPT if it's an instruction
        const startsWithCapital = /^[A-Z][a-z]/.test(mLine);
        const isInstruction = /^(take|at|before|after|with|for|in|as)\b/i.test(mLine);
        
        if (startsWithCapital && !isInstruction && currentBlockLines.length > 0) {
          // Is the current block likely a multi-line continuation?
          // Only flush if current block already has a parseable drug name
          const firstBlockLine = currentBlockLines[0];
          if (/^[A-Z][a-z]/.test(firstBlockLine)) {
            flushBlock();
          }
        }

        currentBlockLines.push(mLine);
        j++;
      }

      flushBlock();
      i = j - 1; // advance outer loop past consumed lines
    }
  }

  // ─── 2. Fallback regex (Inline matches & handwritten) ─────────────────────
  if (!extracted.patientName) {
    // Must NOT contain @ (email) — regex explicitly rejects them via isJunk check
    const nameMatch = text.match(
      /(?:name[:\s]+|(?:Mr\.|Mrs\.|Ms\.|Mast\.)\s+)([A-Za-z][A-Za-z\s]{1,38})/i
    );
    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      if (!isJunk(candidate)) extracted.patientName = candidate;
    }
  }

  if (!extracted.age) {
    const ageMatch =
      text.match(/(?:age)[:\s]+(\d{1,3})/i) ||
      text.match(/(\d{1,3})\s*[\/\\]\s*[MF]/i);
    if (ageMatch) extracted.age = ageMatch[1];
  }

  const weightMatch = text.match(/weight[:\s]+(\d{2,3})/i);
  if (weightMatch) extracted.weight = weightMatch[1];

  const heightMatch = text.match(/height[:\s]+(\d{2,3}(?:\.\d)?)/i);
  if (heightMatch) extracted.height = heightMatch[1];

  // Use last Dr. occurrence (avoids matching doctor's address line at top)
  const drMatches = [...text.matchAll(/Dr\.?\s+([A-Za-z][A-Za-z\s]{1,30})/g)];
  if (drMatches.length > 0) {
    extracted.doctorReg = drMatches[drMatches.length - 1][1].trim();
  }

  if (extracted.medicines.length === 0) {
    // Handwritten fallback: anything after Rx / R/
    const rxMatch = text.match(/R[xX,\/]\s*(.{5,200})/i);
    if (rxMatch) {
      extracted.medicines.push(parseMedicineLine(rxMatch[1].trim()));
    }
  }

  // Date extraction: DD/MM/YYYY or YYYY-MM-DD
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const raw = dateMatch[1];
    const parsed = new Date(raw.replace(/\//g, '-'));
    if (!isNaN(parsed.getTime())) {
      extracted.prescriptionDate = parsed.toISOString().split('T')[0];
    }
  }

  return extracted;
}

// ---------------------------------------------------------------------------
// Medicine strip scan result (item 2 additions)
// ---------------------------------------------------------------------------
export interface MedicineStripResult {
  expiryDate: Date | null;   // null = not found in OCR
  batchNumber: string | null; // null = not found in OCR
  pillCount: number | null;  // null = manual entry required
}

/**
 * Parses expiry date, batch number, and pill count from medicine strip/box OCR lines.
 * Runs in the same OCR pass as findDrugFromOcrText.
 *
 * Expiry patterns supported: EXP MM/YY · EXP MM/YYYY · EXP: YYYY-MM-DD
 * Batch patterns: BATCH/LOT/B.NO followed by alphanumeric string.
 * Pill count: looks for number adjacent to "tab" / "cap" / "ml" / "pills".
 */
export function parseMedicineStripFromOcrText(lines: string[]): MedicineStripResult {
  const text = lines.join(' ');

  // ----- Expiry date -----
  let expiryDate: Date | null = null;
  // EXP MM/YY, MM/YYYY, or MMM.YY (e.g. JUL.24)
  const expShort = text.match(/(?:exp(?:iry)?|use before)[:\s.]*([a-zA-Z]{3}|\d{1,2})[\/\-\.\s]*(\d{2,4})/i);
  if (expShort) {
    let monthIndex = 0;
    const monthRaw = expShort[1].toUpperCase();
    if (isNaN(parseInt(monthRaw))) {
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      monthIndex = months.indexOf(monthRaw);
    } else {
      monthIndex = parseInt(monthRaw) - 1;
    }

    if (monthIndex >= 0 && monthIndex <= 11) {
      const yearRaw = expShort[2];
      const year = yearRaw.length === 2 ? 2000 + parseInt(yearRaw) : parseInt(yearRaw);
      // Set to last day of the expiry month
      const candidate = new Date(year, monthIndex + 1, 0);
      if (!isNaN(candidate.getTime())) expiryDate = candidate;
    }
  }
  // EXP YYYY-MM-DD full form fallback
  if (!expiryDate) {
    const expFull = text.match(/(?:exp(?:iry)?)[:\s.]*(\d{4}-\d{2}-\d{2})/i);
    if (expFull) {
      const candidate = new Date(expFull[1]);
      if (!isNaN(candidate.getTime())) expiryDate = candidate;
    }
  }

  // ----- Batch number -----
  let batchNumber: string | null = null;
  const batchMatch = text.match(/(?:batch|lot|b\.?\s*no)[:\s.#]*([A-Z0-9\-]{4,20})/i);
  if (batchMatch) batchNumber = batchMatch[1].trim();

  // ----- Pill count -----
  let pillCount: number | null = null;
  const pillMatch = text.match(/(\d+)\s*(?:tab(?:let)?s?|cap(?:sule)?s?|pills?)/i);
  if (pillMatch) pillCount = parseInt(pillMatch[1]);

  return { expiryDate, batchNumber, pillCount };
}

// ---------------------------------------------------------------------------
// Multimodal Gemini AI Prescription Extractor (Cursive & Complex Tables)
// ---------------------------------------------------------------------------
export interface ExtractedPrescriptionData {
  patientName: string;
  age: string;
  weight: string;
  height: string;
  conditions: string[];
  medicines: ParsedMedicine[];
  doctorReg: string;
  prescriptionDate: string;
}

export async function extractPrescriptionWithGeminiVision(
  base64Image: string
): Promise<ExtractedPrescriptionData> {
  const result = await invokeAIRouter('prescription_ocr', [], base64Image);

  let parsed: any = null;
  if (result.parsed) {
    parsed = result.parsed;
  } else if (result.text) {
    const clean = result.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(clean);
  }

  if (!parsed) {
    throw new Error('AI could not parse structured prescription details');
  }

  return {
    patientName: parsed.patientName || '',
    age: parsed.age || '',
    weight: parsed.weight || '',
    height: parsed.height || '',
    conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
    doctorReg: parsed.doctorReg || '',
    prescriptionDate: parsed.prescriptionDate || new Date().toISOString().split('T')[0],
    medicines: Array.isArray(parsed.medicines)
      ? parsed.medicines.map((m: any) => ({
          rawText: `${m.name || ''} ${m.dosage || ''} ${(m.frequency || []).join(' ')} ${m.instructions || ''}`.trim(),
          name: m.name || '',
          dosage: m.dosage || '',
          frequency: Array.isArray(m.frequency) ? m.frequency : [],
          instructions: m.instructions || '',
          durationDays: typeof m.durationDays === 'number' ? m.durationDays : null,
        }))
      : [],
  };
}

// ---------------------------------------------------------------------------
// 2D Barcode (GS1 DataMatrix) Parser for Medicine Strips
// ---------------------------------------------------------------------------
export interface GS1ParseResult {
  gtin: string | null;
  expiryDate: Date | null;
  batchNumber: string | null;
}

export function parseGS1DataMatrix(rawBarcode: string): GS1ParseResult {
  let gtin: string | null = null;
  let expiryDate: Date | null = null;
  let batchNumber: string | null = null;

  // Format with AI parentheses: (01)08901148247019(17)260831(10)BT82931
  const gtinParen = rawBarcode.match(/\(01\)(\d{14})/);
  if (gtinParen) gtin = gtinParen[1];

  const expParen = rawBarcode.match(/\(17\)(\d{6})/);
  if (expParen) {
    const raw = expParen[1];
    const year = 2000 + parseInt(raw.slice(0, 2), 10);
    const month = parseInt(raw.slice(2, 4), 10) - 1;
    const day = parseInt(raw.slice(4, 6), 10);
    expiryDate = new Date(year, month, day || 28);
  }

  const batchParen = rawBarcode.match(/\(10\)([A-Za-z0-9\-]+)/);
  if (batchParen) batchNumber = batchParen[1];

  // Plain continuous format: 01089011482470191726083110BT82931
  if (!gtin && rawBarcode.startsWith('01') && rawBarcode.length >= 16) {
    gtin = rawBarcode.slice(2, 16);
    const rest = rawBarcode.slice(16);
    if (rest.startsWith('17') && rest.length >= 8) {
      const raw = rest.slice(2, 8);
      const year = 2000 + parseInt(raw.slice(0, 2), 10);
      const month = parseInt(raw.slice(2, 4), 10) - 1;
      const day = parseInt(raw.slice(4, 6), 10);
      expiryDate = new Date(year, month, day || 28);
      const afterExp = rest.slice(8);
      if (afterExp.startsWith('10')) {
        batchNumber = afterExp.slice(2);
      }
    }
  }

  return { gtin, expiryDate, batchNumber };
}

