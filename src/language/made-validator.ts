import type { ValidationChecks } from 'langium';
import type { MadeAstType } from './generated/ast.js';
import type { MadeServices } from './made-module.js';
import { reflection } from './generated/ast.js';    

/**
 * Custom validation function to check if date properties are in ISO 8601 format.
 */
function validateDates(node: any, accept: any) {
    const typeMeta = reflection.getTypeMetaData(node.$type);
    for (const prop of typeMeta.properties) {
        if (prop.name.match(/date$/i) && typeof node[prop.name] === 'string') {
            const value = node[prop.name];
            if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                accept('error', `A propriedade "${prop.name}" deve estar no formato ISO 8601 (YYYY-MM-DD)`, { node, property: prop.name });
            }
        }
    }
}

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MadeServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MadeValidator;
    const checks: ValidationChecks<MadeAstType> = {};

    for (const type of reflection.getAllTypes()) {
        (checks as any)[type] = validateDates;
    }

    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class MadeValidator {

    

}
