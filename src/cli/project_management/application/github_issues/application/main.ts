import { createProject, addIssueToProject } from './createProject.js';
import { createIssue } from './createIssue.js';


const ORGANIZATION = 'PS-MADE';
const PROJECT_TITLE = 'PROJETOTESTANDOPROMADE';
const REPOSITORY_NAME = 'testeProject';

async function main() {
    try {
        
        console.log('Iniciando criação do projeto...');
        const projectId = await createProject(ORGANIZATION, PROJECT_TITLE);
        console.log('Projeto criado com ID:', projectId);

        console.log('Iniciando criação da issue...');

        /*
            organizationName: string,
            repositoryName: string,
            title: string,
            body: string,
            labels: string[],
            assignees: string[],
        */
       
        const issue = await createIssue(
            ORGANIZATION,
            REPOSITORY_NAME,
            'Nome Issue',
            'Descrição da issue',
            ['bug', 'duplicate'],
            ['jonathancastrosilva', 'JosiasNJB'],
        );
        
        console.log('Issue criada com ID:', issue.id);
        console.log('✅ Todos os assignees foram adicionados com sucesso.');

        console.log('Adicionando issue ao projeto...');
        await addIssueToProject(projectId, issue.id);

        //await addFieldToIssue(projectId, itemId, 'Type', 'Bug');


        console.log('✅ Issue adicionada ao projeto.');
    } catch (error: any) {
        console.error('❌ Erro:', error.response?.data || error.message);
    }
}

main();