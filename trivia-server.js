
const http = require('http');
const fs = require('fs');
//const path = require('path');

function send404(response) {
	response.writeHead(404, { 'Content-Type': 'text/plain' });
	response.write('Error 404: Resource not found.');
	response.end();
}

const server = http.createServer(function (request, response) {
  if(request.method == 'GET'){
    if(request.url == "/" || request.url == "/trivia.html"){ //loads up the html page
      fs.readFile("./trivia.html", (err,data) => {
        if(err){
					send404(response);
					return;
				}
        response.writeHead(200, { 'content-type' : 'text/html' });
        response.end(data);
      })
    }else if(request.url == "/trivia.js"){
      fs.readFile("./trivia.js", (err, data) => {
        if(err){
					send404(response);
					return;
				}
        response.writeHead(200, { 'content-type': 'application/javascript' });
				response.end(data);
      })
    }
		else{
	    send404(response);
	  }
  }else{
    send404(response);
  }
});

//Server listens on port 3000
server.listen(3000);

const io = require("socket.io")(server);

let listOfPlayers = [];
let json = "";
let question = "";
let roundStart = false;
let question_index = 0;

let socketArray = [];
let msgs = [];

const request = require('request');
const options = {
  url: 'https://opentdb.com/api.php?amount=10',
  method: 'GET'
};

io.on('connection', socket =>{ //.on is similar to onclick, it is a socket onclick handler

	//add events for that socket
	socket.on('disconnect', () => {
		console.log("Somebody left.");
    for(let i = 0; i < listOfPlayers.length; i++){
      if(listOfPlayers[i]["name"] == socket.username){
        listOfPlayers.splice(i,1);
				socketArray.splice(i,1);
        break;
      }
    }
    console.log(listOfPlayers);
    if(listOfPlayers.length == 0){
      roundStart = false;
    }else{
			io.emit("displayPlayers", listOfPlayers);
			io.emit("updateDDList", listOfPlayers);
		}
	})

  socket.on("playerjoined", name =>{

    socket.username = name;
		let socketObject = {"socket": socket, "name": socket.username};
		socketArray.push(socketObject);
		console.log(socketArray);

    let newPlayer = {"name": name, "score": 0, "answered": false};
    listOfPlayers.push(newPlayer);
    console.log(newPlayer);

    if(roundStart==false){ //loads a new test
      request(options, function(error, response, body){
        json = JSON.parse(body);
        question = json["results"][question_index];
        console.log(json);
        console.log(question["question"]);
        io.emit("displayQuestion", question); //will call "loadQuestion" when request is done
      });

      roundStart=true;
    }else{
      socket.emit("displayQuestion", question);
    }

    io.emit("displayPlayers", listOfPlayers);

		io.emit("updateDDList", listOfPlayers);

    console.log("display the players");

  })

	socket.on("newPublicMsg", message => {
		message = socket.username + ": " + message;
		msgs.push(message);
		io.emit("newmsg", message); //sends back to client
	})

	socket.on("newPrivateMsg", messageObject => {
		let message = socket.username + ": " + messageObject["message"];
		for(let i = 0; i < socketArray.length; i++){
			if(socketArray[i]["name"] == messageObject["name"]){
				console.log("Message sent");
				io.to(socketArray[i]["socket"].id).emit("newmsg", message);
			}
		}
		console.log(message);
	})

	socket.on("updateScore", score => {
		console.log(score);
		for(let i = 0; i < listOfPlayers.length; i++){
      if(listOfPlayers[i]["name"] == socket.username){
        listOfPlayers[i]["score"] += score;
        listOfPlayers[i]["answered"] = true;
      }
    }
    let numOfPlayersAnswered = 0;
    for(let i = 0; i < listOfPlayers.length; i++){
      if(listOfPlayers[i]["answered"] == true){
        numOfPlayersAnswered++;
      }
    }
		console.log(listOfPlayers);
    if(numOfPlayersAnswered == listOfPlayers.length){
      for(let i = 0; i < listOfPlayers.length; i++){
        listOfPlayers[i]["answered"] = false;
      }
      if(question_index<4){
        question = json["results"][++question_index];
        io.emit("displayQuestion", question);
      }else{
				let highestScore = listOfPlayers[0]["score"];
				for(let i = 0; i < listOfPlayers.length; i++){
					if(listOfPlayers[i]["score"]>highestScore){
						highestScore=listOfPlayers[i]["score"];
					}
				}
				let winnersArray = [];
				for(let i = 0; i < listOfPlayers.length; i++){
					if(listOfPlayers[i]["score"]==highestScore){
						winnersArray.push(listOfPlayers[i]["name"]);
					}
					listOfPlayers[i]["score"] = 0;
				}
				io.emit("displayWinners", winnersArray);

        request(options, function(error, response, body){
          json = JSON.parse(body);
          question_index = 0;
          question = json["results"][question_index];
          console.log(json);
          console.log(question["question"]);
          io.emit("displayQuestion", question); //will call "loadQuestion" when request is done
        });
      }
			io.emit("displayPlayers", listOfPlayers);
    }else{

			io.emit("displayAnswered", listOfPlayers);
		}
	})

})
