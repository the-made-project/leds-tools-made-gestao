import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const ORGANIZATION = process.env.ORGANIZATION || '';
const REPOSITORY_NAME = process.env.REPOSITORY_NAME || '';

if (!GITHUB_TOKEN) {
    throw new Error('❌ GITHUB_TOKEN não está definido. Configure-o como uma variável de ambiente.');
}

console.log('Organização:', ORGANIZATION);
console.log('Repositório:', REPOSITORY_NAME);

// Função para adicionar assignees à issue
export async function addAssigneesToIssue(
    issueNumber: number,
    assignees: string[]
): Promise<void> {
    const url = `https://api.github.com/repos/${ORGANIZATION}/${REPOSITORY_NAME}/issues/${issueNumber}/assignees`;

    const data = {
        assignees,
    };

    try {
        console.log('URL da API REST:', url);
        console.log('Assignees:', assignees);
        console.log('issueNumber:', issueNumber);

        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`✅ Assignees adicionados à issue: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
        console.error('❌ Erro ao adicionar assignees:', error.response?.data || error.message);
        throw error;
    }
}