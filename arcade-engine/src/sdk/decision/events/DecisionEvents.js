export const DecisionEvents = Object.freeze({
  DECISION_EVALUATED: 'Decision.DecisionEvaluated',
  DECISION_RESET: 'Decision.DecisionReset',
  DECISION_INTERRUPTED: 'Decision.DecisionInterrupted',
});

export const StateMachineEvents = Object.freeze({
  STATE_ENTERED: 'StateMachine.StateEntered',
  STATE_EXITED: 'StateMachine.StateExited',
  TRANSITION_STARTED: 'StateMachine.TransitionStarted',
  TRANSITION_COMPLETED: 'StateMachine.TransitionCompleted',
});
