import type { ValidationChecks } from 'langium';
import type { MadeAstType } from './generated/ast.js';
import type { MadeServices } from './made-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MadeServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MadeValidator;
    const checks: ValidationChecks<MadeAstType> = {
       
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class MadeValidator {

    

}
