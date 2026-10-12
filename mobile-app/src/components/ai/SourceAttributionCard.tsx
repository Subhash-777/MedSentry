import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  Info,
  CheckCircle2,
  Pill,
  Scale,
  BookOpen,
  ArrowLeftRight,
} from 'lucide-react-native';
import type { StructuredRetrieval } from '../../lib/aiRouterClient';

interface SourceAttributionCardProps {
  retrieval?: StructuredRetrieval | null;
}

export function isValidHttpUrl(urlString?: string | null): boolean {
  if (!urlString) return false;
  try {
    const trimmed = urlString.trim().toLowerCase();
    return trimmed.startsWith('https://') || trimmed.startsWith('http://');
  } catch {
    return false;
  }
}

function extractDomainName(urlString?: string | null): string {
  if (!urlString) return 'Official Link';
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Official Link';
  }
}

export function SourceAttributionCard({ retrieval }: SourceAttributionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // If no retrieval or completely empty payload, do not clutter UI
  if (!retrieval) return null;

  const matches = retrieval.medicine_matches ?? [];
  const interactions = retrieval.interaction_findings ?? [];
  const warnings = retrieval.warnings ?? [];
  const limitations = retrieval.limitations ?? [];
  const sources = retrieval.sources ?? [];

  const hasContent =
    matches.length > 0 ||
    interactions.length > 0 ||
    warnings.length > 0 ||
    limitations.length > 0 ||
    sources.length > 0;

  if (!hasContent) return null;

  // Determine highest verification status for badge display
  const hasAuthoritative = matches.some((m) => m.status_verification === 'verified_authoritative');
  const hasProvisional = matches.some((m) => m.status_verification === 'provisional_evidence');
  const hasUnverified = matches.some((m) => m.status_verification === 'unverified');

  let badgeLabel = 'Clinical Evidence & Sources';
  let badgeTheme = {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#166534',
    iconBg: '#DCFCE7',
    icon: '#15803D',
    counterBg: '#DCFCE7',
    counterText: '#15803D',
  };

  if (hasAuthoritative) {
    badgeLabel = 'Authoritative Evidence Verified';
    badgeTheme = {
      bg: '#ECFDF5',
      border: '#86EFAC',
      text: '#166534',
      iconBg: '#DCFCE7',
      icon: '#15803D',
      counterBg: '#DCFCE7',
      counterText: '#15803D',
    };
  } else if (hasProvisional) {
    badgeLabel = 'Provisional Regulatory Evidence';
    badgeTheme = {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      iconBg: '#FEF3C7',
      icon: '#B45309',
      counterBg: '#FEF3C7',
      counterText: '#B45309',
    };
  } else if (hasUnverified) {
    badgeLabel = 'Unverified Indian Rx Status';
    badgeTheme = {
      bg: '#FFF7ED',
      border: '#FED7AA',
      text: '#C2410C',
      iconBg: '#FFEDD5',
      icon: '#EA580C',
      counterBg: '#FFEDD5',
      counterText: '#C2410C',
    };
  }

  const handleOpenUrl = (url?: string) => {
    if (isValidHttpUrl(url)) {
      Linking.openURL(url!).catch(() => {});
    }
  };

  const totalRefs = matches.length + sources.length;

  return (
    <View style={styles.container}>
      {/* ── Compact Badge Trigger ── */}
      <TouchableOpacity
        style={[styles.badgePill, { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Toggle verified clinical sources"
      >
        <View style={[styles.badgeIconWrapper, { backgroundColor: badgeTheme.iconBg }]}>
          <ShieldCheck size={13} color={badgeTheme.icon} />
        </View>
        <View style={styles.badgeTextWrap}>
          <Text style={[styles.badgeText, { color: badgeTheme.text }]} numberOfLines={1}>
            {badgeLabel}
          </Text>
        </View>
        <View style={[styles.counterChip, { backgroundColor: badgeTheme.counterBg }]}>
          <Text style={[styles.counterChipText, { color: badgeTheme.counterText }]}>
            {totalRefs} {totalRefs === 1 ? 'ref' : 'refs'}
          </Text>
        </View>
        <View style={styles.chevronWrapper}>
          {expanded ? (
            <ChevronUp size={14} color={badgeTheme.text} />
          ) : (
            <ChevronDown size={14} color={badgeTheme.text} />
          )}
        </View>
      </TouchableOpacity>

      {/* ── Expandable Details Card ── */}
      {expanded && (
        <View style={styles.expandedCard}>
          {/* Card Header Banner */}
          <View style={styles.expandedHeader}>
            <View style={styles.expandedHeaderLeft}>
              <View style={styles.headerIconCircle}>
                <ShieldCheck size={14} color="#15803D" />
              </View>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.expandedTitle}>Verified Regulatory Evidence</Text>
                <Text style={styles.expandedSubtitle}>
                  Cross-referenced with CDSCO, IPC & Pharmacovigilance records
                </Text>
              </View>
            </View>
          </View>

          {/* 1. Matched Medicines & Prescription Status */}
          {matches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Pill size={13} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Medication Classification (India)</Text>
              </View>

              {matches.map((m, idx) => {
                const isAuth = m.status_verification === 'verified_authoritative';
                const isOtc = m.prescription_status === 'OTC';
                const isScheduleH =
                  m.schedule_category?.toLowerCase().includes('schedule h') ||
                  m.prescription_status === 'prescription_only';
                const isScheduleX = m.schedule_category?.toLowerCase().includes('schedule x');

                let statusBadgeStyle = styles.statusTagOtc;
                let statusTextStyle = styles.statusTagTextOtc;
                let statusLabel = 'OTC • OVER THE COUNTER';

                if (isScheduleX) {
                  statusBadgeStyle = styles.statusTagSchedX;
                  statusTextStyle = styles.statusTagTextSchedX;
                  statusLabel = 'Rx • SCHEDULE X';
                } else if (isScheduleH) {
                  statusBadgeStyle = styles.statusTagRx;
                  statusTextStyle = styles.statusTagTextRx;
                  statusLabel = 'Rx • SCHEDULE H';
                } else if (m.prescription_status === 'unverified') {
                  statusBadgeStyle = styles.statusTagUnverified;
                  statusTextStyle = styles.statusTagTextUnverified;
                  statusLabel = 'UNVERIFIED';
                } else if (!isOtc) {
                  statusBadgeStyle = styles.statusTagRx;
                  statusTextStyle = styles.statusTagTextRx;
                  statusLabel = 'Rx • PRESCRIPTION ONLY';
                }

                return (
                  <View key={`match_${idx}`} style={styles.matchCard}>
                    {/* Top Row: Category tag and Rx Status badge (Stacked above name so title never gets squished) */}
                    <View style={styles.matchTopRow}>
                      <View style={styles.medTypePill}>
                        <Pill size={11} color="#0D9488" style={{ marginRight: 4 }} />
                        <Text style={styles.medTypePillText}>Medicine Record</Text>
                      </View>
                      <View style={[styles.statusTag, statusBadgeStyle]}>
                        <Text style={[styles.statusTagText, statusTextStyle]}>{statusLabel}</Text>
                      </View>
                    </View>

                    {/* Full-width Medicine Name — plenty of room for multi-word clinical titles */}
                    <Text style={styles.matchName}>
                      {m.name || m.generic_name}
                      {m.strength ? ` (${m.strength})` : ''}
                    </Text>

                    {/* Active Ingredients Tags */}
                    {m.active_ingredients && m.active_ingredients.length > 0 && (
                      <View style={styles.ingredientBlock}>
                        <Text style={styles.ingredientLabel}>Active Ingredients:</Text>
                        <View style={styles.ingredientChipsWrap}>
                          {m.active_ingredients.map((ing, iIdx) => (
                            <View key={`ing_${iIdx}`} style={styles.ingredientChip}>
                              <Text style={styles.ingredientChipText}>{ing.trim()}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Structured Details Block — Stacked key-value for maximum mobile readability */}
                    <View style={styles.detailsBlock}>
                      <View style={styles.detailRow}>
                        <Scale size={12} color="#64748B" style={{ marginTop: 2, marginRight: 6 }} />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Legal Schedule:</Text>
                          <Text style={styles.detailValue}>
                            <Text style={styles.detailValueBold}>
                              {m.schedule_category || 'Unscheduled'}
                            </Text>
                            {m.legal_basis ? ` — ${m.legal_basis}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.detailRow, { marginTop: 6 }]}>
                        <CheckCircle2
                          size={12}
                          color={isAuth ? '#16A34A' : '#D97706'}
                          style={{ marginTop: 2, marginRight: 6 }}
                        />
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Verification:</Text>
                          <Text
                            style={[
                              styles.detailValue,
                              isAuth ? styles.textVerified : styles.textProvisional,
                            ]}
                          >
                            {isAuth
                              ? 'Authoritative (CDSCO/IPC)'
                              : m.status_verification === 'provisional_evidence'
                              ? 'Provisional Evidence'
                              : 'Unverified Status'}
                          </Text>
                        </View>
                      </View>

                      {m.max_otc_dose_adult && (
                        <View style={[styles.detailRow, { marginTop: 6 }]}>
                          <Info size={12} color="#64748B" style={{ marginTop: 2, marginRight: 6 }} />
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Max OTC Adult Dose:</Text>
                            <Text style={styles.detailValue}>{m.max_otc_dose_adult}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Official Source Link Button */}
                    {isValidHttpUrl(m.source_url) && (
                      <TouchableOpacity
                        style={styles.sourceBtn}
                        onPress={() => handleOpenUrl(m.source_url)}
                        activeOpacity={0.7}
                        accessibilityRole="link"
                      >
                        <ExternalLink size={12} color="#0D9488" style={{ marginRight: 6 }} />
                        <Text style={styles.sourceBtnText} numberOfLines={1}>
                          Official Source: {m.source_organization || 'CDSCO / IPC Registry'}
                        </Text>
                        <Text style={styles.sourceBtnArrow}>↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* 2. Drug Interactions Findings */}
          {interactions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <AlertTriangle size={13} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: '#B45309' }]}>
                  Documented Drug Interactions
                </Text>
              </View>

              {interactions.map((inter, idx) => {
                const sevLower = (inter.severity || '').toLowerCase();
                const isContraindicated =
                  sevLower.includes('contraindicated') ||
                  sevLower.includes('severe') ||
                  sevLower.includes('high');
                const isUnknownOrAbsence =
                  sevLower.includes('unknown') ||
                  inter.is_documented === false ||
                  inter.description.toLowerCase().includes('no documented interaction');

                let cardStyle = styles.interCardModerate;
                let badgeStyle = styles.interBadgeModerate;
                let badgeTextStyle = styles.interBadgeTextModerate;
                let badgeText = inter.severity?.toUpperCase() || 'CAUTION';
                let iconColor = '#D97706';

                if (isContraindicated) {
                  cardStyle = styles.interCardSevere;
                  badgeStyle = styles.interBadgeSevere;
                  badgeTextStyle = styles.interBadgeTextSevere;
                  badgeText = 'HIGH RISK / CONTRAINDICATED';
                  iconColor = '#DC2626';
                } else if (isUnknownOrAbsence) {
                  cardStyle = styles.interCardAbsence;
                  badgeStyle = styles.interBadgeAbsence;
                  badgeTextStyle = styles.interBadgeTextAbsence;
                  badgeText = 'NO RECORDED CONFLICT';
                  iconColor = '#0284C7';
                }

                return (
                  <View key={`inter_${idx}`} style={[styles.interCard, cardStyle]}>
                    {/* Top Row: Severity Badge on its own line */}
                    <View style={styles.interTopRow}>
                      <View style={[styles.interBadge, badgeStyle]}>
                        <Text style={[styles.interBadgeText, badgeTextStyle]}>{badgeText}</Text>
                      </View>
                    </View>

                    {/* Full-width Drug Pair Title */}
                    <View style={styles.interPairRow}>
                      <ArrowLeftRight size={13} color={iconColor} style={{ marginTop: 2, marginRight: 6 }} />
                      <Text style={styles.interPair}>
                        {inter.drug_a} + {inter.drug_b}
                      </Text>
                    </View>

                    {/* Clinical description */}
                    <Text style={styles.interDesc}>{inter.description}</Text>

                    {/* Absence notice note if negative proof */}
                    {isUnknownOrAbsence && (
                      <View style={styles.absenceNoticeBox}>
                        <Info size={12} color="#92400E" style={{ marginTop: 1, marginRight: 6 }} />
                        <Text style={styles.absenceNoticeText}>
                          Absence of recorded interaction in clinical trial databases is NOT proof of clinical safety. Consult your physician or pharmacist.
                        </Text>
                      </View>
                    )}

                    {inter.source && (
                      <View style={styles.citationRow}>
                        <BookOpen size={11} color="#64748B" style={{ marginRight: 5 }} />
                        <Text style={styles.citationText}>Citation: {inter.source}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* 3. Evidence Limitations & Warnings */}
          {(warnings.length > 0 || limitations.length > 0) && (
            <View style={styles.section}>
              <View style={styles.warningCallout}>
                <View style={styles.warningCalloutHeader}>
                  <Info size={13} color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.warningCalloutTitle}>Clinical Scope & Regulatory Limitations</Text>
                </View>
                <View style={styles.warningCalloutBody}>
                  {warnings.map((w, idx) => (
                    <View key={`w_${idx}`} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{w}</Text>
                    </View>
                  ))}
                  {limitations.map((lim, idx) => (
                    <View key={`lim_${idx}`} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{lim}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* 4. External Authoritative Sources */}
          {sources.length > 0 && (
            <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <View style={styles.sectionHeaderRow}>
                <CheckCircle2 size={13} color="#15803D" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: '#166534' }]}>
                  Authoritative Reference Sources
                </Text>
              </View>

              {sources.map((s, idx) => {
                const hasUrl = isValidHttpUrl(s.url);
                const domain = extractDomainName(s.url);

                return (
                  <View key={`src_${idx}`} style={styles.registryCard}>
                    <View style={styles.registryLeft}>
                      <View style={styles.registryIconCircle}>
                        <CheckCircle2 size={13} color="#16A34A" />
                      </View>
                      <View style={styles.registryTextWrap}>
                        <Text style={styles.registryTitle} numberOfLines={1}>
                          {s.title}
                        </Text>
                        <Text style={styles.registrySubtitle} numberOfLines={1}>
                          {s.version ? `Edition: ${s.version}` : 'Official Regulatory Registry'}
                        </Text>
                      </View>
                    </View>

                    {hasUrl && (
                      <TouchableOpacity
                        style={styles.registryLinkBtn}
                        onPress={() => handleOpenUrl(s.url)}
                        activeOpacity={0.7}
                        accessibilityRole="link"
                      >
                        <Text style={styles.registryLinkText} numberOfLines={1}>
                          {domain}
                        </Text>
                        <ExternalLink size={10} color="#0D9488" style={{ marginLeft: 3 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 2,
  },

  // ── Trigger Pill ──
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  badgeTextWrap: {
    flexShrink: 1,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  counterChip: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  counterChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chevronWrapper: {
    marginLeft: 1,
  },

  // ── Expanded Container Card ──
  expandedCard: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Expanded Header Banner
  expandedHeader: {
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  expandedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  expandedTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  expandedSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Sections ──
  section: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── 1. Medicine Classification Cards ──
  matchCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  matchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  medTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  medTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F766E',
  },
  matchName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 8,
  },

  // Status badges
  statusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusTagOtc: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusTagRx: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusTagSchedX: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  statusTagUnverified: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusTagTextOtc: {
    color: '#166534',
  },
  statusTagTextRx: {
    color: '#991B1B',
  },
  statusTagTextSchedX: {
    color: '#9333EA',
  },
  statusTagTextUnverified: {
    color: '#92400E',
  },

  // Ingredients Block
  ingredientBlock: {
    marginBottom: 8,
  },
  ingredientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  ingredientChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  ingredientChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ingredientChipText: {
    fontSize: 10.5,
    color: '#334155',
    fontWeight: '600',
  },

  // Stacked Details Block
  detailsBlock: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  detailValueBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  textVerified: {
    color: '#15803D',
    fontWeight: '700',
  },
  textProvisional: {
    color: '#B45309',
    fontWeight: '700',
  },

  // Source Button
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  sourceBtnText: {
    fontSize: 11,
    color: '#0D9488',
    fontWeight: '700',
    flex: 1,
  },
  sourceBtnArrow: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '800',
    marginLeft: 4,
  },

  // ── 2. Drug Interactions Section ──
  interCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderLeftWidth: 3.5,
  },
  interCardSevere: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderLeftColor: '#DC2626',
  },
  interCardModerate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderLeftColor: '#D97706',
  },
  interCardAbsence: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderLeftColor: '#0284C7',
  },
  interTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  interPairRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  interPair: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    lineHeight: 18,
  },
  interBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  interBadgeSevere: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  interBadgeModerate: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  interBadgeAbsence: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  interBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  interBadgeTextSevere: {
    color: '#991B1B',
  },
  interBadgeTextModerate: {
    color: '#92400E',
  },
  interBadgeTextAbsence: {
    color: '#0369A1',
  },
  interDesc: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16.5,
    marginBottom: 6,
  },
  absenceNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 6,
    padding: 7,
    marginBottom: 6,
  },
  absenceNoticeText: {
    fontSize: 10,
    color: '#92400E',
    lineHeight: 14.5,
    flex: 1,
    fontStyle: 'italic',
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  citationText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // ── 3. Warnings Callout ──
  warningCallout: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 10,
    padding: 9,
  },
  warningCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  warningCalloutTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  warningCalloutBody: {
    marginLeft: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  bulletDot: {
    fontSize: 12,
    color: '#B45309',
    marginRight: 6,
    lineHeight: 15,
  },
  bulletText: {
    fontSize: 10.5,
    color: '#78350F',
    lineHeight: 15,
    flex: 1,
  },

  // ── 4. Authoritative Registries ──
  registryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  registryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  registryIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  registryTextWrap: {
    flex: 1,
  },
  registryTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  registrySubtitle: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  registryLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  registryLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    maxWidth: 90,
  },
});
