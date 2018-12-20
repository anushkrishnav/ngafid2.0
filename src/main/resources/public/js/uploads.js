var paused = [];

var chunkSize = 2 * 1024 * 1024; //2MB

class Upload extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        //console.log("upload did mount for filename: '" + this.props.uploadInfo.filename + "'");
    }

    render() {
        let uploadInfo = this.props.uploadInfo;

        let progressSize = uploadInfo.progressSize;
        let totalSize = uploadInfo.totalSize;

        if (progressSize == undefined) progressSize = uploadInfo.bytesUploaded;
        if (totalSize == undefined) totalSize = uploadInfo.sizeBytes;

        const width = ((progressSize / totalSize) * 100).toFixed(2);
        const sizeText = (progressSize/1000).toFixed(2).toLocaleString() + "/" + (totalSize/1000).toFixed(2).toLocaleString()  + " kB (" + width + "%)";
        const progressSizeStyle = {
            width : width + "%",
            height : "24px",
            textAlign : "left",
            whiteSpace : "nowrap"
        };

        const fixedFlexStyle1 = {
            flex : "0 0 15em"
        };

        const fixedFlexStyle2 = {
            //flex : "0 0 75em",
            height : "34px",
            padding : "4 0 4 0"
        };

        const fixedFlexStyle3 = {
            flex : "0 0 18em"
        };


        let statusText = "";

        let progressBarClasses = "progress-bar";
        let statusClasses = "p-1 pl-2 pr-2 ml-1 card bg-light";
        let status = uploadInfo.status;
        if (status == "HASHING") {
            statusText = "Hashing";
            progressBarClasses += " bg-warning";
            statusClasses += " border-warning text-warning";
        } else if (status == "UPLOADED") {
            statusText = "Uploaded";
            progressBarClasses += " bg-primary";
            statusClasses += " border-primary text-primary";
        } else if (status == "UPLOADING") {
            statusText = "Uploading";
        } else if (status == "UPLOAD INCOMPLETE") {
            statusText = "Upload Incomplete";
            progressBarClasses += " bg-warning";
            statusClasses += " border-warning text-warning";
        } else if (status == "ERROR") {
            statusText = "Import Failed";
            progressBarClasses += " bg-danger";
            statusClasses += " border-danger text-danger";
        } else if (status == "IMPORTED") {
            if (uploadInfo.errorFlights == 0 && uploadInfo.warningFlights == 0) {
                statusText = "Imported";
                progressBarClasses += " bg-success";
                statusClasses += " border-success text-success";

            } else if (uploadInfo.errorFlights != 0 && uploadInfo.errorFlights != 0) {
                statusText = "Imported With Errors and Warnings";
                progressBarClasses += " bg-danger";
                statusClasses += " border-danger text-danger ";

            } else if (uploadInfo.errorFlights != 0) {
                statusText = "Imported With Errors";
                progressBarClasses += " bg-danger";
                statusClasses += " border-danger text-danger ";

            } else if (uploadInfo.warningFlights != 0) {
                statusText = "Imported With Warnings";
                progressBarClasses += " bg-warning";
                statusClasses += " border-warning text-warning ";
            }
        }

        return (
            <div className="m-1">
                <div className="d-flex flex-row">
                    <div className="p-1 mr-1 card border-light bg-light" style={fixedFlexStyle1}>{uploadInfo.filename}</div>
                    <div className="p-1 flex-fill card progress" style={fixedFlexStyle2}>
                        <div className={progressBarClasses} role="progressbar" style={progressSizeStyle} aria-valuenow={width} aria-valuemin="0" aria-valuemax="100">{sizeText}</div>
                    </div>
                    <div className={statusClasses} style={fixedFlexStyle3}>{statusText}</div>
                </div>
            </div>
        );

    }
}

function getUploadeIdentifier(filename, size) {
    return(size + '-' + filename.replace(/[^0-9a-zA-Z_-]/img, ''));
}


