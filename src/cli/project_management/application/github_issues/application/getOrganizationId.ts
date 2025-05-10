import { axiosInstance } from '../utils/axiosInstance.js';

// Função para obter o ID da organização
export async function getOrganizationId(organizationName: string): Promise<string> {
    const query = `
        query($organizationName: String!) {
            organization(login: $organizationName) {
                id
            }
        }
    `;

    // Define as variáveis para a query GraphQL
    const variables = {
        organizationName,
    };

    try {
        // Envia a query para obter o ID da organização
        const response = await axiosInstance.post('', { query, variables });
        const organizationId = response.data.data.organization.id;
        console.log(`✅ ID da organização obtido: ${organizationId}`);
        return organizationId;
    } catch (error: any) {
        console.error('❌ Erro ao obter o ID da organização:', error.response?.data || error.message);
        throw error;
    }
}