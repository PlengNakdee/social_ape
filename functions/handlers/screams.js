const {db} = require('../util/admin')

exports.getAllScreams = (request, response) => {
    db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let screams = []
        data.forEach((doc) => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
                //likeCount: doc.data().likeCount
            })
        })
        return response.json(screams)
    })
}

exports.postOneScream = (request, response) => {
    const newScream = {
        body: request.body.body,
        userHandle: request.user.handle,
        createdAt: new Date().toISOString()
    }
    db.collection('screams')
    .add(newScream)
    .then(doc => {
        response.json({message: `document ${doc.id} created succesfully`})
    })
}

exports.getScream = (request, response) => {
    let screamData = {}
    db.doc(`/screams/${request.params.screamId}`).get()
    .then(doc => {
        if(!doc.exists){
            return response.status(404).json({error: 'Scream not found'})
        }
        screamData = doc.data()
        screamData.screamId = doc.id
        return db.collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId', '==', request.params.screamId).get()
    })
    .then(data => {
        screamData.comments = []
        data.forEach(doc => {
            screamData.comments.push(doc.data())
        })
        return response.json(screamData)
    })
    .catch(error => {
        console.log('Error getting scream data', error)
    })
}






