import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('QuizBuzz AI End-to-End API Flow', () => {
  let sessionId: string;

  it('GET /api/v1/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/sessions creates an opaque session', async () => {
    const res = await request(app).post('/api/v1/sessions');
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
    sessionId = res.body.sessionId;
  });

  it('POST /api/v1/documents uploads and processes document', async () => {
    const sampleText = `
      Chapter 1: Operating Systems Overview
      An operating system manages hardware resources and provides common services for computer programs.
      Memory management is the functionality of an operating system which handles or manages primary memory.
      Virtual memory is a memory management capability of an OS that uses hardware and software to allow a computer to compensate for physical memory shortages.
    `;

    const res = await request(app)
      .post('/api/v1/documents')
      .set('X-Session-ID', sessionId)
      .attach('file', Buffer.from(sampleText), 'os-lecture.txt');

    expect(res.status).toBe(201);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.name).toBe('os-lecture.txt');
    expect(res.body.document.sections.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/documents/current retrieves document preview', async () => {
    const res = await request(app)
      .get('/api/v1/documents/current')
      .set('X-Session-ID', sessionId);

    expect(res.status).toBe(200);
    expect(res.body.document.characterCount).toBeGreaterThan(100);
  });

  it('POST /api/v1/quizzes generates quiz in exam mode without leaking answer keys', async () => {
    const res = await request(app)
      .post('/api/v1/quizzes')
      .set('X-Session-ID', sessionId)
      .send({
        source: { type: 'document' },
        questionCount: 2,
        difficulty: 'medium',
        mode: 'exam',
        navigation: 'one-by-one',
        marksPerCorrect: 2,
        negativeMarksPerIncorrect: 0
      });

    expect(res.status).toBe(201);
    expect(res.body.quizId).toBeDefined();
    expect(res.body.questions.length).toBeGreaterThan(0);

    // CRITICAL PRIVACY INVARIANT: In exam mode, correctOptionId and explanation MUST NOT be returned!
    for (const q of res.body.questions) {
      expect(q.correctOptionId).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    }
  });

  it('POST /api/v1/quizzes/current/submit grades answers and reveals results', async () => {
    // Get questions
    const quizRes = await request(app)
      .get('/api/v1/quizzes/current')
      .set('X-Session-ID', sessionId);

    const questions = quizRes.body.questions;
    expect(questions.length).toBeGreaterThan(0);

    // Submit answers
    const submitRes = await request(app)
      .post('/api/v1/quizzes/current/submit')
      .set('X-Session-ID', sessionId)
      .send({
        answers: [
          { questionId: questions[0].id, selectedOptionId: 'a' }
        ]
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.score).toBeDefined();
    expect(submitRes.body.maximumScore).toBeDefined();
    expect(submitRes.body.results.length).toBe(questions.length);
    // After submission, correctOptionId and explanation are revealed
    expect(submitRes.body.results[0].correctOptionId).toBeDefined();
    expect(submitRes.body.results[0].explanation).toBeDefined();
  });

  it('DELETE /api/v1/sessions/current deletes the session', async () => {
    const res = await request(app)
      .delete('/api/v1/sessions/current')
      .set('X-Session-ID', sessionId);

    expect(res.status).toBe(200);

    // Following request with deleted session must fail
    const checkRes = await request(app)
      .get('/api/v1/documents/current')
      .set('X-Session-ID', sessionId);

    expect(checkRes.status).toBe(401);
    expect(checkRes.body.error.code).toBe('SESSION_EXPIRED');
  });
});
