import { axiosInstance } from '../utils/axiosInstance.js';

// Função para obter os IDs das labels
export async function getLabelIds(
    organizationName: string,
    repositoryName: string,
    labels: string[]): Promise<string[]> {
    const query = `
        query($repositoryName: String!, $organization: String!) {
            repository(name: $repositoryName, owner: $organization) {
                labels(first: 100) {
                    nodes {
                        id
                        name
                    }
                }
            }
        }
    `;

    const variables = {
        repositoryName,
        organization: organizationName,
    };

    const response = await axiosInstance.post('', { query, variables });
    const allLabels = response.data.data.repository.labels.nodes;

    // Mapeia os nomes dos labels para seus respectivos IDs
    const labelIds = labels.map(label => {
        const foundLabel = allLabels.find((l: any) => l.name === label);
        if (!foundLabel) {
            throw new Error(`Label "${label}" não encontrado no repositório.`);
        }
        return foundLabel.id;
    });

    return labelIds;
}