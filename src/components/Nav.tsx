// src/components/Nav.tsx
import { Link, useLocation } from 'react-router-dom';

const Nav = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Candidate Search Application</h1>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/SavedCandidates" 
            className={`nav-link ${location.pathname === '/SavedCandidates' ? 'active' : ''}`}
          >
            Potential Candidates
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;