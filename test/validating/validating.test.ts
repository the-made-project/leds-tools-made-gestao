import { beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createMadeServices } from "../../src/language/made-module.js";
import { Model, isModel } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createMadeServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createMadeServices(EmptyFileSystem);
    const doParse = parseHelper<Model>(services.Made);
    parse = (input: string) => doParse(input, { validation: true });
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

describe('Validating', () => {
  
    test('check no errors', async () => {
        document = await parse(`
            project test {
                name: "Projeto Válido"
                description: "Teste sem erros"
                startDate: 2024-01-01
                dueDate: 2024-12-31
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);
    });

    test('validação de data aceita YYYY-MM-DD', async () => {
        document = await parse(`
            project test {
                name: "Projeto Válido"
                startDate: 2024-01-01
                dueDate: 2024-12-31
            }
            sprint S1 {
                startDate: 2024-05-04
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).toHaveLength(0);
    });

    test('validação de data rejeita DD/MM/YYYY', async () => {
        document = await parse(`
            project test {
                name: "Projeto Válido"
                startDate: 2024-01-01
                dueDate: 2024-12-31
            }
            sprint S1 {
                startDate: 04/05/2024
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).not.toHaveLength(0);
    });

    // Exemplo de validação customizada: nome de sprint deve começar com maiúscula
    test('validação de nome de sprint com letra maiúscula', async () => {
        document = await parse(`
            sprint s1 {
                startDate: 2024-05-04
            }
        `);

        expect(
            checkDocumentValid(document) || document?.diagnostics?.map(diagnosticToString)?.join('\n')
        ).not.toHaveLength(0);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${Model}'.`
        || undefined;
}

function diagnosticToString(d: Diagnostic) {
    return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}
