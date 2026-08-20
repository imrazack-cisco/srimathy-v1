import path from "path";

export interface CurriculumMetadata {
  board: string;
  grade: string;
  subject: string;
  book: string;
  sourceType: string;
}

/**
 * Extract curriculum metadata from the local NCERT
 * directory structure.
 *
 * Expected structure:
 *
 * knowledge/
 *   ncert/
 *     class5/
 *       mathematics/
 *         ganita-prakash.pdf
 */
export function extractCurriculumMetadata(
  filePath: string
): CurriculumMetadata {

  const normalized =
    filePath.split(path.sep);

  const ncertIndex =
    normalized.lastIndexOf("ncert");

  if (ncertIndex === -1) {

    return {
      board: "Unknown",
      grade: "Unknown",
      subject: "Unknown",
      book: path.basename(filePath),
      sourceType: "unknown",
    };

  }

  const gradeFolder =
    normalized[ncertIndex + 1] ?? "";

  const subjectFolder =
    normalized[ncertIndex + 2] ?? "";

  const fileName =
    path.basename(
      filePath,
      path.extname(filePath)
    );


  const grade =
    gradeFolder
      .replace(
        /^class/i,
        ""
      );


  const subject =
    subjectFolder
      .replace(
        /[-_]/g,
        " "
      )
      .replace(
        /\b\w/g,
        char => char.toUpperCase()
      );


  const book =
    fileName
      .replace(
        /[-_]/g,
        " "
      )
      .replace(
        /\b\w/g,
        char => char.toUpperCase()
      );


  return {

    board: "NCERT",

    grade,

    subject,

    book,

    sourceType: "official-ncert",

  };

}