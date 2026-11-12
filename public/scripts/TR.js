/** Functions in this file should be written to be used by designers on 
 *  all sites. Please try to keep these well-commented and listed alphabetically.
 *  Please make sure to update TR.js on all sites.
 */
/** Takes a number as a string and adds commas as necessary
 *  Example call: addCommasTR(5000 + "") or addCommasTR(myNumber + "")
 */
function addCommasTR( str ) {
	let objRegExp  = new RegExp('(-?[0-9]+)([0-9]{3})');
	while(objRegExp.test(str)) {
		str = str.replace(objRegExp, '$1,$2');
	}
	return str;
}
/** Used to change between multiple tabs
 *  "groupName" is the start of the name of the elements, in most
 *  cases use "tr_tab"
 *  "tabCount" is the number of tabs you have
 *  "selectedTab" is the index of the tab you wish to make active
 *
 *  For this function to work, your tabs must be named tr_tab_0...tr_tab_N
 *  and the content for the tabs is in tr_tab_content_0...tr_tab_content_N
 *  where N is "tabCount"-1 and tr_tab is "groupName"
 * 
 *  Example call: onclick="changeTRTabs('tr_tab', 2, 1);return false;"
 */
function changeTRTabs(groupName, tabCount, selectedTab) {
	let currentTab = document.getElementById(groupName + "_" + selectedTab);
	let currentContent = document.getElementById(groupName + "_content_" + selectedTab);
	//if(currentTab != null) currentTab.className = "current";
	$(currentTab).addClass('current');
	if(currentContent != null) currentContent.style.display = ($('div.modalContainer:visible').length > 0?"block":"flex"); // We need to undo display:block when responsive vehicle selector goes live JRB

	for(let i=0; i<tabCount; i++) {
		if(i==(selectedTab-0)) continue;
		let tempTab = document.getElementById(groupName + "_" + i);
		let tempContent = document.getElementById(groupName + "_content_" + i);
		if(tempTab != null) //tempTab.className = "";
				$(tempTab).removeClass('current');
		if(tempContent != null) tempContent.style.display = "none";
	}
}
/** same as changeTRTabs, but moves the focus to the tab element */
function changeTRTabsAndFocus(groupName, tabCount, selectedTab) {
	changeTRTabs(groupName, tabCount, selectedTab);
	document.getElementById("tr_tab_" + selectedTab).scrollIntoView(true);
}
/** Used to display to a customer how many characters they have available
 *  to enter into a form.
 *  You will use the id of your textarea to name your message area.
 *  For example, if the textarea's id is "writereview", use "writereview_txtmsg" 
 *  as the id of the span that will contain the message text
 *  Example call: onkeyup="checkLengthTR(4000, this)" 
 *  onblur="checkLengthTR(4000, this)"
 */
function checkLengthTR(maxLength, myTextField) {
	let str = new String(myTextField.value);
	let len = str.length;
	let left = (maxLength - len)
	if((maxLength - len) < 0) {
		left = 0;
		myTextField.value=myTextField.value.substring(0, maxLength)
	}
	let showstr = "(" + addCommasTR(maxLength+"") + " characters maximum, " + addCommasTR(left+"") + " remaining)";
	document.getElementById(myTextField.id + '_txtmsg').innerHTML = showstr;
}
/** Used to hide any dom element (div, span, img, etc)
 *  The parameter (myID) is the ID of the object to hide
 *  Example call: onclick="hideTRObject('objectID');return false;"
 */
function hideTRObject(myID)  {
	let el = document.getElementById(myID);
	el.style.display = "none";
	//needed for Safari 2.0.2
  	if(navigator.userAgent.indexOf("Mac") != -1 && 
	  (navigator.userAgent.indexOf("Safari/1") != -1 ||
	   navigator.userAgent.indexOf("Safari/2") != -1 ||
	   navigator.userAgent.indexOf("Safari/3") != -1)) {
		window.resizeTo(self.outerWidth + 1, self.outerHeight);
		window.resizeTo(self.outerWidth - 1, self.outerHeight);
	}
}
/** Used to hide multiple dom elements (div, span, img, etc) by name
 *  The parameter (myName) is the name of the object to hide
 *  Example call: onclick="hideTRObjectsByName('objectName');return false;"
 */
