import { axiosInstance } from '../utils/axiosInstance.js';
import { getRepositoryId } from './createProject.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

if (!GITHUB_TOKEN) {
    throw new Error('❌ GITHUB_TOKEN não está definido. Configure-o como uma variável de ambiente.');
}
// Função para criar uma issue no repositório
export async function createIssue(
    organizationName: string,
    repositoryName: string,
    title: string,
    body: string,
    labels: string[],
    assignees: string[]
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
            body,
        };

        // Envia a mutação para criar a issue
        const response = await axiosInstance.post('', { query, variables });
        console.log('Resposta da API:', JSON.stringify(response.data, null, 2));

        // Verifica se a resposta contém os dados esperados
        if (!response.data || !response.data.data || !response.data.data.createIssue || !response.data.data.createIssue.issue) {
            throw new Error('❌ A resposta da API não contém os dados esperados. Verifique o issueTypeId ou outros parâmetros.');
        }

        // Obtém o ID e o numero da issue criada
        const issueId = response.data.data.createIssue.issue.id;
        console.log(`✅ Issue criada com ID: ${issueId}`);

        const issueNumber = response.data.data.createIssue.issue.number;
        console.log(`✅ Issue criada com number: ${issueNumber}`);

        // Adiciona labels à issue
        if (labels.length > 0) {
            await addLabelsToIssue(organizationName, repositoryName, issueId, labels);
        }

        //Adiciona assignees à issue
        if (assignees.length > 0) {
            await addAssigneesToIssue(repositoryName, organizationName, issueNumber, assignees);
        }

        return {
            id: issueId,
            number: issueNumber
            }
    } catch (error: any) {
        console.error('❌ Erro ao criar issue:', error.response?.data || error.message);
        throw error;
    }
}
/* FIXME: Function isn't being able to acess the project fields
// Function converts the field name and option name to their respective IDs
// and updates the issue with the selected option
export async function addFieldToIssue(
    projectId: string,
    itemId: string,
    fieldName: string,
    optionName: string
  ): Promise<void> {
    // Step 1: Fetch all fields for the project
    const fetchFieldsQuery = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            fields(first: 50) {
              nodes {
                id
                name
                __typename
                ... on ProjectV2SingleSelectField {
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;
  
    const fieldsResponse = await axiosInstance.post('', {
      query: fetchFieldsQuery,
      variables: { projectId },
    });
  
    const fields = fieldsResponse.data?.data?.node?.fields?.nodes;
    if (!fields) {
      throw new Error('❌ Could not retrieve project fields.');
    }
  
    // Step 2: Find the target field by name
    const targetField = fields.find(
      (f: any) => f.name.toLowerCase() === fieldName.toLowerCase()
    );
  
    if (!targetField) {
      throw new Error(`❌ Field "${fieldName}" not found.`);
    }
  
    if (targetField.__typename !== 'ProjectV2SingleSelectField') {
      throw new Error(`❌ Field "${fieldName}" is not a single select field.`);
    }
  
    // Step 3: Find the option by name
    const targetOption = targetField.options.find(
      (opt: any) => opt.name.toLowerCase() === optionName.toLowerCase()
    );
  
    if (!targetOption) {
      throw new Error(`❌ Option "${optionName}" not found in field "${fieldName}".`);
    }
  
    // Step 4: Update the item with the correct field + option
    const mutation = `
      mutation(
        $projectId: ID!,
        $itemId: ID!,
        $fieldId: ID!,
        $optionId: String!
      ) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: {
            singleSelectOptionId: $optionId
          }
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;
  
    const variables = {
      projectId,
      itemId,
      fieldId: targetField.id,
      optionId: targetOption.id,
    };
  
    const updateResponse = await axiosInstance.post('', {
      query: mutation,
      variables,
    });
  
    if (updateResponse.data.errors) {
      throw new Error(`❌ Failed to update field "${fieldName}": ${JSON.stringify(updateResponse.data.errors)}`);
    }
  
    console.log(`✅ Field "${fieldName}" set to "${optionName}" for item ${itemId}`);
  }
*/

// Função para adicionar assignees à issue
async function addAssigneesToIssue(
    repositoryName: string,
    organizationName: string,
    issueNumber: number,
    assignees: string[]
): Promise<void> {
    const url = `https://api.github.com/repos/${organizationName}/${repositoryName}/issues/${issueNumber}/assignees`;

    const data = {
        assignees,
    };

    try {
        console.log('URL da API REST:', url);
        console.log('Assignees:', assignees);
        console.log('issueNumber:', issueNumber);

        const response = await axiosInstance.post(url, data, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`✅ Resposta da API: ${JSON.stringify(response.data)}`);
        console.log(`✅ Assignees adicionados com sucesso: ${response.data.assignees}`);
    } catch (error: any) {
        console.error('❌ Erro ao adicionar assignees:', error.response?.data || error.message);
        throw error;
    }
}

// Função para adicionar labels à issue
async function addLabelsToIssue(
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

// Função para obter os IDs das labels
async function getLabelIds(
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