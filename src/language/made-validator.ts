import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { MadeAstType, Person } from './generated/ast.js';
import type { MadeServices } from './made-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MadeServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MadeValidator;
    const checks: ValidationChecks<MadeAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class MadeValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}
