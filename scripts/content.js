const heldKeys = [];
let isMapping = false;
let isLearning = false;
let targetElement;
let selectedMidiInput;
const midiInputs = [];
let learned = [0,0,0];

async function sendToPopup(eventName, data) {
    const response = await chrome.runtime.sendMessage({
        eventName,
        data
    });
    // do something with response here, not outside the function
    console.log(response);
}

// document.addEventListener('keydown', (e) => {

//     if(!heldKeys.find(key => key === e.key)) {
//         heldKeys.push(e.key);
//     }
//     //if combo
//     if(
//         heldKeys.includes('Meta') &&
//         heldKeys.includes('m')
//     ) {
//         isMapping = true;
//         console.log('Mapping now!');
//     }

//     if(targetElement) {
//         if(e.key === 'Meta') {
//             targetElement.click();
//         }
//     }
// });

// document.addEventListener('keyup', (e) => {
//     const index = heldKeys.indexOf(e.key);
//     heldKeys.splice(index, 1);
// });

document.addEventListener('mousedown', (e) => {
    if(isMapping) {
        targetElement = e.target;
        console.log('Target: ' + targetElement);
        isMapping = false;
        console.log('mapping ended!');
    }
});

//we need to receive midi device, learned and mapping event

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.eventName === "mapping") {
            sendResponse({event: "mapping", data: "ongoing"});
            isMapping = request.data;
        }
        if(request.eventName === 'selectedMidiInput') {
            selectedMidiInput = midiInputs.find(input => input.name === request.data);
            selectedMidiInput.onmidimessage = getMIDIMessage;
            sendResponse({event: "selectedMidiInput", data: "set"}); 
        }
        if(request.eventName === 'learning') {
            isLearning = request.data;
            sendResponse({event: "learning", data: "hehehe"});
        }
        if(request.eventName === 'clear') {
            selectedMidiInput = undefined;
            targetElement = undefined;
            learned = [0,0,0];
        }
    }
);

///////MIDI///////

function allowMIDIAccess() {
    navigator.requestMIDIAccess()
    .then(onMIDISuccess, onMIDIFailure);
}

try {
allowMIDIAccess();
} catch(err) {
console.log(err);
}

function onMIDIFailure() {
console.log('Could not access your MIDI devices.');
}



function onMIDISuccess(midiAccess) {
    for (const input of midiAccess.inputs.values()) {
        midiInputs.push(input);
    }
}

function getMIDIMessage(midiMessage) {
    const data = midiMessage.data;

    if(isLearning) {
        //set new mapping
        learned = [...data];
        isLearning = false;
        console.log('learned');
        return;
    }


    if(data[0] === learned[0] && data[1] === learned[1] && data[2] !== 0) {
       if(targetElement) {
        targetElement.click();
       }
    }
}

function dispatchKey() {
    const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight'
    });
    document.dispatchEvent(event);
}