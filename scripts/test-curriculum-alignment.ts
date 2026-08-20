import "dotenv/config";

import {
  evaluateCurriculumAlignment,
} from "../lib/knowledge/evaluator/curriculumAlignment";


async function main() {

  console.log(
    "\n======================================"
  );

  console.log(
    " SRIMATHY CURRICULUM ALIGNMENT TEST"
  );

  console.log(
    "======================================\n"
  );


  const topic =
    "Equivalent fractions for Grade 5";


  const generatedLesson = `

Equivalent fractions are fractions
that represent the same amount.

For example, 1/2 and 2/4 are
equivalent fractions because they
represent the same part of a whole.

To create an equivalent fraction,
multiply both the numerator and
denominator by the same non-zero number.

Practice:
1. Find a fraction equivalent to 1/3.
2. Is 2/4 equivalent to 1/2?
3. Find two fractions equivalent to 3/4.

  `;


  try {

    const result =
      await evaluateCurriculumAlignment(
        generatedLesson,
        topic,
        5
      );


    console.log(
      "\n======================================"
    );

    console.log(
      "RESULT"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Alignment:",
      `${result.score}%`
    );

    console.log(
      "Similarity:",
      result.semanticSimilarity
    );

    console.log(
      "Topic Coverage:",
      `${result.topicCoverage}%`
    );

    console.log(
      "Reference Chunks:",
      result.referenceChunks
    );

    console.log(
      "Unsupported Content:",
      result.unsupportedContent
    );

    console.log(
      "Confidence:",
      `${result.confidence}%`
    );

    console.log(
      "Status:",
      result.status
    );


    console.log(
      "\nReferences:"
    );


    for (
      const reference
      of result.references
    ) {

      console.log(
        "\nSource:",
        reference.source
      );

      console.log(
        "Page:",
        reference.page
      );

      console.log(
        "Similarity:",
        reference.similarity.toFixed(3)
      );

      console.log(
        reference.text.slice(
          0,
          250
        )
      );

    }


  } catch (error) {

    console.error(
      "\n❌ Curriculum evaluation failed"
    );

    console.error(error);

    process.exit(1);

  }

}


main();