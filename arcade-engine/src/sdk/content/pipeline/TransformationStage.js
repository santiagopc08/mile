import { PipelineStage } from './PipelineStage.js';

export class TransformationStage extends PipelineStage {
  async execute(context) {
    // Pure infrastructure placeholder for asset transforms
    context.transformed = true;
    return context;
  }
}
