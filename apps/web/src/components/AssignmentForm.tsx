'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AssignmentInputSchema,
  type AssignmentInput,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from '@vedaai/shared';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setFormValues, setFileUrl, setStep } from '@/store/slices/assignmentFormSlice';
import { enqueued, failed as generationFailed, resetGeneration } from '@/store/slices/generationSlice';
import { useCloudinaryUpload } from '@/lib/useCloudinaryUpload';
import { useAssignmentSocket } from '@/lib/useAssignmentSocket';
import { API_URL } from '@/lib/config';
import copy from '@/content/copy.json';
import { GenerationStatus } from './GenerationStatus';

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = (
  Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]
).map(([value, label]) => ({ value, label }));

/**
 * AssignmentForm — two-step teacher-facing form for creating an assessment.
 *
 * Step 1: collects AssignmentInput fields (file, dueDate, questions table,
 *         additionalInfo) and validates with AssignmentInputSchema.
 * Step 2: shows live generation status driven by socket events.
 */
export function AssignmentForm() {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector((s) => s.assignmentForm.currentStep);
  const uploading = useAppSelector((s) => s.assignmentForm.uploading);
  const { upload } = useCloudinaryUpload();
  const subscribeToAssignment = useAssignmentSocket();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(AssignmentInputSchema),
    defaultValues: {
      questions: [{ type: 'mcq', count: 1, marks: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });
  const watchedQuestions = useWatch({ control, name: 'questions' }) ?? [];

  const totalQuestions = watchedQuestions.reduce(
    (sum, q) => sum + (Number(q?.count) || 0),
    0,
  );
  const totalMarks = watchedQuestions.reduce(
    (sum, q) => sum + (Number(q?.count) || 0) * (Number(q?.marks) || 0),
    0,
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return;
    }

    const url = await upload(file);
    if (url) {
      setValue('fileUrl', url);
      dispatch(setFileUrl(url));
    }
  }

  async function onSubmit(values: AssignmentInput) {
    dispatch(setFormValues(values));
    dispatch(resetGeneration());

    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
    } catch {
      dispatch(generationFailed({ error: copy.assignmentForm.errors.submitFailed }));
      dispatch(setStep(2));
      return;
    }

    if (!response.ok) {
      dispatch(
        generationFailed({ error: `${copy.assignmentForm.errors.submitFailed} (HTTP ${String(response.status)})` }),
      );
      dispatch(setStep(2));
      return;
    }

    const data = (await response.json()) as { assignmentId: string };
    dispatch(enqueued({ assignmentId: data.assignmentId }));
    subscribeToAssignment(data.assignmentId);
    dispatch(setStep(2));
  }

  function handlePrevious() {
    dispatch(setStep(1));
    dispatch(resetGeneration());
  }

  const isPending = isSubmitting || uploading;

  if (currentStep === 2) {
    return (
      <section aria-label={copy.assignmentForm.step2.sectionTitle}>
        <nav aria-label={copy.assignmentForm.progress.step1Label}>
          <span aria-current="false">{copy.assignmentForm.progress.step1Label}</span>
          <span aria-current="step">{copy.assignmentForm.progress.step2Label}</span>
        </nav>
        <GenerationStatus onPrevious={handlePrevious} />
      </section>
    );
  }

  return (
    <section aria-label={copy.assignmentForm.step1.sectionTitle}>
      <nav aria-label={copy.assignmentForm.progress.step1Label}>
        <span aria-current="step">{copy.assignmentForm.progress.step1Label}</span>
        <span aria-current="false">{copy.assignmentForm.progress.step2Label}</span>
      </nav>

      <header>
        <h2>{copy.assignmentForm.step1.sectionTitle}</h2>
        <p>{copy.assignmentForm.step1.sectionSubtitle}</p>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        aria-label={copy.assignmentForm.headingCreate}
        noValidate
      >
        {/* File upload — optional */}
        <div>
          <label htmlFor="file">{copy.assignmentForm.fields.file.label}</label>
          <div>
            <p>{copy.assignmentForm.fields.file.dragDrop}</p>
            <p>{copy.assignmentForm.fields.file.subHint}</p>
            <input
              id="file"
              type="file"
              accept=".pdf,image/jpeg,image/png"
              onChange={(e) => void handleFileChange(e)}
              aria-describedby="file-hint"
              disabled={uploading}
            />
          </div>
          <span id="file-hint">{copy.assignmentForm.fields.file.uploadImages}</span>
          {uploading && <span aria-live="polite">{copy.assignmentForm.uploading}</span>}
        </div>

        {/* Due date — required */}
        <div>
          <label htmlFor="dueDate">{copy.assignmentForm.fields.dueDate.label}</label>
          <input
            id="dueDate"
            type="date"
            placeholder={copy.assignmentForm.fields.dueDate.placeholder}
            aria-invalid={errors.dueDate ? 'true' : undefined}
            aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
            {...register('dueDate')}
          />
          {errors.dueDate && (
            <span id="dueDate-error" role="alert">
              {copy.assignmentForm.errors.dueDate}
            </span>
          )}
        </div>

        {/* Questions table — type + count + marks per row */}
        <fieldset>
          <legend>{copy.assignmentForm.fields.questions.label}</legend>
          <table>
            <thead>
              <tr>
                <th scope="col">{copy.assignmentForm.fields.questions.columnType}</th>
                <th scope="col">{copy.assignmentForm.fields.questions.columnCount}</th>
                <th scope="col">{copy.assignmentForm.fields.questions.columnMarks}</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} data-testid={`question-row-${String(index)}`}>
                  <td>
                    <label htmlFor={`questions-${String(index)}-type`} className="sr-only">
                      {copy.assignmentForm.fields.questions.columnType} {index + 1}
                    </label>
                    <select
                      id={`questions-${String(index)}-type`}
                      {...register(`questions.${index}.type`)}
                    >
                      {QUESTION_TYPE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label
                      htmlFor={`questions-${String(index)}-count`}
                      className="sr-only"
                    >
                      {copy.assignmentForm.fields.questions.columnCount} {index + 1}
                    </label>
                    <button
                      type="button"
                      aria-label={`Decrease count for row ${String(index + 1)}`}
                      onClick={() => {
                        const current = watchedQuestions[index]?.count ?? 1;
                        if (current > 1) setValue(`questions.${index}.count`, current - 1);
                      }}
                    >
                      −
                    </button>
                    <input
                      id={`questions-${String(index)}-count`}
                      type="number"
                      min={1}
                      aria-label={`${copy.assignmentForm.fields.questions.columnCount} row ${String(index + 1)}`}
                      aria-invalid={errors.questions?.[index]?.count ? 'true' : undefined}
                      {...register(`questions.${index}.count`, { valueAsNumber: true })}
                    />
                    <button
                      type="button"
                      aria-label={`Increase count for row ${String(index + 1)}`}
                      onClick={() => {
                        const current = watchedQuestions[index]?.count ?? 1;
                        setValue(`questions.${index}.count`, current + 1);
                      }}
                    >
                      +
                    </button>
                    {errors.questions?.[index]?.count && (
                      <span role="alert">{copy.assignmentForm.errors.countPositive}</span>
                    )}
                  </td>
                  <td>
                    <label
                      htmlFor={`questions-${String(index)}-marks`}
                      className="sr-only"
                    >
                      {copy.assignmentForm.fields.questions.columnMarks} {index + 1}
                    </label>
                    <button
                      type="button"
                      aria-label={`Decrease marks for row ${String(index + 1)}`}
                      onClick={() => {
                        const current = watchedQuestions[index]?.marks ?? 1;
                        if (current > 1) setValue(`questions.${index}.marks`, current - 1);
                      }}
                    >
                      −
                    </button>
                    <input
                      id={`questions-${String(index)}-marks`}
                      type="number"
                      min={1}
                      aria-label={`${copy.assignmentForm.fields.questions.columnMarks} row ${String(index + 1)}`}
                      aria-invalid={errors.questions?.[index]?.marks ? 'true' : undefined}
                      {...register(`questions.${index}.marks`, { valueAsNumber: true })}
                    />
                    <button
                      type="button"
                      aria-label={`Increase marks for row ${String(index + 1)}`}
                      onClick={() => {
                        const current = watchedQuestions[index]?.marks ?? 1;
                        setValue(`questions.${index}.marks`, current + 1);
                      }}
                    >
                      +
                    </button>
                    {errors.questions?.[index]?.marks && (
                      <span role="alert">{copy.assignmentForm.errors.marksPositive}</span>
                    )}
                  </td>
                  <td>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        aria-label={`${copy.assignmentForm.fields.questions.removeRow} row ${String(index + 1)}`}
                        onClick={() => remove(index)}
                      >
                        {copy.assignmentForm.fields.questions.removeRow}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {errors.questions && !Array.isArray(errors.questions) && (
            <span role="alert">{copy.assignmentForm.errors.questions}</span>
          )}

          <button
            type="button"
            onClick={() => append({ type: 'mcq', count: 1, marks: 1 })}
          >
            {copy.assignmentForm.fields.questions.addRow}
          </button>

          <div aria-live="polite" data-testid="question-totals">
            <span>
              {copy.assignmentForm.fields.questions.totalQuestions} {totalQuestions}
            </span>
            <span>
              {copy.assignmentForm.fields.questions.totalMarks} {totalMarks}
            </span>
          </div>
        </fieldset>

        {/* Additional information — optional */}
        <div>
          <label htmlFor="additionalInfo">
            {copy.assignmentForm.fields.additionalInfo.label}
          </label>
          <textarea
            id="additionalInfo"
            placeholder={copy.assignmentForm.fields.additionalInfo.placeholder}
            {...register('additionalInfo')}
          />
        </div>

        <button type="submit" disabled={isPending}>
          {copy.assignmentForm.submit}
        </button>
      </form>
    </section>
  );
}
