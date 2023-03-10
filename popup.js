const learnButton = document.getElementById('learn');
const mapButton = document.getElementById('start');
const clearButton = document.getElementById('clear');
const selector = document.getElementById("devices");

//for display

//learned input
const learnedElement = document.getElementById('learned');

const learnedData = {
    value: [0,0,0]
};
const learnedHandler = {
    set(target, property, value) {
        // learnedElement.innerText = value;
        if(value[0].toString(2).slice(0,4) === '1001') {
            learnedElement.innerText = 'Channel ' + (value[0] - 143) + ', Note ' + value[1];
        } else if(value[0] === 0) {
            learnedElement.innerText = 'none';
        } else {
            learnedElement.innerText = 'Channel ' + (value[0] - 143) + ', CC ' + value[1];
        }
        return Reflect.set(...arguments);
    },
    get() {
        return Reflect.get(...arguments);
    }
}

const learned = new Proxy(learnedData, learnedHandler);



//target element
const targetElementElement = document.getElementById('element');

const targetElementData = {
    value: {
        tite: 'none'
    }
};
const targetElementHandler = {
    set(target, property, value) {
        targetElementElement.innerText = !value.tagName ? 'none' : value.title ? value.tagName + ' ' + value.title : value.tagName;
        return Reflect.set(...arguments);
    },
    get() {
        return Reflect.get(...arguments);
    }
}

const targetElement = new Proxy(targetElementData, targetElementHandler);


//selected midi input
const selectedMidiInputData = {
    value: {}
};

const selectedMidiInputHandler = {
    set(target, property, value) {
        console.log(value);
        selector.value = value;
        return Reflect.set(...arguments);
    },
    get() {
        return Reflect.get(...arguments);
    }
}

const selectedMidiInput = new Proxy(selectedMidiInputData, selectedMidiInputHandler);

//is learning midi note
const midiInputsData = {
    value: false
};

const midiInputsHandler = {
    set(target, property, value) {
        if(value) {
            value.forEach((value) => {
                const option = document.createElement('option');
                option.innerText = value.name;
                option.value = value.name;
         
                selector.appendChild(option)
            });
        }
        return Reflect.set(...arguments);
    },
    get() {
        return Reflect.get(...arguments);
    }
}

const midiInputs = new Proxy(midiInputsData, midiInputsHandler);

//is learning midi note
const isLearningData = {
    value: false
};

const isLearningHandler = {
    set(target, property, value) {
        if(value) {
            learnedElement.innerText = 'Press MIDI note now!';
        } else {
            learned.value = learned.value;
        }
        return Reflect.set(...arguments);
    },
    get() {
        return Reflect.get(...arguments);
    }
}

const isLearning = new Proxy(isLearningData, isLearningHandler);


//is mapping html element
const isMappingData = {
    value: false
};

const isMappingHandler = {
    set(target, property, value) {
        if(value) {
            targetElementElement.innerText = 'mapping...';
        } else {
            targetElementElement.innerText = !targetElement.value.tagName ? 'none' : targetElement.value.title ? targetElement.value.tagName + ' ' + targetElement.value.title : targetElement.value.tagName;
        }
        return Reflect.set(...arguments);
    },
    get() {
        return Reflect.get(...arguments);
    }
}

const isMapping = new Proxy(isMappingData, isMappingHandler);





async function passToContent(eventName, data) {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });
    const response = await chrome.tabs.sendMessage(tab.id, {
        eventName,
        data
    });
    return response;
}

///////comms routes///////
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch(request.eventName) {
            case 'learning':
                isLearning.value = request.data;
                sendResponse({event: 'learning', data: 'success'});
                break;
            case 'learned':
                learned.value = request.data;
                sendResponse({event: 'learned', data: 'success'});
                break;
            case 'mapping':
                isMapping.value = request.data;
                sendResponse({event: 'mapping', data: 'success'});
                break;
            case 'targetElement':
                console.log('received')
                console.log(request.data);
                targetElement.value = request.data;
                sendResponse({event: 'targetElement', data: 'success'});
                break;
            case 'midiInputs': {
                midiInputs.value = request.data;
                sendResponse({event: 'midiAccess', data: 'success'});
                break;
            }
        }
    }
);



//////UI LISTENERS///////
//learn midi command
learnButton.addEventListener('click', async (e) => {
    const response = await passToContent('learning', !isLearning.value);
    isLearning.value = response.data;
});

//map to element
mapButton.addEventListener('click', (e) => {
    isMapping.value = !isMapping.value;
    
    passToContent('mapping', isMapping.value);
});

//clear
clearButton.addEventListener('click', (e) => {
    isMapping.value = false;
    isLearning.value = false;
    learned.value = [0,0,0];
    targetElement.value = {
        title: 'none'
    };
    
    passToContent('clear', 'clear');
});

selector.addEventListener('input', (e) => {
    const selected = midiInputs.value.find((input) => {
        return input.name === e.target.value;
    });
    passToContent('selectedMidiInput', selected.name);
});

///////////onload//////////
async function updateData() {
    const response = await passToContent('onActivated', true);

    const { selectedMidiInput: savedSelectedMidiInput,
        learned: savedLearned,
        targetElement: savedTargetElement,
        midiInputs: savedMidiInputs } = response.data;

    learned.value = savedLearned;
    targetElement.value = savedTargetElement;
    midiInputs.value = savedMidiInputs;
    if(savedSelectedMidiInput) {
        selectedMidiInput.value = savedSelectedMidiInput;
    }
}
updateData();