function hideTRObjectsByName(myName)  {
	let el = document.getElementsByName(myName);
	for(let i=0; i<el.length; i++){
		el[i].style.display = "none";
	}

	//needed for Safari 2.0.2
  	if(navigator.userAgent.indexOf("Mac") != -1 && 
	  (navigator.userAgent.indexOf("Safari/1") != -1 ||
	   navigator.userAgent.indexOf("Safari/2") != -1 ||
	   navigator.userAgent.indexOf("Safari/3") != -1)) {
		window.resizeTo(self.outerWidth + 1, self.outerHeight);
		window.resizeTo(self.outerWidth - 1, self.outerHeight);
	}
}

/** Used in a pop-up window so that when the link is clicked, the parent
 *  window is redirected and the pop-up closes
 *  The parameter (myHref) is where you want the parent window to redirect to
 *  Example call: onclick="redirectAndClosePopUp(this.href)"
 */
function redirectAndClosePopUp(myHref) {
	if(opener) {
		opener.location=myHref;
		self.close();
		return false;
	} else {
		return true;
	}
}
/** Used to show (un-hide) and dom element (div, span, img, etc)
 *  The parameter (myID) is the ID of the object to show
 *  The parameter (showInline) is optional and if true, it will display the object inline 
 *  Example call: onclick="showTRObject('objectID');return false;"
 *  Example call: onclick="showTRObject('objectID', true);return false;"
 */
function showTRObject(myID, showInline)  {
	let el = document.getElementById(myID);
	if(showInline){
		el.style.display = "inline";
	}else{
		el.style.display = "block";
	}
	//needed for Safari 2.0.2
  	if(navigator.userAgent.indexOf("Mac") != -1 && 
	  (navigator.userAgent.indexOf("Safari/1") != -1 ||
	   navigator.userAgent.indexOf("Safari/2") != -1 ||
	   navigator.userAgent.indexOf("Safari/3") != -1)) {
		window.resizeTo(self.outerWidth + 1, self.outerHeight);
		window.resizeTo(self.outerWidth - 1, self.outerHeight);
	}
}
/** Used to hide dom elements (div, span, img, etc) by name
 *  The parameter (myName) is the name of the object to show
 *  The parameter (showInline) is optional and if true, it will display the object inline 
 *  Example call: onclick="showTRObject('objectName');return false;"
 *  Example call: onclick="showTRObject('objectName', true);return false;"
 */
function showTRObjectsByName(myName, showInline)  {
	let el = document.getElementsByName(myName);
	for(let i=0; i<el.length; i++){
		if(showInline){
			el[i].style.display = "inline";
		}else{
			el[i].style.display = "block";
		}
	}
	//needed for Safari 2.0.2
  	if(navigator.userAgent.indexOf("Mac") != -1 && 
	  (navigator.userAgent.indexOf("Safari/1") != -1 ||
	   navigator.userAgent.indexOf("Safari/2") != -1 ||
	   navigator.userAgent.indexOf("Safari/3") != -1)) {
		window.resizeTo(self.outerWidth + 1, self.outerHeight);
		window.resizeTo(self.outerWidth - 1, self.outerHeight);
	}
}
/** Used to hide a button and display a "loading" text message
 *  Example call: stopMultiSubmit('buttonID', false) where buttonID is the 
 *  ID of the button to hide and false indicates to use block rather than
 *  inline. This requires a span with id "loading" and a class of 
 *  "loadingMsg" which is initially hidden. It also requires a line of
 *  window.formSubmitted = "false" on the page to begin.
 */
function stopMultiSubmit(buttonID, showInline) {
	if(window.formSubmitted == "true") return false;
	window.formSubmitted = "true";
	if(document.getElementById(buttonID)) {
		hideTRObject(buttonID);
		showTRObject("loading", showInline);
	}
	return true;
}
/** used to toggle an element's visibility between shown and hidden
 *  The parameter (myID) is the ID of the object whose visibility you
 *  want to toggle
 *  Example call: onclick="toggleVisibility('objectID');return false;"
 */
