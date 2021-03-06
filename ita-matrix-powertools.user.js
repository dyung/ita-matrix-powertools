// ==UserScript==
// @name DL/ORB Itinary Builder
// @namespace https://github.com/SteppoFF/ita-matrix-powertools
// @description Builds fare purchase links
// @version 0.13a
// @grant GM_getValue
// @grant GM_setValue
// @include http*://matrix.itasoftware.com/*
// ==/UserScript==
/*
 Written by paul21, Steppo & IAkH of FlyerTalk.com
 http://www.flyertalk.com/forum/members/paul21.html
 Includes contriutions by 18sas
 Copyright Reserved -- At least share with credit if you do
*********** Latest Changes **************
**** Version 0.13a ****
# 2015-08-07 Edited by Steppo ( class names updated )
**** Version 0.13 ****
# 2015-06-15 Edited by Steppo ( fixed miles/passenger/price extraction,
                                 moved itin-data to global var "currentItin" -> capability to modify/reuse itin,
                                 rearranged config section,
                                 introduced wheretocredit.com,
                                 introduced background resolving of detailed distances using farefreaks.com based on data of OurAirports.com,
                                 tested on FF38, IE11, IE10 (emulated)
                                 )
**** Version 0.12 ****
# 2015-06-13 Edited by IAkH ( added CheapOair )
**** Version 0.11d ****
# 2015-06-06 ( class names updated )
**** Version 0.11c ****
# 2015-05-13 Edited by Steppo ( fixed class names )
**** Version 0.11b ****
# 2015-04-26 Edited by Steppo ( made Planefinder/Seatguru switchable)
**** Version 0.11a ****
# 2015-04-20 Edited by Steppo (fixed Bug in findItinTarget for one-seg-flights,
                                fixed typo,
                                added CSS fix for startpage)
**** Version 0.11 ****
# 2015-04-19 Edited by Steppo (added SeatGuru,
                                added Planefinder,
                                moved translation to external var/function adding capability to add translations,
                                added possibility to print notifications,
                                added self-test to prevent crashing on class-changes,
                                set timeout of resultpage to 10s,
                                added powerfull selector-function to get desired td in itin => see findItinTarget,
                                moved exit in frames to top,
                                some cleanups,
                                moved older changelogitems to seperate file on GitHub - no one wants to read such lame stuff :-) )
*********** About **************
 --- Resultpage ---
  # collecting a lot of information in data-var
  # based on gathered data-var: creating links to different OTAs and other pages
  # able to transform timeformat into 24h format
  # able to translate some things
 *********** Hints ***********
  Unsure about handling of different fares/pax. 
  Unsure about correct usage of cabins while creating links.
  Unsure about correct usage of farebase-per-leg - usage in order of appearance.
  Unsere about segment-skipping - should be fine but needs heavy testing.
*/
/**************************************** Start Script *****************************************/
// User settings
var mptUsersettings = new Object();
mptUsersettings["timeformat"] = "12h"; // replaces times on resultpage - valid: 12h / 24h
mptUsersettings["language"] = "en"; // replaces several items on resultpage - valid: en / de
mptUsersettings["enableDeviders"] = 1; // Print deviders in links after group (airlines/otas/other stuff) - valid: 0 / 1
mptUsersettings["enableInlinemode"] =  0; // enables inline mode - valid: 0 / 1
mptUsersettings["enableIMGautoload"] = 0; // enables images to auto load - valid: 0 / 1
mptUsersettings["enableFarerules"] = 1; // enables fare rule opening in new window - valid: 0 / 1
mptUsersettings["enablePricebreakdown"] =  1; // enables price breakdown - valid: 0 / 1
mptUsersettings["enableMilesbreakdown"] =  1; // enables miles breakdown - valid: 0 / 1
mptUsersettings["enableMilesbreakdownautoload"] =  0; // enables autoload of miles breakdown - valid: 0 / 1
mptUsersettings["enableMilesInlinemode"] =  0; // always print miles breakdown inline - valid: 0 / 1


mptUsersettings["enablePlanefinder"] =  1; // enables Planefinder - click on flight numbers to open Planefinder for this flight - valid: 0 / 1
mptUsersettings["enableSeatguru"] =  1; // enables Seatguru - click on plane type to open Seatguru for this flight - valid: 0 / 1
mptUsersettings["enableWheretocredit"] =  1; // enables Wheretocredit - click on booking class to open wheretocredit for this flight - valid: 0 / 1
mptUsersettings["acEdition"] = "us"; // sets the local edition of AirCanada.com for itinerary pricing - valid: "us", "ca", "ar", "au", "ch", "cl", "cn", "co", "de", "dk", "es", "fr", "gb", "hk", "ie", "il", "it", "jp", "mx", "nl", "no", "pa", "pe", "se"

// *** DO NOT CHANGE BELOW THIS LINE***/
// General settings
var mptSettings = new Object();
mptSettings["itaLanguage"]="en";
mptSettings["retrycount"]=1;
mptSettings["laststatus"]="";
mptSettings["scriptrunning"]=1;

if (typeof GM_info === "undefined") {
   mptSettings["scriptEngine"]=0; // console mode
  }
else {
  mptSettings["scriptEngine"]=1; // tamper or grease mode
  var mptSavedUsersettings = GM_getValue("mptUsersettings", "");
  if (mptSavedUsersettings) {
    mptSavedUsersettings = JSON.parse(mptSavedUsersettings);
    mptUsersettings["timeformat"] = (mptSavedUsersettings["timeformat"] === undefined ? mptUsersettings["timeformat"] : mptSavedUsersettings["timeformat"]);
    mptUsersettings["language"] = (mptSavedUsersettings["language"] === undefined ? mptUsersettings["language"] : mptSavedUsersettings["language"]);
    mptUsersettings["enableDeviders"]=(mptSavedUsersettings["enableDeviders"] === undefined ? mptUsersettings["enableDeviders"] : mptSavedUsersettings["enableDeviders"]);
    mptUsersettings["enableInlinemode"] = (mptSavedUsersettings["enableInlinemode"] === undefined ? mptUsersettings["enableInlinemode"] : mptSavedUsersettings["enableInlinemode"]);
    mptUsersettings["enableIMGautoload"] = (mptSavedUsersettings["enableIMGautoload"] === undefined ? mptUsersettings["enableIMGautoload"] : mptSavedUsersettings["enableIMGautoload"]);
    mptUsersettings["enableFarerules"] = (mptSavedUsersettings["enableFarerules"] === undefined ? mptUsersettings["enableFarerules"] : mptSavedUsersettings["enableFarerules"]);
    mptUsersettings["enablePricebreakdown"] = (mptSavedUsersettings["enablePricebreakdown"] === undefined ? mptUsersettings["enablePricebreakdown"] : mptSavedUsersettings["enablePricebreakdown"]);
    mptUsersettings["enableMilesbreakdown"] = (mptSavedUsersettings["enableMilesbreakdown"] === undefined ? mptUsersettings["enableMilesbreakdown"] : mptSavedUsersettings["enableMilesbreakdown"]);
    mptUsersettings["enableMilesbreakdownautoload"] = (mptSavedUsersettings["enableMilesbreakdownautoload"] === undefined ? mptUsersettings["enableMilesbreakdownautoload"] : mptSavedUsersettings["enableMilesbreakdownautoload"]);
    mptUsersettings["enableMilesInlinemode"] = (mptSavedUsersettings["enableMilesInlinemode"] === undefined ? mptUsersettings["enableMilesInlinemode"] : mptSavedUsersettings["enableMilesInlinemode"]);
    mptUsersettings["enablePlanefinder"] = (mptSavedUsersettings["enablePlanefinder"] === undefined ? mptUsersettings["enablePlanefinder"] : mptSavedUsersettings["enablePlanefinder"]);
    mptUsersettings["enableSeatguru"] = (mptSavedUsersettings["enableSeatguru"] === undefined ? mptUsersettings["enableSeatguru"] : mptSavedUsersettings["enableSeatguru"]);
    mptUsersettings["enableWheretocredit"] = (mptSavedUsersettings["enableWheretocredit"] === undefined ? mptUsersettings["enableWheretocredit"] : mptSavedUsersettings["enableWheretocredit"]);
    mptUsersettings["acEdition"] = (mptSavedUsersettings["acEdition"] === undefined ? mptUsersettings["acEdition"] : mptSavedUsersettings["acEdition"]);  
  }
}

var acEditions = ["us", "ca", "ar", "au", "ch", "cl", "cn", "co", "de", "dk", "es", "fr", "gb", "hk", "ie", "il", "it", "jp", "mx", "nl", "no", "pa", "pe", "se"];

var classSettings = new Object();
classSettings["startpage"] = new Object();
classSettings["startpage"]["maindiv"]="IR6M2QD-w-d"; //Container of main content. Unfortunately id "contentwrapper" is used twice
classSettings["resultpage"] = new Object();
classSettings["resultpage"]["itin"]="IR6M2QD-A-d"; //Container with headline: "Intinerary"
classSettings["resultpage"]["itinRow"]="IR6M2QD-k-i"; // TR in itin with Orig, Dest and date
classSettings["resultpage"]["milagecontainer"]="IR6M2QD-A-e"; // TD-Container on the right
classSettings["resultpage"]["rulescontainer"]="IR6M2QD-l-d"; // First container before rulelinks (the one with Fare X:)
classSettings["resultpage"]["htbContainer"]="IR6M2QD-F-k"; // full "how to buy"-container inner div (td=>div=>div) 
classSettings["resultpage"]["htbLeft"]="IR6M2QD-l-g"; // Left column in the "how to buy"-container
classSettings["resultpage"]["htbRight"]="IR6M2QD-l-f"; // Class for normal right column
classSettings["resultpage"]["htbGreyBorder"]="IR6M2QD-l-l"; // Class for right cell with light grey border (used for subtotal of passenger)
//inline
classSettings["resultpage"]["mcDiv"]="IR6M2QD-U-e";  // Right menu sections class (3 divs surrounding entire Mileage, Emissions, and Airport Info)
classSettings["resultpage"]["mcHeader"]="IR6M2QD-U-b"; // Right menu header class ("Mileage", etc.)
classSettings["resultpage"]["mcLinkList"]="IR6M2QD-U-c"; // Right menu ul list class (immediately following header)

var translations = new Object();
translations["de"] = new Object();
translations["de"]["openwith"]="&Ouml;ffne mit";
translations["de"]["resultpage"] = new Object();
translations["de"]["resultpage"]["Dep:"]="Abflug:";
translations["de"]["resultpage"]["Arr:"]="Ankunft:";
translations["de"]["resultpage"]["Layover in"]="Umst. in";
translations["de"]["resultpage"][" to "]=" nach ";
translations["de"]["resultpage"]["Mon,"]="Mo.,";
translations["de"]["resultpage"]["Tue,"]="Di.,";
translations["de"]["resultpage"]["Wed,"]="Mi.,";
translations["de"]["resultpage"]["Thu,"]="Do.,";
translations["de"]["resultpage"]["Fri,"]="Fr.,";
translations["de"]["resultpage"]["Sat,"]="Sa.,";
translations["de"]["resultpage"]["Sun,"]="So.,";
translations["de"]["resultpage"][" Jan "]=" Januar ";
translations["de"]["resultpage"][" Feb "]=" Februar ";
translations["de"]["resultpage"][" Mar "]=" M&auml;rz ";
translations["de"]["resultpage"][" Apr "]=" April ";
translations["de"]["resultpage"][" May "]=" Mai ";
translations["de"]["resultpage"][" Jun "]=" Juni ";
translations["de"]["resultpage"][" Jul "]=" Juli ";
translations["de"]["resultpage"][" Aug "]=" August ";
translations["de"]["resultpage"][" Sep "]=" September ";
translations["de"]["resultpage"][" Oct "]=" Oktober ";
translations["de"]["resultpage"][" Nov "]=" November ";
translations["de"]["resultpage"][" Dez "]=" Dezember ";
translations["de"]["resultpage"]["OPERATED BY "]="Durchgef&uuml;hrt von ";

