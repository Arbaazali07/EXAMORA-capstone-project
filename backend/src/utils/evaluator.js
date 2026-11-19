// backend/src/utils/evaluator.js
// Automated evaluation engine for Objective questions (Single Choice, Multi Choice, True/False)

function evaluateQuestionAnswer(question, correctOptions, studentAnswer, negativeMarkingRate = 0.00) {
  const marks = parseFloat(question.custom_marks || question.marks);
  const negativeMarks = parseFloat(question.custom_negative_marks !== null && question.custom_negative_marks !== undefined ? question.custom_negative_marks : (question.negative_marks || negativeMarkingRate || 0.00));

  if (!studentAnswer || (Array.isArray(studentAnswer) && studentAnswer.length === 0)) {
    return {
      attempted: false,
      isCorrect: false,
      marksObtained: 0.00,
      isEvaluated: true
    };
  }

  // Question Type: Single Choice or True/False
  if (question.question_type === 'single_choice' || question.question_type === 'true_false') {
    const selectedKey = Array.isArray(studentAnswer) ? studentAnswer[0] : studentAnswer;
    const correctKey = correctOptions.length > 0 ? correctOptions[0].option_key : null;

    if (!selectedKey) {
      return { attempted: false, isCorrect: false, marksObtained: 0.00, isEvaluated: true };
    }

    const isMatch = String(selectedKey).trim().toUpperCase() === String(correctKey).trim().toUpperCase();
    if (isMatch) {
      return { attempted: true, isCorrect: true, marksObtained: marks, isEvaluated: true };
    } else {
      return { attempted: true, isCorrect: false, marksObtained: -negativeMarks, isEvaluated: true };
    }
  }

  // Question Type: Multiple Choice (requires exact match of all correct keys)
  if (question.question_type === 'multiple_choice') {
    const selectedArray = Array.isArray(studentAnswer) ? studentAnswer.map(s => String(s).trim().toUpperCase()) : [String(studentAnswer).trim().toUpperCase()];
    const correctArray = correctOptions.map(o => String(o.option_key).trim().toUpperCase());

    if (selectedArray.length === 0) {
      return { attempted: false, isCorrect: false, marksObtained: 0.00, isEvaluated: true };
    }

    selectedArray.sort();
    correctArray.sort();

    const isMatch = selectedArray.length === correctArray.length &&
      selectedArray.every((val, index) => val === correctArray[index]);

    if (isMatch) {
      return { attempted: true, isCorrect: true, marksObtained: marks, isEvaluated: true };
    } else {
      return { attempted: true, isCorrect: false, marksObtained: -negativeMarks, isEvaluated: true };
    }
  }

  // Question Type: Descriptive (requires manual grading by teacher)
  if (question.question_type === 'descriptive') {
    const textAnswer = typeof studentAnswer === 'string' ? studentAnswer.trim() : '';
    const hasAttempted = textAnswer.length > 0;
    return {
      attempted: hasAttempted,
      isCorrect: false,
      marksObtained: 0.00,
      isEvaluated: false // Flags that manual teacher evaluation is required
    };
  }

  return { attempted: false, isCorrect: false, marksObtained: 0.00, isEvaluated: true };
}

module.exports = {
  evaluateQuestionAnswer
};

