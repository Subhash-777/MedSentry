import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as T from '../../theme/colors';

export interface SafeMarkdownProps {
  content: string;
  style?: StyleProp<ViewStyle>;
  baseTextStyle?: StyleProp<TextStyle>;
  selectable?: boolean;
}

type InlineToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'bold_italic'; content: string }
  | { type: 'code'; content: string }
  | { type: 'link'; label: string; url: string; safe: boolean };

type BlockToken =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'code_block'; lang?: string; code: string }
  | { type: 'blockquote'; text: string }
  | { type: 'callout'; kind: 'warning' | 'danger' | 'info'; title?: string; text: string }
  | { type: 'ul_item'; level: number; text: string }
  | { type: 'ol_item'; number: string; text: string }
  | { type: 'hr' }
  | { type: 'p'; text: string };

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Regex matching:
  // 1) bold_italic: ***...*** or ___...___
  // 2) bold: **...** or __...__
  // 3) italic: *...* or _..._
  // 4) inline code: `...`
  // 5) links: [label](url)
  // 6) raw links: https://... or http://...
  const regex = /(\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`\n]+`|\[([^\]]+)\]\(([^)\s]+)\)|https?:\/\/[^\s<]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    if ((raw.startsWith('***') && raw.endsWith('***')) || (raw.startsWith('___') && raw.endsWith('___'))) {
      tokens.push({ type: 'bold_italic', content: raw.slice(3, -3) });
    } else if ((raw.startsWith('**') && raw.endsWith('**')) || (raw.startsWith('__') && raw.endsWith('__'))) {
      tokens.push({ type: 'bold', content: raw.slice(2, -2) });
    } else if ((raw.startsWith('*') && raw.endsWith('*')) || (raw.startsWith('_') && raw.endsWith('_'))) {
      tokens.push({ type: 'italic', content: raw.slice(1, -1) });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', content: raw.slice(1, -1) });
    } else if (match[2] && match[3]) {
      const label = match[2];
      const url = match[3];
      tokens.push({ type: 'link', label, url, safe: isSafeUrl(url) });
    } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
      tokens.push({ type: 'link', label: raw, url: raw, safe: isSafeUrl(raw) });
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return tokens;
}

