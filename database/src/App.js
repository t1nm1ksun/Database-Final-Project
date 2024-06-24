import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [director, setDirector] = useState('');
  const [sortOption, setSortOption] = useState('latestUpdate');
  const [results, setResults] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3307/movies')
        .then(response => {
          setResults(response.data);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Filter and sorting logic based on user input
    let filteredResults = results.filter(movie => {
      let include = true;
      if (query && !movie.titleKorean.toLowerCase().includes(query.toLowerCase())) {
        include = false;
      }
      if (director && !movie.director.toLowerCase().includes(director.toLowerCase())) {
        include = false;
      }
      if (startYear && parseInt(movie.productionYear) < startYear.getFullYear()) {
        include = false;
      }
      if (endYear && parseInt(movie.productionYear) > endYear.getFullYear()) {
        include = false;
      }
      return include;
    });

    if (sortOption === 'latestUpdate') {
      filteredResults.sort((a, b) => new Date(b.updateDate) - new Date(a.updateDate));
    } else if (sortOption === 'productionYear') {
      filteredResults.sort((a, b) => parseInt(b.productionYear) - parseInt(a.productionYear));
    } else if (sortOption === 'title') {
      filteredResults.sort((a, b) => a.titleKorean.localeCompare(b.titleKorean));
    } else if (sortOption === 'releaseDate') {
      filteredResults.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    }

    setResults(filteredResults);
  };

  const handleReset = () => {
    setQuery('');
    setStartYear(null);
    setEndYear(null);
    setDirector('');
    setSortOption('latestUpdate');
    axios.get('http://localhost:3307/movies')
        .then(response => {
          setResults(response.data);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
  };

  return (
      <div className="App">
        <header className="App-header">
          <h1>KOBIS 영화 검색</h1>
          <div className="separator"></div>
          <form onSubmit={handleSearch}>
            <div className="form-row">
              <div className="input-container">
                <h3>영화명</h3>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="영화 제목을 입력하세요"
                    aria-label="영화명 입력"
                />
              </div>
              <div className="input-container">
                <h3>감독명</h3>
                <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="감독 이름을 입력하세요"
                    aria-label="감독명 입력"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-container">
                <h3>제작 연도</h3>
                <DatePicker
                    selected={startYear}
                    dateFormat="yyyy"
                    showYearPicker
                    onChange={(date) => setStartYear(date)}
                    placeholderText="--전체--"
                    aria-label="제작 연도 시작"
                />
                <DatePicker
                    selected={endYear}
                    dateFormat="yyyy"
                    showYearPicker
                    onChange={(date) => setEndYear(date)}
                    placeholderText="--전체--"
                    aria-label="제작 연도 종료"
                />
              </div>
              <div className="input-container">
                <h3>정렬 기준</h3>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} aria-label="정렬 기준 선택">
                  <option value="latestUpdate">최근 업데이트 순</option>
                  <option value="productionYear">제작 연도</option>
                  <option value="title">영화명</option>
                  <option value="releaseDate">개봉일 순</option>
                </select>
              </div>
            </div>

            <div className="button-group">
              <button type="submit">검색</button>
              <button type="button" onClick={handleReset}>초기화</button>
            </div>
          </form>

          <div className="results">
            {results.length > 0 ? (
                <table>
                  <thead>
                  <tr>
                    <th>영화명 (한국어)</th>
                    <th>영화명 (영어)</th>
                    <th>제작 연도</th>
                    <th>제작 국가</th>
                    <th>유형</th>
                    <th>장르</th>
                    <th>제작 상태</th>
                    <th>감독</th>
                    <th>제작사</th>
                  </tr>
                  </thead>
                  <tbody>
                  {results.map((movie, index) => (
                      <tr key={index}>
                        <td>{movie.titleKorean}</td>
                        <td>{movie.titleEnglish}</td>
                        <td>{movie.productionYear}</td>
                        <td>{movie.productionCountry}</td>
                        <td>{movie.type}</td>
                        <td>{movie.genre}</td>
                        <td>{movie.productionStatus}</td>
                        <td>{movie.director}</td>
                        <td>{movie.productionCompany}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
            ) : (
                <p>검색 결과가 없습니다.</p>
            )}
          </div>
        </header>
      </div>
  );
}

export default App;
