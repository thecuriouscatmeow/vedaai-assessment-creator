import mongoose from 'mongoose';
import type { AssignmentInput, AssignmentSummary, QuestionPaper } from '@vedaai/shared';
import { AssignmentModel, type AssignmentRecord } from '../../models/assignment';
import { QuestionPaperModel, type QuestionPaperDoc } from '../../models/question-paper';
import { QuestionModel, type QuestionDoc } from '../../models/question';
import { NotFoundError } from '../../lib/error';

/**
 * Repository contract for assignment persistence.
 *
 * The service layer depends only on this interface — Mongoose never leaks past
 * this boundary. All methods return plain `AssignmentRecord` domain objects so
 * no Mongoose Document ever escapes to callers.
 * Tests inject a fake; a real Postgres swap touches only this file.
 */
export interface AssignmentRepository {
  /** Persist a new queued assignment; returns its generated id. */
  create(input: AssignmentInput): Promise<{ id: string }>;
  /** Return full record (with paper via aggregate) or null when not found. */
  findById(id: string): Promise<AssignmentRecord | null>;
  /** Return a summary list sorted newest first. */
  listAll(): Promise<AssignmentSummary[]>;
  /** Delete by id and cascade-delete the linked paper + questions. Throws if not found. */
  deleteById(id: string): Promise<void>;
  /** Transition to processing. Throws if id not found. */
  setProcessing(id: string): Promise<void>;
  /** Persist paper + title across two collections, transition to done. Throws if id not found. */
  setDone(id: string, paper: QuestionPaper, title: string): Promise<void>;
  /** Persist error message, transition to failed. Throws if id not found. */
  setFailed(id: string, error: string): Promise<void>;
}

// ─── Aggregate result shape ───────────────────────────────────────────────────

interface AggResult {
  _id: mongoose.Types.ObjectId;
  input: AssignmentInput;
  status: AssignmentRecord['status'];
  title?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  paperDoc?: Pick<QuestionPaperDoc, 'title' | 'schoolName' | 'schoolAddress' | 'subject' |
    'className' | 'totalMarks' | 'durationMinutes' | 'generalInstructions' | 'studentInfo' | 'sections'>;
  rawQuestions: Pick<QuestionDoc, 'sectionIndex' | 'order' | 'text' | 'difficulty' | 'marks' | 'answer'>[];
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Rebuilds the frozen QuestionPaper contract from aggregate output.
 *
 * Groups raw questions by sectionIndex, sorts each group by order, then maps
 * over section metadata to produce sections with an attached question list.
 * No conditional chains — single reduce + map pass.
 */
function buildPaper(
  paperDoc: AggResult['paperDoc'],
  rawQuestions: AggResult['rawQuestions'],
): QuestionPaper | undefined {
  if (!paperDoc) return undefined;

  const bySection = rawQuestions.reduce<Map<number, typeof rawQuestions>>(
    (acc, q) => {
      const list = acc.get(q.sectionIndex) ?? [];
      list.push(q);
      acc.set(q.sectionIndex, list);
      return acc;
    },
    new Map(),
  );

  return {
    title: paperDoc.title,
    schoolName: paperDoc.schoolName,
    schoolAddress: paperDoc.schoolAddress,
    subject: paperDoc.subject,
    className: paperDoc.className,
    totalMarks: paperDoc.totalMarks,
    durationMinutes: paperDoc.durationMinutes,
    generalInstructions: paperDoc.generalInstructions,
    studentInfo: paperDoc.studentInfo ?? {},
    sections: [...paperDoc.sections]
      .sort((a, b) => a.order - b.order)
      .map((sec) => ({
        title: sec.title,
        instruction: sec.instruction,
        questions: (bySection.get(sec.order) ?? [])
          .sort((a, b) => a.order - b.order)
          .map((q) => ({
            text: q.text,
            difficulty: q.difficulty,
            marks: q.marks,
            answer: q.answer,
          })),
      })),
  };
}

// ─── Aggregate pipeline ───────────────────────────────────────────────────────

function buildFindByIdPipeline(id: string): mongoose.PipelineStage[] {
  return [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: QuestionPaperModel.collection.name,
        localField: 'paperId',
        foreignField: '_id',
        as: 'paperDoc',
      },
    },
    { $unwind: { path: '$paperDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: QuestionModel.collection.name,
        localField: 'paperDoc._id',
        foreignField: 'paperId',
        as: 'rawQuestions',
      },
    },
    {
      $project: {
        input: 1,
        status: 1,
        title: 1,
        error: 1,
        createdAt: 1,
        updatedAt: 1,
        'paperDoc.title': 1,
        'paperDoc.schoolName': 1,
        'paperDoc.schoolAddress': 1,
        'paperDoc.subject': 1,
        'paperDoc.className': 1,
        'paperDoc.totalMarks': 1,
        'paperDoc.durationMinutes': 1,
        'paperDoc.generalInstructions': 1,
        'paperDoc.studentInfo': 1,
        'paperDoc.sections': 1,
        'rawQuestions.sectionIndex': 1,
        'rawQuestions.order': 1,
        'rawQuestions.text': 1,
        'rawQuestions.difficulty': 1,
        'rawQuestions.marks': 1,
        'rawQuestions.answer': 1,
      },
    },
  ];
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Mongoose-backed implementation of {@link AssignmentRepository}.
 *
 * This is the only file that imports AssignmentModel, QuestionPaperModel, and
 * QuestionModel directly — all other layers go through the interface.
 */
