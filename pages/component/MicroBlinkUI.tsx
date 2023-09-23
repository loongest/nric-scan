"use client";
import * as React from 'react';
import {
    applyPolyfills,
    defineCustomElements
} from '@microblink/blinkid-in-browser-sdk/ui/loader';
// Import typings for UI component
import "@microblink/blinkid-in-browser-sdk/ui";
import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import { SDKError, EventScanError, EventScanSuccess } from "@microblink/blinkid-in-browser-sdk/ui/dist/types/utils/data-structures";

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
        applyPolyfills().then(() => {
            defineCustomElements().then(() => {
              // Reference to the `<blinkid-in-browser>` custom web component
                const blinkIdRef = document.querySelector("blinkid-in-browser") as HTMLBlinkidInBrowserElement;
                const publicFolder = window.location.origin + "/resources/";
                
                if ( blinkIdRef ) { 
                    const blinkId = blinkIdRef;
                
                    blinkId.licenseKey = process.env.NEXT_PUBLIC_LICENSE_KEY||"";
                    blinkId.engineLocation = publicFolder;
                    blinkId.workerLocation = publicFolder + "BlinkIDWasmSDK.worker.min.js";
                    blinkId.recognizers = ["BlinkIdSingleSideRecognizer"];
                    blinkId.addEventListener("fatalError", (ev: CustomEventInit<SDKError>) => {
                        const fatalError = ev.detail;
                        setMessage("Could not load UI component " + fatalError);
                        console.log("Could not load UI component ", fatalError);
                    });
                    blinkId.addEventListener("scanError", (ev: CustomEventInit<EventScanError>) => {
                        const scanError = ev.detail;
                        setMessage("Could not scan a document " + scanError);
                        console.log("Could not scan a document ", scanError);
                    });
                    blinkId.addEventListener("scanSuccess", (ev: CustomEventInit<EventScanSuccess>) => {
                        const scanResults = ev.detail;
                        setMessage("Scan results " + scanResults);
                        console.log("Scan results ", scanResults);
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