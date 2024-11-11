// src/pages/CandidateSearch.tsx
import { useState, useEffect, useCallback } from 'react';
import { searchGithub, searchGithubUser } from '../api/API';
import { GitHubUser } from '../api/API';
import { delay } from '../utils/delay';

interface BasicGitHubUser {
  id: number;
  login: string;
}

const isGitHubUser = (obj: unknown): obj is GitHubUser => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'login' in obj &&
    'avatar_url' in obj &&
    typeof (obj as GitHubUser).id === 'number' &&
    typeof (obj as GitHubUser).login === 'string' &&
    typeof (obj as GitHubUser).avatar_url === 'string'
  );
};

const parseSavedCandidates = (savedData: string | null): GitHubUser[] => {
  try {
    if (!savedData) return [];
    
    const parsed: unknown = JSON.parse(savedData);
    
    if (!Array.isArray(parsed)) {
      console.error('Saved candidates data is not an array');
      return [];
    }

    const validCandidates = parsed.filter(isGitHubUser);
    
    if (validCandidates.length !== parsed.length) {
      console.warn('Some saved candidates were invalid and have been filtered out');
    }

    return validCandidates;
  } catch (error) {
    console.error('Error parsing saved candidates:', error);
    return [];
  }
};

const CandidateSearch = () => {
  const [currentCandidate, setCurrentCandidate] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIndex, setUserIndex] = useState<number>(0);
  const [usersList, setUsersList] = useState<BasicGitHubUser[]>([]);

  const fetchNewUsers = useCallback(async () => {
    try {
      await delay(5000); // 5 second delay between batches
      const users = await searchGithub();
      if (Array.isArray(users) && users.length > 0) {
        const typedUsers = users as BasicGitHubUser[];
        setUsersList(typedUsers);
        setUserIndex(0);
        return typedUsers;
      }
      throw new Error('No users available');
    } catch (err) {
      if (err instanceof Error && err.message.includes('rate limit')) {
        throw new Error('Please wait a few minutes before trying again - API rate limit reached.');
      }
      console.error('Error fetching users:', err);
      throw err;
    }
  }, []);

  const isValidCandidate = useCallback((candidate: GitHubUser): boolean => {
    return Boolean(
      candidate.avatar_url && 
      !candidate.avatar_url.includes('missing') &&
      candidate.avatar_url.startsWith('https://')
    );
  }, []);

  const loadNextCandidate = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let users = usersList;
      
      if (userIndex >= usersList.length) {
        users = await fetchNewUsers();
      }

      while (userIndex < users.length) {
        try {
          await delay(2000); // 2 second delay between user requests
          const userDetails = await searchGithubUser(users[userIndex].login);
          
          if (isValidCandidate(userDetails)) {
            setCurrentCandidate(userDetails);
            setUserIndex(prev => prev + 1);
            return;
          } else {
            console.log(`Skipping user ${users[userIndex].login} - No valid image`);
            setUserIndex(prev => prev + 1);
            continue;
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes('rate limit')) {
            throw new Error('Please wait a few minutes before trying again - API rate limit reached.');
          }
          console.log(`Skipping invalid user: ${users[userIndex].login}`);
          setUserIndex(prev => prev + 1);
          continue;
        }
      }

      throw new Error('No valid candidates found. Try again.');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading candidate');
      setCurrentCandidate(null);
    } finally {
      setLoading(false);
    }
  }, [userIndex, usersList, fetchNewUsers, isValidCandidate]);

  const saveCandidate = useCallback(() => {
    if (!currentCandidate || !isGitHubUser(currentCandidate)) {
      console.error('Invalid current candidate');
      return;
    }

    try {
      const savedData = localStorage.getItem('savedCandidates');
      const savedCandidates = parseSavedCandidates(savedData);
      
      if (!savedCandidates.some(candidate => candidate.id === currentCandidate.id)) {
        const updatedCandidates = [...savedCandidates, currentCandidate];
        
        if (updatedCandidates.every(isGitHubUser)) {
          localStorage.setItem('savedCandidates', JSON.stringify(updatedCandidates));
        } else {
          throw new Error('Invalid candidate data detected');
        }
      }

      void loadNextCandidate();
    } catch (error) {
      console.error('Error saving candidate:', error);
    }
  }, [currentCandidate, loadNextCandidate]);

  useEffect(() => {
    void loadNextCandidate();
  }, [loadNextCandidate]);

  const handleLoadNext = useCallback(() => {
    void loadNextCandidate();
  }, [loadNextCandidate]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="error-message">
          <p>{error}</p>
          <button
            onClick={handleLoadNext}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {currentCandidate ? (
        <div className="candidate-card">
          <div className="flex items-center gap-6 mb-6">
            <img 
              src={currentCandidate.avatar_url} 
              alt={currentCandidate.login}
              className="w-32 h-32 rounded-full border-4 border-white/10"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                console.log(`Image load error for ${target.src} - skipping to next candidate`);
                void loadNextCandidate();
              }}
            />
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {currentCandidate.name || currentCandidate.login}
              </h2>
              <div className="space-y-1 text-white/80">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">GitHub:</span>
                  <a 
                    href={currentCandidate.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    @{currentCandidate.login}
                  </a>
                </p>
                <p><span className="font-semibold">ID:</span> {currentCandidate.id}</p>
                {currentCandidate.location && (
                  <p><span className="font-semibold">Location:</span> {currentCandidate.location}</p>
                )}
                {currentCandidate.email && (
                  <p><span className="font-semibold">Email:</span> {currentCandidate.email}</p>
                )}
                {currentCandidate.company && (
                  <p><span className="font-semibold">Company:</span> {currentCandidate.company}</p>
                )}
              </div>
            </div>
          </div>
          
          {currentCandidate.bio && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Bio</h3>
              <p className="text-white/80">{currentCandidate.bio}</p>
            </div>
          )}

          <div className="flex justify-center items-center mt-8">
            <button
              onClick={handleLoadNext}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white text-5xl font-bold flex items-center justify-center transition-all duration-300 mx-20"
              aria-label="Skip candidate"
            >
              −
            </button>
            <button
              onClick={saveCandidate}
              className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white text-5xl font-bold flex items-center justify-center transition-all duration-300 mx-20"
              aria-label="Save candidate"
            >
              +
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-xl">
          <p>No more candidates available</p>
          <button
            onClick={handleLoadNext}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;