const socket = io("http://localhost:5000");
const chatContainer = document.getElementById("alm-chat-container");
const msgForm = document.getElementById("msg-form");
const msgInput = document.forms["msg-form"]["msg-input"];

myUsr = JSON.parse(myUsr);

console.log(myRoom);

socket.emit("new-user", myRoom)

socket.on("chat-message", (user, msg) => {
    createMessage(user, msg);
});

msgForm.addEventListener("submit", e => {
    e.preventDefault();
    const msg = msgInput.value;
    socket.emit("send-chat-message", myUsr, msg, myRoom);
    createMessage(myUsr, msg);
    msgInput.value = "";
});

const createMessage = (myuser, msg) => {
    const outer = document.createElement("div");
    outer.classList.add("card");
    outer.classList.add("border-0");
    //outer.classList.add("mt-1");
    //outer.classList.add("ml-1");
    //outer.classList.add("mr-1");
    //outer.classList.add("mw-100");
    chatContainer.append(outer);

    console.log(myuser);

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");
    outer.append(cardBody);

    const media = document.createElement("div");
    media.classList.add("media");
    cardBody.append(media);

    const profImg = document.createElement("img");
    profImg.classList.add("align-self-start");
    profImg.classList.add("mr-3");
    profImg.classList.add("rounded-circle");
    profImg.classList.add("prof-img");
    profImg.src = `/images/${myuser.id}`;
    media.append(profImg);

    const mediaBody = document.createElement("div");
    mediaBody.classList.add("media-body");
    media.append(mediaBody);

    const name = document.createElement("a");
    name.href = `/users/dashboard/${myuser.id}`;
    name.innerHTML = myuser.name;
    mediaBody.append(name);

    const content = document.createElement("p");
    content.classList.add("prevent-overflow");
    content.innerHTML = msg;
    mediaBody.append(content);
}