function toggleVisibility(myID, showInline) {
	if(document.getElementById(myID).style.display == "none") {
		if(showInline){
			showTRObject(myID, true);
		}else{
			showTRObject(myID);
		}
	} else {
		hideTRObject(myID);
	}
}

/** used to toggle an element's class
 *  The parameter (myID) is the ID of the object whose class you want to toggle
 *  The parameters (class1) and (class2) are the classes you want to toggle
	Example call: onclick="changeClass('objectID','red','blue');return false;"
	* If the object's class was 'red' it will switch to 'blue and vice versa
*/
function changeClass(myID, class1, class2){
	document.getElementById(myID).className = (document.getElementById(myID).className == class1) ? class2:class1 ;
}

/** Used to create mailto's by grabbing the attributes of an <a href>
 *  Example usage: <a href="#" onclick="return sendIt();" who="jbarden">Email Me</a>
 *  If the email is someone other than TireRack you can add a dom attribute and designate where it should go.
 *  Example dom usage: <a href="#" onclick="return sendIt();" who="someone" dom="example.com">Email Me</a> which would 
 *  send an email to someone@example.com
 *  If the email requires a subject then add a subject attribute.
 *  Example subject usage: <a href="#" onclick="return sendIt(this);" who="someone" subject="Here's my subject!">Email Me</a>
 */
function sendIt(link) {
	let builder = "mail";
	if(link.getAttribute("who") != null) {
		builder += "to:"+link.getAttribute("who");
		if(link.getAttribute("dom") != null) builder += "@"+link.getAttribute("dom");
		else builder += "@tirerack"+".com";
		if(link.getAttribute("subject") != null) builder += "?subject="+link.getAttribute("subject");
		document.location.href=builder;
	}
	return false;
}

/** Used to determine if a passed variable contains a PO Box
 *  The parameter (address) is a string which needs to be stripped of non alphanumeric and space characters, uppercased and
 *  compared to "PO BOX" and "P O BOX" to determine if a P.O. Box address is present.
 */
function containsPOBox(address) {
	let tempAddress = address.replace(/[^a-zA-Z0-9\s]*/g,'').replace(/\s/g,' ').toUpperCase();
	let pattern = new RegExp('(^|\\s)+(p|post)\\s*(o|office)\\s*(box)?\\s*\\d+', 'i');
	return tempAddress.match(pattern); 
}
/** Validates ZIP or Postal Code
 *  If the length is 5 and all numeric, check for valid ZIP
 *  If not numeric, wait for 6 alphanumeric characters before validating
 *  Example call: onkeyup="validateZIP(this)" 
 *  onblur="validateZIP(this)"
 *  Return: invalid -1, valid 1, not ready to check (not long enough) 0
 */
function validateZIP(zipEntry) {
	let str = new String(zipEntry.value.replace(/ /g,''));
	let len = str.length;
	if((len > 0 && !/^[a-zA-Z0-9]+$/.test(str)) || len > 6) {
		return -1;
	} else if(len == 5 && /^\d+$/.test(str)) {
		return 1;
	} else if(len == 6) {
		return 1;
	}
	return 0;
}

/** modifies the css applied to the ZIP code field to indicate success,
 *  failure or neither
 *  Send in "good", "error" or "neutral" as the values
 */
function changeZipStatus(statusState) {
	let zipFields = document.getElementsByName("zip-code");
	if(zipFields != null) {
		for(let i=0; i<zipFields.length; i++) {
			if(statusState == "error") {
				zipFields[i].className = "zip-code zip-code-input eleError";
			} else if(statusState == "good") {
				zipFields[i].className = "zip-code zip-code-input eleSuccess"
			} else {
				zipFields[i].className = "zip-code zip-code-input"
			}
		}
	}
	zipFields = document.getElementsByName("zipCode");
        if(zipFields != null) {
                for(let i=0; i<zipFields.length; i++) {
                        if(statusState == "error") {
                                zipFields[i].className = "zipCode zip-code-input eleError";
                        } else if(statusState == "good") {
                                zipFields[i].className = "zipCode zip-code-input eleSuccess"
                        } else {
                                zipFields[i].className = "zipCode zip-code-input"
                        }
                }
        }
}
/** removes error style from element passed in */
function clearError(myElement) {
        if(myElement && myElement.className && myElement.className.indexOf("eleError") > -1) myElement.className = myElement.className.replace('eleError', '');
}
/** adds error style to form element passed in */
function addErrorClass(myElement) {
        if(myElement) myElement.className += " eleError";
}