// initialize local storage for resolved distances
var distances = new Object();
// initialize local storage for current itin
var currentItin = new Object();

if (mptSettings["scriptEngine"] === 0 && window.top === window.self) {
 startScript(); 
} else if( window.top === window.self ) {
  // execute language detection and afterwards functions for current page
  if (typeof window.addEventListener !== "undefined"){
  window.addEventListener('load', startScript(), false);
  } else if (typeof window.attachEvent !== "undefined") {
  window.attachEvent("onload", startScript());    
  } else {
  window.onload = startScript();
  }
}

function startScript(){
  if (document.getElementById("mptSettingsContainer") === null ) {
  createUsersettings();
  }
  if (window.location.href !== mptSettings["laststatus"]){
    setTimeout(function(){getPageLang();}, 100);
    mptSettings["laststatus"]=window.location.href;
  }
  if ( mptSettings["scriptrunning"] === 1 ){
   setTimeout(function(){startScript();}, 500); 
  }  
}

/**************************************** Settings Stuff *****************************************/
function createUsersettings(){
    var str="";
    var settingscontainer = document.createElement('div');
    settingscontainer.setAttribute('id', 'mptSettingsContainer');
    settingscontainer.setAttribute('style', 'border-bottom: 1px dashed grey;');
    settingscontainer.innerHTML = '<div><div style="display:inline-block;float:left;">Powertools running</div><div id="mtpNotification" style="margin-left:50px;display:inline-block;"></div><div id="settingsvistoggler" style="display:inline-block;float:right;cursor:pointer;">Show/Hide Settings</div><div id="mptSettings" class="invis" style="display:none;border-top: 1px dotted grey;"><div>';
    var target=document.getElementById("contentwrapper");
    target.parentNode.insertBefore(settingscontainer, target);
    document.getElementById('settingsvistoggler').onclick=function(){toggleSettingsvis();};
    target=document.getElementById("mptSettings");
    str ='<div style="float:left;width:25%">';
    str +='<div id="mpttimeformat" style="cursor:pointer;">Timeformat:<label>'+printSettingsvalue("timeformat")+'</label></div>';   
    str +='<div id="mptlanguage" style="cursor:pointer;">Language:<label>'+printSettingsvalue("language")+'</label></div>';
    str +='<div id="mptenableDeviders" style="cursor:pointer;">Enable deviders:<label>'+printSettingsvalue("enableDeviders")+'</label></div>';
    str +='<div id="mptenableInlinemode" style="cursor:pointer;">Inlinemode:<label>'+printSettingsvalue("enableInlinemode")+'</label></div>';
    str +='<div id="mptenableFarerules" style="cursor:pointer;">Open fare-rules in new window:<label>'+printSettingsvalue("enableFarerules")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenablePricebreakdown" style="cursor:pointer;">Price breakdown:<label>'+printSettingsvalue("enablePricebreakdown")+'</label></div>'; 
    str +='<div id="mptenableMilesbreakdown" style="cursor:pointer;">Miles breakdown:<label>'+printSettingsvalue("enableMilesbreakdown")+'</label></div>';
    str +='<div id="mptenableMilesbreakdownautoload" style="cursor:pointer;">Miles breakdown autoload:<label>'+printSettingsvalue("enableMilesbreakdownautoload")+'</label></div>';
    str +='<div id="mptenableMilesInlinemode" style="cursor:pointer;">Print miles breakdown inline:<label>'+printSettingsvalue("enableMilesInlinemode")+'</label></div>';
    str +='<div id="mptenableIMGautoload" style="cursor:pointer;">Images autoload:<label>'+printSettingsvalue("enableIMGautoload")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';
    str +='<div id="mptenablePlanefinder" style="cursor:pointer;">Enable Planefinder:<label>'+printSettingsvalue("enablePlanefinder")+'</label></div>';
    str +='<div id="mptenableSeatguru" style="cursor:pointer;">Enable Seatguru:<label>'+printSettingsvalue("enableSeatguru")+'</label></div>';
    str +='<div id="mptenableWheretocredit" style="cursor:pointer;">Enable WhereToCredit:<label>'+printSettingsvalue("enableWheretocredit")+'</label></div>';
    str +='</div><div style="float:left;width:25%">';  
    str +='<div id="mptacEdition" style="cursor:pointer;">Air Canada Edition:<label>'+printSettingsvalue("acEdition")+'</label></div>';
    str +='</div><div style="clear:both;"></div>';
    target.innerHTML=str;
    document.getElementById('mpttimeformat').onclick=function(){toggleSettings("timeformat");};
    document.getElementById('mptlanguage').onclick=function(){toggleSettings("language");};
    document.getElementById('mptenableDeviders').onclick=function(){toggleSettings("enableDeviders");};
    document.getElementById('mptenableInlinemode').onclick=function(){toggleSettings("enableInlinemode");};
    document.getElementById('mptenableIMGautoload').onclick=function(){toggleSettings("enableIMGautoload");};
    document.getElementById('mptenableFarerules').onclick=function(){toggleSettings("enableFarerules");};
    document.getElementById('mptenablePricebreakdown').onclick=function(){toggleSettings("enablePricebreakdown");};
    document.getElementById('mptenableMilesbreakdown').onclick=function(){toggleSettings("enableMilesbreakdown");};
    document.getElementById('mptenableMilesbreakdownautoload').onclick=function(){toggleSettings("enableMilesbreakdownautoload");}; 
    document.getElementById('mptenableMilesInlinemode').onclick=function(){toggleSettings("enableMilesInlinemode");};
    document.getElementById('mptenablePlanefinder').onclick=function(){toggleSettings("enablePlanefinder");};
    document.getElementById('mptenableSeatguru').onclick=function(){toggleSettings("enableSeatguru");};
    document.getElementById('mptenableWheretocredit').onclick=function(){toggleSettings("enableWheretocredit");};
    document.getElementById('mptacEdition').onclick=function(){toggleSettings("acEdition");};
}
function toggleSettingsvis(){
  var target=document.getElementById("mptSettings");
  if (hasClass(target,"vis")){
    target.setAttribute('class', 'invis');
    target.style.display="none"; 
  } else {
    target.setAttribute('class', 'vis');
    target.style.display="block"; 
  }
}
function toggleSettings(target){
   switch(target) {
      case "timeformat":
         if (mptUsersettings["timeformat"]=="12h"){
           mptUsersettings["timeformat"]="24h";
         } else {
           mptUsersettings["timeformat"]="12h";
         }
          break;
      case "language":
         if (mptUsersettings["language"]=="de"){
           mptUsersettings["language"]="en";
         } else {
           mptUsersettings["language"]="de";
         }
          break;
      case "acEdition":
      		if (acEditions.indexOf(mptUsersettings["acEdition"]) == (acEditions.length - 1)) {
			      mptUsersettings["acEdition"] = acEditions[0];
      		} else {
      			mptUsersettings["acEdition"] = acEditions[(acEditions.indexOf(mptUsersettings["acEdition"]) + 1)];	
      		}
      	break;
      default:
        if (mptUsersettings[target]==1){
           mptUsersettings[target]=0;
         } else {
           mptUsersettings[target]=1;
         };
  }
  document.getElementById("mpt"+target).firstChild.nextSibling.innerHTML=printSettingsvalue(target);
  if (mptSettings["scriptEngine"] === 1) {
      GM_setValue("mptUsersettings", JSON.stringify(mptUsersettings));
    }
}

function printSettingsvalue(target){
   var ret="";
   switch(target) {
      case "timeformat":
          ret=mptUsersettings["timeformat"];
          break;
      case "language":
          ret=mptUsersettings["language"];
          break;
      case "acEdition":
          ret=mptUsersettings["acEdition"];
          break;
      default:
          ret=boolToEnabled(mptUsersettings[target]);
  }
  return ret; 
}

