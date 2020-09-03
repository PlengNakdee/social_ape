const functions = require('firebase-functions')

const express = require('express')
const app = express()

const FBAuth = require('./util/fbAuth')

const {db} =require('./util/admin')
const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream} = require('./handlers/screams')
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser} = require('./handlers/users')

// screams route
app.get('/screams', getAllScreams)
app.post('/createScream', FBAuth, postOneScream)
app.get('/scream/:screamId', getScream)
app.get('/scream/:screamId/like', FBAuth, likeScream)
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream)
app.post('/scream/:screamId/comment', FBAuth, commentOnScream)
// ToDO delete scream, like scream, unlike

// user rout
app.post('/signup', signup)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails)
app.get('/user', FBAuth, getAuthenticatedUser)

// https://baseurl/api
//exports.api = functions.https.onRequest(app)

exports.api = functions.region('asia-southeast2').https.onRequest(app)



