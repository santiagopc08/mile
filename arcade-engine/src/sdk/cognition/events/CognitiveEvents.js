export const CognitiveEvents = Object.freeze({
  PERCEPTION_UPDATED: 'Cognition.PerceptionUpdated',
  KNOWLEDGE_UPDATED: 'Cognition.KnowledgeUpdated',
  GOAL_ADDED: 'Cognition.GoalAdded',
  GOAL_COMPLETED: 'Cognition.GoalCompleted',
  PLAN_CREATED: 'Cognition.PlanCreated',
  PLAN_DISCARDED: 'Cognition.PlanDiscarded',
  MEMORY_UPDATED: 'Cognition.MemoryUpdated',
  REASONING_COMPLETED: 'Cognition.ReasoningCompleted',
});

export const GoalPriority = Object.freeze({
  CRITICAL: 0,
  HIGH: 100,
  NORMAL: 200,
  LOW: 300,
  BACKGROUND: 400,
});