function printNotification(text) {
  var target = document.getElementById('mtpNotification');
  if (target===null){
    alert("mtp Error: Notification container not Found");
  } else {
   if (text=="empty"){
     target.innerHTML= "";
   } else {
     //possibility to print multiple notifications
     target.innerHTML= target.innerHTML+"<div>"+text+"</div>";
   }   
  } 
}
/**************************************** Get Language *****************************************/
function getPageLang(){
    // reset Notification due to pagechange
    printNotification("empty");
    mptSettings["itaLanguage"]="en";
    mptSettings["retrycount"]=1;
    if (window.location.href.indexOf("view-details") !=-1) {
       setTimeout(function(){fePS();}, 200);   
    } else if (window.location.href.indexOf("#search:") !=-1 || window.location.href == "https://matrix.itasoftware.com/" || window.location.href == "https://matrix.itasoftware.com/") {
       setTimeout(function(){startPage();}, 200);   
    }
}
/**************************************** General Functions *****************************************/
//Parses all of the outputs of regexp matches into an array
function exRE(str,re){
  var ret= new Array();
  var m;
  var i=0;
  while( (m = re.exec(str)) != null ) {
  if (m.index === re.lastIndex) {
  re.lastIndex++;
  }
  for (k=1;k<m.length;k++) {
  ret[i++]=m[k];
  }
  }
  return ret;
}
function inArray(needle, haystack) {
    var length = haystack.length;
    for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
    }
    return false;
}
function monthnameToNumber(month){
  var monthnames=["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP","OCT", "NOV", "DEC"];
  return (monthnames.indexOf(month.toUpperCase())+1);
}
function monthnumberToName(month){
  var monthnames=["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP","OCT", "NOV", "DEC"];
  return (monthnames[month-1]);
}
function getFlightYear(day,month){
 //Do date magic
    var d = new Date();
    var cmonth=d.getMonth();
    var cday=d.getDate();
    var cyear=d.getFullYear();
  // make sure to handle the 0-11 issue of getMonth()
    if (cmonth > (month-1) || (cmonth == (month-1) && day < cday)) {
    cyear += 1; //The flight is next year
    }
   return cyear;
}
function return12htime(match){
        var regex = /([01]?\d)(:\d{2})(AM|PM|am|pm| AM| PM| am| pm)/g;
        match = regex.exec(match);
        var offset = 0;
        match[3]=trimStr(match[3]);
        if  ((match[3]=='AM' || match[3]=='am') && match[1]=='12'){offset = -12;}
        else if  ((match[3]=='PM' || match[3]=='pm') && match[1]!='12'){ offset = 12;}
        return (+match[1] + offset) +match[2];        
};
function trimStr(x) {
    return x.replace(/^\s+|\s+$/gm,'');
}
function boolToEnabled(value){
   if (value==1) {
   return "enabled"
   } else {
   return "disabled"
   }
}
function getcabincode(cabin){
  switch(cabin) {
      case "E":
          cabin=0;
          break;
      case "P":
          cabin=1;
          break;
      case "B":
          cabin=2;
          break;
      case "F":
          cabin=3;
          break;
      default:
          cabin=0;
  }
  return cabin;
}
function findtarget(tclass,nth){
  var elems = document.getElementsByTagName('*'), i;
  j=0;
  for (i in elems) {
       if((' ' + elems[i].className + ' ').indexOf(' '+tclass+' ') > -1) {
        j++;
        if (j==nth){
         return elems[i];
         break;
        }
       }
   }
}
function findtargets(tclass){
  var elems = document.getElementsByTagName('*'), i;
  var ret = new Array();
  for (i in elems) {
       if((' ' + elems[i].className + ' ').indexOf(' '+tclass+' ') > -1) {
         ret.push(elems[i]);
       }
   }
  return ret;
}
function hasClass(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}
function doHttpRequest(url,callback){
  if (typeof(callback) !== "function") {
       printNotification("Error: Invalid callback in doHttpRequest -> not a function");
       return false;  
  }
  var xmlHttpObject = false;
  if (typeof(XMLHttpRequest) !== "undefined"){ xmlHttpObject = new XMLHttpRequest(); }
  if (!xmlHttpObject) {
       printNotification("Error: Failed to initialize http request");
       return false;  
  }
  xmlHttpObject.onreadystatechange=function(){
    if (xmlHttpObject.readyState==4 && xmlHttpObject.status==200)
      {
      callback(xmlHttpObject);
      } else if (xmlHttpObject.readyState==4 && xmlHttpObject.status!=200) {
       printNotification("Error: Failed to complete http request");
       return false;  
      }   
   } 
  xmlHttpObject.open("GET",url,true);
  xmlHttpObject.send();
}
function findItinTarget(leg,seg,tcell){
  var target = findtarget(classSettings["resultpage"]["itin"],1);
  if (target === false) {
  printNotification("Error: Itin not found in findItinTarget-function");
  return false;
  }
  
  target=target.nextSibling.nextSibling;
  // go to leg
  var target=target.children[(leg-1)];
  if (target === undefined) {
  printNotification("Error: Leg not found in findItinTarget-function");
  return false;
  }
  // go to segments of leg
  target=target.children[1].children;
  if (target.length >= 2) {
      // go to desired segment
      var index = 0;
      var j = 0;
      for(i=0;i<target.length;i++) {
       if( hasClass(target[i], classSettings["resultpage"]["itinRow"]) == 1) {
         j++;
          if (j>=seg){
            index = i;
            //special handling for one-seg-legs here
            if (target.length === 2 || target.length === 3){
              // 1. Headline 2. Flight-details 3. arrival next day.. 
              index--;
            }
            break;
          }
        }
      } // end-for
      if (i==target.length){
        //target not found
        printNotification("Error: Call to unreachable Segment in Leg "+leg+" in findItinTarget-function");
        return false;
      }
      var rowoffset=0;
      var columnoffset=0;
      
      switch(tcell) {
          case "headline":
              // special case here allways first row... even in one-seg-legs
              rowoffset= index * -1;
              columnoffset=1;
              break;          
          case "logo":
              rowoffset=0;
              columnoffset=0;
              break;
          case "airportsdate":
              rowoffset=0;
              columnoffset=1;
              break;
          case "flight":
              rowoffset=1;
              columnoffset=0;
              break;
          case "deptime":
              rowoffset=1;
              columnoffset=1;
              break;
          case "arrtime":
              rowoffset=1;
              columnoffset=2;
              break;
          case "duration":
              rowoffset=1;
              columnoffset=2;
              break;          
          case "plane":
              rowoffset=1;
              columnoffset=4;
              break;
          case "cabin":
              rowoffset=1;
              columnoffset=5;
              break;  
          default:
              printNotification("Error: Unknown Target in findItinTarget-function");
              return false;
      }
      return target[index+rowoffset].children[columnoffset];    
  } else {
     printNotification("Error: Unknown error in findItinTarget-function");
     return false;
  }  
}
/********************************************* Start page *********************************************/
function startPage() {
    // try to get content  
    if (findtarget( classSettings["startpage"]["maindiv"],1)===undefined){
      printNotification("Error: Unable to find content on start page.");
      return false;
    } else {
      // apply style-fix
      target = findtarget( classSettings["startpage"]["maindiv"],1);
      target.children[0].children[0].children[0].children[0].setAttribute('valign', 'top');
    }
  
}
/********************************************* Result page *********************************************/
//Primary function for extracting flight data from ITA/Matrix
function fePS() {
    // try to get content
    if (findtarget(classSettings["resultpage"]["itin"],1)===undefined){
      printNotification("Error: Unable to find Content on result page.");
      return false;
    }
    // retry if itin not loaded  
    if (findtarget(classSettings["resultpage"]["itin"],1).parentNode.previousSibling.previousSibling.style.display!="none") { 
      mptSettings["retrycount"]++;
      if (mptSettings["retrycount"]>50) {
        printNotification("Error: Timeout on result page. Content not found after 10s.");
        return false;
      };
      setTimeout(function(){fePS();}, 200);    
      return false;
    };
    // do some self-testing to prevent crashing on class-changes
    for (i in classSettings["resultpage"]) {
       if (findtarget(classSettings["resultpage"][i],1) === undefined) {
          printNotification("Error: Unable to find class "+classSettings["resultpage"][i]+" for "+i+".");
          return false;                  
       }
   }
   
   
    if (mptUsersettings["enableFarerules"]==1) bindRulelinks();
       
    // empty outputcontainer
    if (document.getElementById('powertoolslinkcontainer')!=undefined){
        var div = document.getElementById('powertoolslinkcontainer');
        div.innerHTML ="";
    }
	
    // remove powertool items
  	var elems = findtargets('powertoolsitem');
  	for(var i = elems.length - 1; i >= 0; i--){
  		elems[i].parentNode.removeChild(elems[i]);
  	}
    
    // configure sidebar
    if (mptUsersettings["enableInlinemode"]==1) {
    findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 10);
    //findtarget('GE-ODR-BET',1).setAttribute('class', 'GE-ODR-BBFB');
    } else if (mptUsersettings["enableInlinemode"]==0 && mptUsersettings["enablePricebreakdown"]==1) {
      findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 3);
    } else {
      findtarget(classSettings["resultpage"]["milagecontainer"],1).setAttribute('rowspan', 2);
    }
  
    readItinerary();
    // Translate page
    if (mptUsersettings["language"]!=="en" && translations[mptUsersettings["language"]]["resultpage"]!==undefined) translate("resultpage",mptUsersettings["language"],findtarget(classSettings["resultpage"]["itin"],1).nextSibling.nextSibling);
    // Search - Remove - Add Pricebreakdown
    var target=findtarget('pricebreakdown',1);
    if (target!=undefined) target.parentNode.removeChild(target);
  
    if (mptUsersettings["enablePricebreakdown"]==1) rearrangeprices(currentItin.dist);
    
    if (mptUsersettings["enableInlinemode"]==1) printCPM();
 
    /*** Airlines ***/
    printAC();   
    if (currentItin["itin"].length == 2 &&
        currentItin["itin"][0]["orig"] == currentItin["itin"][1]["dest"] &&
        currentItin["itin"][0]["dest"] == currentItin["itin"][1]["orig"]) {
        printAF();
    } 
    // we print AZ if its only on AZ-flights
    if (currentItin["carriers"].length==1 && currentItin["carriers"][0]=="AZ"){ printAZ(); }  
    printDelta();   
    printKL();
    printUA();
    // we print US if its only on US-flights
    if (currentItin["carriers"].length==1 && currentItin["carriers"][0]=="US"){ printUS(); }
  
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
    /*** OTAs ***/
    printCheapOair();   
    printOrbitz();
    printHipmunk ();
    printPriceline ();
  
    if(mptUsersettings["enableDeviders"]==1) printSeperator();
    /*** other stuff ***/
    printFarefreaks (0);
    printFarefreaks (1);
    printGCM ();

    /*** inline binding ***/
    if(mptUsersettings["enableSeatguru"]==1) bindSeatguru();
    if(mptUsersettings["enablePlanefinder"]==1) bindPlanefinder();  
    if(mptUsersettings["enableMilesbreakdown"]==1 && typeof(JSON) !== "undefined") printMilesbreakdown();  
    if(mptUsersettings["enableWheretocredit"]==1) bindWheretocredit();
}
//*** Rulelinks ****//
function bindRulelinks(){
    var i = 0;
    var j = 0;
    var t = 1;
    var target=findtarget(classSettings["resultpage"]["rulescontainer"],t);
    if (target!=undefined){
      do {
          var current=Number(target.firstChild.innerHTML.replace(/[^\d]/gi, ""));
          if (i>current){
            j++;
            i=0;  
          }
          target=target.nextSibling.nextSibling.nextSibling;
          var targeturl = window.location.href.replace(/view-details/, "view-rules")+";fare-key="+j+"/"+i;
          var newlink = document.createElement('a');
          newlink.setAttribute('class', 'gwt-Anchor');
          newlink.setAttribute('href', targeturl);
          newlink.setAttribute('target', "_blank");
          var linkText = document.createTextNode("rules");
          newlink.appendChild(linkText);
          target.parentNode.replaceChild(newlink,target);    
          i++;
          t++;
          target=findtarget(classSettings["resultpage"]["rulescontainer"],t);
      }
      while (target!=undefined);  
    }   
}
//*** Price breakdown ****//
function rearrangeprices(){
    var basefares = 0;
    var taxes = 0;
    var surcharges =0;
    var basefound=0;
    var cur="";
    // define searchpattern to detect carrier imposed surcharges
    var searchpatt = new RegExp("\((YQ|YR)\)");
    var t=1;
    var target=findtarget(classSettings["resultpage"]["htbLeft"],t);
    if (mptUsersettings["enableInlinemode"] == 0){
     var output="";
     var count=0;
    }
    if (target!=undefined){
      do {    
          var type = target.firstChild.firstChild.nodeType;
          if (type == 1) {
            basefound=1;
            //it's a basefare
            var price = Number(target.nextSibling.firstChild.innerHTML.replace(/[^\d]/gi, ""));
            if (cur=="") cur=target.nextSibling.firstChild.innerHTML.replace(/[\d,.]/g, "");
            basefares+=price;
          } else if(basefound==1 && type == 3) {
            //its a pricenode
            var name  = target.firstChild.innerHTML;    
            var price = Number(target.nextSibling.firstChild.innerHTML.replace(/[^\d]/gi, ""));            
            if( hasClass(target.nextSibling, classSettings["resultpage"]["htbGreyBorder"]) == 1) {
             //we are done for this container
              //console.log( "Basefare: "+ basefares);    
              //console.log( "Taxes: "+ taxes); 
              //console.log( "Surcharges: "+ surcharges);
              var sum=basefares+taxes+surcharges;
              if (mptUsersettings["enableInlinemode"] == 1){
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Basefare per passenger ('+((basefares/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbGreyBorder"]+'"><div class="gwt-Label">'+cur+(basefares/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode);  
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Taxes per passenger ('+((taxes/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbRight"]+'"><div class="gwt-Label">'+cur+(taxes/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode); 
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Surcharges per passenger ('+((surcharges/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbRight"]+'"><div class="gwt-Label">'+cur+(surcharges/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode);  
                  var newtr = document.createElement('tr');
                  newtr.innerHTML = '<td class="'+classSettings["resultpage"]["htbLeft"]+'"><div class="gwt-Label">Basefare + Taxes per passenger ('+(((basefares+taxes)/sum)*100).toFixed(2).toString()+'%)</div></td><td class="'+classSettings["resultpage"]["htbGreyBorder"]+'"><div class="gwt-Label">'+cur+((basefares+taxes)/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+'</div></td>';
                  target.parentNode.parentNode.insertBefore(newtr, target.parentNode); 
              } else {
                 count++;
                 output +='<table style="float:left; margin-right:15px;"><tbody>';
                 output +='<tr><td colspan=3 style="text-align:center;">Price breakdown '+count+':</td></tr>';
                 output +='<tr><td>'+cur+' per mile</td><td colspan=2 style="text-align:center;">'+((sum/currentItin["dist"])/100).toFixed(4).toString()+'</td></tr>';
                 output +='<tr><td>Basefare</td><td style="padding:0px 3px;text-align:right;">'+((basefares/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(basefares/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td>Tax</td><td style="padding:0px 3px;text-align:right;">'+((taxes/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(taxes/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td>Surcharges</td><td style="padding:0px 3px;text-align:right;">'+((surcharges/sum)*100).toFixed(1).toString()+'%</td><td style="text-align:right;">'+cur+(surcharges/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +='<tr><td style="border-top: 1px solid #878787;padding:2px 0">Bf+Tax</td><td style="border-top: 1px solid #878787;padding:2px 3px;text-align:right;">'+(((basefares+taxes)/sum)*100).toFixed(1).toString()+'%</td><td style="border-top: 1px solid #878787;padding:2px 0; text-align:right;">'+cur+((basefares+taxes)/100).toFixed(2).toString().replace(/\d(?=(\d{3})+\.)/g, '$&,')+"</td></tr>";
                 output +="</tbody></table>"; 
              }      
              // reset var
              basefound=0;
              basefares = 0;
              taxes = 0;
              surcharges =0;         
            } else {
              //Carrier surcharge?
              if (searchpatt.test(name)===true){
               surcharges+=price; 
              } else {
               taxes+=price; 
              }           
            }
          }    
          t++;
          target=findtarget(classSettings["resultpage"]["htbLeft"],t);
      }
      while (target!=undefined);  
    }
    if (mptUsersettings["enableInlinemode"] == 0){
      var printtarget=findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode;
      var newtr = document.createElement('tr');
      newtr.setAttribute('class','pricebreakdown');
      newtr.innerHTML = '<td><div>'+output+'</div></td>';
      printtarget.parentNode.insertBefore(newtr, printtarget); 
    }
}
//*** Mileage breakdown ****//
function printMilesbreakdown(){
 if (mptUsersettings["enableMilesbreakdownautoload"] == 1) {
   retrieveMileages();
 } else {
  target = findItinTarget(1,1,"headline");
  target.innerHTML = target.innerHTML.replace(target.firstChild.className, target.firstChild.className + '" style="display:inline-block')+'<div id="loadmileage" class="'+target.firstChild.className+'" style="display:inline-block;cursor:pointer;float:right;">Load mileage</div>'; 
  document.getElementById("loadmileage").onclick=function() {
        document.getElementById("loadmileage").parentNode.removeChild(document.getElementById("loadmileage"));
        retrieveMileages();
      };        
 }
  
}
function retrieveMileages(){
   // collect all airport cominations
  var routes = new Object();
  var params = ""
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        // check if data is localy stored or already part of current task
        if ( distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] === undefined &&
             distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined &&
             routes[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] === undefined &&
             routes[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined ) {
             routes[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] = currentItin["itin"][i]["seg"][j]["orig"]+"-"+currentItin["itin"][i]["seg"][j]["dest"];
        }       
      }
   }
  //build request
  for (i in routes) {
    params+=(params===""?"":"&")+"r[]="+routes[i];
  }
  if (params==="") {
    //no request needed.. call final print function
    printMileages();
    return false; 
  }
  doHttpRequest("https://www.farefreaks.com/ajax/calcroutedist.php?"+params,function(xmlHttpObject) {
     var response=false;
     if (typeof(JSON) !== "undefined"){
       try {
          response = JSON.parse(xmlHttpObject.responseText);
        } catch (e){
          response=false;
        }
     } else {
       // do not(!) use eval here :-/
       printNotification("Error: Failed parsing route data - Browser not supporting JSON");
       return false;
     }     
     if (typeof(response) !== "object"){
      printNotification("Error: Failed parsing route data");
      return false;
     }
     if (response["success"]===undefined || response["error"]===undefined || response["data"]===undefined ){
      printNotification("Error: wrong route data format");
      return false;
     }
     if (response["success"]!=="1"){
      printNotification("Error: "+response["error"]+" in retrieveMileages function");
      return false; 
     }
     // add new routes to distances
     for (i in response["data"]) {
        distances[i]=parseFloat(response["data"][i]);
     }
     printMileages(); 
    });  
}
function printMileages(){
  var legdistance=0;
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        // check if data is localy stored
        if ( distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] === undefined &&
             distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined ) {
             printNotification("Error: Missing route data for "+currentItin["itin"][i]["seg"][j]["orig"]+" => "+currentItin["itin"][i]["seg"][j]["dest"]);
             return false;
        } else if ( distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]] !== undefined &&
                    distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]] === undefined ) {         
          currentItin["itin"][i]["seg"][j]["dist"]=distances[currentItin["itin"][i]["seg"][j]["orig"]+currentItin["itin"][i]["seg"][j]["dest"]];
        } else {
          currentItin["itin"][i]["seg"][j]["dist"]=distances[currentItin["itin"][i]["seg"][j]["dest"]+currentItin["itin"][i]["seg"][j]["orig"]];
        }          
        legdistance+=currentItin["itin"][i]["seg"][j]["dist"];          
        currentItin["itin"][i]["seg"][j]["dist"]=Math.floor(currentItin["itin"][i]["seg"][j]["dist"]);
      }
     currentItin["itin"][i]["dist"]=Math.floor(legdistance);
     legdistance=0;
   }
  // lets finally print it:
  if (mptUsersettings["enableInlinemode"] === 1 || mptUsersettings["enableMilesInlinemode"] === 1) {
  var target = "";
      for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
      target = findItinTarget((i+1),1,"headline");
      target.innerHTML = target.innerHTML.replace(target.firstChild.className, target.firstChild.className + '" style="display:inline-block')+'<div style="display:inline-block;float:right;"> '+currentItin["itin"][i]["dist"]+' miles</div>'; 
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
         if (currentItin["itin"][i]["seg"].length>1) {
         target = findItinTarget((i+1),(j+1),"airportsdate");
         target.innerHTML = target.innerHTML.replace(target.firstChild.className, target.firstChild.className + '" style="display:inline-block')+'<div style="display:inline-block;float:right;margin-right:110px;"> '+currentItin["itin"][i]["seg"][j]["dist"]+' miles</div>';       
        }
      }
   }
  } else {  
  var output="";
  output +='<tbody>';
  output +='<tr><td colspan="4" style="text-align:center;">Mileage breakdown:</td></tr>';         
  for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
    output +='<tr><td style="border-bottom: 1px solid #878787;padding:2px 2px">Leg '+(i+1)+'</td><td style="border-bottom: 1px solid #878787;padding:2px 0">'+currentItin["itin"][i]["orig"]+'</td><td style="border-bottom: 1px solid #878787;padding:2px 0">'+currentItin["itin"][i]["dest"]+'</td><td style="border-bottom: 1px solid #878787;padding:2px 0;text-align:right;">'+currentItin["itin"][i]["dist"]+'</td></tr>';
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        //walks each segment of leg
        if (currentItin["itin"][i]["seg"].length>1) output +='<tr><td></td><td>'+currentItin["itin"][i]["seg"][j]["orig"]+'</td><td>'+currentItin["itin"][i]["seg"][j]["dest"]+'</td><td style="text-align:right;">'+currentItin["itin"][i]["seg"][j]["dist"]+'</td></tr>';       
      }
   }
  output +="</tbody>"; 
  if (findtarget("pricebreakdown",1)===undefined){
       // create container
        var printtarget=findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode;
        var newtr = document.createElement('tr');
        newtr.setAttribute('class','pricebreakdown');
        newtr.innerHTML = '<td><div><table style="float:left; margin-right:15px;">'+output+'</table></div></td>';
        printtarget.parentNode.insertBefore(newtr, printtarget); 
    } else {
      // add to existing container
      var printtarget = findtarget("pricebreakdown",1).firstChild.firstChild.firstChild; 
      var newtable = document.createElement('table');
      newtable.setAttribute('style','float:left; margin-right:15px;');
      newtable.innerHTML = output;
      printtarget.parentNode.insertBefore(newtable, printtarget);    
    }
  }    
}
//*** Readfunction ****//
function parseAddInfo(info){
  var ret= {codeshare:0, layoverduration:0, airportchange:0, arrDate:""};
  if (info.indexOf("This flight contains airport changes") ==-1){
               airportchange=1; 
              }
  if (info.indexOf("OPERATED BY") ==-1){
               codeshare=1; 
              }
  var temp = new Array();
  var re=/\,\s*([a-zA-Z]{3})\s*([0-9]{1,2})/g;
  temp = exRE(info,re);
  if (temp.length == 2){
    // Got datechange
      ret["arrDate"]={};
      ret["arrDate"]["month"]=monthnameToNumber(temp[0]);
      ret["arrDate"]["day"]=parseInt(temp[1]);
      ret["arrDate"]["year"]=getFlightYear(ret["arrDate"]["day"],ret["arrDate"]["month"]);
    }
  var temp = new Array();
  var re=/([0-9]{1,2})h\s([0-9]{1,2})m/g;
  temp = exRE(info,re);
  if (temp.length == 2){
     // Got layover
      ret["layoverduration"]=parseInt(temp[0])*60 + parseInt(temp[1]);
    }
  return ret;
}
function readItinerary(){
      // the magical part! :-)
      var replacementsold = new Array();
      var replacementsnew = new Array();

      var itin= new Array();
      var carrieruarray= new Array();
      var html = document.getElementById("contentwrapper").innerHTML;
      var re=/colspan\=\"5\"[^\(]+\(([\w]{3})[^\(]+\(([\w]{3})/g
      legs = exRE(html,re);
      // Got our outer legs now:
      for(i=0;i<legs.length;i+=2) {
        var legobj={};
        // prepare all elements but fill later
        legobj["arr"]={};
        legobj["dep"]={};
        legobj["orig"]=legs[i];
        legobj["dest"]=legs[i+1];
        legobj["seg"]= new Array();
        itin.push(legobj);
      }
      // extract basefares
      var farebases = new Array();
      var re=/Carrier\s[\w]{2}\s([\w]+).*?Covers\s([\w\(\)\s\-,]+)/g;
      farebases = exRE(html,re);
      var fareBaseLegs = { fares :new Array(), legs:new Array()};
      for(i=0;i<farebases.length;i+=2) {
        fareBaseLegs["fares"].push(farebases[i]);
        // find the covered airports
        fareBaseLegs["legs"].push(exRE(farebases[i+1],/(\w\w\w\-\w\w\w)/g));
      }
      var dirtyFare= new Array();  
      // dirty but handy for later usage since there is no each function
      for(var i=0;i<fareBaseLegs["legs"].length;i++) {
              for(var j=0;j<fareBaseLegs["legs"][i].length;j++) {
               dirtyFare.push(fareBaseLegs["legs"][i][j]+"-"+fareBaseLegs["fares"][i]);
              }
        }   
      var segs = new Array();
      var re=/35px\/(\w{2}).png[^\(]+\(([A-Z]{3})[^\(]+\(([A-Z]{3})[^\,]*\,\s*([a-zA-Z]{3})\s*([0-9]{1,2}).*?gwt-Label.*?([0-9]*)\<.*?Dep:[^0-9]+(.*?)\<.*?Arr:[^0-9]+(.*?)\<.*?([0-9]{1,2})h\s([0-9]{1,2})m.*?gwt-Label.*?\<.*?gwt-Label\"\>(\w).*?\((\w)\).*?\<.*?tr(.*?)(table|airline_logos)/g;
      segs = exRE(html,re);
      // used massive regex to get all our segment-info in one extraction
      var legnr=0;
      var segnr=0;
      for(i=0;i<segs.length;i+=14) {
            temp={};
            temp["carrier"]=segs[i];
            temp["orig"]=segs[i+1];
            temp["dest"]=segs[i+2];
            temp["dep"]={};
            temp["arr"]={};
            temp["dep"]["month"]=monthnameToNumber(segs[i+3]);
            temp["dep"]["day"]=parseInt(segs[i+4]);
            temp["dep"]["year"]=getFlightYear(temp["dep"]["day"],temp["dep"]["month"]);
            temp["fnr"]=segs[i+5];      
            if (mptUsersettings["timeformat"]=="24h") {
                 replacementsold.push(segs[i+6]);
                 replacementsold.push(segs[i+7]); 
                }
            segs[i+6]=return12htime(segs[i+6]);
            segs[i+7]=return12htime(segs[i+7]);
            if (mptUsersettings["timeformat"]=="24h") {          
                  replacementsnew.push((segs[i+6].length==4? "0":"")+segs[i+6]) ;
                  replacementsnew.push((segs[i+7].length==4? "0":"")+segs[i+7]);
                }
            temp["dep"]["time"]=segs[i+6];  
            temp["arr"]["time"]=segs[i+7];  
            temp["duration"]=parseInt(segs[i+8])*60 + parseInt(segs[i+9]);
            temp["cabin"]=getcabincode(segs[i+10]);   
            temp["bookingclass"]=segs[i+11];
            var addinformations=parseAddInfo(segs[i+12]);  
            if (addinformations["arrDate"]!=""){
            temp["arr"]["day"]=addinformations["arrDate"]["day"];
            temp["arr"]["month"]=addinformations["arrDate"]["month"];
            temp["arr"]["year"]=addinformations["arrDate"]["year"]; 
            } else {
            temp["arr"]["day"]=temp["dep"]["day"];
            temp["arr"]["month"]=temp["dep"]["month"];
            temp["arr"]["year"]=temp["dep"]["year"];
            }
            temp["codeshare"]=addinformations["codeshare"];
            temp["layoverduration"]=addinformations["layoverduration"];  
            temp["airportchange"]=addinformations["airportchange"];
            // find farecode for leg
             for(var j=0;j<dirtyFare.length;j++) {
                 if (dirtyFare[j].indexOf(temp["orig"]+"-"+temp["dest"]+"-")!= -1) {
                    //found farebase of this segment
                     temp["farebase"]=dirtyFare[j].replace(temp["orig"]+"-"+temp["dest"]+"-","");
                     dirtyFare[j]=temp["farebase"]; // avoid reuse
                     j=dirtyFare.length;
                     }
             }
            if (itin[legnr]===undefined) itin[legnr] = new Object();
            if (itin[legnr]["seg"]===undefined) itin[legnr]["seg"] = new Array();
            itin[legnr]["seg"].push(temp);     
            // push carrier
            if (!inArray(temp["carrier"],carrieruarray)) {carrieruarray.push(temp["carrier"]);};
            // push dates and times into leg-array
            if ( segnr == 0 ){
              if (itin[legnr]["dep"]===undefined) itin[legnr]["dep"] = new Object();
              itin[legnr]["dep"]["day"]=temp["dep"]["day"];
              itin[legnr]["dep"]["month"]=temp["dep"]["month"];
              itin[legnr]["dep"]["year"]=temp["dep"]["year"];
              itin[legnr]["dep"]["time"]=temp["dep"]["time"];
            }
            if (itin[legnr]["arr"]===undefined) itin[legnr]["arr"] = new Object();
            itin[legnr]["arr"]["day"]=temp["arr"]["day"];
            itin[legnr]["arr"]["month"]=temp["arr"]["month"];
            itin[legnr]["arr"]["year"]=temp["arr"]["year"];
            itin[legnr]["arr"]["time"]=temp["arr"]["time"];
            segnr++;
            // check for legchange
            if(segs[i+13]=="table") {
              legnr++;
              segnr=0;
            }

      }
      // extract mileage paxcount and total price
      var milepaxprice = new Array();
      var re=/Mileage.*?([0-9,]+)\stotal\smiles.*?Total\scost\sfor\s([0-9])\spassenger.*?<div.*?([0-9,.]+)/g;
      milepaxprice = exRE(html,re);
      // detect currency
      itinCur="";
      var re = /Total\scost\sfor\s[0-9]\spassenger([^0-9]+[^\<]+)/g;
      var curstring=new Array();
      curstring = exRE(html,re);
      curstring=curstring[0].replace(/<[^>]+>/g,"")
      var searchpatt = /\€/;
      if (searchpatt.test(curstring)===true){
            itinCur="EUR";
                    }
      var searchpatt = /US\$/;
      if (searchpatt.test(curstring)===true){
            itinCur="USD";
                    }
      currentItin={itin:itin, price: milepaxprice[2].replace(/\,/g,""), numPax:milepaxprice[1] , carriers:carrieruarray, cur : itinCur, farebases:fareBaseLegs["fares"], dist:milepaxprice[0].replace(/\./g,"").replace(/\,/g,"")}; 
      //console.log(currentItin); //Remove to see flightstructure 
      // lets do the time-replacement
       if(replacementsold.length>0) {
         target=findtarget(classSettings["resultpage"]["itin"],1).nextSibling.nextSibling;
         for(i=0;i<replacementsold.length;i++) {
           re = new RegExp(replacementsold[i],"g");
           target.innerHTML = target.innerHTML.replace(re, replacementsnew[i]);
         }
       }
}  
//*** Printfunctions ****//
function translate(page,lang,target){
       if (translations[lang]===undefined){
         printNotification("Error: Translation "+lang+" not found");
         return false;
       }
       if (translations[lang][page]===undefined){
         printNotification("Error: Translation "+lang+" not found for page "+page);
         return false;
       }
      for (i in translations[lang][page]) {
           re = new RegExp(i,"g");
           target.innerHTML = target.innerHTML.replace(re, translations[lang][page][i]);
       }  
}

function printCPM(){
  printItemInline((Number(currentItin.price) / Number(currentItin.dist)).toFixed(4) + ' cpm','',1);
}

function printAC(){
  var acUrl = 'http://www.aircanada.com/aco/flights.do?AH_IATA_NUMBER=0005118&AVAIL_EMMBEDDED_TRANSACTION=FlexPricerAvailabilityServlet'
    if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    acUrl += '&country=DE&countryOfResidence=DE&language=de&LANGUAGE=DE';
    } else {
    	acUrl += '&country=' + mptUsersettings["acEdition"].toUpperCase() + '&countryofResidence=' + mptUsersettings["acEdition"].toUpperCase() + '&language=en&LANGUAGE=US';
    }
  acUrl += '&CREATION_MODE=30&EMBEDDED_TRANSACTION=FareServelet&FareRequest=YES&fromThirdParty=YES&HAS_INFANT_1=False&IS_PRIMARY_TRAVELLER_1=True&SITE=SAADSAAD&thirdPartyID=0005118&TRAVELER_TYPE_1=ADT&PRICING_MODE=0';
  acUrl += '&numberOfChildren=0&numberOfInfants=0&numberOfYouth=0&numberOfAdults=' + currentItin["numPax"];
  acUrl += '&tripType=' + (currentItin['itin'].length > 1 ? 'R' : 'O');
  for (var i=0; i < currentItin['itin'].length; i++) {
    if (i == 0) {
      acUrl += '&departure1='+('0'+currentItin['itin'][i]['dep']['day']).slice(-2)+'/'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'/'+currentItin['itin'][i]['dep']['year']+'&org1='+currentItin['itin'][i]['orig']+'&dest1='+currentItin['itin'][i]['dest'];
    }
    else if (i == 1) {
      acUrl += '&departure2='+('0'+currentItin['itin'][i]['dep']['day']).slice(-2)+'/'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'/'+currentItin['itin'][i]['dep']['year'];
    }
    
    for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
      acUrl += '&AIRLINE_'      +(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['carrier'];
      acUrl += '&B_DATE_'       +(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['dep']['year']+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4);
      acUrl += '&B_LOCATION_'   +(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['orig'];
      acUrl += '&E_DATE_'       +(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['arr']['year']+('0'+currentItin['itin'][i]['seg'][j]['arr']['month']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['arr']['day']).slice(-2)+('0'+currentItin['itin'][i]['seg'][j]['arr']['time'].replace(':','')).slice(-4);
      acUrl += '&E_LOCATION_'   +(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['dest'];
      acUrl += '&FLIGHT_NUMBER_'+(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['fnr'];
      acUrl += '&RBD_'          +(i+1)+'_'+(j+1)+'='+currentItin['itin'][i]['seg'][j]['bookingclass'];
    }
  }
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(acUrl,"Air Canada","");
    } else {
      printUrl(acUrl,"Air Canada","");
    }
}
function printAF() {
  var afUrl = 'https://www.airfrance.com/';
  var flights="";
  if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    afUrl += 'DE/de';
    } else {
    afUrl += 'US/en';
   }
  afUrl += '/local/process/standardbooking/DisplayUpsellAction.do?cabin=Y&calendarSearch=1&listPaxTypo=ADT&subCabin=MCHER&typeTrip=2';
  afUrl += '&nbPax=' + currentItin["numPax"];
  for (var i=0; i < currentItin['itin'].length; i++) {
    if (i == 0) {
      afUrl += '&from='+currentItin['itin'][i]['orig'];
      afUrl += '&to='+currentItin['itin'][i]['dest'];
      afUrl += '&outboundDate='+currentItin['itin'][i]['dep']['year']+'-'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['dep']['day']).slice(-2);
      afUrl += '&firstOutboundHour='+('0'+currentItin['itin'][i]['dep']['time']).slice(-5);
      
      flights = '';
      for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
        if (j > 0) flights += '|';
        flights += currentItin['itin'][i]['seg'][j]['carrier'] + ('000'+currentItin['itin'][i]['seg'][j]['fnr']).slice(-4);
      }
      afUrl += '&flightOutbound=' + flights;
    }
    else if (i == 1) {
      afUrl += '&inboundDate='+currentItin['itin'][i]['dep']['year']+'-'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['dep']['day']).slice(-2);
      afUrl += '&firstInboundHour='+('0'+currentItin['itin'][i]['dep']['time']).slice(-5);
      
      flights = '';
      for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
        if (j > 0) flights += '|';
        flights += currentItin['itin'][i]['seg'][j]['carrier'] + ('000'+currentItin['itin'][i]['seg'][j]['fnr']).slice(-4);
      }
      afUrl += '&flightInbound=' + flights;
    }
  }
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(afUrl,"Air France","");
  } else {
    printUrl(afUrl,"Air France","");
  }
}
function printAZ() {
  var azUrl = 'http://booking.alitalia.com/Booking/'+(mptSettings["itaLanguage"]=='de'||mptUsersettings["language"]=='de'?'de_de':'us_en')+'/Flight/ExtMetaSearch?SearchType=BrandMetasearch';
  azUrl += '&children_number=0&Children=0&newborn_number=0&Infants=0';
  azUrl += '&adult_number='+currentItin["numPax"]+'&Adults='+currentItin["numPax"];
  var seg = 0;
  for (var i=0; i < currentItin['itin'].length; i++) {
    for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
      azUrl += '&MetaSearchDestinations['+seg+'].From='         +currentItin['itin'][i]['seg'][j]['orig'];
      azUrl += '&MetaSearchDestinations['+seg+'].to='           +currentItin['itin'][i]['seg'][j]['dest'];
      azUrl += '&MetaSearchDestinations['+seg+'].DepartureDate='+currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2);
      azUrl += '&MetaSearchDestinations['+seg+'].Flight='       +currentItin['itin'][i]['seg'][j]['fnr']
      azUrl += '&MetaSearchDestinations['+seg+'].code='         +currentItin['itin'][i]['seg'][j]['farebase'];
      azUrl += '&MetaSearchDestinations['+seg+'].slices='       +i;
      seg++;
    }
  }
  
  if (mptUsersettings["enableInlinemode"]==1){
   printUrlInline(azUrl,"Alitalia","");
  } else {
   printUrl(azUrl,"Alitalia","");
  } 
}
function getDeltaCabin(cabin){
// 0 = Economy; 1=Premium Economy; 2=Business; 3=First
// // B5-Coach / B2-Business on DL
  switch(cabin) {
      case 2:
          cabin="B2-Business";
          break;
      case 3:
          cabin="B2-Business";
          break;
      default:
          cabin="B5-Coach";
  }
  return cabin;
}
function printDelta(){
// Steppo: Cabincodefunction needs some care!?
// Steppo: What about farebasis?
// Steppo: What about segmentskipping?
    var deltaURL ="http://"+(mptSettings["itaLanguage"]=="de" || mptUsersettings["language"]=="de" ? "de" : "www");
    deltaURL +=".delta.com/booking/priceItin.do?dispatchMethod=priceItin&tripType=multiCity&cabin=B5-Coach";
    deltaURL +="&currencyCd=" + (currentItin["cur"]=="EUR" ? "EUR" : "USD") + "&exitCountry="+(mptSettings["itaLanguage"]=="de" || mptUsersettings["language"]=="de" ? "US" : "US");
    var segcounter=0;
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
        deltaURL +="&itinSegment["+segcounter.toString()+"]="+i.toString()+":"+currentItin["itin"][i]["seg"][j]["bookingclass"];
        deltaURL +=":"+currentItin["itin"][i]["seg"][j]["orig"]+":"+currentItin["itin"][i]["seg"][j]["dest"]+":"+currentItin["itin"][i]["seg"][j]["carrier"]+":"+currentItin["itin"][i]["seg"][j]["fnr"];
        deltaURL +=":"+monthnumberToName(currentItin["itin"][i]["seg"][j]["dep"]["month"])+":"+ ( currentItin["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"") +currentItin["itin"][i]["seg"][j]["dep"]["day"]+":"+currentItin["itin"][i]["seg"][j]["dep"]["year"]+":0";
        segcounter++; 
      }
    }
    deltaURL += "&fareBasis="+currentItin["farebases"].toString().replace(/,/g, ":");
    deltaURL += "&price=0";
    deltaURL += "&numOfSegments=" + segcounter.toString() + "&paxCount=" + currentItin["numPax"];
    deltaURL += "&vendorRedirectFlag=true&vendorID=Google";      
    if (mptUsersettings["enableInlinemode"]==1){
     printUrlInline(deltaURL,"Delta","");
    } else {
     printUrl(deltaURL,"Delta","");
    }    
}
function printKL() {
  var klUrl = 'https://www.klm.com/travel/';
   if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    klUrl += 'de_de/apps/ebt/ebt_home.htm?lang=DE';
    } else {
    klUrl += 'us_en/apps/ebt/ebt_home.htm?lang=EN';
    }
  klUrl += '&chdQty=0&infQty=0&dev=5&cffcc=ECONOMY';
  var fb = '';
  var oper = '';
  klUrl += '&adtQty=' + currentItin["numPax"];
  for (var i=0; i < currentItin['itin'].length; i++) {
    klUrl += '&c['+i+'].os='+currentItin['itin'][i]['orig'];
    klUrl += '&c['+i+'].ds='+currentItin['itin'][i]['dest'];
    klUrl += '&c['+i+'].dd='+currentItin['itin'][i]['dep']['year']+'-'+('0'+currentItin['itin'][i]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['dep']['day']).slice(-2);   
    if (i > 0) oper += '..';
    for (var j=0; j < currentItin['itin'][i]['seg'].length; j++) {
      klUrl += '&c['+i+'].s['+j+'].os='+currentItin['itin'][i]['seg'][j]['orig'];
      klUrl += '&c['+i+'].s['+j+'].ds='+currentItin['itin'][i]['seg'][j]['dest'];
      klUrl += '&c['+i+'].s['+j+'].dd='+currentItin['itin'][i]['seg'][j]['dep']['year']+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'-'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2);
      klUrl += '&c['+i+'].s['+j+'].dt='+('0'+currentItin['itin'][i]['seg'][j]['dep']['time'].replace(':','')).slice(-4);
      klUrl += '&c['+i+'].s['+j+'].mc='+currentItin['itin'][i]['seg'][j]['carrier'];
      klUrl += '&c['+i+'].s['+j+'].fn='+('000'+currentItin['itin'][i]['seg'][j]['fnr']).slice(-4);
      
      if (j > 0) oper += '.';
      oper += currentItin['itin'][i]['seg'][j]['carrier'];
    }
  }
  
  for (var i=0; i < currentItin['farebases'].length; i++) {
    if (i > 0) fb += ',';
    fb += currentItin['farebases'][i];
  }
  
  klUrl += '&ref=fb='+fb;//+',oper='+oper;
    if (mptUsersettings["enableInlinemode"]==1){
     printUrlInline(klUrl,"KLM","");
    } else {
     printUrl(klUrl,"KLM","");
    } 
}
function getUACabin(cabin){
// 0 = Economy; 1=Premium Economy; 2=Business; 3=First
// Coach - Coach / Business - Business / First - First on UA
  switch(cabin) {
      case 2:
          cabin="Business";
          break;
      case 3:
          cabin="First";
          break;
      default:
          cabin="Coach";
  }
  return cabin;
}
function printUA(){
var uaUrl='{\"post\": {\"pax\": '+currentItin["numPax"];
uaUrl += ', \"trips\": [';
    for (var i=0;i<currentItin["itin"].length;i++) {
      var minCabin=3;
      uaUrl += '{\"origin\": \"'+currentItin["itin"][i]["orig"]+'\", \"dest\": \"'+currentItin["itin"][i]["dest"]+'\", \"dep_date\": \"'+currentItin["itin"][i]["dep"]["month"]+'/'+currentItin["itin"][i]["dep"]["day"]+'/'+currentItin["itin"][i]["dep"]["year"]+'\", \"segments\": [';
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
          var k = 0;
         // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
          while ((j+k)<currentItin["itin"][i]["seg"].length-1){
          if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                   currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
          }
          uaUrl += '{\"origin\": \"'+currentItin["itin"][i]["seg"][j]["orig"]+'\", \"dep_date\": \"'+ currentItin["itin"][i]["seg"][j]["dep"]["month"].toString() +'/'+ currentItin["itin"][i]["seg"][j]["dep"]["day"].toString() +'/'+currentItin["itin"][i]["seg"][j]["dep"]["year"].toString() +'\", \"dest_date\": \" \", \"dest\": \"'+currentItin["itin"][i]["seg"][j+k]["dest"]+'\", ';
          uaUrl += '\"flight_num\": '+currentItin["itin"][i]["seg"][j]["fnr"]+', \"carrier\": \"'+currentItin["itin"][i]["seg"][j]["carrier"]+'\", \"fare_code\": \"'+currentItin["itin"][i]["seg"][j]["farebase"]+'\"},';         
          if (currentItin["itin"][i]["seg"][j]["cabin"] < minCabin) {minCabin=currentItin["itin"][i]["seg"][j]["cabin"];};
          j+=k; 
      }
      uaUrl = uaUrl.substring(0,uaUrl.length-1)+'],\"cabin\": \"'+getUACabin(minCabin)+'\"},';
    }
    uaUrl = 'https://www.hipmunk.com/bookjs?booking_info=' + encodeURIComponent(uaUrl.substring(0,uaUrl.length-1) +']}, \"kind\": \"flight\", \"provider_code\": \"UA\" }');
        if (mptUsersettings["language"]=="de"){
        desc="Kopiere den Link bei Hipmunk";
      } else {
        desc="Copy Link in Text, via Hipmunk";
      }     
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(uaUrl,"United",desc);
    } else {
      printUrl(uaUrl,"United",desc);
    }
}
function getUSCabin(cabin){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  switch(cabin) {
      case 2:
          cabin="B";
          break;
      case 3:
          cabin="F";
          break;
      default:
          cabin="C";
  }
  return cabin;
}
function printUS(){
// Steppo: is class of service implemented correct?
// Steppo: legskipping necessary?
    var usUrl = "https://shopping.usairways.com/Flights/Passenger.aspx?g=goo&c=goog_US_pax";
    usUrl += "&a=" + currentItin["numPax"];
    usUrl += "&s=" + getUSCabin(currentItin["itin"][0]["seg"][0]["cabin"]).toLowerCase();
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
        var segstr = (i+1).toString()+(j+1).toString();
        usUrl += "&o"+segstr+"=" + currentItin["itin"][i]["seg"][j]["orig"] + "&d"+segstr+"=" + currentItin["itin"][i]["seg"][j]["dest"] + "&f"+segstr+"=" + currentItin["itin"][i]["seg"][j]["fnr"];
        usUrl += "&t"+segstr+"=" + currentItin["itin"][i]["seg"][j]["dep"]["year"] + (currentItin["itin"][i]["seg"][j]["dep"]["month"] < 10 ? "0":"" )+ currentItin["itin"][i]["seg"][j]["dep"]["month"] +(currentItin["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"" ) + currentItin["itin"][i]["seg"][j]["dep"]["day"] + "0000";
        usUrl += "&x"+segstr+"=" + currentItin["itin"][i]["seg"][j]["farebase"];
      }
    }   
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(usUrl,"US Airways","");
    } else {
      printUrl(usUrl,"US Airways","");
    }
}

