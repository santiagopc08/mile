export class AnimationParameter {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}

export class BooleanParameter extends AnimationParameter {
  constructor(name, value = false) { super(name, !!value); }
}

export class FloatParameter extends AnimationParameter {
  constructor(name, value = 0.0) { super(name, Number(value)); }
}

export class IntegerParameter extends AnimationParameter {
  constructor(name, value = 0) { super(name, Math.floor(value)); }
}

export class TriggerParameter extends AnimationParameter {
  constructor(name) {
    super(name, false);
  }

  trigger() { this.value = true; }
  consume() { this.value = false; }
}
