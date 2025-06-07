import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import { createMadeServices } from "../../src/language/made-module.js";
import { Model, isModel } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createMadeServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

beforeAll(async () => {
    services = createMadeServices(EmptyFileSystem);
    parse = parseHelper<Model>(services.Made);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [ document ]);
});

describe('Linking tests', () => {

    test('linking of backlog items', async () => {
        document = await parse(`
            project test {
                name: "Exemplo de Projeto"
                description: "Este é um projeto de exemplo."
                startDate: 2022-11-22
                dueDate: 2022-11-30
            }
            backlog Sprint {
                epic E1 {
                    name: "Minha Epic"
                    story S1 {
                        name: "Minha User Story"
                        depends: Sprint.E1
                    }
                }
            }
        `);

        expect(
            checkDocumentValid(document)
            || document.parseResult.value.components
                .filter(c => c.$type === 'Backlog')
                .flatMap(b => b.items)
                .filter(i => i.$type === 'Epic')
                .map(e => e.name)
                .join('\n')
        ).toBe(s`
            Minha Epic
        `);
    });

    test('linking of backlog items', async () => {
        document = await parse(`
            project test {
                name: "Exemplo de Projeto"
                description: "Este é um projeto de exemplo."
                startDate: 2022-11-22
                dueDate: 2022-11-30
            }
            backlog Sprint {
                epic E1 {
                    name: "Minha Epic"
                    story S1 {
                        name: "Minha User Story"
                        depends: Sprint.E1
                    }
                }
            }
        `);

        expect(
            checkDocumentValid(document)
            || document.parseResult.value.components
                .filter(c => c.$type === 'Backlog')
                .flatMap(b => b.items)
                .filter(i => i.$type === 'Epic')
                .map(e => e.name)
                .join('\n')
        ).toBe(s`
            Minha Epic
        `);
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