function printCheapOair(){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  var cabins = ['Economy', 'PREMIUMECONOMY', 'Business', 'First'];
  var coaUrl = 'http://www.cheapoair.com/default.aspx?tabid=1832&ch=0&sr=0&is=0&il=0&ulang=en';
  coaUrl += '&ad=' + currentItin.numPax;
  var seg = 0;
  var slices = {};
  for (var i=0; i < currentItin.itin.length; i++) {
    slices[i] = '';
    for (var j=0; j < currentItin.itin[i].seg.length; j++) {
      seg++;
      if (slices[i]) slices[i] += ',';
      slices[i] += seg;
      
      coaUrl += '&cbn'        +seg+'='+cabins[currentItin.itin[i].seg[j].cabin];
      coaUrl += '&carr'      +seg+'='+currentItin.itin[i].seg[j].carrier;
      coaUrl += '&dd'+seg+'='+currentItin.itin[i].seg[j].dep.year+('0'+currentItin.itin[i].seg[j].dep.month).slice(-2)+('0'+currentItin.itin[i].seg[j].dep.day).slice(-2);
      coaUrl += '&og'       +seg+'='+currentItin.itin[i].seg[j].orig;
      coaUrl += '&dt'  +seg+'='+currentItin.itin[i].seg[j].dest;
      coaUrl += '&fbc'  +seg+'='+currentItin.itin[i].seg[j].bookingclass;
      coaUrl += '&fnum' +seg+'='+currentItin.itin[i].seg[j].fnr;
    }
    
    coaUrl += '&Slice'+(i+1)+'='+slices[i];
  }
  
  if (currentItin.itin.length == 1) {
    coaUrl += '&tt=OneWay';
  }
  else if (currentItin.itin.length == 2 && currentItin.itin[0].orig == currentItin.itin[1].dest && currentItin.itin[0].dest == currentItin.itin[1].orig) {
    coaUrl += '&tt=RoundTrip';
  }
  else {
    coaUrl += '&tt=MultiCity';
  }
  
  if (mptUsersettings["enableInlinemode"]==1){
    printUrlInline(coaUrl,"CheapOair","");
  } else {
    printUrl(coaUrl,"CheapOair","");
  }
}

