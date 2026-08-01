import { PipelineStage } from './PipelineStage.js';
import { ValidationError } from '../../core/errors/SDKError.js';

export class ValidationStage extends PipelineStage {
  async execute(context) {
    if (!context.descriptor) {
      throw new ValidationError('ValidationStage: Missing descriptor in pipeline context.');
    }
    context.validated = true;
    return context;
  }
}
