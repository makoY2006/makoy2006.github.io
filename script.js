
const appId = '6933336d4b506b575a4933523276355176745249757664766450505334536466';
const appSecret = '6366725365366648673469696430555774784e7235573133464b50666936704d746d4a2d7379393635304e2d4c4c774b306669416e6471345246516463547235';

async function getAccessToken(){
    const response = await fetch('https://api.symbl.ai/oauth2/token:generate', {
    method: 'post',
    headers: {
        'Content-Type': "application/json",
    },
    body: JSON.stringify({
        type: 'application',
        appId: appId,
        appSecret: appSecret
    })
    })
    
    const token = (await response.json()).accessToken
    console.log(token)

    return token
}

async function sendAudioURL(name, url, token){
    const response = await fetch('https://api.symbl.ai/v1/process/audio/url', {
        method: 'post',
        body: JSON.stringify({
            'name': name,
            'url' : url
        }),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


    const data = await response.json();
    console.log(data);

    return data
}


/*
async function sendAudioFile(name, token){
    const formData = new FormData();
    formData.append("audio/mpeg", document.getElementById("file-button").files[0])

    console.log(formData)
    console.log(document.getElementById("file-button").files[0])
    const response = await fetch(`https://api.symbl.ai/v1/process/audio?${JSON.stringify({'name': name,})}`, {
        method: 'post',
        body: formData  ,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

    const data = await response.json();
    console.log(data);

    return data
} */




async function checkCompleted(token, jobId){
    const response = await fetch(`https://api.symbl.ai/v1/job/${jobId}`,{
        method: 'get',
        headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json()
    return data.status
}

async function getIntelligence(token, conversationId){
    const response = await fetch(`https://api.symbl.ai/v1/conversations/${conversationId}/messages?sentiment=true`, {
    method: 'get',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    });

    const data = await response.json()
    console.log(data)
    
    return data.messages
}

async function getData(){
    const accessToken = await getAccessToken()
    const jobData = await sendAudioURL('funny', document.getElementById("url-button").value, accessToken);

    if(jobData.message){
        document.getElementById("display").value = jobData.message
        return false
    }

    var status = ''

    while(status != 'completed'){
        status = await checkCompleted(accessToken, jobData.jobId)
    }

    
    const messages = await getIntelligence(accessToken, jobData.conversationId);
    messages.startTime = new Date(messages[0].startTime)
    if (document.getElementById("offset").value){
        messages.startTime -= document.getElementById("offset").value*1000
    }
    //set the start time to when the first person talks (dunno how to accurately set the start time of the actual video)

    return messages
}

async function playButton(){
    const urlButton = document.getElementById("url-button");
    const playButton = document.getElementById("play-button");
    const loadingButton = document.getElementById("loading-button")

    playButton.hidden = true;
    loadingButton.hidden = false;
    document.getElementById("description").hidden = true;

    if(urlButton.value == '' || urlButton.value == 'Paste URL here'){
        return
    }
    urlButton.disabled = true;
    playButton.disabled = true;
    playButton.src = "";

    const messageData = await getData()

    playButton.hidden = true
    loadingButton.hidden = true;

    if (messageData){
        //playButton.value = "Playing";
    }
    else{
        //playButton.value = "Failed";
        return
    }

    playAudio(urlButton.value);
    await playLoop(messageData.startTime, messageData);
}

async function playLoop(audioStartTime, messageData){
    console.log(audioStartTime)

    for (let i = 0; i < messageData.length; i++) {
        const startTime = new Date(messageData[i].startTime)
        const endTime = new Date(messageData[i].endTime)

        setTimeout(playPhrase, startTime - audioStartTime, messageData, i)
    }
}
function playPhrase(messageData, i){
    const topText = document.getElementById("top-text")
    const display = document.getElementById("display")
    const bottomText = document.getElementById("bottom-text")

    if (messageData[i-1]){
        topText.value = messageData[i-1].text; 
        if (topText.value[topText.value.length-1] == '.'){
            topText.value = topText.value.substring(0, topText.value.length-1)
        }
        if (topText.value.length > 45){
            topText.style.fontSize = "" + 40*45/topText.value.length + "px"
        }else{
            topText.style.fontSize = "40px"
        }
    }else{
        topText.value = ""
    }
    
    display.value = messageData[i].text;
    if (display.value[display.value.length-1] == '.'){
        display.value = display.value.substring(0, display.value.length-1)
    }
    if (display.value.length > 40){
        display.style.fontSize = "" + 50*40/display.value.length + "px"
    }else{
        display.style.fontSize = "50px"
    }

    if (messageData[i+1]){
        bottomText.value = messageData[i+1].text; 
        if (bottomText.value[bottomText.value.length-1] == '.'){
            bottomText.value = bottomText.value.substring(0, bottomText.value.length-1)
        }
        if (bottomText.value.length > 45){
            bottomText.style.fontSize = "" + 40*45/bottomText .value.length + "px"
        }else{
            bottomText.style.fontSize = "40px"
        }
    }else{
        bottomText.value = ""
    }
    
}

function playAudio(url){
    const audio = new Audio(url);
    audio.play();
}
