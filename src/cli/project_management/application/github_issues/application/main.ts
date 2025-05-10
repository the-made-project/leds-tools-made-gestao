import { createProject } from './createProject.js';
import { createIssue } from './createIssue.js';
import { addIssueToProject } from './addIssueToProject.js';

const ORGANIZATION = 'PS-MADE';
const PROJECT_TITLE = 'PROJETOTESTANDOPROMADE';
const REPOSITORY_NAME = 'testeProject';

async function main() {
    try {
        console.log('Iniciando criação do projeto...');
        const projectId = await createProject(ORGANIZATION, PROJECT_TITLE);
        console.log('Projeto criado com ID:', projectId);

        console.log('Iniciando criação da issue...');
        const issueId = await createIssue(
            ORGANIZATION,
            REPOSITORY_NAME,
            'Minha primeira issue',
            'Descrição da minha primeira issue',
            ['bug', 'duplicate'],
            ['jonathancastrosilva'],
            'BUG'
        );
        
        console.log('Issue criada com ID:', issueId);

        console.log('Adicionando issue ao projeto...');
        await addIssueToProject(projectId, issueId.id);
        console.log('✅ Issue adicionada ao projeto.');
    } catch (error: any) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

main();