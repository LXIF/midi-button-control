let isMapping = false;
let isLearning = false;
let targetElement;
let selectedMidiInput;
let midiInputs = [];
let learned = [0,0,0];

async function sendToPopup(eventName, data) {
    const response = await chrome.runtime.sendMessage({
        eventName,
        data
    });
}

document.addEventListener('mousedown', (e) => {
    if(isMapping) {
        if(e.target.click) {
            targetElement = e.target;
        } else {
            targetElement = e.target.closest('button');
        }
        isMapping = false;
    }
});

//we need to receive midi device, learned and mapping event

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch(request.eventName) {
            case "mapping":
                sendResponse({event: "mapping", data: request.data});
                console.log('mapping')
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
                    allowMIDIAccess()
                        .then((access) => {
                            if(access === 'granted') {
                                console.log('sending');
                                const responseData = {event: 'newActiveTab', data: {
                                    targetElement: {
                                        tagName: targetElement?.tagName,
                                        title: targetElement?.title
                                    },
                                    selectedMidiInput: selectedMidiInput?.name,
                                    learned,
                                    midiInputs: midiInputs.map(input => { return { name: input.name } })
                                    }
                                };
                                console.log(responseData);
                                sendResponse(responseData);
                            } else {
                                sendResponse({
                                    event: 'newActiveTab', data: 'denied'
                                });
                            }
                        });
                break;
        }
        return true;
    }
);

///////MIDI///////

async function allowMIDIAccess() {
    const result = await navigator.permissions.query({ name: 'midi', sysex: false });
    if(result.state === 'granted') {
        try{
            const access = await navigator.requestMIDIAccess({
                sysex: false,
                software: false
            });
            const success = await onMIDISuccess(access);
            if(success) {
                console.log('howdy');
                return 'granted'; 
            }
        } catch (err){
            onMIDIFailure(err);
            return 'granted';
        }
    } else if (result.state === 'prompt') {
        allowMIDIAccess();
    } else if (result.state === 'denied') {
        
        window.alert('You need to grant MIDI access to use MIDI features!');
        return 'denied';
    }
}

function onMIDIFailure(err) {
console.log('Could not access your MIDI devices.');
console.log(err);
}



async function onMIDISuccess(midiAccess) {
    midiInputs = [...midiAccess.inputs.values()];

    midiAccess.onstatechange = (e) => {
        const newInputs = e.target.inputs;

        function compareArrays(array1, array2) {
            return (
                array1.length === array2.length &&
                array1.every((oldInput) => {
                    return array2.find((newInput) => newInput.name === oldInput.name);
                })
            );
        }

        if(!compareArrays(midiInputs, [...newInputs.values()])) {
            midiInputs = [...newInputs.values()];
            sendToPopup('midiInputs', midiInputs.map(input => { return { name: input.name } }));
        }
    }
    return true;
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
        // function traverseNonHTML(target) {
        //     if(!target instanceof HTMLElement) {
        //         console.log(target.parentNode);
        //     }
        // }
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