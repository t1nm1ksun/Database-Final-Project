import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactPaginate from 'react-paginate';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [director, setDirector] = useState('');
  const [sortOption, setSortOption] = useState('latestUpdate');
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    axios.get('http://localhost:3001/movies')
        .then(response => {
          setResults(response.data);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    // Trim whitespace from director input
    const trimmedDirector = director.trim();

    // Fetch the full dataset again before filtering
    axios.get('http://localhost:3001/movies')
        .then(response => {
          // Filter results based on search criteria
          let filteredResults = response.data.filter(movie => {
            let include = true;

            // Check for query
            if (query && movie.titleKorean && !movie.titleKorean.toLocaleLowerCase().includes(query.toLocaleLowerCase())) {
              include = false;
            }

            // Check for director
            if (trimmedDirector) {
              if (movie.directors) {
                // Check if directors is a string or an array
                if (typeof movie.directors === 'string') {
                  // Case where directors is a single string
                  if (!movie.directors.toLocaleLowerCase().includes(trimmedDirector.toLocaleLowerCase())) {
                    include = false;
                  }
                } else if (Array.isArray(movie.directors)) {
                  // Case where directors is an array of strings
                  if (!movie.directors.some(dir => dir.toLocaleLowerCase().includes(trimmedDirector.toLocaleLowerCase()))) {
                    include = false;
                  }
                }
              } else {
                // Exclude movies with empty director fields when a director is specified
                include = false;
              }
            }

            // Check for start year
            if (startYear && movie.productionYear && parseInt(movie.productionYear) < startYear.getFullYear()) {
              include = false;
            }

            // Check for end year
            if (endYear && movie.productionYear && parseInt(movie.productionYear) > endYear.getFullYear()) {
              include = false;
            }

            return include;
          });

          // Sort filtered results based on sortOption
          if (sortOption === 'latestUpdate') {
            filteredResults.sort((a, b) => new Date(b.updateDate) - new Date(a.updateDate));
          } else if (sortOption === 'productionYear') {
            filteredResults.sort((a, b) => parseInt(b.productionYear) - parseInt(a.productionYear));
          } else if (sortOption === 'title') {
            filteredResults.sort((a, b) => a.titleKorean.localeCompare(b.titleKorean));
          } else if (sortOption === 'releaseDate') {
            filteredResults.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
          }

          // Update state with filtered and sorted results
          setResults(filteredResults);
          setCurrentPage(0); // Move to the first page after filtering
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
  };




  const handleReset = () => {
    setQuery('');
    setStartYear(null);
    setEndYear(null);
    setDirector('');
    setSortOption('latestUpdate');
    axios.get('http://localhost:3001/movies')
        .then(response => {
          setResults(response.data);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    setCurrentPage(0); // Move to the first page after resetting
  };


  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const offset = currentPage * itemsPerPage;
  const displayResults = results.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(results.length / itemsPerPage);

  const handleFirstPage = () => setCurrentPage(0);
  const handleLastPage = () => setCurrentPage(pageCount - 1);

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
            {displayResults.length > 0 ? (
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
                  {displayResults.map((movie, index) => (
                      <tr key={index}>
                        <td>{movie.titleKorean}</td>
                        <td>{movie.titleEnglish}</td>
                        <td>{movie.productionYear}</td>
                        <td>{movie.productionCountry}</td>
                        <td>{movie.type}</td>
                        <td>{movie.genre}</td>
                        <td>{movie.productionStatus}</td>
                        <td>{Array.isArray(movie.directors) ? movie.directors.join(', ') : movie.directors}</td> {/* Display directors */}
                        <td>{movie.productionCompany}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
            ) : (
                <p>검색 결과가 없습니다.</p>
            )}
          </div>

          <div className="pagination-container">
            <button onClick={handleFirstPage}>&lt;&lt;</button>
            <ReactPaginate
                previousLabel={'<'}
                nextLabel={'>'}
                breakLabel={''}
                pageCount={pageCount}
                marginPagesDisplayed={0}
                pageRangeDisplayed={10}
                onPageChange={handlePageClick}
                containerClassName={'pagination'}
                pageClassName={'page-item'}
                pageLinkClassName={'page-link'}
                activeClassName={'active'}
                activeLinkClassName={'active-link'}
                disabledClassName={'disabled'}
                previousClassName={'prev'}
                nextClassName={'next'}
                previousLinkClassName={'prev-link'}
                nextLinkClassName={'next-link'}
                breakClassName={'break-me'}
                breakLinkClassName={'break-link'}
                renderOnZeroPageCount={null}
                forcePage={currentPage}
            />
            <button onClick={handleLastPage}>&gt;&gt;</button>
          </div>
        </header>
      </div>
  );
}

export default App;
