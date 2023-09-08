const Pool = require("pg").Pool;
const pool = new Pool({
  user: "postgres",
  host: "192.168.212.17",
  database: "postgres",
  password: "Kanaad39DB",
  port: 30010,
});

// CRUD Operations for Users from Users Table
const getUsers = (request, response) => {
  pool.query("SELECT * FROM users ORDER BY id ASC", (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};
const getUserById = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query("SELECT * FROM users WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};
const loginUserByEmailPwd = async (req, res) => {
  // Extract the email and password from the request body
  const { email, password } = req.body;

  try {
    // Query the database for the user with the matching email
    const query = "SELECT * FROM users WHERE email = $1";
    const values = [email];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      // User not found
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Check if the password matches
    if (user.password === password) {
      // Password matches, login successful
      return res.json({ message: "Login successful", user: user });
    } else {
      // Password doesn't match
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    // Error occurred while accessing the database
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const createUser = (request, response) => {
  const { first_name, last_name, email, password } = request.body;
  const message = { message: 'User added with new ID' };

  // Check if the email already exists in the database
  pool.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rows.length > 0) {
      // Email already exists
      response.status(409).json({ message: 'Email already exists' });
    } else {
      // Email is unique, proceed with insertion
      pool.query(
        'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
        [first_name, last_name, email, password],
        (error, results) => {
          if (error) {
            throw error;
          }
          response.status(201).send(message);
        }
      );
    }
  });
};
const updateUser = (request, response) => {
  const id = parseInt(request.params.id);
  const { first_name, last_name, email, password } = request.body;

  pool.query(
    "UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id = $5 RETURNING *",
    [first_name, last_name, email, password, id],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`User modified with ID: ${id}`);
    }
  );
};
const deleteUser = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query(
    "DELETE FROM cards WHERE user_id = $1",
    [id],
    (error, cardDeletionResult) => {
      if (error) {
        throw error;
      }

      pool.query(
        "DELETE FROM users WHERE id = $1",
        [id],
        (error, userDeletionResult) => {
          if (error) {
            throw error;
          }
          const cardsDeletedCount = cardDeletionResult.rowCount;
          const userDeletedCount = userDeletionResult.rowCount;
          response.status(200).json({
            message: `User with ID ${id} and associated cards have been deleted.`,
            cardsDeletedAmount: cardsDeletedCount,
            userDeletedAmount: userDeletedCount,
          });
        }
      );
    }
  );
};

// CRUD Operations for Cards from Cards Table
const getUserCards = (request, response) => {
  const { id } = request.body;
  pool.query(
    "SELECT cards.* FROM cards JOIN users ON cards.user_id = users.id WHERE users.id = $1 ORDER BY id ASC",
    [id],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
};
const getCardById = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query("SELECT * FROM cards WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};
const createNewCard = (request, response) => {
  const { serial_number, cvv, expiration_date, card_type, user_id } = request.body;
  const message = { message: 'NewCard added with new ID' };

  // Check if the serial_number already exists in the database
  pool.query('SELECT * FROM cards WHERE serial_number = $1', [serial_number], (error, results) => {
    if (error) {
      throw error;
    }

    if (results.rows.length > 0) {
      // Serial number already exists
      response.status(409).json({ message: 'Serial number already exists' });
    } else {
      // Validate the serial number
      const isValidSerialNumber = /^\d{16}$/.test(serial_number);
      // Validate the CVV
      const isValidCVV = /^\d{3}$/.test(cvv);
      // Validate the expiration date
      const currentDate = new Date();
      const [inputMonth, inputYear] = expiration_date.split("/");
      const inputDate = new Date(`20${inputYear}`, inputMonth - 1);
      const isValidExpirationDate =
        /^\d{2}\/\d{2}$/.test(expiration_date) &&
        inputDate >= currentDate &&
        inputDate.getMonth() === inputMonth - 1;
      // Validate the card type
      const isValidCardType = card_type === "debit" || card_type === "credit";

      if (
        isValidSerialNumber &&
        isValidCVV &&
        isValidExpirationDate &&
        isValidCardType
      ) {
        pool.query(
          "INSERT INTO cards (serial_number, cvv, expiration_date, card_type, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [serial_number, cvv, expiration_date, card_type, user_id],
          (error, results) => {
            if (error) {
              throw error;
            }
            response.status(201).send(message);
          }
        );
      } else {
        response.status(400).json({ message: 'Invalid card details' });
      }
    }
  });
};
const updateCard = (request, response) => {
  const id = parseInt(request.params.id);
  const { serial_number, cvv, expiration_date, card_type, user_id } =
    request.body;

  pool.query(
    "UPDATE cards SET serial_number = $1, cvv = $2, expiration_date = $3, card_type = $4, user_id = $5 WHERE id = $6 RETURNING *",
    [serial_number, cvv, expiration_date, card_type, user_id, id],
    (error, results) => {
      if (error) {
        throw error;
      }
      response
        .status(200)
        .send(`Card modified with card id: ${id} from user_id: ${user_id}`);
    }
  );
};
const deleteCard = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query(
    "DELETE FROM cards WHERE id = $1",
    [id],
    (error) => {
      if (error) {
        throw error;
      }
      response.status(200).json({
        message: `Card with ID ${id} has been deleted.`});
    }
  );
};

module.exports = {
  getUsers,
  getUserById,
  loginUserByEmailPwd,
  createUser,
  updateUser,
  deleteUser,

  getUserCards,
  getCardById,
  createNewCard,
  updateCard,
  deleteCard,
};
