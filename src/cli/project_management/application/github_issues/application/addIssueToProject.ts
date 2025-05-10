import { axiosInstance } from '../utils/axiosInstance.js';

// Função para adicionar uma issue ao projeto
export async function addIssueToProject(
    projectId: string,
    issueId: string // Agora espera o ID da issue
): Promise<void> {
    const query = `
        mutation($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                item {
                    id
                }
            }
        }
    `;

    const variables = {
        projectId,
        contentId: issueId, // Passa o ID da issue
    };

    try {
        console.log('Adicionando issue ao projeto...');
        console.log('Project ID:', projectId);
        console.log('Content ID (Issue ID):', issueId);

        const response = await axiosInstance.post('', { query, variables });
        console.log('Resposta da API:', JSON.stringify(response.data, null, 2));

        const itemId = response.data.data.addProjectV2ItemById.item.id;
        console.log(`✅ Issue adicionada ao projeto: ${itemId}`);
    } catch (error: any) {
        console.error('❌ Erro ao adicionar issue ao projeto:', error.response?.data || error.message);
        throw error;
    }
}