export class TransitionHistory {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.records = [];
  }

  add(record) {
    if (this.records.length >= this.capacity) this.records.shift();
    this.records.push(record);
  }
}

export class DecisionHistory extends TransitionHistory {}
