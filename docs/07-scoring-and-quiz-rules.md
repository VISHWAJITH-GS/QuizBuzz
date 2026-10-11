# 07 --- Scoring and Quiz Rules

## 1. Quiz modes

### Practice mode

After an answer is selected, show whether it is correct and display the
explanation. Decide with the team whether changing an answer is allowed
after feedback; document the chosen behavior.

### Exam mode

Hide correctness, answer keys, and explanations until the student
submits the quiz or the timer expires. Do not send correct option IDs to
the browser before submission.

## 2. Navigation

-   `one-by-one`: show one question at a time with next/previous
    navigation as agreed.
-   `all-at-once`: show all questions on one screen.
-   The chosen mode is fixed when the quiz starts.

## 3. Timer

-   Optional.
-   If enabled, the student chooses a positive bounded duration before
    starting.
-   The client may display a countdown, but the backend should validate
    the submitted attempt against its recorded start/deadline if timer
    enforcement is required.
-   Define whether time expiry automatically submits the current
    answers. Recommended behavior: submit available answers when time
    expires.
-   A page refresh should restore the timer deadline rather than reset
    the full duration.

## 4. Scoring

For each question: - Correct answer: add `marksPerCorrect`. - Incorrect
answer: subtract `negativeMarksPerIncorrect` if negative marking is
enabled; otherwise subtract zero. - Unanswered answer: zero unless the
team explicitly chooses another policy.

Suggested score formula:

`score = (correctCount × marksPerCorrect) − (incorrectCount × negativeMarksPerIncorrect)`

Suggested maximum score:

`maximumScore = totalQuestions × marksPerCorrect`

Percentage handling must be agreed. A simple policy is
`score / maximumScore × 100`, clamped to the documented range if
negative marking can produce a negative total. Alternatively, show raw
score and percentage separately. Do not leave the behavior ambiguous in
the UI.

Validate all scoring settings server-side. Use finite non-negative
values and reasonable maximums.

## 5. Answer validation

-   Only accept question IDs belonging to the active quiz.
-   Only accept option IDs belonging to that question.
-   Ignore or reject duplicate answer submissions consistently.
-   Compute results using the server-held answer key, never a score sent
    by the client.
-   Store answer keys and submitted answers only in temporary session
    state.

## 6. Results view

Show: - score and maximum score, - percentage, - correct, incorrect, and
unanswered counts, - each question and the correct answer after
submission, - explanation, - source page/slide reference when reliable.

Topic-level weak-area analysis is optional and must not infer topic
labels without a dependable method.

## 7. Starting a new quiz

Starting a new quiz immediately discards the previous in-progress quiz
without a confirmation dialog. Clear its answer key and answers from
temporary state and clear related `sessionStorage` data before saving
the new quiz state.