function getHipmunkCabin(cabin){
  // 0 = Economy; 1=Premium Economy; 2=Business; 3=First
  switch(cabin) {
      case 2:
          cabin="Business";
          break;
      case 3:
          cabin="First";
          break;
      default:
          cabin="Coach";
  }
  return cabin;
}
function printHipmunk(){
    var url = "https://www.hipmunk.com/search/flights?";
    var mincabin=3;
    //Build multi-city search based on legs
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
            url += "&from"+i+"=" + currentItin["itin"][i]["orig"];            
            for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
           //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }               
                url += ( j>0 ? "%20"+currentItin["itin"][i]["seg"][j]["orig"]+"%20":"%3A%3A")+currentItin["itin"][i]["seg"][j]["carrier"] + currentItin["itin"][i]["seg"][j]["fnr"];
                if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};  
                j+=k;
      }
      url += "&date"+i+"="+currentItin["itin"][i]["dep"]["year"]+"-"+( Number(currentItin["itin"][i]["dep"]["month"]) <= 9 ? "0":"") +currentItin["itin"][i]["dep"]["month"].toString()+"-"+ ( Number(currentItin["itin"][i]["dep"]["day"]) <= 9 ? "0":"") +currentItin["itin"][i]["dep"]["day"].toString();  
      url += "&to"+i+"="+currentItin["itin"][i]["dest"];
    }  
    url += "&pax=" + currentItin["numPax"]+"&cabin="+getHipmunkCabin(mincabin)+"&infant_lap=0&infant_seat=0&seniors=0&children=0";    
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url,"Hipmunk","");
    } else {
      printUrl(url,"Hipmunk","");
    } 
}
function getOrbitzCabin(cabin){
// 0 = Economy; 1=Premium Economy; 2=Business; 3=First
// C - Coach / B - Business / F - First on ORB
  switch(cabin) {
      case 1:
          cabin="E";
          break;
      case 2:
          cabin="B";
          break;
      case 3:
          cabin="F";
          break;
      default:
          cabin="C";
  }
  return cabin;
}
function printOrbitz(){
    // Steppo: This should be fine
    var selectKey="";
    var orbitzUrl = "/shop/home?type=air&source=GOOGLE_META&searchHost=ITA&ar.type=multiCity&strm=true";
    //Build multi-city search based on legs
  
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
            var iStr = i.toString();
            orbitzUrl += "&ar.mc.slc["+iStr+"].orig.key=" + currentItin["itin"][i]["orig"];
            orbitzUrl += "&_ar.mc.slc["+iStr+"].originRadius=0";
            orbitzUrl += "&ar.mc.slc["+iStr+"].dest.key=" + currentItin["itin"][i]["dest"];
            orbitzUrl += "&_ar.mc.slc["+iStr+"].destinationRadius=0";
            var twoyear = currentItin["itin"][i]["dep"]["year"]%100;
            orbitzUrl += "&ar.mc.slc["+iStr+"].date=" + currentItin["itin"][i]["dep"]["month"].toString() + "/" + currentItin["itin"][i]["dep"]["day"].toString() + "/" + twoyear.toString();
            orbitzUrl += "&ar.mc.slc["+iStr+"].time=Anytime"; 
        
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
         //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }               
                selectKey += currentItin["itin"][i]["seg"][j]["carrier"] + currentItin["itin"][i]["seg"][j]["fnr"] + currentItin["itin"][i]["seg"][j]["orig"] + currentItin["itin"][i]["seg"][j+k]["dest"] + ( currentItin["itin"][i]["seg"][j]["dep"]["month"] < 10 ? "0":"") + currentItin["itin"][i]["seg"][j]["dep"]["month"] +  ( currentItin["itin"][i]["seg"][j]["dep"]["day"] < 10 ? "0":"") + currentItin["itin"][i]["seg"][j]["dep"]["day"] + getOrbitzCabin(currentItin["itin"][i]["seg"][j]["cabin"]);
                selectKey += "_";                      
                j+=k;
      }
    }

  orbitzUrl += "&ar.mc.numAdult=" + currentItin["numPax"];
    orbitzUrl += "&ar.mc.numSenior=0&ar.mc.numChild=0&ar.mc.child[0]=&ar.mc.child[1]=&ar.mc.child[2]=&ar.mc.child[3]=&ar.mc.child[4]=&ar.mc.child[5]=&ar.mc.child[6]=&ar.mc.child[7]=&search=Search Flights&ar.mc.nonStop=true&_ar.mc.nonStop=0";
    //lets see if we can narrow the carriers  Orbitz supports up to 3
    if (currentItin["carriers"].length <= 3) {
      orbitzUrl += "&_ar.mc.narrowSel=1&ar.mc.narrow=airlines";
      for (var i = 0; i< 3;i++){
          if (i<currentItin["carriers"].length){
          orbitzUrl += "&ar.mc.carriers["+i+"]="+currentItin["carriers"][i];
          } else {
          orbitzUrl += "&ar.mc.carriers["+i+"]=";
          }       
      }
    } else {
      orbitzUrl += "&_ar.mc.narrowSel=0&ar.mc.narrow=airlines&ar.mc.carriers[0]=&ar.mc.carriers[1]=&ar.mc.carriers[2]=";
    }
    orbitzUrl += "&ar.mc.cabin=C";
    orbitzUrl += "&selectKey=" + selectKey.substring(0,selectKey.length-1);
    if (currentItin["cur"]=="USD") {
    //lets do this when USD is cur
    var priceval = parseFloat(currentItin["price"]) + 6.99;
    orbitzUrl += "&userRate.price=USD|" + priceval.toString();
    }
    if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline("http://www.cheaptickets.com"+orbitzUrl,"Cheaptickets","");
      printUrlInline("http://www.orbitz.com"+orbitzUrl,"Orbitz","");
    } else {
      printUrl("http://www.cheaptickets.com"+orbitzUrl,"Cheaptickets","");
      printUrl("http://www.orbitz.com"+orbitzUrl,"Orbitz","");
    }    
}
function printPriceline(){
    var url = "https://www.priceline.com/airlines/landingServlet?userAction=search";
    var pricelineurl="&TripType=MD&ProductID=1";
    // outer params
    pricelineurl+="&DepCity="+currentItin["itin"][0]["orig"];
    pricelineurl+="&ArrCity="+currentItin["itin"][0]["dest"];
    pricelineurl+="&DepartureDate="+(Number(currentItin["itin"][0]["dep"]["month"]) <= 9 ? "0":"") +currentItin["itin"][0]["dep"]["month"].toString()+"/"+(Number(currentItin["itin"][0]["dep"]["day"]) <= 9 ? "0":"") +currentItin["itin"][0]["dep"]["day"].toString()+"/"+currentItin["itin"][0]["dep"]["year"].toString();
    var legsize=1;
    var segsize=1;
    var searchparam="<externalSearch>";
    for (var i=0;i<currentItin["itin"].length;i++) {
      // walks each leg
      pricelineurl+="&MDCity_"+legsize.toString()+"="+currentItin["itin"][i]["orig"];
      pricelineurl+="&DepDateMD"+legsize.toString()+"="+(Number(currentItin["itin"][i]["dep"]["month"]) <= 9 ? "0":"") +currentItin["itin"][i]["dep"]["month"].toString()+"/"+(Number(currentItin["itin"][i]["dep"]["day"]) <= 9 ? "0":"") +currentItin["itin"][i]["dep"]["day"].toString()+"/"+currentItin["itin"][i]["dep"]["year"].toString();
      legsize++;
      pricelineurl+="&MDCity_"+legsize.toString()+"="+currentItin["itin"][i]["dest"];
      pricelineurl+="&DepDateMD"+legsize.toString()+"="+(Number(currentItin["itin"][i]["arr"]["month"]) <= 9 ? "0":"") +currentItin["itin"][i]["arr"]["month"].toString()+"/"+(Number(currentItin["itin"][i]["arr"]["day"]) <= 9 ? "0":"") +currentItin["itin"][i]["arr"]["day"].toString()+"/"+currentItin["itin"][i]["arr"]["year"].toString();
      legsize++;
      searchparam+="<slice>";    
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
         searchparam+="<segment>";  
                //walks each segment of leg
                var k=0;
                // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
                while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                         currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                       k++;
                }
                searchparam+="<number>"+segsize.toString()+"</number>";
                searchparam+="<departDateTime>"+(Number(currentItin["itin"][i]["seg"][j]["dep"]["month"]) <= 9 ? "0":"") +currentItin["itin"][i]["seg"][j]["dep"]["month"].toString()+"/"+(Number(currentItin["itin"][i]["seg"][j]["dep"]["day"]) <= 9 ? "0":"") +currentItin["itin"][i]["seg"][j]["dep"]["day"].toString()+"/"+currentItin["itin"][i]["seg"][j]["dep"]["year"].toString()+" "+currentItin["itin"][i]["seg"][j]["dep"]["time"]+":00</departDateTime>";
                searchparam+="<arrivalDateTime>"+(Number(currentItin["itin"][i]["seg"][j+k]["arr"]["month"]) <= 9 ? "0":"") +currentItin["itin"][i]["seg"][j+k]["arr"]["month"].toString()+"/"+(Number(currentItin["itin"][i]["seg"][j+k]["arr"]["day"]) <= 9 ? "0":"") +currentItin["itin"][i]["seg"][j+k]["arr"]["day"].toString()+"/"+currentItin["itin"][i]["seg"][j+k]["arr"]["year"].toString()+" "+currentItin["itin"][i]["seg"][j+k]["arr"]["time"]+":00</arrivalDateTime>";
                searchparam+="<origAirportCode>"+currentItin["itin"][i]["seg"][j]["orig"]+"</origAirportCode>";
                searchparam+="<destAirportCode>"+currentItin["itin"][i]["seg"][j+k]["dest"]+"</destAirportCode>";
                searchparam+="<carrierCode>"+currentItin["itin"][i]["seg"][j]["carrier"]+"</carrierCode>";
                searchparam+="<flightNumber>"+currentItin["itin"][i]["seg"][j]["fnr"]+"</flightNumber>";
                searchparam+="<equipmentCode></equipmentCode>";
                searchparam+="<bookingClass>"+currentItin["itin"][i]["seg"][j]["bookingclass"]+"</bookingClass>";         
                segsize++;
                j+=k;
         searchparam+="</segment>";
      }
      searchparam+="</slice>";
    }
   searchparam+="<numberOfTickets>"+currentItin["numPax"]+"</numberOfTickets><cost><totalFare>0.00</totalFare><baseFare>0.00</baseFare><tax>0.00</tax><fee>0.00</fee></cost>";
   searchparam+="</externalSearch>";
   pricelineurl+="&NumTickets="+currentItin["numPax"]+"&AirAffiliateSearch=";
   if (mptUsersettings["enableInlinemode"]==1){
      printUrlInline(url+pricelineurl+encodeURIComponent(searchparam),"Priceline","");
    } else {
      printUrl(url+pricelineurl+encodeURIComponent(searchparam),"Priceline","");
    }
}