function parseBlocks(markdown: string): BlockToken[] {
  const blocks: BlockToken[] = [];
  if (!markdown) return blocks;

  // Handle code blocks first by splitting on triple backticks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let cbMatch: RegExpExecArray | null;

  const sections: { isCode: boolean; lang?: string; content: string }[] = [];

  while ((cbMatch = codeBlockRegex.exec(markdown)) !== null) {
    if (cbMatch.index > lastIndex) {
      sections.push({ isCode: false, content: markdown.slice(lastIndex, cbMatch.index) });
    }
    sections.push({ isCode: true, lang: cbMatch[1], content: cbMatch[2] });
    lastIndex = cbMatch.index + cbMatch[0].length;
  }
  if (lastIndex < markdown.length) {
    sections.push({ isCode: false, content: markdown.slice(lastIndex) });
  }

  for (const section of sections) {
    if (section.isCode) {
      blocks.push({
        type: 'code_block',
        lang: section.lang,
        code: section.content.trimEnd(),
      });
      continue;
    }

    const lines = section.content.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // Horizontal rule
      if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
        blocks.push({ type: 'hr' });
        i++;
        continue;
      }

      // Headings
      if (/^#\s+/.test(trimmed)) {
        blocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
        i++;
        continue;
      }
      if (/^##\s+/.test(trimmed)) {
        blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
        i++;
        continue;
      }
      if (/^###\s+/.test(trimmed)) {
        blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
        i++;
        continue;
      }
      if (/^####\s+/.test(trimmed)) {
        blocks.push({ type: 'h4', text: trimmed.replace(/^####\s+/, '') });
        i++;
        continue;
      }

      // Blockquotes
      if (/^>\s*/.test(trimmed)) {
        const quoteLines: string[] = [];
        while (i < lines.length && /^>\s*/.test(lines[i].trim())) {
          quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
          i++;
        }
        blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
        continue;
      }

      // Medical callout highlights (Warnings / Contraindications / Notes)
      const isDanger = /^\*\*(?:Danger|Contraindication|Alert):?\*\*[:]?/i.test(trimmed) || /^(?:Contraindication|Danger):/i.test(trimmed);
      const isWarning = /^\*\*(?:Warning|Caution|Refill Nudge):?\*\*[:]?/i.test(trimmed) || /^(?:Warning|Caution):/i.test(trimmed);
      const isInfo = /^\*\*(?:Note|Important|Adherence|AWaRe):?\*\*[:]?/i.test(trimmed) || /\[AWaRe:\s*(?:Access|Watch|Reserve)\]/i.test(trimmed);

      if (isDanger || isWarning || isInfo) {
        const kind = isDanger ? 'danger' : isWarning ? 'warning' : 'info';
        blocks.push({ type: 'callout', kind, text: trimmed });
        i++;
        continue;
      }

      // Unordered list item
      const ulMatch = line.match(/^(\s*)(?:[-*•])\s+(.+)$/);
      if (ulMatch) {
        const indent = ulMatch[1].length;
        const level = Math.floor(indent / 2);
        blocks.push({ type: 'ul_item', level, text: ulMatch[2] });
        i++;
        continue;
      }

      // Ordered list item
      const olMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
      if (olMatch) {
        blocks.push({ type: 'ol_item', number: olMatch[2], text: olMatch[3] });
        i++;
        continue;
      }

      // Regular paragraph — collect consecutive lines until blank line or block start
      const pLines: string[] = [trimmed];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(?:#{1,4}\s+|[-*•]\s+|\d+[.)]\s+|>\s*|---|```|\*\*(?:Warning|Caution|Danger|Contraindication))/i.test(lines[i].trim())
      ) {
        pLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'p', text: pLines.join(' ') });
    }
  }

  return blocks;
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = React.memo(({
  content,
  style,
  baseTextStyle,
  selectable = true,
}) => {
  const blocks = useMemo(() => parseBlocks(content || ''), [content]);

  const handleOpenLink = (url: string) => {
    if (isSafeUrl(url)) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const renderInline = (text: string, inlineStyle?: StyleProp<TextStyle>) => {
    const tokens = parseInlineTokens(text);
    return tokens.map((token, index) => {
      if (token.type === 'bold') {
        return (
          <Text key={index} style={[styles.bold, inlineStyle]}>
            {token.content}
          </Text>
        );
      }
      if (token.type === 'italic') {
        return (
          <Text key={index} style={[styles.italic, inlineStyle]}>
            {token.content}
          </Text>
        );
      }
      if (token.type === 'bold_italic') {
        return (
          <Text key={index} style={[styles.bold, styles.italic, inlineStyle]}>
            {token.content}
          </Text>
        );
      }
      if (token.type === 'code') {
        return (
          <Text key={index} style={[styles.inlineCode]}>
            {` ${token.content} `}
          </Text>
        );
      }
      if (token.type === 'link') {
        if (!token.safe) {
          return (
            <Text key={index} style={[styles.text, inlineStyle]}>
              {token.label}
            </Text>
          );
        }
        return (
          <Text
            key={index}
            style={[styles.link, inlineStyle]}
            onPress={() => handleOpenLink(token.url)}
            accessibilityRole="link"
          >
            {token.label}
          </Text>
        );
      }
      return (
        <Text key={index} style={[styles.text, inlineStyle]}>
          {token.content}
        </Text>
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <Text key={idx} selectable={selectable} style={[styles.h1, baseTextStyle]}>
                {renderInline(block.text, styles.h1Text)}
              </Text>
            );
          case 'h2':
            return (
              <Text key={idx} selectable={selectable} style={[styles.h2, baseTextStyle]}>
                {renderInline(block.text, styles.h2Text)}
              </Text>
            );
          case 'h3':
            return (
              <Text key={idx} selectable={selectable} style={[styles.h3, baseTextStyle]}>
                {renderInline(block.text, styles.h3Text)}
              </Text>
            );
          case 'h4':
            return (
              <Text key={idx} selectable={selectable} style={[styles.h4, baseTextStyle]}>
                {renderInline(block.text, styles.h4Text)}
              </Text>
            );
          case 'blockquote':
            return (
              <View key={idx} style={styles.blockquote}>
                <Text selectable={selectable} style={[styles.blockquoteText, baseTextStyle]}>
                  {renderInline(block.text, styles.blockquoteInline)}
                </Text>
              </View>
            );
          case 'callout': {
            const calloutStyle =
              block.kind === 'danger'
                ? styles.calloutDanger
                : block.kind === 'warning'
                ? styles.calloutWarning
                : styles.calloutInfo;
            const textStyle =
              block.kind === 'danger'
                ? styles.calloutDangerText
                : block.kind === 'warning'
                ? styles.calloutWarningText
                : styles.calloutInfoText;
            return (
              <View key={idx} style={[styles.calloutBase, calloutStyle]}>
                <Text selectable={selectable} style={[styles.calloutText, textStyle, baseTextStyle]}>
                  {renderInline(block.text, textStyle)}
                </Text>
              </View>
            );
          }
          case 'ul_item':
            return (
              <View key={idx} style={[styles.listRow, { paddingLeft: block.level * 14 }]}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text selectable={selectable} style={[styles.listContent, baseTextStyle]}>
                  {renderInline(block.text)}
                </Text>
              </View>
            );
          case 'ol_item':
            return (
              <View key={idx} style={styles.listRow}>
                <Text style={styles.numberSymbol}>{block.number}.</Text>
                <Text selectable={selectable} style={[styles.listContent, baseTextStyle]}>
                  {renderInline(block.text)}
                </Text>
              </View>
            );
          case 'code_block':
            return (
              <View key={idx} style={styles.codeBlock}>
                {block.lang ? (
                  <Text style={styles.codeBlockLang}>{block.lang}</Text>
                ) : null}
                <Text selectable={selectable} style={styles.codeBlockText}>
                  {block.code}
                </Text>
              </View>
            );
          case 'hr':
            return <View key={idx} style={styles.hr} />;
          case 'p':
          default:
            return (
              <Text key={idx} selectable={selectable} style={[styles.paragraph, baseTextStyle]}>
                {renderInline(block.text)}
              </Text>
            );
        }
      })}
    </View>
  );
});

