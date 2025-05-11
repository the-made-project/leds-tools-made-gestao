import { axiosInstance } from '../utils/axiosInstance.js';

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

// Função para adicionar uma issue ao projeto
export async function addIssueToProject(
    projectId: string,
    issueId: string // Agora espera o ID da issue
): Promise<string> {
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

        return itemId;

    } catch (error: any) {
        console.error('❌ Erro ao adicionar issue ao projeto:', error.response?.data || error.message);
        throw error;
    }
}

// Função para obter o ID da organização
async function getOrganizationId(organizationName: string): Promise<string> {
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
