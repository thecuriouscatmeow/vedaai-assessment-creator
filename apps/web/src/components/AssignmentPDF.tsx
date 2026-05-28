'use client';

/**
 * AssignmentPDF — @react-pdf/renderer Document for the generated question paper.
 *
 * Uses plain StyleSheet values (not Tailwind) as required by react-pdf.
 * Color tokens match globals.css: #303030 (text-primary), #5E5E5E (text-secondary),
 * #F6F6F6 (bg-page), #D4D4D4 (grey-2), #F0F0F0 (surface-hover).
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { QuestionPaper } from '@vedaai/shared';
import copy from '@/content/copy.json';

const c = copy.output.pdf;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 11,
    color: '#303030',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  schoolAddress: {
    fontSize: 10,
    textAlign: 'center',
    color: '#5E5E5E',
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 10,
    color: '#303030',
  },
  studentInfoSection: {
    backgroundColor: '#F6F6F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  studentInfoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  studentInfoLabel: {
    fontSize: 10,
    color: '#5E5E5E',
    marginRight: 4,
  },
  studentInfoValue: {
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
    minWidth: 80,
    paddingBottom: 2,
    marginRight: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#F0F0F0',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 6,
  },
  sectionInstruction: {
    fontSize: 10,
    color: '#5E5E5E',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 8,
  },
  questionText: {
    fontSize: 11,
    flex: 1,
    paddingRight: 8,
    color: '#303030',
  },
  questionMeta: {
    fontSize: 10,
    color: '#5E5E5E',
    flexShrink: 0,
  },
  answerKeyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    flexShrink: 0,
    marginRight: 8,
  },
  answerText: {
    fontSize: 10,
    flex: 1,
    color: '#303030',
  },
});

function difficultyLabel(d: 'easy' | 'moderate' | 'challenging'): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Flat list of every question with its global sequential number, pre-computed to
 *  avoid mutating a counter inside JSX map callbacks (fragile under React StrictMode). */
interface FlatQuestion {
  sIdx: number;
  qIdx: number;
  globalNum: number;
}

function buildFlatQuestions(paper: QuestionPaper): FlatQuestion[] {
  const flat: FlatQuestion[] = [];
  let n = 0;
  for (const [s, section] of paper.sections.entries()) {
    for (let q = 0; q < section.questions.length; q++) {
      n++;
      flat.push({ sIdx: s, qIdx: q, globalNum: n });
    }
  }
  return flat;
}

export function AssignmentPDF({ paper }: { paper: QuestionPaper }) {
  const allAnswers = paper.sections.flatMap((s, si) =>
    s.questions
      .map((q, qi) => ({ n: `${si + 1}.${qi + 1}`, answer: q.answer }))
      .filter((a): a is { n: string; answer: string } => a.answer !== undefined),
  );

  // Pre-compute global question numbers once, outside JSX, to avoid counter
  // mutation inside map callbacks (unsafe under React concurrent/StrictMode).
  const flatQuestions = buildFlatQuestions(paper);
  // Group back by section index for the nested render
  const questionsBySectionIdx = paper.sections.map((_, sIdx) =>
    flatQuestions.filter((fq) => fq.sIdx === sIdx),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School header */}
        <Text style={styles.schoolName}>{paper.schoolName}</Text>
        {paper.schoolAddress !== undefined && (
          <Text style={styles.schoolAddress}>{paper.schoolAddress}</Text>
        )}
        <View style={styles.divider} />

        {/* Exam info row */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{c.subject} {paper.subject}</Text>
          <Text style={styles.infoText}>{c.class} {paper.className}</Text>
          {paper.durationMinutes !== undefined && (
            <Text style={styles.infoText}>{c.duration} {paper.durationMinutes} {c.durationUnit}</Text>
          )}
          <Text style={styles.infoText}>{c.totalMarks} {paper.totalMarks}</Text>
        </View>

        {/* Student info fill-in */}
        <View style={styles.studentInfoSection}>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentInfoLabel}>{c.studentName} </Text>
            <Text style={styles.studentInfoValue}>{paper.studentInfo.name ?? ''}</Text>
            <Text style={styles.studentInfoLabel}>{c.studentRoll} </Text>
            <Text style={styles.studentInfoValue}>{paper.studentInfo.rollNumber ?? ''}</Text>
            <Text style={styles.studentInfoLabel}>{c.studentSection} </Text>
            <Text style={styles.studentInfoValue}>{paper.studentInfo.section ?? ''}</Text>
          </View>
        </View>

        {/* Sections and questions */}
        {paper.sections.map((section, sIdx) => (
          <View key={`section-${sIdx}`}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.instruction !== undefined && (
              <Text style={styles.sectionInstruction}>{section.instruction}</Text>
            )}
            {/* questionsBySectionIdx[sIdx] is guaranteed non-undefined: built from paper.sections */}
            {questionsBySectionIdx[sIdx]!.map(({ qIdx, globalNum }) => {
              // q is guaranteed: qIdx comes from buildFlatQuestions which iterated section.questions
              const q = section.questions[qIdx]!;
              return (
                <View key={`q-${sIdx}-${qIdx}`} style={styles.questionRow}>
                  <Text style={styles.questionText}>
                    {globalNum}. {q.text}
                  </Text>
                  <Text style={styles.questionMeta}>
                    [{difficultyLabel(q.difficulty)}] {q.marks} {c.marks}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Answer Key — only when answers exist */}
        {allAnswers.length > 0 && (
          <View break>
            <Text style={styles.answerKeyTitle}>{c.answerKey}</Text>
            {allAnswers.map((a) => (
              <View key={`ans-${a.n}`} style={styles.answerRow}>
                <Text style={styles.answerLabel}>{a.n}.</Text>
                <Text style={styles.answerText}>{a.answer}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
