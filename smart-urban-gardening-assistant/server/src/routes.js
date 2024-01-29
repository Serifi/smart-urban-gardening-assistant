const express = require('express')
const pool = require('./config/database').promise()
const router = express.Router()

//Login ==================================================================================================================================
router.post('/login', (req, res) => {
  const { name, password } = req.body

  pool.query('SELECT * FROM User WHERE name = ?', [name])
    .then(([results]) => {
      if (results.length > 0) {
        const user = results[0]

        //Passwörter vergleichen
        bcrypt.compare(password, user.password)
          .then((passwordIsValid) => {
            //Passwort korrekt
            if (passwordIsValid) res.status(200).json({ message: 'Logged in', user })
            //Passwort inkorrekt
            else res.status(401).json({ message: 'Username or password incorrect' })
          })
          .catch((error) => {
            res.status(500).json({ error: 'Internal server error' });
          })
      } else {
        //kein Benutzer mit Benutzernamen
        res.status(401).json({ message: 'No user with this name' });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: 'Database error' })
    })
})

//Register ===============================================================================================================================
router.post('/register', (req, res) => {
  const { name, password, language } = req.body

  pool.query('SELECT * FROM User WHERE name = ?', [name])
    .then(([results]) => {
      if (results.length > 0) {
        // Benutzer existiert bereits
        res.status(409).json({ message: 'Username already taken' });
      } else {
        // Benutzer erstellen
        let defaultLanguage = 'en'
        pool.query(
          'INSERT INTO User (name, password, language) VALUES (?, ?, ?)',
          [name, password, language || defaultLanguage]
        )
        .then(() => {
          res.status(201).json({ message: 'User created' })
        })
        .catch((error) => {
          res.status(500).json({ error: 'Database error' })
        })
      }
    })
    .catch((error) => {
      res.status(500).json({ error: 'Database error' })
    })
})

//Prüfung, ob ein Benutzername bereits vergeben ist ======================================================================================
router.get('/users/:name', async (req, res) => {
  const { name } = req.params

  try {
    const [results] = await pool.query('SELECT * FROM User WHERE name = ?', [name]);
    if (results.length > 0) res.status(200).json({ message: 'User found' })
    else res.status(404).json({ message: 'User not found' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

//GET Benutzer ===========================================================================================================================
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM User')
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete Benutzer ==================================================================================================================
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params

  try {
    await pool.execute('DELETE FROM UserPlant WHERE userID = ?', [id])
    await pool.execute('DELETE FROM User WHERE ID = ?', [id])
    res.status(200).json({ message: 'User removed.' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
})

// PUT Passwort ====================================================================================================================
router.put('/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body

  try {
    const [user] = await pool.query('SELECT * FROM User WHERE ID = ?', [id])
    if (user.length === 0) return res.status(404).json({ message: 'User not found.' })
    
    const isPasswordsCorrect = await bcrypt.compare(oldPassword, user[0].password)
    if (!isPasswordsCorrect) return res.status(401).json({ message: 'Old password is incorrect.' })

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE User SET password = ? WHERE ID = ?', [hashedNewPassword, id])
    res.json({ message: 'Password updated successfully.' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
})

// GET Pflanzen =====================================================================================================================
router.get('/plants', async (req, res) => {
  try {
    const [plants] = await pool.query('SELECT * FROM Plant') // Annahme: Die Pflanzendaten befinden sich in der Tabelle "Plant"
    res.json(plants)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error.' })
  }
})

// GET Pflanzen eines Benutzers =======================================================================================================
router.get('/user/:userId/plants', async (req, res) => {
  const { userId } = req.params

  try {
    const [results] = await pool.query('SELECT * FROM UserPlant WHERE userID = ?', [userId])
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

// POST BenutzerPflanze ==============================================================================================================
router.post('/user/:userId/plants/:plantId', async (req, res) => {
  const { userId, plantId } = req.params

  try {
    await pool.execute('INSERT INTO UserPlant (userID, plantID) VALUES (?, ?)', [userId, plantId])
    res.status(201).json({ message: 'Neue Benutzerpflanze erfolgreich hinzugefügt' })
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' })
  }
})

// DELETE BenutzerPflanze ============================================================================================================
router.delete('/user/:userId/plants/:plantId', async (req, res) => {
  const { userId, plantId } = req.params

  try {
    const [deleteResults] = await pool.execute('DELETE FROM UserPlant WHERE userID = ? AND plantID = ?', [userId, plantId])

    if (deleteResults.affectedRows > 0) res.json({ message: 'Users plant removed' })
    else res.status(404).json({ message: 'User does not have the plant' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET Umweltbedingungen ============================================================================================================
router.get('/environmentalConditionByPlant', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM EnvironmentalCondition')
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' })
  }
})

module.exports = router