function printFarefreaks (method){
// Should be fine
// method: 0 = based on leg; 1 = based on segment
    var carrieruarray = new Array();
    var mincabin=3;
    var segsize=0;  
    var farefreaksurl = "https://www.farefreaks.com/landing/landing.php?";
    if (mptSettings["itaLanguage"]=="de"||mptUsersettings["language"]=="de"){
    farefreaksurl +="lang=de";
    } else {
    farefreaksurl +="lang=en";
    }
    farefreaksurl += "&target=flightsearch&referrer=matrix";
    for (var i=0;i<currentItin["itin"].length;i++) {
        if (method!=1){
          farefreaksurl += "&orig["+segsize+"]=" + currentItin["itin"][i]["orig"];
          farefreaksurl += "&dest["+segsize+"]=" + currentItin["itin"][i]["dest"];
          farefreaksurl += "&date["+segsize+"]="+currentItin["itin"][i]["dep"]["year"].toString() + "-" + currentItin["itin"][i]["dep"]["month"] + "-" + currentItin["itin"][i]["dep"]["day"] + "_"+currentItin["itin"][i]["dep"]["time"]+":00";
          farefreaksurl += "&validtime["+segsize+"]=1";
          segsize++; 
        } 
       for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        if (method==1){
          var k=0;
          // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
          while ((j+k)<currentItin["itin"][i]["seg"].length-1){
          if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                   currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
          }
          farefreaksurl += "&orig["+segsize+"]=" + currentItin["itin"][i]["seg"][j]["orig"];
          farefreaksurl += "&dest["+segsize+"]=" + currentItin["itin"][i]["seg"][j+k]["dest"];
          farefreaksurl += "&date["+segsize+"]="+currentItin["itin"][i]["seg"][j]["dep"]["year"].toString() + "-" + currentItin["itin"][i]["seg"][j]["dep"]["month"] + "-" + currentItin["itin"][i]["seg"][j]["dep"]["day"] + "_"+currentItin["itin"][i]["seg"][j]["dep"]["time"]+":00";
          farefreaksurl += "&validtime["+segsize+"]=1";
          segsize++;
          j+=k;  
        }         
        if (currentItin["itin"][i]["seg"][j]["cabin"]<mincabin){mincabin=currentItin["itin"][i]["seg"][j]["cabin"];};  
        if (!inArray(currentItin["itin"][i]["seg"][j]["carrier"],carrieruarray)){carrieruarray.push(currentItin["itin"][i]["seg"][j]["carrier"]);};  
      }
    }
    farefreaksurl += "&adult="+currentItin["numPax"];  
    farefreaksurl += "&cabin="+mincabin;  
    farefreaksurl += "&child=0&childage[]=&flexible=0";
    if (method==1){  
      farefreaksurl += "&nonstop=1";
      if (mptUsersettings["language"]=="de"){
        desc="Benutze "+segsize+" Segment(e)";
      } else {
        desc="Based on "+segsize+" segment(s)";
      }
      
    } else {
      if (segsize==1) {
        return false;
      }
      farefreaksurl += "&nonstop=0";  
      if (mptUsersettings["language"]=="de"){
        desc="Benutze "+segsize+" Abschnitt(e)";
      } else {
        desc="Based on "+segsize+" segment(s)";
      }
    }
    if (carrieruarray.length <= 3) {farefreaksurl += "&carrier="+ carrieruarray.toString();}
    
    if (mptUsersettings["enableInlinemode"]==1 && segsize<=6){
      printUrlInline(farefreaksurl,"Farefreaks",desc);
    } else if (segsize<=6) {
      printUrl(farefreaksurl,"Farefreaks",desc);
    }    
}

