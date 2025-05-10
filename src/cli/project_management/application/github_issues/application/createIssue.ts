import { axiosInstance } from '../utils/axiosInstance.js';
import { getRepositoryId } from './getRepositoryId.js';
import { addLabelsToIssue } from './addLabelsToIssue.js';
import { addAssigneesToIssue } from './addAssigneesToIssue.js';

// Função para criar uma issue no repositório
export async function createIssue(
    organizationName: string,
    repositoryName: string,
    title: string,
    body: string,
    labels: string[],
    assignees: string[],
    type: string
): Promise<{id: string, number: number}> { // Retorna o numero da issue
    const query = `
        mutation($repositoryId: ID!, $title: String!, $body: String!) {
            createIssue(input: {repositoryId: $repositoryId, title: $title, body: $body}) {
                issue {
                    id
                    number
                }
            }
        }
    `;

    try {
        // Obtém o ID do repositório
        const repositoryId = await getRepositoryId(organizationName, repositoryName);
        console.log('ID do repositório:', repositoryId);

        // Define as variáveis para a mutação GraphQL
        const variables = {
            repositoryId,
            title,
            body: `${body}\n\n**Type:** ${type}`, // Adiciona o tipo ao corpo da issue
        };

        // Envia a mutação para criar a issue
        const response = await axiosInstance.post('', { query, variables });
        console.log('Resposta da API:', JSON.stringify(response.data, null, 2));

        // Obtém o ID e o numero da issue criada
        const issueId = response.data.data.createIssue.issue.id;
        console.log(`✅ Issue criada com ID: ${issueId}`);
        const issueNumber = response.data.data.createIssue.issue.number;
        console.log(`✅ Issue criada com number: ${issueNumber}`);

        // Adiciona labels à issue
        if (labels.length > 0) {
            await addLabelsToIssue(organizationName, repositoryName, issueId, labels);
        }

        // Adiciona assignees à issue
        if (assignees.length > 0) {
            await addAssigneesToIssue(issueNumber, assignees);
        }

        return {
            id: issueId,
            number: issueNumber // Retorna o ID da issue
            }
    } catch (error: any) {
        console.error('❌ Erro ao criar issue:', error.response?.data || error.message);
        throw error;
    }
}