/* Creates a basic right/left jQuery slider.
 * You'll need to define the below CSS on a per slider basis.  Refer to Tire Detail product videos for example.
 * The use of dots are optional with this slider.
 *
 * .yourWrapper "slideWrapper" {width:px; height:px}
 * .yourSlide "slide" {width:px}
 * I've set the .slideContainer to 20,000px which should suffice for all occasions but you can make it bigger if need be.
 * You'll then want to create 2 buttons and use trSlideRight(this, i) & trSlideLeft(this, i) to move the slider.
 **/
function trSlideRight(obj, dots) {
	let index = $(obj).find('.slide').index($(obj).find('.active'));
	let slideCount = $(obj).find('.slide').length;
	trSlide(obj, index+1>=slideCount?slideCount-1:index+1, dots);
}
function trSlideLeft(obj, dots) {
	let index = $(obj).find('.slide').index($(obj).find('.active'));
	trSlide(obj, index-1<0?0:index-1, dots);
}
function trSlide(obj, index, dots) {
	$(dots).find(' .red-dot').removeClass('red-dot').addClass('grey-dot');
	$(dots).find(' .dot-'+index).removeClass('grey-dot').addClass('red-dot');
	let slideWidth = $(obj).find('.slide:eq(0)').width();
	let leftTotal = (slideWidth*index);
	$(obj).find('.slide').removeClass('active');
	$(obj).find('.slide:eq('+index+')').addClass('active');
	$(obj).animate({'left':(leftTotal>0?"-"+leftTotal:0)+'px'},300);
}

/** does not append a $ since we seem to be styling those separately 
    formats as X,XXX.XX */
function formatMoney(number) {
	if(number.typeOf == "String") number = number.replace(/,/g,"");
	number = number || 0;
	let places = 2;
	let thousand = ",";
	let decimal = ".";
	let negative = number < 0 ? "-" : ""; 
	let absNumber = Math.abs(+number || 0).toFixed(places)
	let i = Number.parseInt(absNumber, 10) + ""; 
	let j = (j = i.length) > 3 ? j % 3 : 0;
	return negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
}
/** needed to override the default behavior on text entry fields if there
are custom select menus in the form */
function checkEnter(e) {
	if(e.keyCode == 13 || e.which == 13) {
		e.preventDefault();
		return true;
	}
	return false;
}
/** Global JS Email Validation */
function isValidEmail(email){
	email = email.trim();
	let reg = /^[a-zA-Z0-9!#$%&*+=^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&*+=^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
	return (reg.test(email)===true);
}
/** Global JS Error Validation ******
 * Return true/false if an error occurred and updates the input field with the appropriate class. 
 */
function checkInputField(field, checkType) {
	let error = false;
	if(!$(field).length) error = true;
	else {
		let fieldVal = $(field).val().trim();
		$(field).val(fieldVal); // Trim and store trimmed input
		if(checkType=='emailCheck') {
			error = !isValidEmail(fieldVal);
			if(!error) $(field).attr('class','').addClass('eleGreenCheck');
			else $(field).attr('class','').addClass('eleError');
			return;
		} else if(checkType=='email') error = !isValidEmail(fieldVal);
		else if(checkType=='numeric') error = $.isNumeric(fieldVal);
		else if (checkType == 'passwordLogin') error = !(fieldVal.length > 3);
		else if (checkType == 'passwordRegister') {
			error = 0;
			if (fieldVal.length < 12 || fieldVal.length > 30) error += 1;
			if (!/[A-Z]/.test(fieldVal) && !/\d/.test(fieldVal) && !/[!@#$%^&*(),.?":{}|<>\\[\]_+=~`-]/.test(fieldVal)) error += 2;
		}
		else error = !(fieldVal.length>0);
		if(error) $(field).addClass('eleError');
		else $(field).removeClass('eleError');
	}
	return error;
}