export function createAssignmentRepository(): AssignmentRepository {
  return {
    async create(input) {
      const doc = await AssignmentModel.create({ input, status: 'queued' });
      return { id: String(doc._id) };
    },

    async findById(id) {
      const [agg] = await AssignmentModel.aggregate<AggResult>(buildFindByIdPipeline(id));
      if (!agg) return null;
      return {
        id: agg._id.toString(),
        input: agg.input,
        status: agg.status,
        title: agg.title,
        paper: buildPaper(agg.paperDoc, agg.rawQuestions ?? []),
        error: agg.error,
        createdAt: agg.createdAt,
        updatedAt: agg.updatedAt,
      };
    },

    async listAll() {
      const docs = await AssignmentModel.find({})
        .sort({ createdAt: -1 })
        .select({ input: 1, status: 1, title: 1, createdAt: 1 })
        .lean()
        .exec();

      return docs.map((doc) => ({
        id: (doc._id as mongoose.Types.ObjectId).toString(),
        title: (doc.title as string | undefined) ?? 'Untitled assignment',
        status: doc.status as AssignmentRecord['status'],
        assignedAt: (doc.createdAt as Date).toISOString(),
        dueDate: (doc.input as AssignmentInput).dueDate,
      }));
    },

    async deleteById(id) {
      const doc = await AssignmentModel.findByIdAndDelete(id).lean().exec();
      if (!doc) throw new NotFoundError(`Assignment ${id} not found`);
      if (doc.paperId) {
        await Promise.all([
          QuestionPaperModel.deleteOne({ _id: doc.paperId }),
          QuestionModel.deleteMany({ paperId: doc.paperId }),
        ]);
      }
    },

    async setProcessing(id) {
      const result = await AssignmentModel.findByIdAndUpdate(
        id,
        { status: 'processing' },
        { returnDocument: 'after' },
      )
        .lean()
        .exec();
      if (!result) throw new NotFoundError(`Assignment ${id} not found`);
    },

    async setDone(id, paper, title) {
      // Fail fast before writing any paper/question documents
      const exists = await AssignmentModel.exists({ _id: id });
      if (!exists) throw new NotFoundError(`Assignment ${id} not found`);

      const assignmentOid = new mongoose.Types.ObjectId(id);

      // 1. Create paper metadata (sections without questions)
      const paperDoc = await QuestionPaperModel.create({
        assignmentId: assignmentOid,
        title: paper.title,
        schoolName: paper.schoolName,
        schoolAddress: paper.schoolAddress,
        subject: paper.subject,
        className: paper.className,
        totalMarks: paper.totalMarks,
        durationMinutes: paper.durationMinutes,
        generalInstructions: paper.generalInstructions,
        studentInfo: paper.studentInfo,
        sections: paper.sections.map((s, i) => ({ title: s.title, instruction: s.instruction, order: i })),
      });

      // 2. Flatten all questions with their section + position coordinates
      await QuestionModel.insertMany(
        paper.sections.flatMap((section, sectionIndex) =>
          section.questions.map((q, order) => ({
            paperId: paperDoc._id,
            sectionIndex,
            order,
            text: q.text,
            difficulty: q.difficulty,
            marks: q.marks,
            answer: q.answer,
          })),
        ),
      );

      // 3. Link assignment to the new paper and mark done
      const result = await AssignmentModel.findByIdAndUpdate(
        id,
        { status: 'done', title, paperId: paperDoc._id },
        { returnDocument: 'after' },
      )
        .lean()
        .exec();
      if (!result) throw new NotFoundError(`Assignment ${id} not found`);
    },

    async setFailed(id, error) {
      const result = await AssignmentModel.findByIdAndUpdate(
        id,
        { status: 'failed', error },
        { returnDocument: 'after' },
      )
        .lean()
        .exec();
      if (!result) throw new NotFoundError(`Assignment ${id} not found`);
    },
  };
}
