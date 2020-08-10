const TEMPLATES = ["BioTech", "ClassicTech", "MagicRPG"];

const monthSelect = document.getElementById('monthSelect');
const templateSelect = document.getElementById('templateSelect');
const inputJson = document.getElementById('inputJson');
const generateJsonButton = document.getElementById('generateJson');
const outputJson = document.getElementById('outputJson');
const generationError = document.getElementById('generationError');
const copiedComplete = document.getElementById('copiedComplete');

monthSelect.selectedIndex = (new Date().getMonth() + 1) % 12;
templateSelect.addEventListener("change", onSelectTemplateChangedOption);
generateJsonButton.addEventListener("click", onGenerateJsonButtonClick);
copiedComplete.style.visibility = 'hidden';

let rewardsConfig = [];
outputJson.innerHTML = JSON.stringify(rewardsConfig, null, 2);

for (let i = 0; i < TEMPLATES.length; i++) {
    const option = document.createElement("option");
    option.innerHTML = TEMPLATES[i];
    templateSelect.appendChild(option);
}

function onGenerateJsonButtonClick() {
    try {
        let rewardsList = parseInputJson();

        let monthIndex = monthSelect.selectedIndex;
        generateRewardsConfig(rewardsList, monthIndex);

        outputJson.innerHTML = JSON.stringify(rewardsConfig, null, 2);

        hideError();
    } catch (error) {
        showError(error, "Invalid JSON. See console for more info.");
    }
};


function parseInputJson() {
    let rewardsList = Object.assign({}, JSON.parse(inputJson.value));

    if (rewardsList.length === 0) {
        throw 'No types defined';
    }

    let typeIndex;

    for (typeIndex = 0; typeIndex < rewardsList.length; typeIndex++) {
        if (!rewardsList[typeIndex].type) {
            throw "Missing 'type' property of type with index " + typeIndex;
        }

        if (!rewardsList[typeIndex].rewards) {
            throw "Missing 'rewards' property of type with index " + typeIndex;
        }

        if (rewardsList[typeIndex].rewards.length === 0) {
            throw 'No rewards of type ' + rewardsList[typeIndex].type + ' defined';
        }
    }

    return rewardsList;
}

function generateRewardsConfig(rewardsList, month) {
    rewardsConfig = [];

    let typeIndex = 0;

    rewards = [];

    for (let i = 0; i < 3; i++) {
        let header = {
            day: 0,
            type: rewardsList[i].type
        };

        if (rewardsList[i].description) {
            header.description = rewardsList[i].description;
        }

        let content = [];
        for (let j = 0; j < rewardsList[i].rewards.length; j++) {
            content = rewardsList[i].rewards[j];
            rewardsList[i].rewards[j] = Object.assign(Object.assign({}, header), Object.assign({}, content));
        }

        rewards = rewards.concat(rewardsList[i].rewards);
    }

    let filteredRewardsL = rewards.filter(
        reward => reward.weight === "l"
    );

    let filteredRewardsLM = rewards.filter(
        reward => (reward.weight === "l" || reward.weight === "m")
    );

    let filteredRewardsMH = rewards.filter(
        reward => (reward.weight === "m" || reward.weight === "h")
    );

    const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (i = 1; i <= DAYS[month]; i++) {
        let reward = {};

        if (i < 8) {
            reward = getRandomItemFromArray(filteredRewardsL);
        } else if (i > 23) {
            reward = getRandomItemFromArray(filteredRewardsMH);
        } else {
            reward = getRandomItemFromArray(filteredRewardsLM);
        }

        reward = Object.assign({}, reward);
        reward.day = i;
        delete reward.weight;
        rewardsConfig.push(reward);
    }
}

function getRandomItemFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

document.getElementById('copyJson').onclick = copyJsonToClipboard;

function copyJsonToClipboard() {
    let input = document.createElement('textarea');

    document.body.appendChild(input);

    input.value = JSON.stringify(rewardsConfig, null, 2);
    input.select();

    document.execCommand('copy');

    document.body.removeChild(input);

    delete input;

    copiedComplete.style.visibility = 'visible';

    setTimeout(() => {
        copiedComplete.style.visibility = 'hidden'
    }, 3000);
}

function showError(error, errorText = '') {
    generationError.style.visibility = 'visible';
    generationError.innerHTML = "<b>Unknown error!</b> See console for details.";

    if (errorText != '') {
        generationError.innerHTML = "<b>Error!</b> " + errorText;
    }

    console.error(error);
}

function hideError() {
    generationError.style.visibility = 'hidden';
}

function onSelectTemplateChangedOption() {
    let templateName = templateSelect.options[templateSelect.selectedIndex].text;

    if (templateSelect.selectedIndex == 0) {
        inputJson.value = "";
        return;
    }

    axios.get(`templates/${templateName}.json`).then((res) => {
        inputJson.value = JSON.stringify(res.data, null, 2);
    }).catch((error) => {
        showError(error, "Failed to load template "+`(templates/${templateName}.json)`)
    })
}
