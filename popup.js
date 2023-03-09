const learnButton = document.getElementById('learn');
const mapButton = document.getElementById('start');
const clearButton = document.getElementById('clear');
const selector = document.getElementById("devices");

let isLearning = false;
let isMapping = false;
const midiInputs = [];
let selectedMidiInput;
let learned = [0,0,0];
let targetElement;

async function passToContent(eventName, data) {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });
    const response = await chrome.tabs.sendMessage(tab.id, {
        eventName,
        data
    });
}

learnButton.addEventListener('click', (e) => {
    isLearning = true;
    passToContent('learning', true);
});

mapButton.addEventListener('click', (e) => {
    isMapping = !isMapping;
    console.log('trying to map');
    passToContent('mapping', isMapping);
});

clearButton.addEventListener('click', (e) => {
    isMapping = !isMapping;
    console.log('trying to map');
    passToContent('clear', 'clear');
});

//////////////MIDI///////////////
//for midi
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
 
        const option = document.createElement('option');
        option.innerText = input.name;
        option.value = input.name;
 
        selector.appendChild(option)
    }
}

selector.addEventListener('input', (e) => {
    selectedMidiInput = midiInputs.find((input) => {
        return input.name === e.target.value;
    });
    passToContent('selectedMidiInput', selectedMidiInput.name);
});


// function getMIDIMessage(midiMessage) {
//     const data = midiMessage.data;

//     // if(isLearning) {
//     //     //set new mapping
//     //     learned = [...data];
//     //     isLearning = false;
//     //     return;
//     // }
// }