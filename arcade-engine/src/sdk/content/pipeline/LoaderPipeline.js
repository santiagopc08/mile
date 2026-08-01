import { ValidationStage } from './ValidationStage.js';
import { TransformationStage } from './TransformationStage.js';
import { RegistrationStage } from './RegistrationStage.js';

export class LoaderPipeline {
  constructor() {
    this.stages = [
      new ValidationStage(),
      new TransformationStage(),
      new RegistrationStage(),
    ];
  }

  addStage(stage) {
    this.stages.push(stage);
  }

  async execute(descriptor) {
    let context = { descriptor, validated: false, transformed: false, registered: false };
    for (const stage of this.stages) {
      context = await stage.execute(context);
    }
    return context;
  }
}
