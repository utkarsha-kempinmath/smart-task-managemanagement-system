/**
 * TaskAnalyzer - Heuristic Algorithmic Engine for Smart Task Prioritization
 * Evaluates urgency, effort, and deadlines without requiring external AI APIs.
 */

function analyzeTask(task) {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const isOverdue = diffHours < 0;

  // 1. Base Priority Weight
  const baseWeights = {
    low: 15,
    medium: 35,
    high: 60,
    urgent: 85
  };
  const baseScore = baseWeights[task.priority] || 35;

  // 2. Urgency Score (Proximity to deadline)
  let urgencyScore = 0;
  if (isOverdue) {
    // Heavy penalty for overdue tasks to pull them to the top
    urgencyScore = 55 + Math.min(20, Math.abs(Math.floor(diffHours / 24)) * 5);
  } else if (diffHours <= 12) {
    urgencyScore = 50;
  } else if (diffHours <= 24) {
    urgencyScore = 40;
  } else if (diffHours <= 48) {
    urgencyScore = 28;
  } else if (diffHours <= 120) { // 5 days
    urgencyScore = 15;
  } else {
    urgencyScore = 5;
  }

  // 3. Effort / Friction Factor (Longer tasks need earlier starts)
  const estimatedHours = Number(task.estimatedTime) || 1;
  const effortScore = Math.min(20, Math.round(estimatedHours * 3));

  // Total Score clamped 0 to 160
  const totalScore = Math.min(160, Math.round(baseScore + urgencyScore + effortScore));

  // 4. Eisenhower Quadrant Heuristic
  let quadrant = 'Important / Strategic';
  if (isOverdue || diffHours <= 36 || (diffHours <= 72 && (task.priority === 'urgent' || task.priority === 'high'))) {
    quadrant = 'Urgent & Important';
  } else if (task.priority === 'low' && diffHours <= 48) {
    quadrant = 'Urgent / Low Effort';
  } else if (task.priority === 'low' || diffHours > 168) {
    quadrant = 'Backlog / Flexible';
  } else {
    quadrant = 'Important / Strategic';
  }

  // 5. Algorithmic Smart Recommendation
  let recommendation = '';
  if (isOverdue) {
    const overdueDays = Math.ceil(Math.abs(diffHours) / 24);
    recommendation = `Overdue by ${overdueDays} day(s). Immediate priority to clear roadblock.`;
  } else if (diffHours <= 24) {
    recommendation = `Due within 24 hours (${estimatedHours}h effort). Recommended for morning focus block.`;
  } else if (diffHours <= 72 && estimatedHours >= 3) {
    recommendation = `Substantial effort (${estimatedHours}h) due soon. Break into 2-3 focused sessions.`;
  } else if (task.priority === 'urgent') {
    recommendation = `Marked high urgency. Complete before secondary tasks.`;
  } else {
    recommendation = `On track. Planned for upcoming schedule window.`;
  }

  return {
    smartPriorityScore: totalScore,
    smartQuadrant: quadrant,
    smartRecommendation: recommendation
  };
}

module.exports = {
  analyzeTask
};