function printGCM (){
    var url = '';
    // Build multi-city search based on segments
    // Keeping continous path as long as possible 
    for (var i=0;i<currentItin["itin"].length;i++) {
      for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
        url+=currentItin["itin"][i]["seg"][j]["orig"]+"-";
        if (j+1<currentItin["itin"][i]["seg"].length){
          if (currentItin["itin"][i]["seg"][j]["dest"] != currentItin["itin"][i]["seg"][(j+1)]["orig"]){url+=currentItin["itin"][i]["seg"][j]["dest"]+";";};
        } else {
         url+=currentItin["itin"][i]["seg"][j]["dest"]+";";
        }    
      }
    }
  if (mptUsersettings["enableInlinemode"]==1){
      printImageInline('http://www.gcmap.com/map?MR=900&MX=182x182&PM=*&P='+url, 'http://www.gcmap.com/mapui?P='+url);
  } else {
      printUrl("http://www.gcmap.com/mapui?P="+url,"GCM","");
  }
}
function bindSeatguru(){
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
             var k=0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
             while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }  
         // build the search to identify flight:
          var target = findItinTarget((i+1),(j+1),"plane");
          if (target===false) {
            printNotification("Error: Could not find target in bindSeatguru");
            return false;
          } else {
            var url='http://www.seatguru.com/findseatmap/findseatmap.php?carrier='+currentItin['itin'][i]['seg'][j]['carrier']+'&flightno='+currentItin['itin'][i]['seg'][j]['fnr']+'&date='+('0'+currentItin['itin'][i]['seg'][j]['dep']['month']).slice(-2)+'%2F'+('0'+currentItin['itin'][i]['seg'][j]['dep']['day']).slice(-2)+'%2F'+currentItin['itin'][i]['seg'][j]['dep']['year']+'&from_loc='+currentItin['itin'][i]['seg'][j]['orig'];
            target.children[0].innerHTML='<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">'+target.children[0].innerHTML+"</a>";
          }
        j+=k;
      }
   }  
}
function bindPlanefinder(){
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
             var k=0;
             // lets have a look if we need to skip segments - Flightnumber has to be the same and it must be just a layover
             while ((j+k)<currentItin["itin"][i]["seg"].length-1){
                 if (currentItin["itin"][i]["seg"][j+k]["fnr"] != currentItin["itin"][i]["seg"][j+k+1]["fnr"] || 
                     currentItin["itin"][i]["seg"][j+k]["layoverduration"] >= 1440) break;
                 k++;
                }  
         // build the search to identify flight:
          var target = findItinTarget((i+1),(j+1),"flight");
          if (target===false) {
            printNotification("Error: Could not find target in bindPlanefinder");
            return false;
          } else {
            var url='http://www.planefinder.net/data/flight/'+currentItin['itin'][i]['seg'][j]['carrier']+currentItin['itin'][i]['seg'][j]['fnr'];
            target.children[0].innerHTML='<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">'+target.children[0].innerHTML+"</a>";
          }
        j+=k;
      }
   }  
}
function bindWheretocredit(){
  for (var i=0;i<currentItin["itin"].length;i++) {
  // walks each leg      
    for (var j=0;j<currentItin["itin"][i]["seg"].length;j++) {
       //walks each segment of leg
          var target = findItinTarget((i+1),(j+1),"cabin");
          if (target===false) {
            printNotification("Error: Could not find target in bindWheretocredit");
            return false;
          } else {
            var url='http://www.wheretocredit.com/'+currentItin['itin'][i]['seg'][j]['carrier']+'/'+currentItin['itin'][i]['seg'][j]['bookingclass'];
            target.children[0].innerHTML= target.children[0].innerHTML.replace(/<a.*?\/a>/,'('+currentItin['itin'][i]['seg'][j]['bookingclass']+')').replace('('+currentItin['itin'][i]['seg'][j]['bookingclass']+')','<a href="'+url+'" target="_blank" style="text-decoration:none;color:black">('+currentItin['itin'][i]['seg'][j]['bookingclass']+")</a>");        
          }
      }
   }  
}

