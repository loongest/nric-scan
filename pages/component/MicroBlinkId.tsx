"use client";
import React from 'react';
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";



const MicroBlinkId = () => {
    const [message, setMessage] = React.useState<string>("Loading...");
    // Initialize the useRef with null
    const videoRef =  React.useRef<HTMLVideoElement>(null);
    const progressRef =  React.useRef<HTMLProgressElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const constraints = {
        video: {'facingMode': 'environment', width: {min: 1280}, height: {min: 720}}
    };      

    /**
     * BlinkID In-browser SDK demo app which demonstrates how to:
     *
     * - Change default SDK settings
     * - Scan front side of the identity document with web camera
     * - Provide visual feedback to the end-user during the scan
     */
    React.useEffect( () => {
        (async () => {
            await main();
        })();
    }, []);

    async function main() {
        const publicfolder = window.location.origin + "/resources/";
        try { 
            // Check if browser has proper support for WebAssembly
            if (!BlinkIDSDK.isBrowserSupported()) {
                setMessage("This browser is not supported!");
                return;
            }
            
            // 2. Create instance of SDK load settings with your license key
            const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(process.env.NEXT_PUBLIC_LICENSE_KEY||"");

            // [OPTIONAL] Change default settings
            // Show or hide hello message in browser console when WASM is successfully loaded
           loadSettings.allowHelloMessage = true;
            // In order to provide better UX, display progress bar while loading the SDK
           loadSettings.loadProgressCallback = (progress) => (progressRef.current!.value = progress);
            
            // Set relative or absolute location of the engine, i.e. WASM and support JS files
            
           loadSettings.engineLocation = publicfolder;
            // loadSettings.engineLocation = "https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.2.0/resources/";
            
            // Set absolute location of the worker file
            // IMPORTANT: function getWorkerLocation is a workaround for the CodePen since native Web Workers are not supported

           loadSettings.workerLocation = await getWorkerLocation(publicfolder + "BlinkIDWasmSDK.worker.min.js");
            // loadSettings.workerLocation = await getWorkerLocation('https://unpkg.com/@microblink/blinkid-in-browser-sdk@6.2.0/resources/BlinkIDWasmSDK.worker.min.js');
      


            


            // 3. Load SDK
            BlinkIDSDK.loadWasmModule(loadSettings).then(
                (wasmSDK: BlinkIDSDK.WasmSDK) => {
                    if ( videoRef.current ) {
                        videoRef.current.addEventListener("click", (ev) => {
                            ev.preventDefault();
                            startScan(wasmSDK);
                        });
                    } else {
                        setMessage("VideoRef not loeaded");
                    }
                },
                (error) => {
                    setMessage("Failed to load SDK! " +  error);
                    console.error("Failed to load SDK!", error);
                }
            );
        } catch (error) {
            setMessage('Error accessing webcam: ' + error);
            console.error('Error accessing webcam:', error);
        }
    }

    /**
     * Scan single side of identity document with web camera.
     */
    async function startScan( sdk: BlinkIDSDK.WasmSDK )
    {   
        const video = videoRef.current;

        if ( video ) {
            // 1. Create a recognizer objects which will be used to recognize single image or stream of images.
            //
            // BlinkID Single-side Recognizer - scan various ID documents
            // ID Barcode Recognizer - scan barcodes from various ID documents
            const singleSideIDRecognizer = await BlinkIDSDK.createBlinkIdSingleSideRecognizer( sdk );

            // [OPTIONAL] Create a callbacks object that will receive recognition events, such as detected object location etc.
            const callbacks = {
                onQuadDetection: ( quad: any ) => drawQuad( quad ),
                onDetectionFailed: () => updateScanFeedback( "Detection failed", true )
            }

            // 2. Create a RecognizerRunner object which orchestrates the recognition with one or more
            //    recognizer objects.
            const recognizerRunner = await BlinkIDSDK.createRecognizerRunner
            (
                // SDK instance to use
                sdk,
                // List of recognizer objects that will be associated with created RecognizerRunner object
                [ singleSideIDRecognizer ],
                // [OPTIONAL] Should recognition pipeline stop as soon as first recognizer in chain finished recognition
                false,
                // [OPTIONAL] Callbacks object that will receive recognition events
                callbacks
            );

            // 3. Create a VideoRecognizer object and attach it to HTMLVideoElement that will be used for displaying the camera feed
            const videoRecognizer = await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream
            (
                videoRef.current,
                recognizerRunner
            );

            // 4. Start the recognition and await for the results
            const processResult = await videoRecognizer.recognize();

            // 5. If recognition was successful, obtain the result and display it
            if ( processResult !== BlinkIDSDK.RecognizerResultState.Empty )
            {
                const recognitionResults = await singleSideIDRecognizer.getResult();
                if ( recognitionResults.state !== BlinkIDSDK.RecognizerResultState.Empty )
                {
                    console.log( "BlinkID SingleSide recognizer results", recognitionResults );

                    let firstNameStr = "";
                    let lastNameStr = "";
                    let fullNameStr = "";

                    if (recognitionResults?.firstName && recognitionResults?.lastName) {
                        if (
                            typeof recognitionResults.firstName === "string" &&
                            typeof recognitionResults.lastName === "string"
                        ) {
                            firstNameStr = recognitionResults.firstName;
                            lastNameStr = recognitionResults.lastName;
                        } else {
                            firstNameStr =
                            recognitionResults.firstName.latin||"" ||
                            recognitionResults.firstName.cyrillic||"" ||
                            recognitionResults.firstName.arabic||"";
                            
                            lastNameStr =
                            recognitionResults.lastName.latin||"" ||
                            recognitionResults.lastName.cyrillic||"" ||
                            recognitionResults.lastName.arabic||"";
                        }
                    } 

                    if ( recognitionResults?.fullName ) {
                        const { fullName } = recognitionResults;
                        const { latin, cyrillic, arabic  } = fullName;

                        fullNameStr = `${latin||""}${cyrillic||""}${arabic||""} `
                    } 

                    const derivedFullName = `${firstNameStr} ${lastNameStr}`.trim() || fullNameStr

                    let dateOfBirth = {
                        year: 0,
                        month: 0,
                        day: 0
                    };

                    if ( recognitionResults?.dateOfBirth ) {
                        dateOfBirth = {
                            year: recognitionResults.dateOfBirth.year || recognitionResults.mrz.dateOfBirth.year,
                            month: recognitionResults.dateOfBirth.month || recognitionResults.mrz.dateOfBirth.month,
                            day: recognitionResults.dateOfBirth.day || recognitionResults.mrz.dateOfBirth.day
                        }
                    }

                    alert (
                    `Hello, ${ derivedFullName }!\n You were born on ${ dateOfBirth.year }-${ dateOfBirth.month }-${ dateOfBirth.day }.`
                    );
                }
            }
            else
            {
                alert( "Could not extract information!" );
            }

            // 7. Release all resources allocated on the WebAssembly heap and associated with camera stream

            // Release browser resources associated with the camera stream
            videoRecognizer?.releaseVideoFeed();

            // Release memory on WebAssembly heap used by the RecognizerRunner
            recognizerRunner?.delete();

            // Release memory on WebAssembly heap used by the recognizer
            singleSideIDRecognizer?.delete();

            // Clear any leftovers drawn to canvas
            clearDrawCanvas();
          
        }
    }

    React.useEffect(() => {
        const videoElement = videoRef.current;

        async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoElement) {
            videoElement.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing webcam:', error);
            setMessage('Error accessing webcam: ' + error);

        }
        }

        setupCamera();
    }, []);


    /**
     * Utility functions for drawing detected quadrilateral onto canvas.
     */
    function drawQuad(quad: any) {
        const canvasElement = canvasRef.current;
    
        if (canvasElement) {
            const drawContext = canvasElement.getContext('2d');
            if ( drawContext ) {
                clearDrawCanvas();
                // Based on detection status, show appropriate color and message
                setupColor(quad);
                setupMessage(quad);
                applyTransform(quad.transformMatrix);
                drawContext.beginPath();
                drawContext.moveTo(quad.topLeft.x, quad.topLeft.y);
                drawContext.lineTo(quad.topRight.x, quad.topRight.y);
                drawContext.lineTo(quad.bottomRight.x, quad.bottomRight.y);
                drawContext.lineTo(quad.bottomLeft.x, quad.bottomLeft.y);
                drawContext.closePath();
                drawContext.stroke();
            }
        }
    }

    /**
     * This function will make sure that coordinate system associated with detectionResult
     * canvas will match the coordinate system of the image being recognized.
     */
    function applyTransform(transformMatrix: any) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        if ( canvas && video ) {
            const drawContext = canvas.getContext('2d');
            if  ( drawContext ) {
                const canvasAR = canvas.width / canvas.height;
                const videoAR = video.videoWidth / video.videoHeight;
                let xOffset = 0;
                let yOffset = 0;
                let scaledVideoHeight = 0;
                let scaledVideoWidth = 0;
                if (canvasAR > videoAR) {
                    // pillarboxing: https://en.wikipedia.org/wiki/Pillarbox
                    scaledVideoHeight = canvas.height;
                    scaledVideoWidth = videoAR * scaledVideoHeight;
                    xOffset = (canvas.width - scaledVideoWidth) / 2.0;
                } else {
                    // letterboxing: https://en.wikipedia.org/wiki/Letterboxing_(filming)
                    scaledVideoWidth = canvas.width;
                    scaledVideoHeight = scaledVideoWidth / videoAR;
                    yOffset = (canvas.height - scaledVideoHeight) / 2.0;
                }
                // first transform canvas for offset of video preview within the HTML video element (i.e. correct letterboxing or pillarboxing)
                drawContext.translate(xOffset, yOffset);
                // second, scale the canvas to fit the scaled video
                drawContext.scale(
                    scaledVideoWidth / video.videoWidth,
                    scaledVideoHeight / video.videoHeight
                );
                // finally, apply transformation from image coordinate system to
                // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
                drawContext.transform(
                    transformMatrix[0],
                    transformMatrix[3],
                    transformMatrix[1],
                    transformMatrix[4],
                    transformMatrix[2],
                    transformMatrix[5]
                );
            }
        }
    }

    function clearDrawCanvas() {
        const canvas = canvasRef.current;
        if ( canvas ){ 
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            const drawContext = canvas.getContext('2d');
            if ( drawContext ) {
                drawContext.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    function setupColor(displayable: any) {
        const canvas = canvasRef.current;
        if ( canvas ) {
            const drawContext = canvas.getContext('2d');
            if ( drawContext ) {
                let color = "#FFFF00FF";
                if (displayable.detectionStatus === 0) {
                    color = "#FF0000FF";
                } else if (displayable.detectionStatus === 1) {
                    color = "#00FF00FF";
                }
                drawContext.fillStyle = color;
                drawContext.strokeStyle = color;
                drawContext.lineWidth = 5;
            }
        }
    }


    function setupMessage(displayable: any) {
        switch (displayable.detectionStatus) {
            case BlinkIDSDK.DetectionStatus.Fail:
                updateScanFeedback("Scanning...");
                break;
            case BlinkIDSDK.DetectionStatus.Success:
            case BlinkIDSDK.DetectionStatus.FallbackSuccess:
                updateScanFeedback("Detection successful");
                break;
            case BlinkIDSDK.DetectionStatus.CameraAtAngle:
                updateScanFeedback("Adjust the angle");
                break;
            case BlinkIDSDK.DetectionStatus.CameraTooHigh:
                updateScanFeedback("Move document closer");
                break;
            case BlinkIDSDK.DetectionStatus.CameraTooNear:
            case BlinkIDSDK.DetectionStatus.DocumentTooCloseToEdge:
            case BlinkIDSDK.DetectionStatus.Partial:
                updateScanFeedback("Move document farther");
                break;
            default:
                console.warn(
                    "Unhandled detection status!",
                    displayable.detectionStatus
                );
        }
    }
  
    /**
     * The purpose of this function is to ensure that scan feedback message is
     * visible for at least 1 second.
     */
    function updateScanFeedback(text: string, force?: boolean) {
        if (!force) {
            return;
        }
        setMessage(text);
        // window.setTimeout(() => (scanFeedbackLock = false), 1000);
    }
    
    async function getWorkerLocation(path: string): Promise<string> {
        return new Promise((resolve) => {
            window.fetch(path)
            .then(response => response.text())
            .then(data => {
                const blob = new Blob( [ data ], { type: "application/javascript" } );
                const url = URL.createObjectURL( blob );
                resolve(url);
            });
        });
    }

    return (
        <div>
            <progress ref={progressRef} value="0" max="100" />

            <video ref={videoRef} id="camera-feed" playsInline style={{
                width: '50%',
                height: '50%'
            }} />
             
            <canvas ref={canvasRef} />

            <p>{message}</p>
        </div>
    );
};

export default MicroBlinkId;