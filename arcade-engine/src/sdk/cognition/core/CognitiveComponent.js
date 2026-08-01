import { ActorComponent } from '../../actors/components/ActorComponent.js';
import { WorkingMemory } from '../memory/MemoryStore.js';
import { KnowledgeBase } from '../knowledge/KnowledgeBase.js';
import { GoalSet } from '../goals/Goal.js';

export class CognitiveContext {
  constructor(actor = null) {
    this.actor = actor;
    this.memory = new WorkingMemory();
    this.knowledge = new KnowledgeBase();
    this.goals = new GoalSet();
  }
}

export class CognitiveComponent extends ActorComponent {
  constructor() {
    super('CognitiveComponent');
    this.memory = new WorkingMemory();
    this.knowledge = new KnowledgeBase();
    this.goals = new GoalSet();
  }

  onUpdate(dt) {
    this.memory.update(dt);
  }
}

export class CognitiveRegistry {
  constructor() {
    this.providers = new Map();
  }
}

export class CognitiveSystem {
  constructor() {
    this.registry = new CognitiveRegistry();
  }
}
