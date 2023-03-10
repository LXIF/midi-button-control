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
}

document.addEventListener('mousedown', (e) => {
    if(isMapping) {
        targetElement = e.target;
        isMapping = false;
    }
});

//we need to receive midi device, learned and mapping event

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch(request.eventName) {
            case "mapping":
                sendResponse({event: "mapping", data: request.data});
                isMapping = request.data;
                break;
            case 'selectedMidiInput':
                if(selectedMidiInput) {
                    selectedMidiInput.onmidimessage = undefined;
                }
                selectedMidiInput = midiInputs.find(input => input.name === request.data);
                selectedMidiInput.onmidimessage = getMIDIMessage;
                sendResponse({event: "selectedMidiInput", data: "set"}); 
                break;
            case 'learning':
                isLearning = request.data;
                sendResponse({event: "learning", data: isLearning});
                break;
            case 'clear':
                selectedMidiInput = undefined;
                targetElement = undefined;
                learned = [0,0,0];
                sendResponse({event: 'clear', data: true});
                break;
            case 'onActivated':
                sendResponse({event: 'newActiveTab', data: {
                    targetElement: {
                        tagName: targetElement?.tagName,
                        title: targetElement?.title
                    },
                    selectedMidiInput: selectedMidiInput?.name,
                    learned,
                    midiInputs: midiInputs.map(input => { return { name: input.name } })
                }});
                break;
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
        sendToPopup('learning', false);
        sendToPopup('learned', learned);
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