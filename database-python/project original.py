import numpy as np
import pandas as pd

from db_conn import *

movie_tbl = "database_final_project.movie"
genre_tbl = "database_final_project.genre"
director_tbl = "database_final_project.director"
movie_director_tbl = "database_final_project.movie_director"

insert_movie_query = f"""INSERT INTO {movie_tbl} (title, eng_title, year, country, m_type, status, company)
                         VALUES (%s, %s, %s, %s, %s, %s, %s);"""
insert_genre_query = f"""INSERT INTO {genre_tbl} (movie_id, genre) VALUES (%s, %s);"""
insert_director_query = f"""INSERT INTO {director_tbl} (name) VALUES (%s);"""
insert_movie_director_query = f"""INSERT INTO {movie_director_tbl} (movie_id, director_id) VALUES (%s, %s);"""
get_last_movie_id_query = f"""SELECT MAX(id) as id FROM {movie_tbl};"""
get_last_director_id_query = f"""SELECT MAX(id) as id FROM {director_tbl};"""


def import_excel_to_mysql():
    excel_file_path = "movie_list.xls"

    conn, cur = open_db()

    movie_data = pd.read_excel(excel_file_path, sheet_name="영화정보 리스트", skiprows=4)
    movie_data_additional = pd.read_excel(excel_file_path, sheet_name="영화정보 리스트_2", header=None)

    setup_query = f"""
        DROP TABLE IF EXISTS {movie_director_tbl};
        DROP TABLE IF EXISTS {director_tbl};
        DROP TABLE IF EXISTS {genre_tbl};
        DROP TABLE IF EXISTS {movie_tbl};

        CREATE TABLE {movie_tbl} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(500),
            eng_title VARCHAR(500),
            year INT,
            country VARCHAR(100),
            m_type VARCHAR(10),
            status VARCHAR(30),
            company VARCHAR(200)
        );

        CREATE TABLE {genre_tbl} (
            movie_id INT,
            FOREIGN KEY (movie_id) REFERENCES {movie_tbl}(id),
            genre VARCHAR(100)
        );

        CREATE TABLE {director_tbl} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(250)
        );

        CREATE TABLE {movie_director_tbl} (
            movie_id INT,
            director_id INT,
            FOREIGN KEY (movie_id) REFERENCES {movie_tbl}(id),
            FOREIGN KEY (director_id) REFERENCES {director_tbl}(id)
        );

        CREATE INDEX idx_movie_id ON {genre_tbl}(movie_id);
        CREATE INDEX idx_year ON {movie_tbl}(year);
        CREATE FULLTEXT INDEX idx_title ON {movie_tbl}(title);
        CREATE FULLTEXT INDEX idx_name ON {director_tbl}(name);
    """

    cur.execute(setup_query)
    conn.commit()

    movie_data = movie_data.replace({np.nan: None})
    movie_data_additional = movie_data_additional.replace({np.nan: None})

    data_frames = [movie_data, movie_data_additional]

    movie_entries = []
    director_entries = []
    genre_entries = []

    for data_frame in data_frames:
        for _, row in data_frame.iterrows():
            title, eng_title, year, country, m_type, genre, status, directors, company = tuple(row)

            movie_entries.append((title, eng_title, year, country, m_type, status, company))
            director_entries.append(directors)
            genre_entries.append(genre)

    # Insert movies
    cur.executemany(insert_movie_query, movie_entries)
    print(f"{len(movie_entries)} movies inserted")

    # Get last inserted movie ID
    cur.execute(get_last_movie_id_query)
    last_movie_id = cur.fetchone()["id"]
    first_movie_id = last_movie_id - len(movie_entries) + 1

    # Prepare and insert genres
    genre_entries = [(movie_id, genre_entries[movie_id - first_movie_id]) for movie_id in
                     range(first_movie_id, last_movie_id + 1) if genre_entries[movie_id - first_movie_id] is not None]
    cur.executemany(insert_genre_query, genre_entries)
    print(f"{len(genre_entries)} genres inserted")

    # Prepare and insert unique directors
    unique_directors = list(
        {director.strip() for directors in director_entries if directors for director in directors.split(",")})
    cur.executemany(insert_director_query, [(director,) for director in unique_directors])
    conn.commit()
    print(f"{len(unique_directors)} directors inserted")

    # Get last inserted director ID
    cur.execute(get_last_director_id_query)
    last_director_id = cur.fetchone()["id"]
    first_director_id = last_director_id - len(unique_directors) + 1

    director_id_map = {unique_directors[i]: first_director_id + i for i in range(len(unique_directors))}

    # Prepare and insert movie-director relations
    movie_director_entries = []
    for movie_id in range(first_movie_id, last_movie_id + 1):
        if director_entries[movie_id - first_movie_id] is not None:
            for director in director_entries[movie_id - first_movie_id].split(","):
                movie_director_entries.append((movie_id, director_id_map[director.strip()]))

    cur.executemany(insert_movie_director_query, movie_director_entries)
    print(f"{len(movie_director_entries)} movie-director relations inserted")

    conn.commit()
    close_db(conn, cur)


if __name__ == '__main__':
    import_excel_to_mysql()
