import React, { useEffect,useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use'; 
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm,setSearchTerm] = useState('');
  const [errorMsg,setErrorMsg] = useState('')
  const [movieList,setMovieList] = useState([]);
  const [trendingMovies,setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])
    
  const fetchMovies = async(query = '') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const endpoint = 
        query 
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);
      
      if (!response.ok) {
        throw new Error('Failed to Fetch Movies')
      }

      const data = await response.json();

      if (data.response == 'False'){
        setErrorMsg(data.Error || 'Failed to Fetch Movies')
        setMocvieList([]);
        return
      } 

      setMovieList(data.results || []);

      if (query && data.results.length > 0){
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching Movies: ${error}`);
      setErrorMsg('Error Fetching Movies, Please Try Again Later.');
    }

    finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }
  
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  },[searchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  },[]);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner"/>
          <h1>Free <span className="text-gradient">Movies</span> to your Heart's Content</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>

        {trendingMovies.length > 0 && (
          <section className = "trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title}/>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner/>
          ) : errorMsg ? ( 
            <p className='text-red-500'>{errorMsg}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
        
      </div>
    </main>
  )
}

export default App