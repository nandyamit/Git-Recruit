// src/api/API.tsx

// Remove the unused interface since we're handling errors differently
export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage: string;
  
  try {
    // Explicitly type the parsed response
    const parsedResponse = await response.json() as unknown;
    
    // Type guard to check if the response matches our expected error format
    if (
      typeof parsedResponse === 'object' && 
      parsedResponse !== null && 
      'message' in parsedResponse && 
      typeof (parsedResponse as { message: unknown }).message === 'string'
    ) {
      errorMessage = (parsedResponse as { message: string }).message;
    } else {
      errorMessage = response.statusText;
    }
  } catch {
    errorMessage = response.statusText;
  }

  throw new Error(`GitHub API error ${response.status}: ${errorMessage}`);
};

const getGitHubToken = (): string => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      'GitHub token not found. Please ensure:\n' +
      '1. .env file exists in project root\n' +
      '2. File contains VITE_GITHUB_TOKEN=your_token\n' +
      '3. You\'ve restarted the dev server after adding the token'
    );
  }
  return token;
};

const searchGithub = async (): Promise<GitHubUser[]> => {
  try {
    const token = getGitHubToken();
    const start = Math.floor(Math.random() * 100000000) + 1;
    
    const response = await fetch(
      `https://api.github.com/users?since=${start}`,
      {
        headers: {
          Authorization: `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
      }
    );
    
    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json() as GitHubUser[];
    return data;
  } catch (err) {
    console.error('Error fetching GitHub users:', err);
    throw err;
  }
};

const searchGithubUser = async (username: string): Promise<GitHubUser> => {
  try {
    const token = getGitHubToken();
    
    const response = await fetch(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Authorization: `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
      }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json() as GitHubUser;
    return data;
  } catch (err) {
    console.error('Error fetching GitHub user:', err);
    throw err;
  }
};

export { searchGithub, searchGithubUser };