import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Arena.css';

const Arena = () => {
  const [theme, setTheme] = useState('light');
  const [sortBy, setSortBy] = useState('ProblemID');
  const [sortOrder, setSortOrder] = useState('asc');
  const [problems, setProblems] = useState([]);

  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    ProblemName: '',
    ProblemStatement: '',
    ProblemDifficulty: 'Easy',
    ProblemTestCasesInput: '',
    ProblemTestCasesOutput: '',
    ProblemHiddenTestCasesInput: '',
    ProblemHiddenTestCasesOutput: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch problems when component mounts
    const fetchProblems = async () => {
      try {
        const response = await fetch('http://localhost:3333/problems');
        if (response.ok) {
          const data = await response.json();
          setProblems(data);
        } else {
          console.error('Failed to fetch problems');
        }
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };
    fetchProblems();
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSortChange = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleGotoChange = (e) => {
    const path = e.target.value;
    navigate(`/${path}`);
  };

  const handleUploadProblemClick = () => {
    setFormVisible(true);
  };

  const handleCancelClick = () => {
    setFormVisible(false);
    setFormData({
      ProblemName: '',
      ProblemStatement: '',
      ProblemDifficulty: 'Easy',
      ProblemTestCasesInput: '',
      ProblemTestCasesOutput: '',
      ProblemHiddenTestCasesInput: '',
      ProblemHiddenTestCasesOutput: '',
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Send formData to your API here
    try {
      const response = await fetch('http://localhost:3333/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newProblem = await response.json();
        setProblems([...problems, newProblem]);
        handleCancelClick(); // Close the form and reset data
      } else {
        console.error('Failed to upload problem');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleProblemNameClick = (problemID) => {
    navigate(`/problempage/${problemID}`);
  };

  const difficultyOrder = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
  };

  const sortedProblems = [...problems].sort((a, b) => {
    const compareA = sortBy === 'ProblemID' ? a.ProblemID : difficultyOrder[a.ProblemDifficulty];
    const compareB = sortBy === 'ProblemID' ? b.ProblemID : difficultyOrder[b.ProblemDifficulty];
    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  return (
    <div className={`arena-container ${theme}`}>
      <div className="top-bar">
        <p>Problems</p>
        <button className="button" onClick={handleUploadProblemClick}>Upload Problem</button>
        <div className="title">SAHAS_CODE_ARENA</div>
        <select className="goto-dropdown" onChange={handleGotoChange}>
          <option value="">Go to...</option>
          <option value="playground">Playground</option>
          <option value="battleground">Battleground</option>
        </select>
        <button className="theme-toggle" onClick={handleThemeToggle}>
          {theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
        </button>
      </div>
      {formVisible && (
        <div className="upload-form-container">
          <form onSubmit={handleFormSubmit} className="upload-form">
            <h3>Upload Problem</h3>
            <label>
              Problem Name:
              <input
                type="text"
                name="ProblemName"
                value={formData.ProblemName}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Problem Statement:
              <textarea
                name="ProblemStatement"
                value={formData.ProblemStatement}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Problem Difficulty:
              <select
                name="ProblemDifficulty"
                value={formData.ProblemDifficulty}
                onChange={handleFormChange}
                required
              >
                <option value="">Select Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
            <label>
              Test Cases Input:
              <textarea
                name="ProblemTestCasesInput"
                value={formData.ProblemTestCasesInput}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Test Cases Output:
              <textarea
                name="ProblemTestCasesOutput"
                value={formData.ProblemTestCasesOutput}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Hidden Test Cases Input:
              <textarea
                name="ProblemHiddenTestCasesInput"
                value={formData.ProblemHiddenTestCasesInput}
                onChange={handleFormChange}
                required
              />
            </label>
            <label>
              Hidden Test Cases Output:
              <textarea
                name="ProblemHiddenTestCasesOutput"
                value={formData.ProblemHiddenTestCasesOutput}
                onChange={handleFormChange}
                required
              />
            </label>
            <div className="form-buttons">
              <button type="button" onClick={handleCancelClick}>Cancel</button>
              <button type="submit">Upload</button>
            </div>
          </form>
        </div>
      )}

      <div className='table'>
      <table className="problems-table">
        <thead>
          <tr>
            <th onClick={() => handleSortChange('ProblemID')}>
              Problem ID {sortBy === 'ProblemID' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Problem Name</th>
            <th onClick={() => handleSortChange('ProblemDifficulty')}>
              Difficulty {sortBy === 'ProblemDifficulty' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedProblems.map((problem, index) => (
            <tr key={problem.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
              <td>{problem.ProblemID}</td>
              <td className='problem-name-coloumn'><a 
                    className="problem-name"
                    onClick={() => handleProblemNameClick(problem.ProblemID)}
                  >
                    {problem.ProblemName}
                  </a>
                  </td>
              <td>{problem.ProblemDifficulty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default Arena;
