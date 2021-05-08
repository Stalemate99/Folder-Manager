import React, { useEffect, useRef, useState } from 'react';

export default function FileList({ user }) {

    const [files,setFiles] = useState([]);
    const [userName, setUserName] = useState(user);
    const [filePath, setFilePath] = useState("");

    const filePathInputElement = useRef(null); 

    useEffect(() => {
        setUserName(user);
    }, [ user]);

    useEffect(() => {
        Electron.receive('updated-dir', data => {
          setFiles(data);
        });
      },[]);

    const handleOpenFile = (e) => {
        let fileName = e.target.name;
        let path = filePathInputElement.current.value.replaceAll("\\", "/") + '/' + fileName;
        console.log(path,"Openning this file...");
        Electron.send('open-file',path);
    }

    const handleFilePath = () => {
        if(filePathInputElement.current.value)
          Electron.send('display-files',filePathInputElement.current.value);
    }

    const handleDeleteFile = (e) => {
        let fileName = e.target.name;
        let path = "";
        if(filePath !== "")
            path = filePathInputElement.current.value.replaceAll("\\", "/") + '/' + fileName;
        else
            path = fileName;
        console.log(path, "Deleting this file...");
        Electron.send('delete-file', path);
        setFilePath("");
    }

    const renderFiles = () => {

        if(files && files.length>0){
            return files.map((file) =>{
                return(
                    <div key={file} className="file">
                        <p>{file}</p>
                        <button name={file} onClick={handleOpenFile} >OPEN</button>
                        <button name={file} onClick={handleDeleteFile} >DELETE</button>
                    </div>
                )
            })
        
        }
    }

    return(
        <>
            <input type="text" ref={ filePathInputElement } onChange={ e => { setFilePath(e.target.value) } } value={ filePath === ""? "" : filePath } />
            <button onClick={handleFilePath} >OPEN</button>
            { renderFiles() }
        </>
    )

}