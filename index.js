'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()

app.set('port', (process.env.PORT || 5000))

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// ROUTES

app.get('/', function(req, res) {
	res.send("Hi I am a chatbot")
})

let token = "EAALycQlzW8YBACRbYAdjYrOuk0tvPgoPPaK7ryw1NHHD2aYiJ6xRJ1Pe3yb041SmDEb9oofypJ7IxateZC2SudYDtL6mKVWWJinONn8EuY5PhkUZBzSFYktCqYgGBZC0Y4mbv0RBSHJeXXCGJdvmDXR60Je70OZBP5KEt6OTogZDZD"

let apiKey = "it482098928645462174752743661947"
var isFirst = -1
var invalidCheck=false
var tripDay
var tripMonth
var tripYear
var tripDest
var tripSource
var tripPassenger
var monthcheck = 0
// Facebook 

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] === "cafbot") {
		res.send(req.query['hub.challenge'])
	}
	res.send("Wrong token")
})

app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = messaging_events[i]
		let sender = event.sender.id
		if (event.message && event.message.text ) {
			if(event.message.text === 'exit'){
				isFirst = -1
				monthcheck = 0
				invalidCheck = false
				sendText(sender, "I cancelled your request. Please type a messege in order to restart a flight search")
				continue
			}
		}
		if (event.message && event.message.text && isFirst === -1) {
			 let text = event.message.text
	         var day=parseInt(event.message.text)
	         if(day > 0 && day < 32){
	         	console.log("DAYi eşitledim şuna: ", day)
	            tripDay=makeTwoDigits(day)
	            isFirst = 0
	            invalidCheck=false
	         }else if(invalidCheck === false){
	         	console.log("sender: ", sender)
	         	console.log("token: ", token)
	            sendText(sender, "Hello Welcome to CAF Reservation Bot.Now Please can you type the day of the flight (1-31)")
	            invalidCheck=true
	         }else{
	            sendText(sender, "Invalid Input, Please can you type the day of the flight (1-31)")
	         }
         }
		if(event.message && event.message.text && isFirst === 0){
	         var month=parseInt(event.message.text)

	         console.log("Month'u buna eşitledim: ", month)
	         if(month > 0 && month < 13 && monthcheck === 1){
	         	console.log("Month'u eşitledğim ife girdim")
	            tripMonth=makeTwoDigits(month)
	            isFirst = 1
	            invalidCheck=false
	         }else if(invalidCheck === false){
	            sendText(sender, "Thank You , Now Please can you type the month of the flight (1-12)")
	         	console.log("MONTH CHECK i 1 yaptım!!!!")
	            monthcheck = 1
	            invalidCheck=true
	         }else{
	            sendText(sender, "Invalid Input, Please can you type the month of the flight (1-12)")
	         }
		}
         if(event.message && event.message.text && isFirst === 1){
         var year=parseInt(event.message.text)
         if(year > 2016){
            tripYear=year
            isFirst = 2
            invalidCheck=false
         }else if(invalidCheck === false) {
            sendText(sender, "Thank You , Now Please can you type the year of the flight (>= 2017)")
            invalidCheck=true
         }else{
            sendText(sender, "Invalid Input, Now Please can you type the year of the flight (>= 2017)")
         }
         }
         if(event.message && event.message.text && isFirst === 2){
         if(event.message.text !== String(year) && (event.message.text.length<5 && event.message.text.length>2)){
            tripSource=event.message.text
            isFirst = 3
            invalidCheck=false
         }else if(invalidCheck === false){
            sendText(sender, "Please Enter the Source City")
            invalidCheck=true
         }else{
            sendText(sender, "Invalid Input, Please Enter Correct Source City")
         }
         }
         if(event.message && event.message.text && isFirst === 3){
         if(event.message.text !== tripSource && (event.message.text.length<5 && event.message.text.length>2)){
            tripDest=event.message.text
            isFirst = 4
            invalidCheck=false
         }
         else if(invalidCheck === false){
            sendText(sender, "Please Enter the Destination City")
            invalidCheck=true
         }
         else{
            sendText(sender, "Invalid Input, Please Enter Correct Destination City")
         }
         }
         if(event.message && event.message.text && isFirst === 4){
         	var passNum = parseInt(event.message.text)
	         if(passNum < 11 && passNum >0){
		         tripPassenger=event.message.text
		         isFirst = 5
		         invalidCheck=false
	         }
	         else if(invalidCheck === false){
	            sendText(sender, "Please Enter Passanger Number (1-10)")
	            invalidCheck=true
	         }
	         else{
	            sendText(sender, "Invalid Input, Please Enter Correct Passenger Number")
	         }
         }
         if(event.message && event.message.text && isFirst === 5){
           
            getSkyScannerData(sender)
            if(event.message.text !== " "){
                isFirst=-1
                continue
         		}
         }
	}
	
	res.sendStatus(200)
})

function sendText(sender, text) {
	let messageData = {text: text}
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message : messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("sending error")
		} else if (response.body.error) {
			console.log("response body error")
		}
	})
}


function getSkyScannerData(sender){
	var request = require('request');
	var baseUrl = "http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/TR/TRY/en-US/"
	monthcheck = 0

	var requestURI = baseUrl + tripSource + "/" + tripDest + "/" + tripYear + "-" + tripMonth + "-" + tripDay +"//?apiKey=" + apiKey 
	console.log("RequestURI: ",requestURI)
	request(requestURI, function (error, response, body) {
		var info = JSON.parse(body);
		if(info.ValidationErrors){
			sendText(sender, "There is an error due to given information please try again.")
		}else{
			sendText(sender, "Result:")
            sendText(sender, tripDay+"/"+tripMonth+"/"+tripYear+" "+tripSource+"-"+tripDest+" "+tripPassenger+" Passengers")
			console.log(info)
			if(info.Quotes[0]){
				sendText(sender,info.Carriers[0].Name + "has a flight with cost: " + info.Quotes[0].MinPrice + "TRY")
			}
			
			if(info.Quotes[0]){
				sendText(sender,"Departure Time: " + info.Quotes[0].OutboundLeg.DepartureDate)
			}
		}
		 
	});
}

function makeTwoDigits(n){
    return n > 9 ? "" + n: "0" + n;
}

app.listen(app.get('port'), function() {
	console.log("running: port")
})
