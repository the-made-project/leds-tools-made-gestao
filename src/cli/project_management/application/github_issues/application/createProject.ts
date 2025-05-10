import { axiosInstance } from '../utils/axiosInstance.js';
import { getOrganizationId } from './getOrganizationId.js';

/// Função para criar um projeto na organização
export async function createProject(organization: string, projectTitle: string): Promise<string> {
    const query = `
        mutation($organizationId: ID!, $title: String!) {
            createProjectV2(input: {ownerId: $organizationId, title: $title}) {
                projectV2 {
                    id
                }
            }
        }
    `;

    try {
        // Obtém o ID da organização
        const organizationId = await getOrganizationId(organization);
        console.log('ID da organização:', organizationId);

        // Define as variáveis para a mutação GraphQL
        const variables = {
            organizationId,
            title: projectTitle,
        };

        console.log('Enviando mutação para criar projeto...');

        // Envia a mutação para criar o projeto
        const response = await axiosInstance.post('', { query, variables });
        console.log('Resposta da API:', JSON.stringify(response.data, null, 2));

        // Obtém o ID do projeto criado
        const projectId = response.data.data.createProjectV2.projectV2.id;
        console.log(`✅ Projeto criado com ID: ${projectId}`);
        return projectId;

    } catch (error: any) {
        console.error('❌ Erro ao criar projeto:', error.response?.data || error.message);
        throw error;
    }
}