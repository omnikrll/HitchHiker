var USER;
chrome.storage.sync.get(function(syncData){
	USER = syncData
	console.log(USER)
	init()
})
chrome.storage.onChanged.addListener(function(){
	chrome.storage.sync.get(function(data){
		USER = data;
	})
})
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	if(message.rooms && USER.role == "audience" && !USER.room){
		showRooms(message.rooms)
	}
	if(message.users){
		// showUsers(message.users)
	}
	if(message.error){
		showError(message.error)
	}
	if(message.joinRoomSuccess){
		joinRoom(message.room)
	}
	if(message.disconnected){
		reset()
	}
})

//event handlers





//on startup
function init(){
	// $('#mainDiv,#reset').hide()
	// $('#currentRoom').html("")
	if(!USER.username){
		USER.username = prompt("What username would you like to go by?")
		USER.username = sanitize(USER.username)
		chrome.storage.sync.set({username:USER.username})
	}
	if(!USER.role){
		$('#guide,#audience').fadeIn()
		$('#audience').click(function(){
			$('#audience,#guide').hide()
			toServer('getRooms')
			USER.role = "audience"
			USER.messages = []
			sync()
		})
		$('#guide').click(function(){
			USER.messages = []
			USER.role = "guide"
			sync()
			var newRoom = prompt("Name your room: ")
			attemptJoinRoom(newRoom)
		})
	} 
	else {
		showChat();
	}

	


}

function showRooms(rooms){
	console.log("showing rooms")
	if($('#roomList').length < 1)
		$('#roomManagement').append("<select id='roomList'></select>")
	$('#roomList').empty().append("<option>Choose an available room:</option>")
	for(var i in rooms){
		console.log(rooms[i].sockets)
		if(!(i in rooms[i].sockets) && i !== 'null' && i !== "lobby")
			$('#roomList').append("<option>"+i+"</option>")
	}
	$('#roomList').change(function(){
		if(this.selectedIndex > 0){
			//audience joins room
			attemptJoinRoom(this.options[this.selectedIndex].value)
		}
	})
}

function showUsers(users){
	for (var i = 0; i < users.length; i++) {
		console.log(users[i])
	}
}
function attemptJoinRoom(room){
	toServer("joinRoom", {room:room, username:USER.username, role:USER.role})
	
}
function joinRoom(room){
	$('#audience,#guide').hide()
	$('#roomList').fadeOut()
	USER.room = room;
	chrome.storage.sync.set({room:room})
	showChat()
	$('#currentRoom').html("<strong>Currently <em>"+USER.role+"</em> in <em>"+USER.room+"</em>")
	chrome.runtime.sendMessage({roomJoined:true})
}
function showGuideTools(){
	$('#guideTools').fadeIn()
	
	$('#actions').load("../modules/guideActions.html",function(){
		bindGuideActions();
	})

}



function showChat(){
	$('#chat').load("../modules/chat.html",function(){
		chatInit()
	})
	if(USER.role == "guide"){showGuideTools()}
	
	$('#mainDiv').fadeIn()

	$('#reset').fadeIn().click(reset)
	
}


function showError(error){
	$('#errorMsg').text(error).fadeIn(400,function(){
		setTimeout(function(){$('#errorMsg').fadeOut()},3000)
	})
}


function toServer(eName, obj={}){
	chrome.runtime.sendMessage({socketEvent: eName, data: obj })
}




function reset(){
	USER.role = false;
	USER.room = false;
	toServer("leaveRoom", USER)
	sync()
	location.reload()
}

function sync(){
	chrome.storage.sync.set(USER)
}

function relay(obj){
	chrome.runtime.sendMessage({socketEvent: "guideEvent", data: obj })
}

function sanitize(string) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}