// Inline Stuff
function printUrlInline(url,text,desc,nth){
  var otext = '<a href="'+url+ '" target="_blank">';
  var valid=false;
  if (translations[mptUsersettings["language"]] !== undefined) {
    if (translations[mptUsersettings["language"]]["openwith"] !== undefined) {
      otext += translations[mptUsersettings["language"]]["openwith"];
      valid=true;
    }
  }
  otext+=(valid===false ? "Open with":"");
  otext+=' '+text+'</a>'; 
  printItemInline(otext,desc,nth);
}
function printItemInline(text,desc,nth){
  div = getSidebarContainer(nth);
  div.innerHTML = div.innerHTML + '<li class="powertoolsitem">'+text+(desc ? '<br/><small>('+desc+')</small>' : '')+'</li>';
}
function printImageInline(src,url,nth){
  div = getSidebarContainer(nth).parentNode;
  if (mptUsersettings["enableIMGautoload"] == 1) {
    div.innerHTML = div.innerHTML + (url?'<a href="'+url+ '" target="_blank" class="powertoolsitem">':'')+'<img src="'+src+'" style="margin-top:10px;"'+(!url?' class="powertoolsitem"':'')+'/>'+(url?'</a>':'');      
   } else {
     var id=Math.random();
     div.innerHTML = div.innerHTML + '<div id="'+id+'" class="powertoolsitem" style="width:184px;height:100px;background-color:white;cursor:pointer;text-align:center;margin-top:10px;padding-top:84px;"><span>Click</span></div>';
     document.getElementById(id).onclick=function(){
       var newdiv = document.createElement('div');
       newdiv.setAttribute('class','powertoolsitem');
       newdiv.innerHTML =(url?'<a href="'+url+ '" target="_blank">':'')+'<img src="'+src+'" style="margin-top:10px;"'+(!url?' class="powertoolsitem"':'')+'/>'+(url?'</a>':'');
       document.getElementById(id).parentNode.replaceChild(newdiv,document.getElementById(id));
      };   
   } 
}
function getSidebarContainer(nth){
  var div = !nth || nth >= 4 ? document.getElementById('powertoolslinkinlinecontainer') : findtarget(classSettings["resultpage"]["mcHeader"], nth).nextElementSibling;
  return div ||createUrlContainerInline();
}
function createUrlContainerInline(){
  var newdiv = document.createElement('div');
  newdiv.setAttribute('class',classSettings["resultpage"]["mcDiv"]);
  newdiv.innerHTML = '<div class="'+classSettings["resultpage"]["mcHeader"]+'">Powertools</div><ul id="powertoolslinkinlinecontainer" class="'+classSettings["resultpage"]["mcLinkList"]+'"></ul>';
  findtarget(classSettings["resultpage"]["mcDiv"],1).parentNode.appendChild(newdiv);
  return document.getElementById('powertoolslinkinlinecontainer');
}
// Printing Stuff
function printUrl(url,name,desc) {
    if (document.getElementById('powertoolslinkcontainer')==undefined){
    createUrlContainer();
    }
  var text = "<br><font size=3><bold><a href=\""+url+ "\" target=_blank>";
  var valid=false;
  if (translations[mptUsersettings["language"]] !== undefined) {
    if (translations[mptUsersettings["language"]]["openwith"] !== undefined) {
      text += translations[mptUsersettings["language"]]["openwith"];
      valid=true;
    }
  }
  text+=(valid===false ? "Open with":"");
  text+=" "+name+"</a></font></bold>"+(desc ? "<br>("+desc+")<br>" : "<br>");  
  var target = document.getElementById('powertoolslinkcontainer');
  target.innerHTML = target.innerHTML + text;
}
function createUrlContainer(){
  var newdiv = document.createElement('div');
  newdiv.setAttribute('id','powertoolslinkcontainer');
  newdiv.setAttribute('style','margin-left:10px;');
  findtarget(classSettings["resultpage"]["htbContainer"],1).parentNode.parentNode.parentNode.appendChild(newdiv);
}
function printSeperator() {
  var container = document.getElementById('powertoolslinkcontainer') || getSidebarContainer();
  if (container) {
    container.innerHTML = container.innerHTML + (mptUsersettings["enableInlinemode"] ? '<hr class="powertoolsitem"/>' : '<br/><hr/>');
  }
}
