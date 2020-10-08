import React from "react";
import axios from 'axios';
import { useState } from "react";
import AuthService from "../../api/AuthService"

const UploadXml = ({ energyHistory }) => {
    const [file, setFile] = useState(null);
    const demo = energyHistory.email === "jph@demo.com";


    const onFileChange = (e) => {
        setFile(e.target.files[0]);
    }

    const onFileUpload = () => {
        const data = new FormData();
        data.append("xml", file)
        axios.post(
            `api/web/upload-xml?friendly_name=${energyHistory.friendlyName}`,
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': AuthService.getAuthHeader().headers['X-CSRF-TOKEN']
                },
            })
    }

    return (
        <div>
            <input disabled={demo} type="file" onChange={onFileChange} />
            <button disabled={demo} onClick={onFileUpload}>
                Upload
            </button>
        </div>

    )

}
export default UploadXml;