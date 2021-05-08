import React,{ useEffect, useRef, useState } from 'react';
import FileList from './components/FileList';

export default function App() {

  const [userName, setUserName] = useState("");
  const [files, setFiles] = useState([]);

  const fileInputElement = useRef(null);
  const userNameInputElement = useRef(null);

  const handleFileChange = () => {
    setFiles(fileInputElement.current.files); 
  }

  const handleUpload = () => {
    if(userName !== ""){
      var formdata = new FormData();
      formdata.append("userName", userName);
      if(files.length !== 0){
        for (const file of files) {
          formdata.append('printFiles', file, file.name);
        }
  
        var requestOptions = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };
  
        fetch("http://localhost:5000/uploadFiles", requestOptions)
          .then(response => response.text())
          .then(result => console.log(result))
          .catch(error => console.log('error', error));


      } else {
        Electron.notificationApi.sendNotification("Please upload some files!");
      }
    } else {
      Electron.notificationApi.sendNotification("Please enter user name before uploading!");
    }
  }

  return (
    <div className="container">
      <section className="upload">
        <h1>Teleport Print</h1>
        <label>Enter User Name:</label>
        <input type="text"  ref={userNameInputElement} onChange={ e => { setUserName(e.target.value) } } value={ userName === "" ? "" : userName } />
        <input type="file" multiple={true} ref={fileInputElement} onChange={handleFileChange} />
        <button onClick={handleUpload}>UPLOAD</button>
      </section>
      <section className="controlFiles" >
        <h3>File Explorer</h3>
        <FileList user={userName} />
      </section>
    </div>
  )
}