SafeMarkdown.displayName = 'SafeMarkdown';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: T.textColor,
  },
  bold: {
    fontWeight: '700',
    color: T.textColor,
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: T.textColor,
    backgroundColor: T.warmCocoa + '44',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  link: {
    color: T.mutedAccentSolid,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  h1: {
    marginTop: 10,
    marginBottom: 6,
  },
  h1Text: {
    fontSize: 20,
    fontWeight: '800',
    color: T.textColor,
    letterSpacing: -0.3,
  },
  h2: {
    marginTop: 8,
    marginBottom: 4,
  },
  h2Text: {
    fontSize: 18,
    fontWeight: '700',
    color: T.textColor,
    letterSpacing: -0.2,
  },
  h3: {
    marginTop: 6,
    marginBottom: 4,
  },
  h3Text: {
    fontSize: 16,
    fontWeight: '700',
    color: T.textColor,
  },
  h4: {
    marginTop: 4,
    marginBottom: 2,
  },
  h4Text: {
    fontSize: 15,
    fontWeight: '700',
    color: T.textColor,
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 22,
    fontSize: 15,
    color: T.textColor,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletSymbol: {
    fontSize: 16,
    lineHeight: 22,
    color: T.sageGreenSolid,
    marginRight: 8,
    fontWeight: '700',
  },
  numberSymbol: {
    fontSize: 14,
    lineHeight: 22,
    color: T.sageGreenSolid,
    marginRight: 6,
    fontWeight: '700',
    minWidth: 20,
  },
  listContent: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: T.textColor,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: T.mutedAccentSolid,
    backgroundColor: T.mutedAccent + '15',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginVertical: 6,
  },
  blockquoteText: {
    fontSize: 14,
    lineHeight: 20,
    color: T.textColor,
  },
  blockquoteInline: {
    fontStyle: 'italic',
  },
  calloutBase: {
    borderRadius: T.radius.card,
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 4,
  },
  calloutDanger: {
    backgroundColor: T.dangerClay + '18',
    borderLeftColor: T.dangerClaySolid,
    borderColor: T.dangerClay + '44',
    borderWidth: 1,
  },
  calloutDangerText: {
    color: T.dangerClaySolid,
    fontWeight: '600',
  },
  calloutWarning: {
    backgroundColor: T.warningAmber + '18',
    borderLeftColor: T.warningAmberSolid,
    borderColor: T.warningAmber + '44',
    borderWidth: 1,
  },
  calloutWarningText: {
    color: T.textColor,
  },
  calloutInfo: {
    backgroundColor: T.sageGreen + '18',
    borderLeftColor: T.sageGreenSolid,
    borderColor: T.sageGreen + '44',
    borderWidth: 1,
  },
  calloutInfoText: {
    color: T.textColor,
  },
  calloutText: {
    fontSize: 14,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: T.background,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radius.card,
    padding: 10,
    marginVertical: 6,
  },
  codeBlockLang: {
    fontSize: 10,
    fontWeight: '700',
    color: T.caption,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: T.textColor,
  },
  hr: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 10,
  },
});
