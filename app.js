const express = require('express')
const {open} = require('sqlite')
const app = express()
const path = require('path')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null
module.exports = app
app.use(express.json())
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running at localhost3000')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()
const convertStateDbResponseToObjectresponse = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDistrictDbResponseToObjectResponse = dbObject => {
  return {
    disrtictId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    active: dbObject.active,
    cured: dbObject.cured,
    deaths: dbObject.deaths,
  }
}
//API 1
app.get('/states/', async (request, response) => {
  const getQuery = `SELECT * FROM state;`
  const dbState = await db.all(getQuery)
  response.send(
    dbState.map(state => convertStateDbResponseToObjectresponse(state)),
  )
})
//API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getQuery = `SELECT * FROM state where state_id=${stateId};`
  const dbState = await db.get(getQuery)
  response.send(convertStateDbResponseToObjectresponse(dbState))
})
//API 3
app.post('/districts/', async (request, response) => {
  const getDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getDetails
  const getQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  const dbResponse = await db.run(getQuery)
  response.send('District Successfully Added')
})
// API 4
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtQuery = `select * from district where district_id = ${districtId};`
  const dbResponse = await db.get(districtQuery)
  response.send(convertDistrictDbResponseToObjectResponse(dbResponse))
})
//API 5
app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `DELETE FROM district where district_id = ${districtId};`
  const dbResponse = await db.run(deleteQuery)
  response.send('District Removed')
})
// API 6
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = getDetails
  const getQuery = `UPDATE district SET district_name='${districtName}',state_id=${stateId},cases = ${cases},cured = ${cured},active=${active},deaths = ${deaths}  where district_id = ${districtId};`
  const dbResponse = await db.run(getQuery)
  response.send('District Details Updated')
})
//API 7
app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getQuery = `select sum(cases),sum(cured),sum(active),sum(deaths) from district where state_id = ${stateId};`
  const stats = await db.get(getQuery)
  console.log(stats)
  response.send({
    totalCases: stats['sum(cases)'],
    totalCured: stats['sum(cured)'],
    totalActive: stats['sum(active)'],
    totalDeaths: stats['sum(deaths)'],
  })
})
// API 8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getQuery = `select state.state_name as stateName from district INNER JOIN state ON district.state_id = state.state_id where district.district_id = ${districtId};`
  const dbResponse = await db.get(getQuery)
  response.send(dbResponse)
})
