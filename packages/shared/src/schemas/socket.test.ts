import { describe, it, expect } from 'vitest';
import {
  SOCKET_EVENTS,
  AssignmentStatusSchema,
  AssignmentQueuedSchema,
  AssignmentProgressSchema,
  AssignmentDoneSchema,
  AssignmentFailedSchema,
} from '../index';

const validPaper = {
  title: 'Quiz',
  subject: 'Maths',
  totalMarks: 10,
  studentInfo: {},
  sections: [
    { title: 'A', questions: [{ text: '2 + 2 = ?', difficulty: 'easy', marks: 10 }] },
  ],
};

describe('SOCKET_EVENTS', () => {
  it('exposes the four lifecycle event names', () => {
    expect(SOCKET_EVENTS).toMatchObject({
      queued: 'assignment:queued',
      progress: 'assignment:progress',
      done: 'assignment:done',
      failed: 'assignment:failed',
    });
  });
});

describe('AssignmentStatusSchema', () => {
  it('accepts known statuses and rejects unknown ones', () => {
    expect(AssignmentStatusSchema.parse('queued')).toBe('queued');
    expect(() => AssignmentStatusSchema.parse('paused')).toThrow();
  });
});

describe('socket payloads', () => {
  it('validates a queued payload', () => {
    expect(AssignmentQueuedSchema.parse({ assignmentId: 'a1', status: 'queued' }).status).toBe(
      'queued',
    );
  });

  it('validates a progress payload and bounds percent', () => {
    expect(
      AssignmentProgressSchema.parse({ assignmentId: 'a1', stage: 'generating', percent: 50 })
        .percent,
    ).toBe(50);
    expect(() =>
      AssignmentProgressSchema.parse({ assignmentId: 'a1', stage: 'x', percent: 150 }),
    ).toThrow();
  });

  it('validates a done payload carrying the generated paper', () => {
    const parsed = AssignmentDoneSchema.parse({ assignmentId: 'a1', paper: validPaper });
    expect(parsed.paper.title).toBe('Quiz');
  });

  it('validates a failed payload with an error message', () => {
    expect(AssignmentFailedSchema.parse({ assignmentId: 'a1', error: 'LLM timeout' }).error).toBe(
      'LLM timeout',
    );
  });

  it('rejects a failed payload missing the error', () => {
    expect(() => AssignmentFailedSchema.parse({ assignmentId: 'a1' })).toThrow();
  });
});
