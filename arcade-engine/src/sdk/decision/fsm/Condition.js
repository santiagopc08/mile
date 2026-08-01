export class Condition {
  constructor(predicateFn) {
    this.predicateFn = predicateFn;
  }

  evaluate(context) {
    return this.predicateFn ? this.predicateFn(context) : true;
  }
}
