import { axiosInstance } from '../utils/axiosInstance.js';

// Função para obter o ID do repositório
export async function getRepositoryId(organizationName: string, repositoryName: string): Promise<string> {
    const query = `
        query($organization: String!, $repositoryName: String!) {
            organization(login: $organization) {
                repository(name: $repositoryName) {
                    id
                }
            }
        }
    `;

    // Define as variáveis para a query GraphQL
    const variables = {
        organization: organizationName,
        repositoryName,
    };

    try {
        // Envia a query para obter o ID do repositório
        const response = await axiosInstance.post('', { query, variables });
        const repositoryId = response.data.data.organization.repository.id;
        console.log(`✅ ID do repositório obtido: ${repositoryId}`);
        return repositoryId;
    } catch (error: any) {
        console.error('❌ Erro ao obter o ID do repositório:', error.response?.data || error.message);
        throw error;
    }
}