'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { figmaAssets } from '@/lib/figmaAssets';


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
  const router = useRouter();
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
  const watchedDueDate = useWatch({ control, name: 'dueDate' });

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
      <section aria-label={copy.assignmentForm.step2.sectionTitle} className="w-full max-w-[810px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── Page Header (Outside Card) ─────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-[#00C853] shrink-0" aria-hidden="true" />
          <div className="flex flex-col">
            <h1 className="font-bold text-p1 text-text-primary tracking-tight leading-tight">
              Create Assignment
            </h1>
            <p className="text-p4 text-text-secondary leading-snug">
              Generating your structured assessment...
            </p>
          </div>
        </div>

        {/* ── Segmented Progress Bar (Outside Card) ───────────────────────── */}
        <div className="w-full h-1 flex gap-3 mt-1" aria-label={copy.assignmentForm.progress.step2Label}>
          <div className="flex-1 h-full rounded bg-btn-dark" title={copy.assignmentForm.progress.step1Label} />
          <div className="flex-1 h-full rounded bg-btn-dark" title={copy.assignmentForm.progress.step2Label} />
        </div>

        <GenerationStatus onPrevious={handlePrevious} />
      </section>
    );
  }

  return (
    <section aria-label={copy.assignmentForm.step1.sectionTitle} className="w-full max-w-[810px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      {/* ── Page Header (Outside Card) ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="size-3 rounded-full bg-[#00C853] shrink-0" aria-hidden="true" />
        <div className="flex flex-col">
          <h1 className="font-bold text-p1 text-text-primary tracking-tight leading-tight">
            {copy.assignmentForm.headingCreate}
          </h1>
          <p className="text-p4 text-text-secondary leading-snug">
            {copy.assignmentForm.subtitle}
          </p>
        </div>
      </div>

      {/* ── Segmented Progress Bar (Outside Card) ───────────────────────── */}
      <div className="w-full h-1 flex gap-3 mt-1" aria-label={copy.assignmentForm.progress.step1Label}>
        <div className="flex-1 h-full rounded bg-btn-dark" title={copy.assignmentForm.progress.step1Label} />
        <div className="flex-1 h-full rounded bg-grey-2" title={copy.assignmentForm.progress.step2Label} />
      </div>

      {/* Main card */}
      <div
        className="
          bg-[rgba(255,255,255,0.5)] border border-white/20 backdrop-blur-md rounded-[32px] shadow-[var(--shadow-modal)]
          w-full p-6 sm:p-8 flex flex-col gap-6
        "
      >
        {/* Card header */}
        <header className="flex flex-col gap-1">
          <h2 className="font-bold text-p2 text-text-primary tracking-tight">
            Assignment Details
          </h2>
          <p className="text-p4 text-text-secondary">
            Basic information about your assignment
          </p>
        </header>

        <form
          id="assignment-create-form"
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
                border border-dashed border-[#dadada] rounded-[24px] bg-white
                p-8 flex flex-col items-center gap-4
                cursor-pointer hover:bg-surface-hover transition-all relative w-full
              "
            >
              {/* Cloud Icon wrapper */}
              <div className="bg-white border-[1.75px] border-dashed border-btn-dark/20 flex items-center justify-center rounded-[8px] size-10 shadow-sm">
                <img 
                  src={figmaAssets.create.uploadCloud} 
                  alt="" 
                  aria-hidden="true" 
                  className="size-6" 
                />
              </div>

              <div className="flex flex-col gap-1 items-center text-center">
                <span className="text-p3 font-semibold text-text-primary">
                  {copy.assignmentForm.fields.file.dragDrop}
                </span>
                <span className="text-p5 text-text-disabled">
                  JPEG, PNG, upto 10MB
                </span>
              </div>

              {/* Browse Pill Button */}
              <div className="bg-[#f0f0f0] hover:bg-[#dadada]/50 text-[#303030] text-p5 font-semibold rounded-full px-6 py-2 transition-all">
                Browse Files
              </div>

              {selectedFileName && (
                <span
                  className="
                    bg-surface-hover rounded-full px-3 py-1 mt-2
                    text-p5 text-text-primary truncate max-w-xs border border-grey-2
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

            <span id="file-hint" className="text-p5 text-text-secondary text-center mt-1">
              {copy.assignmentForm.fields.file.uploadImages}
            </span>
            {uploading && (
              <span aria-live="polite" className="text-p5 text-text-secondary text-center">
                {copy.assignmentForm.uploading}
              </span>
            )}
            {fileError && (
              <span role="alert" aria-live="assertive" className="text-p5 text-error text-center">
                {fileError}
              </span>
            )}
          </div>

          {/* ── Due date — required ────────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="dueDate"
              className="font-semibold text-p4 text-text-primary"
            >
              {copy.assignmentForm.fields.dueDate.label}
            </label>
            <div className="relative w-full h-[44px] bg-[#f6f6f6] border border-[#dadada] rounded-[100px] flex items-center justify-between px-4 cursor-pointer hover:bg-surface-hover transition-colors">
              <span className={`text-p3 ${watchedDueDate ? 'text-text-primary font-medium' : 'text-text-disabled font-normal'}`}>
                {watchedDueDate ? watchedDueDate : 'DD-MM-YYYY'}
              </span>
              <img 
                src={figmaAssets.create.calendarIcon} 
                alt="" 
                aria-hidden="true" 
                className="size-6" 
              />
              <input
                id="dueDate"
                type="date"
                placeholder={copy.assignmentForm.fields.dueDate.placeholder}
                aria-invalid={errors.dueDate ? 'true' : undefined}
                aria-describedby={errors.dueDate ? 'dueDate-error' : undefined}
                className="
                  absolute inset-0 w-full h-full opacity-0 cursor-pointer
                "
                {...register('dueDate')}
              />
            </div>
            {errors.dueDate && (
              <span id="dueDate-error" role="alert" className="text-p5 text-error mt-0.5">
                {copy.assignmentForm.errors.dueDate}
              </span>
            )}
          </div>

          {/* ── Question types table ──────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 w-full">
            <legend className="font-semibold text-p4 text-text-primary mb-2">
              {copy.assignmentForm.fields.questions.label}
            </legend>

            {/* Column Headers (Visible only on Desktop) */}
            <div className="hidden md:flex items-center justify-between w-full text-p5 font-semibold text-text-secondary px-4 mb-2">
              <div className="w-[443px]">Question Type</div>
              <div className="w-[100px] text-center">No. of Questions</div>
              <div className="w-[100px] text-center">Marks</div>
            </div>

            {/* List of Dynamic Rows */}
            <div className="flex flex-col gap-4 w-full">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  data-testid={`question-row-${String(index)}`}
                  className="flex flex-col md:flex-row gap-4 items-center justify-between w-full p-4 md:p-0 bg-white md:bg-transparent rounded-2xl border border-grey-2 md:border-0 shadow-sm md:shadow-none"
                >
                  {/* Select Dropdown & Remove Row Action */}
                  <div className="flex items-center gap-3 w-full md:max-w-[443px] flex-1">
                    <div className="relative flex-1">
                      <label
                        htmlFor={`questions-${String(index)}-type`}
                        className="sr-only"
                      >
                        {copy.assignmentForm.fields.questions.columnType} {index + 1}
                      </label>
                      <select
                        id={`questions-${String(index)}-type`}
                        className="
                          appearance-none border border-[#dadada] rounded-[100px] bg-white h-[44px] px-4 pr-10
                          text-p4 text-text-primary w-full font-medium focus:outline-none focus:ring-2 focus:ring-btn-dark/20
                        "
                        {...register(`questions.${index}.type`)}
                      >
                        {QUESTION_TYPE_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <img 
                        src={figmaAssets.create.chevronDown} 
                        alt="" 
                        aria-hidden="true" 
                        className="absolute right-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none" 
                      />
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        aria-label={`${copy.assignmentForm.fields.questions.removeRow} row ${String(index + 1)}`}
                        className="p-2 hover:bg-surface-hover rounded-full transition-all shrink-0 active:scale-90"
                        onClick={() => remove(index)}
                      >
                        <img 
                          src={figmaAssets.create.deleteRow} 
                          alt="Remove row" 
                          className="size-4" 
                        />
                      </button>
                    )}
                  </div>

                  {/* Steppers Column (Side-by-side) */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
                    
                    {/* Stepper 1: Questions */}
                    <div className="flex flex-col items-center md:items-stretch gap-1">
                      <span className="md:hidden text-p5 font-semibold text-text-disabled uppercase tracking-wider text-center">
                        Questions
                      </span>
                      <div className="bg-white border border-[#dadada] rounded-[100px] w-[100px] h-[44px] flex items-center justify-between px-2 shadow-sm md:shadow-none animate-fade-in">
                        <button
                          type="button"
                          aria-label={`Decrease count for row ${String(index + 1)}`}
                          className="size-6 flex items-center justify-center rounded-full hover:bg-surface-hover active:scale-90 transition-all shrink-0"
                          onClick={() => {
                            const current = watchedQuestions[index]?.count ?? 1;
                            if (current > 1) setValue(`questions.${index}.count`, current - 1);
                          }}
                        >
                          <img src={figmaAssets.create.stepperMinus} alt="Minus" className="size-4" />
                        </button>
                        
                        <label
                          htmlFor={`questions-${String(index)}-count`}
                          className="sr-only"
                        >
                          {copy.assignmentForm.fields.questions.columnCount} row {String(index + 1)}
                        </label>
                        <input
                          id={`questions-${String(index)}-count`}
                          type="number"
                          min={1}
                          className="
                            bg-transparent text-p4 font-bold text-text-primary text-center w-8 focus:outline-none
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                          "
                          {...register(`questions.${index}.count`, { valueAsNumber: true })}
                        />
                        
                        <button
                          type="button"
                          aria-label={`Increase count for row ${String(index + 1)}`}
                          className="size-6 flex items-center justify-center rounded-full hover:bg-surface-hover active:scale-90 transition-all shrink-0"
                          onClick={() => {
                            const current = watchedQuestions[index]?.count ?? 1;
                            setValue(`questions.${index}.count`, current + 1);
                          }}
                        >
                          <img src={figmaAssets.create.stepperPlus} alt="Plus" className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stepper 2: Marks */}
                    <div className="flex flex-col items-center md:items-stretch gap-1">
                      <span className="md:hidden text-p5 font-semibold text-text-disabled uppercase tracking-wider text-center">
                        Marks
                      </span>
                      <div className="bg-white border border-[#dadada] rounded-[100px] w-[100px] h-[44px] flex items-center justify-between px-2 shadow-sm md:shadow-none animate-fade-in">
                        <button
                          type="button"
                          aria-label={`Decrease marks for row ${String(index + 1)}`}
                          className="size-6 flex items-center justify-center rounded-full hover:bg-surface-hover active:scale-90 transition-all shrink-0"
                          onClick={() => {
                            const current = watchedQuestions[index]?.marks ?? 1;
                            if (current > 1) setValue(`questions.${index}.marks`, current - 1);
                          }}
                        >
                          <img src={figmaAssets.create.stepperMinus} alt="Minus" className="size-4" />
                        </button>
                        
                        <label
                          htmlFor={`questions-${String(index)}-marks`}
                          className="sr-only"
                        >
                          {copy.assignmentForm.fields.questions.columnMarks} row {String(index + 1)}
                        </label>
                        <input
                          id={`questions-${String(index)}-marks`}
                          type="number"
                          min={1}
                          className="
                            bg-transparent text-p4 font-bold text-text-primary text-center w-8 focus:outline-none
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                          "
                          {...register(`questions.${index}.marks`, { valueAsNumber: true })}
                        />
                        
                        <button
                          type="button"
                          aria-label={`Increase marks for row ${String(index + 1)}`}
                          className="size-6 flex items-center justify-center rounded-full hover:bg-surface-hover active:scale-90 transition-all shrink-0"
                          onClick={() => {
                            const current = watchedQuestions[index]?.marks ?? 1;
                            setValue(`questions.${index}.marks`, current + 1);
                          }}
                        >
                          <img src={figmaAssets.create.stepperPlus} alt="Plus" className="size-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {errors.questions && !Array.isArray(errors.questions) && (
              <span role="alert" className="text-p5 text-error mt-1 block">
                {copy.assignmentForm.errors.questions}
              </span>
            )}

            {/* Add Question Button & Totals Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 w-full">
              <button
                type="button"
                className="inline-flex items-center gap-3 self-start group transition-all"
                onClick={() => append({ type: 'mcq', count: 1, marks: 1 })}
              >
                <div className="bg-[#2b2b2b] text-white size-9 rounded-full flex items-center justify-center group-hover:bg-[#181818] active:scale-90 transition-all shadow-sm">
                  <img src={figmaAssets.create.addRowPlus} alt="" className="size-5" />
                </div>
                <span className="text-p4 font-bold text-[#303030] group-hover:underline">
                  {copy.assignmentForm.fields.questions.addRow}
                </span>
              </button>

              <div
                aria-live="polite"
                data-testid="question-totals"
                className="flex flex-col items-start sm:items-end text-p5 font-semibold text-text-primary gap-1 sm:text-right"
              >
                <span>
                  {copy.assignmentForm.fields.questions.totalQuestions} {totalQuestions}
                </span>
                <span>
                  {copy.assignmentForm.fields.questions.totalMarks} {totalMarks}
                </span>
              </div>
            </div>
          </fieldset>

          {/* ── Additional information — optional ─────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="additionalInfo"
              className="font-semibold text-p4 text-text-primary"
            >
              {copy.assignmentForm.fields.additionalInfo.label}
            </label>
            <div className="relative border border-dashed border-[#dadada] rounded-[16px] p-4 bg-[rgba(255,255,255,0.25)] focus-within:ring-2 focus-within:ring-btn-dark/20 transition-all flex flex-col gap-2 min-h-[102px]">
              <textarea
                id="additionalInfo"
                placeholder={copy.assignmentForm.fields.additionalInfo.placeholder}
                className="
                  bg-transparent text-p4 text-text-primary w-full h-[60px] resize-none focus:outline-none
                "
                {...register('additionalInfo')}
              />
              
              <button
                type="button"
                aria-label="Voice input (dictation)"
                className="absolute bottom-4 right-4 bg-[#f0f0f0] hover:bg-[#dadada]/50 text-text-primary size-9 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-sm"
              >
                <img src={figmaAssets.create.micIcon} alt="" className="size-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Page Footer Action Buttons (Outside Card) ────────────────────── */}
      <div className="w-full flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={() => router.push('/assignments')}
          className="
            bg-white border border-[#dadada] text-[#303030] rounded-full px-6 py-3
            text-p4 font-bold inline-flex items-center gap-3 transition-all hover:bg-surface-hover active:scale-95
          "
        >
          <img src={figmaAssets.create.arrowLeft} alt="" className="size-4" />
          Previous
        </button>

        <button
          type="submit"
          form="assignment-create-form"
          disabled={isPending}
          className="
            bg-[#2b2b2b] text-white rounded-full px-6 py-3
            text-p4 font-bold inline-flex items-center gap-3 transition-all hover:bg-btn-dark disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
          "
        >
          {isPending ? copy.assignmentForm.uploading : copy.assignmentForm.submit}
          <img src={figmaAssets.create.arrowRight} alt="" className="size-4" />
        </button>
      </div>
    </section>
  );
}
