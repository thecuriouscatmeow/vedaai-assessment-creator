import { describe, it, expect } from 'vitest';
import {
  SOCKET_EVENTS,
  SOCKET_CLIENT_EVENTS,
  AssignmentQueuedSchema,
  AssignmentProgressSchema,
  AssignmentDoneSchema,
  AssignmentFailedSchema,
  AssignmentSubscribeSchema,
} from '../index';

const validPaper = {
  title: 'Quiz',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Maths',
  className: '5th',
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

describe('SOCKET_CLIENT_EVENTS', () => {
  it('exposes the subscribe event name', () => {
    expect(SOCKET_CLIENT_EVENTS.subscribe).toBe('assignment:subscribe');
  });
});

describe('AssignmentSubscribeSchema', () => {
  it('accepts a valid subscribe payload', () => {
    const parsed = AssignmentSubscribeSchema.parse({ assignmentId: 'abc-123' });
    expect(parsed.assignmentId).toBe('abc-123');
  });

  it('rejects a payload with an empty assignmentId', () => {
    expect(() => AssignmentSubscribeSchema.parse({ assignmentId: '' })).toThrow();
  });

  it('rejects a payload missing the assignmentId', () => {
    expect(() => AssignmentSubscribeSchema.parse({})).toThrow();
  });
});
