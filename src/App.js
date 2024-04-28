import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // update text input
  const handleTextInputChange = (e) => {
    setInputText(e.target.value);
  };

  // update file input
  const handleFileInputChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  //
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      console.error("Must select file");
      return;
    }

    // get filedata and upload to s3
    const fileData = await getPresignedURL(selectedFile.name)
    await uploadFileS3(fileData.url, selectedFile);

    // send the text/file info to
    await sendToLambda({
      textInput: inputText,
      filePath: fileData.filePath, // This should be the key of the uploaded object in S3
    });
  };

  // HELPER FUNCTIONS

  // gets the pre-signed url data from API
  // returns the URL
  const getPresignedURL = async (fileName) => {
    try {
      const response = await fetch('/your-api-endpoint-for-presigned-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName }),
      });
      if (!response.ok) {
        throw new Error('Error getting pre-signed URL');
      } else {
        return response.json();
      }
    } catch (error) {
      console.error("Error getting pre-signed data");
    }
  };

  // uploads the url to s3
  const uploadFileS3 = async (URL, file) => {
    try {
      const formData = new FormData();
      Object.keys(URL.fields).forEach(key => {
        formData.append(key, URL.fields[key]);
      });
      formData.append("file", file);
      const response = await fetch(URL.url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Error uploading to s3");
      } else {
        console.log("Success!");
      }
    } catch (error) {
      console.error("Error uploading to s3");
    }
  };

  // sends the form data to lambda
  const sendToLambda = async (data) => {
    try {
      const response = await fetch('/processData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Error sending form");
      } else {
        const responseData = await response.json();
        console.log("Data: ", responseData);
      }
    } catch (error) {
      console.error("Error sending form");
    }
  };

  return (
    <div className="App">
      <header className="appHeader">
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              <span>
                Text input:
                <input type="text" value={inputText} onChange={handleTextInputChange} />
              </span>
            </label>
          </div>
          <div>
            <label>
              <span>
                File input:
                <input type="file" onChange={handleFileInputChange} />
              </span>
            </label>
          </div>
          <button type="submit">Submit</button>
        </form>
      </header>
    </div>
  );
}

export default App;