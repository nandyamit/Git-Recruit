// src/pages/SavedCandidates.tsx
import { useState, useEffect, useCallback } from 'react';
import { GitHubUser } from '../api/API';

type SortField = 'name' | 'location' | 'company';
type SortDirection = 'asc' | 'desc';

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

const SavedCandidates = () => {
  const [savedCandidates, setSavedCandidates] = useState<GitHubUser[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<GitHubUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const saved = parseSavedCandidates(localStorage.getItem('savedCandidates'));
    setSavedCandidates(saved);
    setFilteredCandidates(saved);
  }, []);

  const removeCandidate = useCallback((id: number) => {
    try {
      const updatedCandidates = savedCandidates.filter(candidate => candidate.id !== id);
      localStorage.setItem('savedCandidates', JSON.stringify(updatedCandidates));
      setSavedCandidates(updatedCandidates);
      setFilteredCandidates(prevFiltered => 
        prevFiltered.filter(candidate => candidate.id !== id)
      );
    } catch (error) {
      console.error('Error removing candidate:', error);
    }
  }, [savedCandidates]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredCandidates(savedCandidates);
      return;
    }
    
    const searchValue = value.toLowerCase();
    const filtered = savedCandidates.filter(candidate => 
      candidate.name?.toLowerCase().includes(searchValue) ||
      candidate.login.toLowerCase().includes(searchValue) ||
      candidate.location?.toLowerCase().includes(searchValue) ||
      candidate.company?.toLowerCase().includes(searchValue) ||
      candidate.email?.toLowerCase().includes(searchValue) ||
      candidate.bio?.toLowerCase().includes(searchValue)
    );
    setFilteredCandidates(filtered);
  }, [savedCandidates]);

  const handleSort = useCallback((field: SortField) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...filteredCandidates].sort((a, b) => {
      const aValue = (a[field] || '').toLowerCase();
      const bValue = (b[field] || '').toLowerCase();

      if (newDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredCandidates(sorted);
  }, [filteredCandidates, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (savedCandidates.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Saved Candidates</h1>
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <p className="text-white/80">No candidates have been saved yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center w-full mb-8">
        <h1 className="text-2xl font-bold mb-6">Saved Candidates ({filteredCandidates.length})</h1>
        
        <div className="w-[600px] mx-auto">
          <div className="relative w-full search-container">
            <input
              type="text"
              placeholder="Search candidates by username..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-6 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-white/40 text-white text-lg search-input"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white/5 rounded-lg">
          <thead className="bg-white/10">
            <tr>
              <th className="px-6 py-4 text-left cursor-pointer hover:bg-white/5" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  Profile {getSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-4 text-left">GitHub Info</th>
              <th className="px-6 py-4 text-left cursor-pointer hover:bg-white/5" onClick={() => handleSort('location')}>
                <div className="flex items-center gap-2">
                  Location {getSortIcon('location')}
                </div>
              </th>
              <th className="px-6 py-4 text-left">Contact</th>
              <th className="px-6 py-4 text-left cursor-pointer hover:bg-white/5" onClick={() => handleSort('company')}>
                <div className="flex items-center gap-2">
                  Company {getSortIcon('company')}
                </div>
              </th>
              <th className="px-6 py-4 text-left">Bio</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate) => (
              <tr 
                key={candidate.id} 
                className="border-t border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={candidate.avatar_url} 
                      alt={candidate.login}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-semibold">{candidate.name || candidate.login}</div>
                      <div className="text-sm text-white/60">ID: {candidate.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <a 
                    href={candidate.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    @{candidate.login}
                  </a>
                </td>
                <td className="px-6 py-4">
                  {candidate.location || 'Not specified'}
                </td>
                <td className="px-6 py-4">
                  {candidate.email || 'Not available'}
                </td>
                <td className="px-6 py-4">
                  {candidate.company || 'Not specified'}
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs overflow-hidden text-ellipsis">
                    {candidate.bio ? (
                      <div className="text-sm text-white/80 line-clamp-2" title={candidate.bio}>
                        {candidate.bio}
                      </div>
                    ) : (
                      <span className="text-white/60">No bio available</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => removeCandidate(candidate.id)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                    aria-label="Remove candidate"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SavedCandidates;