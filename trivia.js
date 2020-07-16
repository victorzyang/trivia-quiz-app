let socket = io(); //creates socket that connects to the server

socket.on("updateDDList", ddListOfPlayers);
socket.on("displayQuestion", loadQuestion);
socket.on("displayPlayers", showAllPlayers);
socket.on("newmsg", newmsg);
socket.on("displayAnswered", showAnsweredPlayers);
socket.on("displayWinners", showWinners);

let name = "";
let breakLine = document.createElement("br");
let list;

//joinGame function
function joinGame(){ //called when user clicks the 'Join Game' button
	let textbox = document.getElementById("name");
	name = textbox.value;
	if(name.length > 0){
		socket.emit("playerjoined", name);
	}else{
		alert("You need a name.");
	}
}

function ddListOfPlayers(listOfPlayers){
	list = document.getElementById("dd_list");
	for(let i = list.length-1; i >= 0; i--){
		list.remove(i);
	}

	for(let i = 0; i <= listOfPlayers.length; i++){
		var option = document.createElement("option");
		if(i == 0){
			option.text = "All";
		}else{
			option.text = listOfPlayers[i-1]["name"];
		}
		list.add(option);
	}
}

function sendMessage(){
	let msg = document.getElementById("message").value;
	if(msg.length > 0){
		if(list.selectedIndex == 0){
			socket.emit("newPublicMsg", msg);
		}else{
			let messageObject = {"name": list.options[list.selectedIndex].text, "message": msg};
			socket.emit("newPrivateMsg", messageObject);
		}
	}
}

let currentCorrectAnswer = "";
let score;
let timer;
let counter;
let incorrectList;

//loadQuestion function
function loadQuestion(question){
	score = 100;
	counter = 3;

	document.getElementById("trivia_question").innerHTML = ""; //clears existing text everytime 'displayQuestion' is clicked

	currentCorrectAnswer = question["correct_answer"];

	let num_questions_answered = 0;

	timer = setInterval(updateTimer, 10000);

	var newQuestion = document.createElement("span"); //the question text
	newQuestion.textContent = question["question"];

	document.getElementById("trivia_question").appendChild(newQuestion);
	document.getElementById("trivia_question").appendChild(breakLine);

	incorrectList = [];
	let arr = [];
	arr.push(question["correct_answer"]);
	for(let j = 0; j < question["incorrect_answers"].length; j++){
		arr.push(question["incorrect_answers"][j]);
		incorrectList.push(question["incorrect_answers"][j]);
	}

	let arr2 = [];
	while(arr.length>0){
		let newRandomAnswer = Math.floor(Math.random() * arr.length);
		arr2.push(arr[newRandomAnswer]);
		arr.splice(newRandomAnswer,1); //'splice()' - removes from a specific Array index
	}

	for(let i = 0; i < arr2.length; i++){
		console.log(JSON.stringify(arr2[i]));

		var button = document.createElement("INPUT"); //creates buttons
		button.setAttribute("type", "radio");
		button.setAttribute("name", "group");
		button.setAttribute("id", 3*i+2);
		button.onclick = handler;

		var addedAnswer = document.createElement("span");
		addedAnswer.textContent = arr2[i];

		document.getElementById("trivia_question").appendChild(button);
		document.getElementById("trivia_question").appendChild(addedAnswer);

		let breakLine = document.createElement("br");
		document.getElementById("trivia_question").appendChild(breakLine);
	}

	console.log("test has been created");

}

//timer
function updateTimer(){
	console.log(counter);
	if(counter==0){
		score = 0;
		socket.emit("updateScore", score);
		clearInterval(timer);
	}else{
		if(counter==1){
			if(incorrectList.length > 1){
				let randomIncorrectAnswer = Math.floor(Math.random() * incorrectList.length);
				let children = document.getElementById("trivia_question").children;
				for(let j = 3; j < children.length; j+=3){
					if(children[j].innerHTML == incorrectList[randomIncorrectAnswer]){
						children[j-1].disabled = true;
					}
				}
			}
		}
		score-=25;
		counter--;
	}
}

function handler(){

	let children = document.getElementById("trivia_question").children;

	let selectedAnswer = "";

	for(let j = 2; j < children.length; j+=3){
		if(children[j].checked){
			selectedAnswer = children[j+1].innerHTML;
			console.log(selectedAnswer);
		}
		children[j].disabled = true; //use '.disabled' on radio button to disable radio button
	}

	console.log("Answer has been selected");

	if(selectedAnswer == currentCorrectAnswer){
		console.log("answer is correct");
		console.log(score);
		socket.emit("updateScore", score);
	}else{
		score = -100;
		console.log(score);
		socket.emit("updateScore", score);
	}
	clearInterval(timer);

}

function showAllPlayers(listOfPlayers){
	console.log("Updating players statuses");

	document.getElementById("display_of_scores").innerHTML = "";

	for(let i = 0; i < listOfPlayers.length; i++){
		var playerInfo = document.createElement("span");
		playerInfo.textContent = listOfPlayers[i]["name"] + " --- " + listOfPlayers[i]["score"];

		let breakLine = document.createElement("br"); //creates a line break element

		document.getElementById("display_of_scores").appendChild(playerInfo);
		document.getElementById("display_of_scores").appendChild(breakLine);
		console.log("break line");
	}
}

function showAnsweredPlayers(listOfPlayers){
	var children = document.getElementById("display_of_scores").children;
	for(let i = 0; i < listOfPlayers.length; i++){
		var secondChild = children[i].children;
		if(listOfPlayers[i]["answered"] == true){
			children[i*2].style.backgroundColor = "yellow";
		}
	}
}

function newmsg(message){
	console.log("New message: " + message);
	let newLI = document.createElement("li");
	let text = document.createTextNode(message);
	newLI.appendChild(text);
	document.getElementById("messages").appendChild(newLI);
}

function showWinners(winnersArray){
	let stringWinners = "";
	for(let i = 0; i < winnersArray.length; i++){
		stringWinners += (winnersArray[i] + "\n");
	}
	alert("The winners are:\n" + stringWinners);
}
