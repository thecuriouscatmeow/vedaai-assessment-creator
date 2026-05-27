/**
 * School identity — injected by the backend into every generated QuestionPaper.
 *
 * The LLM generates academic content (title, subject, className, sections, etc.).
 * These fields are set by the server and are never derived from the model output,
 * ensuring every paper carries a consistent, accurate institution header.
 */
export const SCHOOL_NAME = 'Delhi Public School, Sector-4, Bokaro' as const;
export const SCHOOL_ADDRESS = 'Sector-4, Bokaro Steel City, Jharkhand 827004' as const;
