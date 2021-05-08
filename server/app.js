const express = require('express');
const multer = require('multer');
const methodOverride = require('method-override');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const open = require('open');
const del = require('del');
const glob = require("glob");
const http = require('http');
const config = require('./config');

const port = 5000;
const app = express();

//-----------------------------------------------------------------------
// MIDDLEWARE
//-----------------------------------------------------------------------

app.use(cors({
    origin: '*',
}));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(methodOverride('_method'));

var server = http.createServer(app);
var io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true
    }
  });

const timeStamp = (req, res, next) => {
    req.timestamp = new Date().getTime();
    next();
}

var storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        var currentPath = config.basePath;
        var {userName} = req.body; 
        var { timestamp } = req;
        if(!checkExists(currentPath+'/'+userName)){
            createFolder(currentPath + '/' + userName);
        }
        if(!checkExists(currentPath+'/'+userName + '/' + timestamp)){
            createFolder(currentPath + '/' + userName + '/' + timestamp);
        }
        cb(null,currentPath+'/'+userName+'/'+timestamp);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({
    storage: storage
})

//-----------------------------------------------------------------------
// UTILITY
//-----------------------------------------------------------------------

//Creating a new folder 
const createFolder = (path) => {
    fs.mkdir(path,(err)=>{
        console.log(err,path);
    });
}

//Check if folder/file exists
const checkExists = (path) => {
    return fs.existsSync(path);
}

// Get all files in folder
const getFiles = async (src, callback) => {
    glob(src + '/**/*', callback);
};


//-----------------------------------------------------------------------
// ROUTES
//-----------------------------------------------------------------------

app.get('/', (req, res) => {
    res.status(200).send('Server Ready.');
});


// Create folder and upload files of a given user
// params:
// userName - name of the user
// printFiles - list of files to upload
// response:
// message - status message
app.post('/uploadFiles', [timeStamp,upload.array('printFiles', 100)], (req, res) => {
    try {
        console.log(req.body, "Inside post request");
        res.status(201).json({
            message: 'File uploded successfully'
        });
    } catch (error) {
        console.log(error);
        res.send(400).json({
            message: 'Failed to Upload :: ' + error.message
        });
    }
});

// Display files of a given user
// params:
// userName - name of the user
// response:
// files - list of files of a given user
// message - status message
app.get('/getFiles/:userName',async (req,res)=>{
    try {
        let { userName } = req.params;
        getFiles(path.join(config.basePath,userName),(err,fileRes)=>{
            if(err){
                console.log(err,"Error in getting files.");
                res.status(400).json({
                    message: 'Directory deos not exist'
                });
            } else {
                let files = fileRes.map(file => {
                    return file.split(config.basePath+'/'+userName)[1];
                })
                res.status(201).json({
                    message: 'File request received',
                    files: files,
                });
            }
        });
    } catch (error) {
        res.status(401).json({
            message: 'Failed to Fetch :: ' + error.message
        });
    }
});

// Open the requested file
// params:
// userName - name of the user
// fileName - name of the file to open
// response:
// message - status message
// output:
// Open the requested file
app.get('/openFile', async (req, res)=>{
    try {
        let { userName, fileName } = req.query;
        var currentPath = config.basePath+'/'+ userName + '/' + fileName;
        await open(currentPath)
        res.status(201).json({
            message: 'File opened',
        });
    } catch (error) {
        res.status(400).json({
            message: 'Failed to Open :: ' + error.message
        });
    }
});


// Delete file
//params :
// userName - name of the user
// fileName - name of the file to delete
// response:
// message - status message
// output:
// Deleted requested file
app.delete('/deleteFile',   (req, res)=>{
    try {
        let { userName, fileName } = req.query;
        var currentPath = config.basePath+'/'+ userName+'/'+ fileName;
        console.log(currentPath);
        fs.unlink(currentPath, (err)=>{
            if (err){
                console.log(err);
                res.status(400).json({
                    message: 'Failed to Delete the File as file does not exist :: ' + err.message
                });
            } else {
                getFiles(path.join(config.basePath,userName),(err,fileRes)=>{
                    if(err){
                        console.log(err,"Error in getting files.");
                        res.status(400).json({
                            message: 'Directory deos not exist'
                        });
                    } else {
                        let files = fileRes.map(file => {
                            return file.split(config.basePath+'/'+userName)[1];
                        })
                        res.status(201).json({
                            message: 'File request received',
                            files: files,
                        });
                    }
                });
            }
        });
    } catch (error) {
        res.status(400).json({
            message: 'Failed to Delete the File :: ' + error.message
        });
    }
})

// Delete folder
//params :
// path - path of folder
// response:
// message - status message
// output:
// Deleted requested folder
app.delete('/deleteFolder', async  (req, res)=>{
    try {
        let { userName } = req.query;
        let folderPath = path.join(userName,req.query.path);
        var currentPath = path.join(config.basePath,folderPath);
        console.log(currentPath);
        if(!checkExists(currentPath)){
            res.status(401).json({
                message: 'Incorrect Folder Path :: ' + error.message
            });
        } else {
            await del(currentPath);
            getFiles(path.join(config.basePath,userName),(err,fileRes)=>{
                if(err){
                    console.log(err,"Error in getting files.");
                    res.status(400).json({
                        message: 'Directory deos not exist'
                    });
                } else {
                    let files = fileRes.map(file => {
                        return file.split(config.basePath+'/'+userName)[1];
                    })
                    res.status(201).json({
                        message: 'File request received',
                        files: files,
                    });
                }
            });
        }
    } catch (error) {
        res.status(400).json({
            message: 'Failed to Delete the Folder :: ' + error.message
        });
    }
})

// Delete user's folder
//params :
// userName - name of the user
// response:
// message - status message
// output:
// Deleted requested folder
app.delete('/deleteUser', async  (req, res)=>{
    try {
        let { userName } = req.query;
        var currentPath = path.join(config.basePath,userName);
        console.log(currentPath);
        await del(currentPath);
        res.status(200).json({
            message: "Folder successfully deleted"
        })
    } catch (error) {
        res.status(400).json({
            message: 'Failed to Delete the Folder :: ' + error.message
        });
    }
})

//Socket Connection
io.sockets.on('connection', (socket) =>{
    console.log('Socket connection established.');

    socket.on('fileUpdate',(path=config.basePath)=>{
        console.log('File update occurred.',path);
        socket.emit('dirUpdate',path);
    })
    socket.on('changeDisplay', (userName) => {
        console.log("changeDisplay :: ",userName);
        getFiles(path.join(config.basePath,userName),(err,fileRes)=>{
            if(err){
                console.log(err,"Error in getting files.");
            } else {
                let files = fileRes.map(file => {
                    return file.split(config.basePath+'/'+userName)[1];
                })
                socket.emit('updatedDir',files);
            }
        });
    });

})



server.listen(port, () => console.log(`Server listening on port ${port}!`));