class UploadsCard extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hidden : this.props.hidden
        }

        mainCards['uploads'] = this;
        console.log("constructed UploadsCard, set mainCards");
    }

    setContent(uploads) {
        this.state.uploads = uploads;
        this.setState(this.state);
    }

    getUploadsCard() {
        return this;
    }


    getMD5Hashh(file, onFinish, uploadsCard) {
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            chunkSize = 2097152,                             // Read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader();

        fileReader.onload = function (e) {
            console.log('read chunk nr', currentChunk + 1, 'of', chunks);
            spark.append(e.target.result);                   // Append array buffer
            currentChunk++;

            if (currentChunk % 5 == 0) {
                //var percent = (currentChunk / chunks) * 100.0;

                let state = uploadsCard.state;
                console.log("inside onload function!");
                console.log(state);
                console.log(file);
                state.uploads[file.position].progressSize = currentChunk * chunkSize;

                uploadsCard.setState(
                    state: state
                );

                //set_progressbar_percent(file.identifier, percent);
            }

            if (currentChunk < chunks) {
                loadNext();
            } else {
                //reset progress bar for uploading
                let state = uploadsCard.state;
                state.uploads[file.position].progressSize = 0;
                state.uploads[file.position].status = "UPLOADING";
                uploadsCard.setState(
                    state: state
                );

                onFinish(spark.end());
            }
        };

        fileReader.onerror = function () {
            display_error_modal("File Upload Error", "Could not upload file because of an error generating it's MD5 hash. Please reload the page and try again.");
        };

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        }

        loadNext();
    }

    startUpload(file) {
        //different versions of firefox have different field names
        var filename = file.webkitRelativePath || file.fileName || file.name;
        var identifier = file.identifier;
        var position = file.position;

        paused[identifier] = false;

        var numberChunks = Math.ceil(file.size / chunkSize);

        var uploadInfo = {};
        uploadInfo.identifier = identifier;
        uploadInfo.filename = filename;
        uploadInfo.uploadedChunks = 0;
        uploadInfo.numberChunks = numberChunks;
        uploadInfo.sizeBytes = file.size;
        uploadInfo.bytesUploaded = 0;
        uploadInfo.status = 'HASHING';

        var uploadsCard = this;

        function onFinish(md5Hash) {
            file.md5Hash = md5Hash;
            console.log("got md5Hash: '" + md5Hash + "'");
            var xhr = new XMLHttpRequest();

            xhr.open('POST', './protected/new_upload');
            xhr.onload = function() {
                console.log("New upload response: " + xhr.responseText);
                var response = JSON.parse(xhr.responseText);

                var filename = file.webkitRelativePath || file.fileName || file.name;

                //check and see if there was an error in the response!
                if (response.errorTitle !== undefined) {
                    display_error_modal(response.errorTitle, response.errorMessage + "<br>On file: '" + filename + "'");
                    uploadsCard.removeUpload(file);

                } else {
                    var uploadInfo = response;
                    uploadInfo.file = file; //set the file in the response uploadInfo so it can be used later
                    uploadInfo.identifier = identifier;
                    uploadInfo.position = position;
                    uploadsCard.updateUpload(uploadInfo);
                }
            };

            var formData = new FormData();
            //formData.append("idToken", idToken);
            formData.append("idToken", "TEST_ID_TOKEN");
            formData.append("request", "NEW_UPLOAD");
            formData.append("filename", filename);
            formData.append("identifier", identifier);
            formData.append("numberChunks", numberChunks);
            formData.append("sizeBytes", file.size);
            formData.append("md5Hash", md5Hash);
            xhr.send(formData);
        }

        var md5Hash = this.getMD5Hashh(file, onFinish, this);
    }


    addUpload(file) {
        const filename = file.webkitRelativePath || file.fileName || file.name;
        const progressSize = 0;
        const status = "HASHING";
        const totalSize = file.size;
        console.log("adding filename: '" + filename + "'");

        let uploads = this.state.uploads;

        let identifier = getUploadeIdentifier(filename, totalSize);
        console.log("CREATED IDENTIFIER: " + identifier);
        file.identifier = identifier;
        file.position = uploads.length;

        let alreadyExists = false;
        for (var i = 0; i < uploads.length; i++) {
            if (uploads[i].identifier == identifier) {

                if (uploads[i].status == "UPLOAD INCOMPLETE") {
                    //upload already exists in the list but is incomplete, so we need to restart it
                    alreadyExists = true;
                    file.position = i;
                } else {
                    console.log("file already exists, not adding!");
                    return;
                }
            }
        }

        if (!alreadyExists) {
            uploads.push({
                identifier : identifier,
                filename : filename,
                status : status,
                totalSize : totalSize,
                progressSize : progressSize
            });
        }

        let state = this.state;
        state.uploads = uploads;
        this.setState(
            state : state
        );

        this.startUpload(file);
    }

    removeUpload(file) {
        if (file.position < uploads.length) {
            let uploads = this.state.uploads;
            uploads.splice(file.position, 1);
            for (var i = 0; i < uploads.length; i++) {
                uploads[i].position = i;
            }

            let state = this.state;
            state.uploads = uploads;
            this.setState(
                state : state
            );
        }
    }

    updateUpload(uploadInfo) {
        var file = uploadInfo.file;
        var position = uploadInfo.position;

        var numberChunks = parseInt(uploadInfo.numberChunks); 
        var filename = uploadInfo.filename;
        var identifier = uploadInfo.identifier;

        var chunkStatus = uploadInfo.chunkStatus;
        var chunkNumber = chunkStatus.indexOf("0");
        //console.log("chunk status: '" + chunkStatus + "'");
        console.log("next chunk: " + chunkNumber + " of " + numberChunks);

        uploadInfo.progressSize = uploadInfo.bytesUploaded;
        uploadInfo.totalSize = uploadInfo.sizeBytes;

        let uploads = this.state.uploads;
        uploads[uploadInfo.position] = uploadInfo;
        let state = this.state;
        this.setState({
            state : state
        });

        var uploadsCard = this;

        var fileReader = new FileReader();

        var startByte = parseInt(chunkNumber) * parseInt(chunkSize);
        var endByte = Math.min(parseInt(startByte) + parseInt(chunkSize), file.size);
        //console.log("startByte: " + startByte + ", endByte: " + endByte + ", chunkSize: " + chunkSize);

        var func = (file.slice ? 'slice' : (file.mozSlice ? 'mozSlice' : (file.webkitSlice ? 'webkitSlice' : 'slice')));
        var bytes = file[func](startByte, endByte, void 0);

        //console.log(bytes);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', './protected/upload');
        //xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.onload = function() {
            console.log("Upload response: " + xhr.responseText);

            var response = JSON.parse(xhr.responseText);
            if (response.errorTitle !== undefined) {
                display_error_modal(response.errorTitle, response.errorMessage + "<br>On file: '" + filename + "'");

            } else {
                var uploadInfo = response;
                uploadInfo.file = file; //set the fileObject so we can use it for restarts
                uploadInfo.position = position;

                var numberChunks = Math.ceil(file.size / chunkSize);
                console.log("uploaded chunk " + chunkNumber + " of " + numberChunks);

                var chunkStatus = uploadInfo.chunkStatus;
                chunkNumber = chunkStatus.indexOf("0");
                //console.log("chunk status: '" + chunkStatus + "'");
                //console.log("next chunk: " + chunkNumber);
                //chunkNumber = chunkNumber + 1;

                if (chunkNumber > -1) {
                    //console.log("uploading next chunk with response:");
                    //console.log(response);

                    uploadsCard.updateUpload(uploadInfo);
                } else {

                    let uploads = uploadsCard.state.uploads;
                    uploads[uploadInfo.position] = uploadInfo;
                    let state = uploadsCard.state;
                    uploadsCard.setState({
                        state : state
                    });
                }
            }
        };

        console.log("appending identifier: " + file.identifier);
        var formData = new FormData();
        //formData.append("idToken", idToken);
        formData.append("idToken", "TEST_ID_TOKEN");
        formData.append("request", "UPLOAD");
        formData.append("chunkNumber", chunkNumber);
        formData.append("identifier", file.identifier);
        formData.append("md5Hash", file.md5Hash);
        formData.append("chunk", bytes, file.fileName);
        xhr.send(formData);
    }


    triggerInput() {
        var uploadsCard = this;

        $('#upload-file-input').trigger('click');

        $('#upload-file-input:not(.bound)').addClass('bound').change(function() {
            console.log("number files selected: " + this.files.length);
            console.log( this.files );

            if (this.files.length > 0) { 
                var file = this.files[0];
                var filename = file.webkitRelativePath || file.fileName || file.name;

                if (!filename.match(/^[a-zA-Z0-9_.-]*$/)) {
                    display_error_modal("Malformed Filename", "The filename was malformed. Filenames must only contain letters, numbers, dashes ('-'), underscores ('_') and periods.");
                } else {
                    uploadsCard.addUpload(file);
                }    
            }    
        });  
    }

    render() {
        console.log("rendering uploads!");
        const hidden = this.props.hidden;
        const hiddenStyle = {
            display : "none"
        };

        let uploads = [];
        if (typeof this.state.uploads != 'undefined') {
            uploads = this.state.uploads;
        }

        return (
            <div className="card-body" hidden={hidden}>
                {
                    uploads.map((uploadInfo, index) => {
                        return (
                            <Upload uploadInfo={uploadInfo} key={uploadInfo.identifier} />
                        );
                    })
                }
                <div className="d-flex justify-content-center mt-2">
                    <div className="p-0">
                        <input id ="upload-file-input" type="file" style={hiddenStyle} />
                        <button id="upload-flights-button" className="btn btn-primary" onClick={() => this.triggerInput()}>
                            <i className="fa fa-upload"></i> Upload Flights
                        </button>
                    </div>
                </div>

            </div>
        );
    }
}

