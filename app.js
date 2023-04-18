const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
moviesDBPath = path.join(__dirname, "moviesData.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: moviesDBPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dataBaseObject) => {
  return {
    movieName: dataBaseObject.movie_name,
  };
};

const convertDbObjectToResponseObjectDirector = (dataBaseObject) => {
  return {
    directorId: dataBaseObject.director_id,
    directorName: dataBaseObject.director_name,
  };
};

const forEachMovieConversion = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

// 1 -  Returns a list of all movie names in the movie table
app.get("/movies/", async (request, response) => {
  const listOfAllMoviesQuery = `
        SELECT * FROM movie
        ORDER BY movie_id;
    `;
  const listOfAllMoviesArray = await db.all(listOfAllMoviesQuery);
  // response.send(listOfAllMoviesArray);
  response.send(
    listOfAllMoviesArray.map((eachMovie) =>
      convertDbObjectToResponseObject(eachMovie)
    )
  );
});

// 2 - Creates a new movie in the movie table. movie_id is auto-incremented
app.post("/movies/", async (request, response) => {
  const movieTableRequestBody = request.body;
  const { directorId, movieName, leadActor } = movieTableRequestBody;
  const postMovieQuery = `
        INSERT INTO 
        movie
        (director_id, movie_name, lead_actor)
        VALUES(
            '${directorId}',
            '${movieName}',
            '${leadActor}'
        )
    `;
  await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

// 3 - Returns a movie based on the movie ID
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getAMovieQuery = `
    SELECT * FROM movie
    WHERE movie_id = ${movieId};
  `;
  const aMovieArray = await db.get(getAMovieQuery);
  response.send(forEachMovieConversion(aMovieArray));
});

// 4 - Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const updateMovieBody = request.body;
  const { directorId, movieName, leadActor } = updateMovieBody;
  const updateMovieDetailsQuery = `
        UPDATE 
        movie
        SET 
        director_id = '${directorId}',
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
        WHERE
        movie_id = ${movieId}
    `;
  await db.run(updateMovieDetailsQuery);
  response.send("Movie Details Updated");
});

// 5 - Deletes a movie from the movie table based on the movie ID
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE 
        FROM
        MOVIE
        WHERE movie_id = ${movieId}
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

// 6 - Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getAllDirectorsQuery = `
        SELECT * FROM director
        ORDER BY director_id;
    `;
  const directorsArray = await db.all(getAllDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDbObjectToResponseObjectDirector(eachDirector)
    )
  );
});

// 7 - Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesOfDirectorQuery = `
        SELECT * FROM movie
        NATURAL JOIN director
        WHERE movie.director_id = ${directorId};
    `;
  const listOfDirectorMoviesArray = await db.all(getMoviesOfDirectorQuery);
  response.send(
    listOfDirectorMoviesArray.map((eachMovie) =>
      convertDbObjectToResponseObject(eachMovie)
    )
  );
});

module.exports = app;
