'use client';

import { useState } from 'react';
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
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

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
      setFileError(copy.assignmentForm.errors.fileSize);
      return;
    }

    setFileError(null);
    setSelectedFileName(file.name);
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
        <nav
          aria-label={copy.assignmentForm.progress.step1Label}
          className="flex items-center gap-3 max-w-[640px] mx-auto mt-4 px-4"
        >
          <span aria-current="false" className="text-p4 text-text-secondary">
            {copy.assignmentForm.progress.step1Label}
          </span>
          <span className="text-text-disabled text-p5">›</span>
          <span aria-current="step" className="text-p4 font-semibold text-text-primary">
            {copy.assignmentForm.progress.step2Label}
          </span>
        </nav>
        <GenerationStatus onPrevious={handlePrevious} />
      </section>
    );
  }

  return (
    <section aria-label={copy.assignmentForm.step1.sectionTitle}>
      {/* Progress indicator */}
      <nav
        aria-label={copy.assignmentForm.progress.step1Label}
        className="flex items-center gap-3 max-w-[640px] mx-auto mt-4 px-4"
      >
        <span aria-current="step" className="text-p4 font-semibold text-text-primary">
          {copy.assignmentForm.progress.step1Label}
        </span>
        <span className="text-text-disabled text-p5">›</span>
        <span aria-current="false" className="text-p4 text-text-secondary">
          {copy.assignmentForm.progress.step2Label}
        </span>
      </nav>

      {/* Main card */}
      <div
        className="
          bg-surface rounded-[24px] shadow-[var(--shadow-modal)]
          max-w-[640px] mx-auto
          mt-[clamp(2rem,5dvh,4rem)]
          p-8 sm:p-10
          flex flex-col gap-6
        "
      >
        {/* Card header */}
        <header>
          <h1 className="font-bold text-p2 text-text-primary">
            {copy.assignmentForm.headingCreate}
          </h1>
          <p className="text-p4 text-text-secondary mt-1">
            {copy.assignmentForm.subtitle}
          </p>
        </header>

        {/* Section sub-heading (a11y landmark + test hook) */}
        <h2 className="sr-only">{copy.assignmentForm.step1.sectionTitle}</h2>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          aria-label={copy.assignmentForm.headingCreate}
          noValidate
          className="flex flex-col gap-6"
        >
          {/* ── File upload — optional ─────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="file"
              className="font-semibold text-p4 text-text-primary"
            >
              {copy.assignmentForm.fields.file.label}
            </label>

            {/* Drop zone */}
            <label
              htmlFor="file"
              className="
                border-2 border-dashed border-grey-3 rounded-[12px]
                p-8 flex flex-col items-center gap-3
                cursor-pointer hover:bg-surface-hover transition-colors
              "
            >
              <span className="text-[2rem] leading-none" aria-hidden="true">
                ☁
              </span>
              <span className="text-p3 font-medium text-text-primary">
                {copy.assignmentForm.fields.file.dragDrop}
              </span>
              <span className="text-p4 text-text-secondary underline cursor-pointer">
                {copy.assignmentForm.fields.file.browseButton}
              </span>

              {selectedFileName && (
                <span
                  className="
                    bg-surface-hover rounded-full px-3 py-1
                    text-p4 text-text-primary truncate max-w-xs
                  "
                >
                  {selectedFileName}
                </span>
              )}

              <input
                id="file"
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => void handleFileChange(e)}
                aria-describedby="file-hint"
                disabled={uploading}
                className="sr-only"
              />
            </label>

            <span id="file-hint" className="text-p5 text-text-secondary">
              {copy.assignmentForm.fields.file.uploadImages}
            </span>
            {uploading && (
              <span aria-live="polite" className="text-p5 text-text-secondary">
                {copy.assignmentForm.uploading}
              </span>
            )}
            {fileError && (
              <span role="alert" aria-live="assertive" className="text-p5 text-error">
                {fileError}
              </span>
            )}
          </div>

          {/* ── Due date — required ────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="dueDate"
              className="font-semibold text-p4 text-text-primary"
            >
              {copy.assignmentForm.fields.dueDate.label}
            </label>
            <input
              id="dueDate"
              type="date"
              placeholder={copy.assignmentForm.fields.dueDate.placeholder}
              aria-invalid={errors.dueDate ? 'true' : undefined}
              aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
              className="
                border border-grey-2 rounded-[8px] px-3 py-2
                text-p3 text-text-primary w-full bg-surface
                focus:outline-none focus:ring-2 focus:ring-btn-dark/20
              "
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <span id="dueDate-error" role="alert" className="text-p5 text-error">
                {copy.assignmentForm.errors.dueDate}
              </span>
            )}
          </div>

          {/* ── Question types table ──────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
            <legend className="font-semibold text-p4 text-text-primary mb-2">
              {copy.assignmentForm.fields.questions.label}
            </legend>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-hover rounded-[8px]">
                    <th
                      scope="col"
                      className="text-left px-3 py-2 text-p5 font-semibold text-text-secondary rounded-l-[8px]"
                    >
                      {copy.assignmentForm.fields.questions.columnType}
                    </th>
                    <th
                      scope="col"
                      className="text-center px-3 py-2 text-p5 font-semibold text-text-secondary"
                    >
                      {copy.assignmentForm.fields.questions.columnCount}
                    </th>
                    <th
                      scope="col"
                      className="text-center px-3 py-2 text-p5 font-semibold text-text-secondary"
                    >
                      {copy.assignmentForm.fields.questions.columnMarks}
                    </th>
                    <th scope="col" className="px-2 py-2 rounded-r-[8px]">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      data-testid={`question-row-${String(index)}`}
                      className="border-b border-grey-2 last:border-0"
                    >
                      {/* Type select */}
                      <td className="py-2 pr-2">
                        <label
                          htmlFor={`questions-${String(index)}-type`}
                          className="sr-only"
                        >
                          {copy.assignmentForm.fields.questions.columnType} {index + 1}
                        </label>
                        <select
                          id={`questions-${String(index)}-type`}
                          className="
                            border border-grey-2 rounded-[8px] px-2 py-1.5
                            text-p4 bg-surface text-text-primary w-full
                          "
                          {...register(`questions.${index}.type`)}
                        >
                          {QUESTION_TYPE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Count stepper */}
                      <td className="py-2 px-2">
                        <label
                          htmlFor={`questions-${String(index)}-count`}
                          className="sr-only"
                        >
                          {copy.assignmentForm.fields.questions.columnCount} {index + 1}
                        </label>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            aria-label={`Decrease count for row ${String(index + 1)}`}
                            className="w-6 h-6 flex items-center justify-center rounded border border-grey-2 text-text-secondary hover:bg-surface-hover transition-colors text-p4"
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
                            className="
                              border border-grey-2 rounded-[8px] px-2 py-1.5
                              text-p4 bg-surface text-text-primary w-16 text-center
                            "
                            {...register(`questions.${index}.count`, { valueAsNumber: true })}
                          />
                          <button
                            type="button"
                            aria-label={`Increase count for row ${String(index + 1)}`}
                            className="w-6 h-6 flex items-center justify-center rounded border border-grey-2 text-text-secondary hover:bg-surface-hover transition-colors text-p4"
                            onClick={() => {
                              const current = watchedQuestions[index]?.count ?? 1;
                              setValue(`questions.${index}.count`, current + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                        {errors.questions?.[index]?.count && (
                          <span role="alert" className="text-p5 text-error block mt-1 text-center">
                            {copy.assignmentForm.errors.countPositive}
                          </span>
                        )}
                      </td>

                      {/* Marks stepper */}
                      <td className="py-2 px-2">
                        <label
                          htmlFor={`questions-${String(index)}-marks`}
                          className="sr-only"
                        >
                          {copy.assignmentForm.fields.questions.columnMarks} {index + 1}
                        </label>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            aria-label={`Decrease marks for row ${String(index + 1)}`}
                            className="w-6 h-6 flex items-center justify-center rounded border border-grey-2 text-text-secondary hover:bg-surface-hover transition-colors text-p4"
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
                            className="
                              border border-grey-2 rounded-[8px] px-2 py-1.5
                              text-p4 bg-surface text-text-primary w-16 text-center
                            "
                            {...register(`questions.${index}.marks`, { valueAsNumber: true })}
                          />
                          <button
                            type="button"
                            aria-label={`Increase marks for row ${String(index + 1)}`}
                            className="w-6 h-6 flex items-center justify-center rounded border border-grey-2 text-text-secondary hover:bg-surface-hover transition-colors text-p4"
                            onClick={() => {
                              const current = watchedQuestions[index]?.marks ?? 1;
                              setValue(`questions.${index}.marks`, current + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                        {errors.questions?.[index]?.marks && (
                          <span role="alert" className="text-p5 text-error block mt-1 text-center">
                            {copy.assignmentForm.errors.marksPositive}
                          </span>
                        )}
                      </td>

                      {/* Remove */}
                      <td className="py-2 pl-1">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            aria-label={`${copy.assignmentForm.fields.questions.removeRow} row ${String(index + 1)}`}
                            className="text-text-secondary hover:text-error transition-colors p-1 text-p4"
                            onClick={() => remove(index)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errors.questions && !Array.isArray(errors.questions) && (
              <span role="alert" className="text-p5 text-error">
                {copy.assignmentForm.errors.questions}
              </span>
            )}

            <button
              type="button"
              className="text-p4 text-text-secondary underline mt-1 flex items-center gap-1 self-start"
              onClick={() => append({ type: 'mcq', count: 1, marks: 1 })}
            >
              + {copy.assignmentForm.fields.questions.addRow}
            </button>

            <div
              aria-live="polite"
              data-testid="question-totals"
              className="flex gap-4 text-p5 text-text-secondary mt-1"
            >
              <span>
                {copy.assignmentForm.fields.questions.totalQuestions} {totalQuestions}
              </span>
              <span>
                {copy.assignmentForm.fields.questions.totalMarks} {totalMarks}
              </span>
            </div>
          </fieldset>

          {/* ── Additional information — optional ─────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="additionalInfo"
              className="font-semibold text-p4 text-text-primary"
            >
              {copy.assignmentForm.fields.additionalInfo.label}
            </label>
            <textarea
              id="additionalInfo"
              placeholder={copy.assignmentForm.fields.additionalInfo.placeholder}
              className="
                border border-grey-2 rounded-[8px] px-3 py-2
                text-p3 text-text-primary w-full bg-surface
                focus:outline-none focus:ring-2 focus:ring-btn-dark/20
                min-h-[5rem] resize-y
              "
              {...register('additionalInfo')}
            />
          </div>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={isPending}
            className="
              bg-btn-dark text-white rounded-full px-6 py-3 w-full
              text-p3 font-medium transition-opacity
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isPending ? copy.assignmentForm.uploading : copy.assignmentForm.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
