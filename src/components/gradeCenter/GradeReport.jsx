/**
 * GradeReport Component
 *
 * Read-only grade view for Parent and Student roles.
 * Shows evaluation plan, scores, weighted contribution, and running average.
 */

const GradeReport = ({ evaluations, grades, studentName }) => {
  // Build a score map: evaluationId → grade record
  const scoreMap = {};
  grades.forEach((g) => {
    if (!g.annulled) {
      scoreMap[g.evaluationId] = g;
    }
  });

  // Calculate weighted average (only over evaluations that have a score)
  let earnedWeightedSum = 0;
  let coveredPct = 0;

  evaluations.forEach((ev) => {
    const record = scoreMap[ev._id];
    if (record) {
      earnedWeightedSum += (record.score / 100) * ev.percentage;
      coveredPct += ev.percentage;
    }
  });

  const projectedAvg =
    coveredPct > 0 ? ((earnedWeightedSum / coveredPct) * 100).toFixed(1) : null;
  const finalAvg = coveredPct === 100 ? earnedWeightedSum.toFixed(1) : null;
  const totalPct = evaluations.reduce((s, e) => s + Number(e.percentage), 0);

  const letterGrade = (score) => {
    if (score === null || score === undefined) return "—";
    const n = Number(score);
    if (n >= 90) return "A";
    if (n >= 80) return "B";
    if (n >= 70) return "C";
    if (n >= 60) return "D";
    return "F";
  };

  const scoreColor = (score) => {
    if (score === null || score === undefined) return "";
    if (score >= 80) return "gr-score--good";
    if (score >= 60) return "gr-score--mid";
    return "gr-score--low";
  };

  return (
    <div className="gr-container">
      {studentName && <div className="gr-student-name">{studentName}</div>}

      <table className="gr-table">
        <thead>
          <tr>
            <th>Evaluation</th>
            <th>Weight</th>
            <th>Score</th>
            <th>Letter</th>
            <th>Contribution</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.map((ev) => {
            const record = scoreMap[ev._id];
            const score = record ? record.score : null;
            const contribution =
              score !== null ? ((score / 100) * ev.percentage).toFixed(1) : "—";
            return (
              <tr
                key={ev._id}
                className={score === null ? "gr-row--pending" : ""}
              >
                <td>{ev.name}</td>
                <td className="gr-pct">{ev.percentage}%</td>
                <td className={`gr-score ${scoreColor(score)}`}>
                  {score !== null ? (
                    `${score}`
                  ) : (
                    <span className="gr-pending">Pending</span>
                  )}
                </td>
                <td className="gr-letter">{letterGrade(score)}</td>
                <td className="gr-contrib">{contribution}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {/* Accumulated contribution row */}
          {coveredPct > 0 && (
            <tr className="gr-footer gr-footer--accum">
              <td colSpan={4}>
                <strong>Accumulated so far:</strong>
              </td>
              <td
                className={`gr-contrib gr-contrib--total ${scoreColor(earnedWeightedSum)}`}
              >
                <strong>{earnedWeightedSum.toFixed(1)}</strong>
                <span className="gr-contrib-denom"> / {coveredPct} pts</span>
              </td>
            </tr>
          )}
          <tr className="gr-footer">
            <td colSpan={2}>
              <strong>Total Plan: {totalPct}%</strong>
            </td>
            <td colSpan={3}>
              {finalAvg !== null ? (
                <span className={`gr-final ${scoreColor(Number(finalAvg))}`}>
                  Final: <strong>{finalAvg} / 100</strong> (
                  {letterGrade(Number(finalAvg))})
                </span>
              ) : projectedAvg !== null ? (
                <span>
                  Projected so far: <strong>{projectedAvg}</strong> (based on{" "}
                  {coveredPct}% evaluated)
                </span>
              ) : (
                <span className="gr-pending">No grades yet</span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default GradeReport;
