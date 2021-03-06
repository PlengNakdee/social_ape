const {admin, db} =require('../util/admin')
const config = require('../util/config')
const firebase = require('firebase')
firebase.initializeApp(config)

const {validateSignupData, validateLoginData, reduceUserDetails} = require('../util/validators')

// signup a user
exports.signup =(request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle,
    }

    const {valid, errors} = validateSignupData(newUser)
    if(!valid) return response.status(400).json(errors)

    const noImg = 'no-img.png'

    // validate data
    let token, userId

    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exist) {
            return response.status(400).json({handle: 'this handle is already taken'})
        } else {
            return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        }
    })
    .then(data => {
        userId = data.user.uid
        return data.user.getIdToken()
    })
    .then(idToken => {
        token = idToken
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
            userId
        }
        return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    })
    .then(() => {
            return response.status(201).json({token})
        })
    .catch (error => {
        console.log('Error creating new user', error)
    })
}

// user login
exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }
    const {valid, errors} = validateLoginData(user)
    if(!valid) return response.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            return response.json({token})
        })
        .catch (error => {
            if(error.code === 'auth/wrong-password') {
                console.log('Wrong password', error)
            }
            console.log('Error login', error)
        })
}

// add user details
exports.addUserDetails = (request, response) => {
    let userDetails = reduceUserDetails(request.body)

    db.doc(`/users/${request.user.handle}`).update(userDetails)
    .then(() => {
        return response.json({message: 'Successfully update user details'})
    })
    .catch(error => {
        console.log('Error update user details', error)
    })
}

// get own user detail
exports.getAuthenticatedUser = (request, response) => {
    let userData = {}
    db.doc(`/users/${request.user.handle}`).get()
    .then(doc => {
        if(doc.exists) {
            userData.credentials = doc.data()
            return db.collection('likes').where('userHandle', '==', request.user.handle).get()
        }
    })
    .then(data => {
        userData.likes = []
        data.forEach(doc => {
            userData.likes.push(doc.data())
        })
        return response.json(userData)
    })
    .catch(error => {
        console.log('Error getting user detail', error)
    })
}

// upload user image profile
exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busboy = new BusBoy({headers: request.headers})

    let imageFileName
    let imageToBeUploaded = {}

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return response.status(400).json({ error: "Wrong file type submitted" })
        }
        // image.png
        const imageExtension = filename.split('.')[filename.split('.').length -1]
        // 459086542.png
        imageFileName = `${Math.round(Math.random()*1000000000)}.${imageExtension}`
        const filepath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = {filepath, mimetype}
        file.pipe(fs.createWriteStream(filepath))
    })

    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata:{
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${request.user.handle}`).update({imageUrl})
        })
        .then(() => {
            return response.json({message: 'Image uploaded successfully.'})
        })
        .catch(error => {
            console.log('Error uploading image', error)
        })
    })

    busboy.end(request.rawBody)
}








