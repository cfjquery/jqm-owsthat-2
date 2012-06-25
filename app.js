$(function(){

	//DEFINE THE APPLICATION
	var Owsthat = {};

	(function(app){
		// DEFINE VARIABLES
		var $selectTeam1 = $("#selectTeam1");
		var $selectTeam2 = $("#selectTeam2");
		var $btnStart = $("#btnStart");
        var battingDiceText = ['1','2','3','4','Owsthat','6'];
        var umpireDiceText = ['Bowled','Stumped','Caught','Not Out','No Ball','LBW'];
        var flagsDirectory = 'themes/images/flags/48/';
        var umpireDice = 0;
        var activeTeam = 1;
        var bowlingTeam = 0;
        var battingTeam = 0;
        var activeTeamName = '';
        var activeTeamShortName = '';
        var activeTeamScore = 0;
        var activeTeamExtras = 0;
        var activePlayer = 0;
        var activePlayerScore = 0;
        var activeBowler = 10;
        var bowlNumber = 7;
        var noOfOvers = 0;
        var overScores = '&nbsp;&nbsp;&nbsp;';
		var aryTeamName = new Array();
		var aryTeamShortName = new Array();
		var aryTeamFlag = new Array();
		var aryPlayer = new Array();
		var aryCommentaryText = new Array();
		var aryQty = new Array();
		var extraCommentaryText = '';
		var gameOver = 0;
		var gameInit = 1;
		var sel = '';
		//INITIALISE THE APP
		app.init = function(){
			//GET THE TEAM DATA FROM THE XML FILE
			app.getTeamData();
			//GET THE COMMENTARY DATA FROM THE XML FILE
			app.getCommentaryData();
			//APPLY BINDINGS
			app.bindings();
			//INITIALLY HIDE THE START BUTTON UNTIL TWO TEAMS ARE SELECTED
			$btnStart.hide();
			//INITIALLY HIDE THE PLAY AGAIN BUTTON
			$("#playAgain").hide();
		}
		//GET THE TEAM DATA FROM THE XML FILE
		app.getTeamData = function(){
			$.ajax({
				type: "GET",
				url: "owsthat.xml",
				dataType: "xml",
				success: function(xml) {
					$(xml).find("team").each(function(){
						var teamid = $(this).attr("teamid");
						var teamname = $(this).attr("teamname");
						var teamshortname = $(this).attr("teamshortname");
						var teamflag = $(this).attr("teamflag");
						sel += '<option value="' + teamid + '">' + teamname + '</option>';
						aryTeamName[teamid] = teamname;
						aryTeamShortName[teamid] = teamshortname;
						aryTeamFlag[teamid] =  teamflag;
						aryPlayer[teamid] = new Array();
						$(this).find('player').each(function(){
							var playerID = $(this).attr("id");
							var playerInitials = $(this).find("initials").text();
							var playerName = $(this).find("name").text();
							aryPlayer[teamid][playerID] = playerInitials + ' ' + playerName;						
						});
					});
					$selectTeam1.append(sel);
					$selectTeam2.append(sel);
					$selectTeam1.selectmenu();
					$selectTeam2.selectmenu();
				}
			});
		}
		//GET THE COMMENTARY DATA FROM THE XML FILE
		app.getCommentaryData = function(){
			$.ajax({
				type: "GET",
				url: "commentary.xml",
				dataType: "xml",
				success: function(xml) {
					$(xml).find("type").each(function(){
						var typeid = $(this).attr("typeid");
						var typename = $(this).attr("typename");
						var qty = $(this).attr("qty");
						aryQty[typeid] = qty; 
						aryCommentaryText[typeid] = new Array();
						$(this).find("commentaryText").each(function(){
							var textID = $(this).attr("id");
							var txtValue = $(this).find("txtValue").text();
							aryCommentaryText[typeid][textID] = txtValue;						
						});
					});
				}
			});
		}
		//HIT THE BALL
		function bat(){
      	    bowlNumber++;
	        //ROLL THE DICE
	        var battingDice = rollDice();
	        //INCREMENT THE BOWLING FIGURE
	        bowlingStats();
	        if(battingDice == 5){
	    	    //OWSTHAT
	            umpireDice = rollDice();
	            //NOT OUT
	            if(umpireDice == 4 || umpireDice == 5){
	            	//NO BALL
	                if(umpireDice == 5){
	                	activeTeamExtras++;
	                	//ADD RUNS TO PLAYERS SCORE
	                	activePlayerScore++;
	                	//ADD RUNS TO TEAM SCORE
	                	activeTeamScore++;
	                	//ADD NO BALL TO OVERS SCORES
	                	overScores += ' 1 <sup>nb</sup>';
	                }
	                else{
	                	//ADD DOT BALL TO OVERS SCORES
	                	overScores += ' .';
	                }
		            //GET EXTRA COMMENTARY
		            extraCommentaryText = getExtraCommentary('notout',umpireDice); 
	                //DISPLAY SCORES
	                displayScores(); 
	            }
	            else{
		            //GET EXTRA COMMENTARY
		            extraCommentaryText = getExtraCommentary('out',umpireDice); 
                	//ADD WICKET BALL TO OVERS SCORES
                	overScores += ' w';
	                //DISPLAY SCORES
	                displayScores(); 
	            	//GET NEXT ACTIVE PLAYER
	                activePlayer++;
	                //LAST PLAYER HAS BATTED
	                if(activePlayer == 11){
	                	if(activeTeam == 1){
				        	$("#headerTeamScore_1").html(activeTeamScore);
				        	$("#headerTeamPlayerNo_1").html('All Out');
 	                    	activeTeam++;
	                    	activeTeamScore = 0;
	                    	activeTeamExtras = 0;
	                    	activePlayer = 0;
	                    	activePlayerScore = 0;
	        	        	bowlNumber = 6;
				        	noOfOvers = 0;
							bowlingTeam = $selectTeam1.val();
							battingTeam = $selectTeam2.val();
	   		       			displayScores(); 
	                  	}
	                  	else{
				        	$("#headerTeamScore_2").html(activeTeamScore);
				        	$("#headerTeamPlayerNo_2").html('All Out');
	                  		$("#btnBat").hide();
	                  		displayWinner();
	                  		gameOver = 1;
	                	}
	                }
	                //RESET ACTIVE PLAYER SCORE
	                activePlayerScore = 0;
	            }
	        }
	        else{
	            //ADD RUNS TO PLAYERS SCORE
	            activePlayerScore = activePlayerScore + battingDice;
	            //ADD RUNS TO TEAM SCORE
	            activeTeamScore = activeTeamScore + battingDice;
	            //GET EXTRA COMMENTARY
	            extraCommentaryText = getExtraCommentary('scored',battingDice); 
               	//ADD RUNS TO OVERS SCORES
               	overScores += ' ' + battingDice.toString();
	            //DISPLAY SCORES
	            displayScores(); 
	        }
		}
		//DISPLAY SCORES
		function displayScores(){
			displayHeaderScores();
			displayCommentary();
		}
		//DISPLAY HEADER SCORES
		function displayHeaderScores(){
			$("#headerTeamScore_" + activeTeam).html(activeTeamScore + ' for '); 
			$("#headerTeamPlayerNo_" + activeTeam).html(activePlayer);
			$("#oversPlayed_" + activeTeam).html(noOfOvers + '.' + bowlNumber);
		}
		//ROLL DICE
		function rollDice(){
			dice = (Math.floor(Math.random()*5)+1);
			return dice;
		}
		//GET RANDOM NUNBER
		function getRandomNumber(max){
			max = max - 1;
			number = (Math.floor(Math.random()*max)+1);
			return number;
		}
		//BOWLING STATS
		function bowlingStats(){
	        if(bowlNumber == 7){
	        	if(gameInit == 1){
		        	bowlNumber = 0;
		        	gameInit = 0;
	        	}
	        	else{
		        	bowlNumber = 1;
					overScores = '&nbsp;&nbsp;&nbsp;';
	        	}
	        	noOfOvers++;
	        	chooseBowler();
	        }
		}
		//CHOOSE BOWLER
		function chooseBowler(){
	        var bowlerDice = rollDice();
			switch(bowlerDice){
				case 1: case 2:
					activeBowler = 8;
					break;
				case 3: case 4:
					activeBowler = 9;
					break;
				case 5: case 6:
					activeBowler = 10;
					break;
			}
			displayBowlingText();
		}
		//ADD A SUFFIX TO THE OVERS NUMBER
		function addSuffix(num){
			var suffix = '';
			if(num < 20){
				switch(num){
					case 1: suffix = 'st';
					break;
					case 2: suffix = 'nd';
					break;
					case 3: suffix = 'rd';
					break;
					default: suffix = 'th';
				}
			}
			else{
				strNum = (num).toString().substr(-1);
				switch(strNum){
					case '1': suffix = 'st';
					break;
					case '2': suffix = 'nd';
					break;
					case '3': suffix = 'rd';
					break;
					default: suffix = 'th';
				}
			}
			return (num).toString() + suffix;
		}
		//DISPLAY TEAM SCORE
		function displayTeamScore(){
			$("#headerFlagName_1").attr("src",flagsDirectory + aryTeamFlag[$selectTeam1.val()] + '.png');
			$("#headerTeamName_1").html(aryTeamShortName[$selectTeam1.val()]);
			$("#headerTeamScore_1").html(activeTeamScore);
			$("#headerTeamPlayerNo_1").html(' for ' + activePlayer);
			$("#headerFlagName_2").attr("src",flagsDirectory + aryTeamFlag[$selectTeam2.val()] + '.png');
			$("#headerTeamName_2").html(aryTeamShortName[$selectTeam2.val()]);
			$("#headerTeamScore_2").html('0');
			$("#headerTeamPlayerNo_2").html(' for 0');
		}
 		//DISPLAY COMMENTARY
		function displayCommentary(){
			var commentaryText = ''; 
			commentaryText += '<li>'; 
			commentaryText += '<table>'; 
			commentaryText += '<tr>'; 
			commentaryText += '<td>' + noOfOvers + '.' + bowlNumber + '</td>'; 
			commentaryText += '<td>' + aryPlayer[bowlingTeam][activeBowler] + ' to ' + aryPlayer[battingTeam][activePlayer] + '</td>'; 
			commentaryText += '</tr>'; 
			commentaryText += '<tr>'; 
			commentaryText += '<td></td>'; 
			commentaryText += '<td>' + extraCommentaryText + '</td>'; 
			commentaryText += '</tr>'; 
			commentaryText += '</table>';
			commentaryText += '</li>'; 
			$("#over_" + activeTeam + '_' + noOfOvers).prepend(commentaryText);
			$("#overScores_" + activeTeam + '_' + noOfOvers).html(overScores);
		}
		//DISPLAY BOWLING TEXT
		function displayBowlingText(){
			var commentaryText = '<br/>'; 
			var strOvers = addSuffix(noOfOvers);
			commentaryText += '<li data-role="list-divider" role="heading" class="ui-li ui-li-divider ui-bar-a">';
			commentaryText += '<strong>'; 
			commentaryText += strOvers + ' Over. '; 
			commentaryText += '<span id="overScores_' + activeTeam + '_' + noOfOvers + '"></span>'; 
			commentaryText += '</strong>'; 
			commentaryText += '</li>'; 
			commentaryText += '<div id="over_' + activeTeam + '_' + noOfOvers + '">'; 
			commentaryText += '</div>'; 
			$("#txtCommentary").prepend(commentaryText);
		}
		//DISPLAY WINNER
		function displayWinner(){
      		var txtWinner = '';
      		var diff = '';
      		var txtWinningTeam = '';
      		var t1Score = parseInt($("#headerTeamScore_1").text());
      		var t2Score = parseInt($("#headerTeamScore_2").text());
  			diff = (Math.abs(t1Score - t2Score)).toString();
      		if(t1Score > t2Score){
      			txtWinningTeam = aryTeamName[$selectTeam1.val()];
      		}
      		else
      		{
      			txtWinningTeam = aryTeamName[$selectTeam2.val()];
      		}
  			txtWinner += '<table align="center"><tr><td><strong>' + txtWinningTeam + ' won by ' + diff + ' Runs' + '</strong></td></tr></table>';
			txtWinner += $("#txtCommentary").html();
			$("#txtCommentary").html(txtWinner);
			$("#playAgain").show();
		}
		//GET EXTRA COMMENTARY
		function getExtraCommentary(playType,diceValue){
			var extraText = '';
			var randomNo = 0;
			switch(playType){
				case 'notout':
					randomNo = getRandomNumber(aryQty[0]);
					if(diceValue == 4){
						//NO RUN
						extraText = '<strong>NO RUN. </strong>' + aryCommentaryText[0][randomNo];
					}
					if(diceValue == 5){
						//NO RUN
						extraText = '<strong>NO BALL. </strong>' + aryCommentaryText[0][randomNo];
					}
					break;
				case 'out':
					randomNo = getRandomNumber(aryQty[4]);
					extraText = '<strong>OUT. </strong>' + aryCommentaryText[4][randomNo];
					break;
				case 'scored':
					switch(diceValue){
						case 1:
							randomNo = getRandomNumber(aryQty[1]);
							extraText = '<strong>1 RUN. </strong>' + aryCommentaryText[1][randomNo];
							break;

						case 2:
							randomNo = getRandomNumber(aryQty[1]);
							extraText = '<strong>2 RUNS. </strong>' + aryCommentaryText[1][randomNo];
							break;
						case 3:
							randomNo = getRandomNumber(aryQty[1]);
							extraText = '<strong>3 RUNS. </strong>' + aryCommentaryText[1][randomNo];
							break;
						case 4:
							randomNo = getRandomNumber(aryQty[2]);
							extraText = '<strong>FOUR. </strong>' + aryCommentaryText[2][randomNo];
							break;
						case 6:
							randomNo = getRandomNumber(aryQty[3]);
							extraText = '<strong>SIX. </strong>' + aryCommentaryText[3][randomNo];
							break;
					}
					break;
			}
			return extraText;
		}
		//RESET THE APP TO START A NEW GAME
		app.reset = function(){
			umpireDice = 0;
			activeTeam = 1;
			bowlingTeam = 0;
			battingTeam = 0;
			activeTeamName = '';
			activeTeamShortName = '';
			activeTeamScore = 0;
			activeTeamExtras = 0;
			activePlayer = 0;
			activePlayerScore = 0;
			activeBowler = 10;
			bowlNumber = 7;
			noOfOvers = 0;
			overScores = '&nbsp;&nbsp;&nbsp;';
			extraCommentaryText = '';
			gameOver = 0;
			gameInit = 1;
			$("#txtCommentary").html('');
			$("#selectTeam1").val(-1);
			$("#selectTeam2").val(-1);
			$("#selectTeam1").selectmenu('refresh');
			$("#selectTeam2").selectmenu('refresh');
			$btnStart.hide();
			$("#playAgain").hide();
       		$("#btnBat").show();
	        $.mobile.changePage("owsthat.html");
		}
		//APPLY BINDINGS
		app.bindings = function(){
			$("body").bind("swipeleft", function(e){
				if(gameOver == 0){
					bat();
				}
			});
			//PROCESS THE TEAM SELECTION
			$("#selectTeam1,#selectTeam2").change(function(event){
				if($selectTeam1.val() != -1 && $selectTeam2.val() != -1){
					//SHOW THE START BUTTON
					$btnStart.show();
					displayTeamScore();
				}
			});
			//PROCESS START BUTTON
			$("#btnStart").click(function(event){
				bowlingTeam = $selectTeam2.val();
				battingTeam = $selectTeam1.val();
				bowlingStats();
			});
			//BATTING BUTTON
		    $("#btnBat").click(function(event){
		        bat();
		    });
			//PLAY AGAIN BUTTON
		    $("#btnPlayAgain").click(function(event){
		        gameOver = 0;
		        app.reset();
		    });
		}
		//LAUNCH APPLICATION
		app.init();
	})(Owsthat);
});