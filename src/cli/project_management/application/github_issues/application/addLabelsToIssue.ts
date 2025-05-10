import { axiosInstance } from '../utils/axiosInstance.js';
import { getLabelIds } from './getLabelIds.js';

// Função para adicionar labels à issue
export async function addLabelsToIssue(
    organizationName: string,
    repositoryName: string,
    issueId: string,
    labels: string[]
): Promise<void> {
    try {
        // Obtém os IDs das labels
        const labelIds = await getLabelIds(organizationName, repositoryName, labels);

        const query = `
            mutation($labelableId: ID!, $labelIds: [ID!]!) {
                addLabelsToLabelable(input: {labelableId: $labelableId, labelIds: $labelIds}) {
                    labelable {
                        __typename
                    }
                }
            }
        `;

        const variables = {
            labelableId: issueId,
            labelIds,
        };

        // Envia a mutação para adicionar labels à issue
        const response = await axiosInstance.post('', { query, variables });
        console.log(`✅ Labels adicionadas à issue: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
        console.error('❌ Erro ao adicionar labels à issue:', error.response?.data || error.message);
        throw error;
    }
}