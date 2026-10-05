// Local development server — loads .env, starts Express on PORT
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const app  = require('./app')
const PORT = process.env.PORT || 5051

app.listen(PORT, () => {
  console.log(`✅ DentalTrack API running on http://localhost:${PORT}`)
  console.log(`   ENV: ${process.env.APP_ENV || 'local'}`)
})
