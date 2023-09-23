"use client";
import * as React from 'react';
import {
    applyPolyfills,
    defineCustomElements
} from '@microblink/blinkid-in-browser-sdk/ui/loader';
// Import typings for UI component
import { EventReady, SDKError, EventScanError, EventScanSuccess } from "@microblink/blinkid-in-browser-sdk/ui/dist/types/utils/data-structures";


declare global {
  namespace JSX {
    interface IntrinsicElements {
      'blinkid-in-browser': HTMLBlinkidInBrowserElement | React.DetailedHTMLProps<React.HTMLAttributes<HTMLBlinkidInBrowserElement>, HTMLBlinkidInBrowserElement>;
    }
  }
}

const MicroBlinkUI = () => {

    const [message, setMessage] = React.useState<string>("");
    
    React.useEffect(() => {
        const publicfolder = window.location.origin + "/resources/";
        applyPolyfills().then(() => {
            defineCustomElements().then( async() => {
              // Reference to the `<blinkid-in-browser>` custom web component
                const blinkIdRef = document.querySelector("blinkid-in-browser") as HTMLBlinkidInBrowserElement;
                const publicFolder = window.location.origin + "/resources/";
                
                if ( blinkIdRef ) { 
                    const blinkId = blinkIdRef;

                    blinkId.licenseKey = process.env.NEXT_PUBLIC_LICENSE_KEY||"";
                    blinkId.engineLocation = publicFolder;
                    blinkId.workerLocation = publicFolder + "BlinkIDWasmSDK.worker.min.js";
                    blinkId.recognizers = ["BlinkIdSingleSideRecognizer"];

                    blinkId.addEventListener('ready', (ev: CustomEventInit<EventReady>) => {
                        setMessage("ready " + ev.detail);
                    });
                    blinkId.addEventListener("fatalError", (ev: CustomEventInit<SDKError>) => {
                        setMessage("FatalError: " + ev.detail + JSON.stringify(ev, null, 2));
                    });
                    blinkId.addEventListener("scanError", (ev: CustomEventInit<EventScanError>) => {
                        setMessage("ScanError " + ev.detail);
                    });
                    blinkId.addEventListener("scanSuccess", (ev: CustomEventInit<EventScanSuccess>) => {
                        setMessage("ScanSuccess " + ev.detail);
                    });
                } else {
                    setMessage("Could not find UI component!");
                    throw "Could not find UI component!";
                }
            });
        });
    }, []);

    return (
        <>
            <blinkid-in-browser></blinkid-in-browser>
            <p>{message}</p>
        </>
    );
};

export default MicroBlinkUI;