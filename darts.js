// darts.js: Dave Aronson's Role Tracking System, code file
//
// COPYRIGHT 2008 David J. Aronson
//
// Toastmasters club role assigner, printer, suggester, and analyzer.
// Uses past and future roster data as currently stored on
// FreeToastHost, plus config file.
//
// Credit to Tom Warfield for some bugfixes and several suggestions.
//
// This WOULD be done in a more OO-ish fashion, except that JS's
// "class.prototype.method = method" construct does NOT let you just
// call "class.method" for a class method, making you stick the
// "prototype" in there again, saving you nil.  Same goes for its
// use of class vars.  Still, I used it for instance methods....
//
// Also, I know that some things are not in ideal Javascriptian form.  In
// particular, I know that building strings by simple concatenation is slow
// and inefficient.  Eventually I will get around to replacing all string
// building done as "foo = bar + baz + quux;" to the more JS-ian
// "foo = [bar, baz, quux].join('');"....


var agendaDiv;
var agendaDtIdx;
var agendaInitted;
var agendaReq;
var agendaTemplate;
var asgnDiv;
var asgnDtIdx;
var asgnInitted;
var asgnMmbrList;
var asgnMmbrs;
var asgnRoleList;
var asgnRoles;
var clubURL;
var configFile;
var configReq;
var curMenu;
var debugDiv;
var dutyFile;
var dutyReq;
var historyFile;
var historyReq;
var mainDiv;
var memberReq;
var Member_Retrieved;
var members;
var roleReq;
var Role_Retrieved;
var roles;
var rolesPage;
var rptsDateList;
var rptsInitted;
var rptsMaxIdx;
var rptsMinIdx;
var siteType;
var speechInfo;
var speechReq;



// first some general utilities I use on lots of stuff

function $ (name)
{
  return document.getElementById (name);
}


// make a checkbox THAT GETS CLICKED WHEN YOU CLICK ITS TEXT
function dja_mkChkBox (name, checked, onClick, text)
{
  ret =
  [
    '<input type="checkbox" id="', name, '"', (checked ? ' checked' : '') +
            ' onClick="', onClick, '">' + 
            '<span onClick="getElementById(\'', name, '\').click()">',
            text, '</span><br>\n'
  ].join ('');
  return ret;
}


function dja_nbsp (str)
{
  var idx;
  var ret = str;

  do
  {
    idx = ret.indexOf (' ');
    if (idx != -1) ret = ret.slice (0, idx) + '&nbsp;' + ret.slice (idx + 1);
  } while (idx != -1);
  return ret;
}


// now the functions for THIS app


function Agenda_Init_Internals()
{
  var tmpStr = "";

  agendaDtIdx = 0;
  agendaReq = null;
  agendaReq = AJAX_CreateRequest (clubURL +
                                  '/members/files/agendaTemplate.html',
                                  Agenda_SetTemplate);
  agendaTemplate = null;

  DebugClr();
  Debug ('Fetching agenda template....');

  tmpStr  = '<p><input type="button" value="Main Menu" onClick="ShowDiv (main)">';
  tmpStr += '<p><table align="center" border="2" cellpadding="5" cellspacing="2">';
  tmpStr +=   '<tr valign="top">';
  tmpStr +=     '<td>';
  tmpStr +=       'These are the dates in your signup file.<br>';
  tmpStr +=       'Select <i>one</i> to assign roles for.';
  tmpStr +=       '<p><div id="agendaDtList"></div>';
  tmpStr +=       '<p align="center"><input id="agendaBtn" onClick="Agenda_PrepToPrint();" type="button" value=" Create Agenda ">';
  tmpStr +=     '</td>';
  tmpStr +=     '<td>';
  tmpStr +=       '<div align="center">Edit your agenda template below</div>';
  tmpStr +=       '<p><textarea id="agendaTemplate" cols="60" rows="40"></textarea>';
  tmpStr +=     '</td>';
  tmpStr +=   '</tr>';
  tmpStr += '</table>';
  agendaDiv.innerHTML = tmpStr;
  $('agendaDtList').innerHTML = MkDtList ("agendaDts", "Agenda_SetDtIdx",
                                                                                  agendaDtIdx);
  if (agendaReq != null) agendaReq.send (null);
  agendaInitted = true;
}


function Agenda_PrepToPrint()
{
  var date;
  var line;

  speechInfo = null;
  speechReq = AJAX_CreateRequest (clubURL + '/members/' +
                                  escape (escape (dutyFile[agendaDtIdx][0])) +
                                  '.speechinfo',
                                  Agenda_Print);
  Debug ("Fetching speech info....");
  if (speechReq != null) speechReq.send (null);
}


function Agenda_Print()
{
  var date;
  var errs = "";
  var htmlArray = [];
  var i;
  var line;
  var title;
  var tmpStr;
  var tokenSubs;
  var win;

  if (speechInfo != null) return;  // someone beat us to it
  speechInfo = AJAX_RetrieveResponse (speechReq, 'speech');
  if (typeof (speechInfo) == undefined || speechInfo == null) return;

  DebugClr();

  speechInfo = speechInfo.split ('\n');
  for (i = 0; i < speechInfo.length; i++)
  {
    speechInfo[i] = speechInfo[i].split ('\t')[1];
  }

  line = dutyFile[agendaDtIdx];
  date = line[0];
  tokenSubs =
  [
    ['$DATE',    date,     'ERROR: NO DATE CHOSEN'],
    ['$TMOD',    line[ 1], '____________________'],
    ['$WOTD',    line[ 2], '____________________'],
    ['$INVO',    line[ 3], '____________________'],
    ['$HUMOR',   line[ 4], '____________________'],
    ['$SPKR1',   line[ 5], '____________________'],
    ['$SPKR2',   line[ 6], '____________________'],
    ['$SPKR3',   line[ 7], '____________________'],
    ['$SPKR4',   line[ 8], '____________________'],
    ['$BKUP',    line[ 9], '____________________'],
    ['$EVAL1',   line[10], '____________________'],
    ['$EVAL2',   line[11], '____________________'],
    ['$EVAL3',   line[12], '____________________'],
    ['$EVAL4',   line[13], '____________________'],
    ['$TTM',     line[14], '____________________'],
    ['$GENEVAL', line[15], '____________________'],
    ['$AHCTR',   line[16], '____________________'],
    ['$TIMER',   line[17], '____________________'],
    ['$GRAMMAR', line[18], '____________________'],
    ['$CUSTOM1', line[19], '____________________'],
    ['$CUSTOM2', line[20], '____________________'],
    ['$CUSTOM3', line[21], '____________________'],
    ['$CUSTOM4', line[22], '____________________'],
    ['$CUSTOM5', line[23], '____________________'],
    ['$CUSTOM6', line[24], '____________________'],
    ['$CUSTOM7', line[25], '____________________'],
    ['$SPNUM1',  speechInfo[ 0], '____'],
    ['$SPTIME1', speechInfo[ 1], '___ to ___'],
    ['$SPMAN1',  speechInfo[ 2], '____________________'],
    ['$SPOBJ1',  speechInfo[ 3], '____________________'],
    ['$SPINT1',  speechInfo[ 4], '____________________'],
    ['$SPTTL1',  speechInfo[ 5], '____________________'],
    ['$SPNUM2',  speechInfo[ 6], '____'],
    ['$SPTIME2', speechInfo[ 7], '___ to ___'],
    ['$SPMAN2',  speechInfo[ 8], '____________________'],
    ['$SPOBJ2',  speechInfo[ 9], '____________________'],
    ['$SPINT2',  speechInfo[10], '____________________'],
    ['$SPTTL2',  speechInfo[11], '____________________'],
    ['$SPNUM3',  speechInfo[12], '____'],
    ['$SPTIME3', speechInfo[13], '___ to ___'],
    ['$SPMAN3',  speechInfo[14], '____________________'],
    ['$SPOBJ3',  speechInfo[15], '____________________'],
    ['$SPINT3',  speechInfo[16], '____________________'],
    ['$SPTTL3',  speechInfo[17], '____________________'],
    ['$SPNUM4',  speechInfo[18], '____'],
    ['$SPTIME4', speechInfo[19], '___ to ___'],
    ['$SPMAN4',  speechInfo[20], '____________________'],
    ['$SPOBJ4',  speechInfo[21], '____________________'],
    ['$SPINT4',  speechInfo[22], '____________________'],
    ['$SPTTL4',  speechInfo[23], '____________________']
  ]

  title = ('Agenda_for_' + date).
                  replace (/ /g,  '_').
                  replace (/,/g,  '_').
                  replace (/__/g, '_');

  html = $('agendaTemplate').value;

  for (i = 0; i < tokenSubs.length; i++)
  {
    var start = 0;
    var t0;
    var t1;

    t0 = tokenSubs[i][0];
    start = html.indexOf (t0);
    if (start > -1)
    {
      var uname;
      t1 = tokenSubs[i][1];
      if (t1 == '')
      {
        t1 = tokenSubs[i][2];
        errs += t0 + ' is unfilled\n';
      }
      else if (t1 == 'X')
      {
        t1 = 'DO NOT USE!';
        errs += t0 + ' is marked Do Not Use\n';
      }
      else if (i > 0 && i <= 25)  // 0 == date; 26+ are speech info
      {
        var idx;
        idx = Member_FindIdxByUName (t1);
        if (idx == -1)
        {
          errs += 'Can\'t find uname ' + uname + ' to sub for ' + t0 + '\n';
          t1 = 'NO LONGER A MEMBER';
        }
        else t1 = members[idx].name;
      }
      do
      {
        html = html.replace (t0, t1);
        start = html.indexOf (t0, start);
      } while (start > -1);
    }
  }

  if (errs != '') alert ('Warnings:\n\n' + errs);

  win = window.open ('', title,
                     'location=no,menubar=no,scrollbar=yes,statusbar=no,toolbar=no');

  win.document.body.innerHTML = html;
  try { win.sizeToContent(); }
  catch (e) { /* not supported in IE7; just ignore the error */ }
}


function Agenda_SetDtIdx (idx)
{
  agendaDtIdx = idx;
}


function Agenda_SetTemplate()
{
  if (agendaTemplate != null) return;  // someone beat us to it
  else if (agendaReq == null) return;
  else if (agendaReq.readyState != 4) return;
  else if (agendaReq.status == 200)
  {
    agendaTemplate = agendaReq.responseText;
  }
  else
  {
    var html = [];
    alert ('Could not retrieve club agenda template;\nstatus = ' +
           agendaReq.status + ' (' + agendaReq.statusText + ').\n' +
           'Using default.');
    html.push ('<html>');
    html.push ('<body>');
    html.push ('<div align="center">');
    html.push ('<h1> PUT YOUR CLUB\'S NAME HERE </h1>');
    html.push ('<h2> Agenda for $DATE </h2>');
    html.push ('</div>');
    html.push ('');
    html.push ('<p><table width="100%">');
    html.push ('<tr><td><b><big> Introduction </big></b></td><td align="right"></td></tr>');
    html.push ('<tr><td> Call to Order </td><td align="right"> Sergeant At Arms </td></tr>');
    html.push ('<tr><td> Introduction / Recognize Guests </td><td align="right"> $TMOD, Toastmaster </td></tr>');
    html.push ('<tr><td> President\'s Address </td><td align="right"> President </td></tr>');
    html.push ('<tr><td> Review Agenda and Meeting Roles </td><td align="right"> $TMOD, Toastmaster </td></tr>');
    html.push ('<tr><td> Word of the Day </td><td align="right"> $WOTD, Word of the Day</td></tr>');
    html.push ('</table>');
    html.push ('');
    html.push ('<p><table width="100%">');
    html.push ('<tr><td><b><big> Prepared Speeches </big></b></td><td align="right"> $TMOD, Toastmaster </td></tr>');
    html.push ('<tr><td><i> $SPTTL1 </i></td><td align="right"> $SPKR1 </td></tr>');
    html.push ('<tr><td></td><td align="right"><small> ($SPMAN1 Manual, Project #$SPNUM1, $SPTIME1 Minutes) </small></td> </tr>');
    html.push ('<tr><td><i> $SPTTL2 </i></td><td align="right"> $SPKR2 </td></tr>');
    html.push ('<tr><td></td><td align="right"><small> ($SPMAN2 Manual, Project #$SPNUM2, $SPTIME2 Minutes) </small></td> </tr>');
    html.push ('<tr><td><i> $SPTTL3 </i></td><td align="right"> $SPKR3 </td></tr>');
    html.push ('<tr><td></td><td align="right"><small> ($SPMAN3 Manual, Project #$SPNUM3, $SPTIME3 Minutes) </small></td> </tr>');
    html.push ('<tr><td><i> $SPTTL4 </i></td><td align="right"> $SPKR4 </td></tr>');
    html.push ('<tr><td></td><td align="right"><small> ($SPMAN4 Manual, Project #$SPNUM4, $SPTIME4 Minutes) </small></td> </tr>');
    html.push ('<tr><td> Timer\'s Report on Speeches </td><td align="right"> $TIMER, Timer </td></tr>');
    html.push ('<tr><td> Vote for Best Speaker </td><td align="right"> $CUSTOM2, Vote Counter </td></tr>');
    html.push ('</table>');
    html.push ('');
    html.push ('<p><table width="100%">');
    html.push ('<tr><td><b> Table Topics </b> (1-2 minutes each) </td><td align="right"> $TTM, Table Topics Master </td></tr>');
    html.push ('<tr><td> Timer\'s Report on Table Topics Speeches </td><td align="right"> $TIMER, Timer </td></tr>');
    html.push ('<tr><td> Vote for Best Table Topics Speaker </td><td align="right"> $CUSTOM2, Vote Counter </td></tr>');
    html.push ('</table>');
    html.push ('');
    html.push ('<p><table width="100%">');
    html.push ('<tr><td><b><big> Evaluations </big></b></td><td align="right"> $GENEVAL, General Evaluator </td></tr>');
    html.push ('<tr><td> Evaluations of Prepared Speeches (2-3 minutes each) </td><td align="right"></td></tr>');
    html.push ('<tr><td> - For $SPKR1\'s Speech </td><td align="right"> $EVAL1 </td></tr>');
    html.push ('<tr><td> - For $SPKR2\'s Speech </td><td align="right"> $EVAL2 </td></tr>');
    html.push ('<tr><td> - For $SPKR3\'s Speech </td><td align="right"> $EVAL3 </td></tr>');
    html.push ('<tr><td> Timer\'s Report on Evaluations </td><td align="right"> $TIMER, Timer </td></tr>');
    html.push ('<tr><td> Vote for Best Evaluator </td><td align="right"> $CUSTOM2, Vote Counter </td></tr>');
    html.push ('<tr><td> Ah Counter\'s Report </td><td align="right"> $AHCTR, Ah Counter </td></tr>');
    html.push ('<tr><td> Grammarian\'s Report </td><td align="right"> $GRAMMAR, Grammarian </td></tr>');
    html.push ('<tr><td> Word of the Day Report </td><td align="right"> $WOTD, Word of the Day </td></tr>');
    html.push ('<tr><td> General Evaluation </td><td align="right"> $GENEVAL, General Evaluator </td></tr>');
    html.push ('</table>');
    html.push ('');
    html.push ('<p><table width="100%">');
    html.push ('<tr><td><b><big> Conclusion </big></b></td><td align="right"> $TMOD, Toastmaster </td></tr>');
    html.push ('<tr><td> Awards </td><td align="right"> $CUSTOM2, Vote Counter </td></tr>');
    html.push ('<tr><td> Closing Remarks </td><td align="right"> $TMOD, Toastmaster; Guests; Any Others </td></tr>');
    html.push ('<tr><td> Meeting Adjourned </td><td align="right"> Sergeant At Arms </td></tr>');
    html.push ('</table>');
    html.push ('</body>');
    html.push ('</html>');
    agendaTemplate = html.join ('\n');
  }
  DebugClr();
  Agenda_ShowDiv();
}


function Agenda_ShowDiv()
{
  if (! agendaInitted)
  {
    Agenda_Init_Internals();
    return;
  }
  $('agendaTemplate').value = agendaTemplate;
  DebugClr();
  ShowDiv (agendaDiv);
}


function AJAX_CreateRequest (url, func)
{
  var req = null;

  if (window.ActiveXObject) // detect IE
  {
    req = new ActiveXObject ('Microsoft.XMLHTTP');
    if (req == null)
    {
      alert ('Could not create XMLHTTP Active X object to fetch ' + url + '!');
    }
  }
  else if (window.XMLHttpRequest) // pretty much everything else
  {
    req = new XMLHttpRequest();
    if (req == null)
    {
      alert ('Could not create XMLHttpRequest to fetch ' + url + '!');
    }
  }
  else alert ('Sorry, I do not know how to fetch files with your browser!');

  if (req != null)
  {
    req.onreadystatechange = func;
    req.open ('GET', url);
    // DO NOT SEND IT YET; it may return before this function exits!  :-(
  }
  return req;
}


// try to get the club-specific data.
// NOTE: Do NOT make this more efficient by moving sending to CreateRequest!
// That runs the risk of the request returning before CreateRequest
// has exited, which means that the various *Req vars have not yet been set.
// TODO: add a timeout?
function AJAX_FetchFiles()
{
  var ext;

  configFile = null;
  configReq = AJAX_CreateRequest (clubURL + '/members/files/darts.cfg',
                                  AJAX_SetConfigFile);
  if (configReq == null) return;

  dutyFile = null;
  dutyReq = AJAX_CreateRequest (clubURL + '/members/duty.txt',
                                AJAX_SetDutyFile);
  if (dutyReq == null) return;

  historyFile = null;
  historyReq = AJAX_CreateRequest (clubURL + '/members/historical.txt',
                                   AJAX_SetHistoryFile);
  if (historyReq == null) return;

  if (siteType == 'demo') ext = 'html';
  else ext = 'cgi';

  Member_Retrieved = false;
  memberReq = AJAX_CreateRequest (clubURL + '/members/memberprofile.' + ext,
                                  Member_SetList);
  if (memberReq == null) return;

  rolesPage = null;
  roleReq = AJAX_CreateRequest (clubURL + '/members/roster.' + ext,
                                Role_SetList);
  if (roleReq == null) return;

  // save all sending for last, to give time for null/false to take.
  // wtf, js can't do things in the right order?????
  configReq.send (null);
  dutyReq.send (null);
  historyReq.send (null);
  memberReq.send (null);
  roleReq.send (null);
  SetDebugFetchingMsg();
}


// retrieve the text of a response --
// return null if not ready or not available,
// else text.
function AJAX_RetrieveResponse (req, desc)
{
  if (req == null) return null;
  if (req.readyState != 4) return null;
  if (req.status == 200) return req.responseText;
  alert ('Could not retrieve ' + desc + ' file; status = ' + req.status +
                ' (' + req.statusText + ')');
  return null;
}


function AJAX_SetConfigFile()
{
  var msg = '';

  // can't use AJAX_RetrieveResponse here
  // 'cuz we want to differentiate
  // between 'not found' and other delays/problems
  if (configReq == null) return;
  else if (configReq.readyState != 4) return;
  else if (configReq.status == 200)
  {
    // replace \r's w/ \n in case written on CR-only system
    configFile = configReq.responseText.replace ('\r', '\n');
    configFile = configFile.split ('\n');
    AJAX_ShowMainMaybe();
  }
  else if (configReq.status == 404)
  {
    configFile = '';
    msg += 'No config file found for this club.\n';
    msg += '(Status = ' + configReq.status + ' (' + configReq.statusText + ')\n';
    msg += 'It is not necessary, but is useful.\n';
    alert (msg);
    AJAX_ShowMainMaybe();
  }
  else
  {
    alert ('Could not retrieve config file; status = ' + configReq.status +
                  ' (' + configReq.statusText + ')');
  }
}


function AJAX_SetDutyFile()
{
  dutyFile = AJAX_RetrieveResponse (dutyReq, 'duty');
  if (typeof (dutyFile) != undefined && dutyFile != null)
  {
    var idx;
    dutyFile = dutyFile.split ('\n');
    dutyFile.pop();  // remove blank 'line' generated by final newline
    for (idx = 0; idx < dutyFile.length; idx++)
    {
      dutyFile[idx] = dutyFile[idx].split ('\t');
    }
    AJAX_ShowMainMaybe();
  }
}


function AJAX_SetHistoryFile()
{
  var dateList = '';
  historyFile = AJAX_RetrieveResponse (historyReq, 'history');
  if (typeof (historyFile) != undefined && historyFile != null)
  {
    var idx;
    historyFile = historyFile.split ('\n');
    historyFile.pop();  // remove blank 'line' generated by final newline
    for (idx = 0; idx < historyFile.length; idx++)
    {
      historyFile[idx] = historyFile[idx].split ('\t');
    }
    AJAX_ShowMainMaybe();
  }
}


function AJAX_ShowMainMaybe()
{
  // someone beat us to it
  if (mainDiv.style.display == '') return;
  if (configFile != null && dutyFile != null && historyFile != null &&
          Member_Retrieved && Role_Retrieved)
  {
    // can't do these until now 'cuz we need roles page AND duty list.
    Role_ExtractAll();

    // initialize all stuff in modules, that needs to happen
    // BEFORE their respective ShowDiv calls.
    Asgn_Init_Externals();

    // can't do this until now 'cuz we need member and role lists
    if (configFile != '')
    {
      var idx;
      for (idx = 0; idx < configFile.length; idx++)
      {
        ParseConfigLine (configFile[idx]);
      }
    }
    DebugClr();
    ShowDiv (mainDiv);
  }
}


function Asgn()
{
  var asgmtRec;
  var busies;
  var curAsgnMmbrs;
  var curAsgnRoles;
  var dutyLine;
  var mmbrNum;
  var output;
  var qs;
  var roleNum;
  var win;

  if (! Asgn_GetChoices()) return;

  curAsgnMmbrs = [];
  curAsgnRoles = [];

  dutyLine = dutyFile[asgnDtIdx];
  busies = Role_GetBusyPpl (dutyLine);
  for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++)
  {
    curAsgnMmbrs[mmbrNum] = asgnMmbrs[mmbrNum];
  }
  for (mmbrNum = 0; mmbrNum < busies.length; mmbrNum++)
  {
    curAsgnMmbrs[busies[mmbrNum]] = false;
  }

  qs = LastDone_PrepRawQs (FoldHistoryAt (asgnDtIdx));
  qs = LastDone_AddBusyness (qs);
  qs = LastDone_SortQs (qs);

  for (roleNum = 0; roleNum < asgnRoles.length; roleNum++)
  {
    asgmtRec = Asgn_RoleMaybe (asgnRoles[roleNum], curAsgnMmbrs, dutyLine, qs);
    if (asgmtRec != null) curAsgnRoles.push (asgmtRec);
  }

  curAsgnRoles.sort (function (ar1, ar2) { return ar1.roleNum - ar2.roleNum; });
  output = '<div align="center"><h1>Assignments for ' +
                    dutyFile[asgnDtIdx][0] +
                    '</h1><p><table border="1" cellpadding="5">' +
                    '<tr><th>Role</th><th>Member</th></tr>';
  for (roleNum = 0; roleNum < curAsgnRoles.length; roleNum++)
  {
    asgmtRec = curAsgnRoles[roleNum];
    output += '<tr><td>' + roles[asgmtRec.roleNum].name + '</td><td>' +
                        asgmtRec.filler + '</td></tr>';
  }

  output += '</table></div>';
  win = window.open ('', 'Assignments',
                     'location=no,menubar=no,scrollbar=yes,statusbar=no,toolbar=no');
  win.document.body.innerHTML = output;
  try { win.sizeToContent(); }
  catch (e) { /* not supported in IE7; just ignore the error */ }
}


function Asgn_BumpRole (lowNum)
{
  var tmp;
  tmp = asgnRoles[lowNum];
  asgnRoles[lowNum] = asgnRoles[lowNum + 1];
  asgnRoles[lowNum + 1] = tmp;
  Asgn_MkRoleList();
}


function Asgn_ChkMmbrs()
{
  var idx;
  for (idx = 0; idx < members.length; idx++) if (asgnMmbrs[idx]) return true;
  return false;
}


function Asgn_ChkRoles()
{
  var idx;
  for (idx = 0; idx < roles.length; idx++) if (asgnRoles[idx].asgn) return true;
  return false;
}


function Asgn_GetChoices()
{
  if (asgnDtIdx == null)
  {
    alert ('You have not chosen a date to assign!');
    return false;
  }

  if (! Asgn_ChkMmbrs())
  {
    alert ('You have not chosen any members to assign!');
    return false;
  }

  if (! Asgn_ChkRoles())
  {
    alert ('You have not chosen any roles to assign!');
    return false;
  }

  return true;
}


function Asgn_Init_Externals()
{
  var idx;
  asgnMmbrs = [];
  for (idx = 0; idx < members.length; idx++) asgnMmbrs[idx] = true;
  asgnRoles = [];
  for (idx = 0; idx < roles.length; idx++)
  {
    asgnRoles[idx] = new AsgnRec (idx, false);
  }
}


function Asgn_Init_Internals()
{
  var tmpStr;
  tmpStr  = '<p><input type="button" value="Main Menu" onClick="ShowDiv (main)">';
  tmpStr += '<h1>Assignment Maker</h1>';
  tmpStr += '<p><table align="center" border="2" cellpadding="5" cellspacing="2">';
  tmpStr +=   '<tr valign="top">';
  tmpStr +=     '<td>';
  tmpStr +=       'These are the dates in your signup file.<br>';
  tmpStr +=       'Select <i>one</i> to assign roles for.';
  tmpStr +=       '<p><div id="asgnDtList"></div>';
  tmpStr +=     '</td>';
  tmpStr +=     '<td>';
  tmpStr +=       'These are the members in your club.<br>';
  tmpStr +=       'Check the ones available for the meeting.';
  tmpStr +=       '<p><div id="asgnMmbrList"></div>';
  tmpStr +=     '</td>';
  tmpStr +=     '<td>';
  tmpStr +=       'These are the roles your club uses.<br>';
  tmpStr +=       'Select the ones you want to assign.<br>';
  tmpStr +=       'Then use "up" and "dn" to move them into<br>';
  tmpStr +=       'the order you wish to assign them in.';
  tmpStr +=       '<p><div id="asgnRoleList"></div>';
  tmpStr +=     '</td>';
  tmpStr +=   '</tr>';
  tmpStr += '</table>';
  asgnDiv.innerHTML = tmpStr;
  asgnDtIdx = dutyFile.length - 1;
  asgnMmbrList = $('asgnMmbrList');
  asgnRoleList = $('asgnRoleList');
  asgnInitted = true;
}


function Asgn_MkDateList()
{
  $('asgnDtList').innerHTML = MkDtList ("asgnDts", "Asgn_SetDtIdx", asgnDtIdx) +
                                        '<br>\n' +
                                        '<div align="center"><input id="asgnBtn" ' +
                                        'onClick="Asgn();" type="button" ' +
                                        'value=" ASSIGN ROLES! "></div>';
}


function Asgn_MkMmbrList()
{
  var html = '';
  var idx;

  for (idx = 0; idx < members.length; idx++)
  {
    var mmbr;
    mmbr = members[idx];
    html += dja_mkChkBox ('chkMmbr' + idx, asgnMmbrs[idx],
                          'Asgn_ToggleMmbr(' + idx + ')', mmbr.name);
  }
  asgnMmbrList.innerHTML = html;
}


function Asgn_MkRoleList()
{
  var html = '<table border="0" cellpadding="0" cellspacing="0">';
  var roleNum;

  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    var row;
    row = Asgn_MkRoleRow (roleNum, asgnRoles[roleNum]);
    if (row == '') break;
    html += row;
  }
  html += '</table>';
  asgnRoleList.innerHTML = html;
}


function Asgn_MkRoleMover (lowNum, bgColor, dir)
{
    return '<td onClick="Asgn_BumpRole(' + lowNum + ')"><span style="background:' +
            bgColor + ';color:white">&nbsp;<b>' + dir + '</b>&nbsp;</span>';
}


function Asgn_MkRoleRow (roleNum, asgnRec)
{
  var html;
  var name;
  var role;
  
  role = roles[asgnRec.roleNum];
  if (role.IsFake()) return '';
  name = role.name;

  //html = '<tr><td><input id="asgnChkRole' + roleNum + '" type="checkbox" ' + 
  //       (asgnRec.asgn ? 'checked ' : '') + 'onClick="Asgn_ToggleRole (' +
  //       roleNum + ')" value="' + name + '">' + dja_nbsp (name) + '&nbsp;&nbsp;</td>';
  html = '<tr>\n';

  if (roleNum > 0) html += Asgn_MkRoleMover (roleNum - 1, 'blue', 'up');
  else html += '<td>';
  html += '&nbsp;</td>\n';

  if (roleNum < roles.length - 1)
  {
    html += Asgn_MkRoleMover (roleNum, 'green', 'dn');
  }
  else html += '<td>';
  html += '</td>\n';

  html += '<td>' + dja_mkChkBox ('chkRole' + roleNum, asgnRec.asgn,
                                 'Asgn_ToggleRole (' + roleNum + ')',
                                 dja_nbsp (name)) +
                  '</td>\n';

  html += '</tr>\n';

  return html;
}


function Asgn_Role (roleNum, qs, curAsgnMmbrs)
{
  var ldNum;
  var q;
  var role = roles[roleNum];

  q = qs[role.base];
  for (ldNum = 0; ldNum < members.length; ldNum++)
  {
    var mmbrNum;
    mmbrNum = q[ldNum].mmbrNum;
    if (curAsgnMmbrs[mmbrNum])
    {
      curAsgnMmbrs[mmbrNum] = false;
      return members[mmbrNum].name;
    }
  }
  return 'CANNOT FIND A FILLER!';
}


function Asgn_RoleMaybe (asgnRec, curAsgnMmbrs, dutyLine, qs)
{
  var filler;
  var role;
  var roleNum;

  if (! asgnRec.asgn) return null;

  roleNum = asgnRec.roleNum;
  role = roles[roleNum];
  filler = dutyLine[role.column];
  if (filler == 'X') return null;  // marked Don't Use this time

  if (filler != '')
  {
    var mmbrNum = Member_FindIdxByUName (filler);
    if (mmbrNum == -1)  // no longer a member
    {
      alert ('Cannot find member "' + filler + '", slated to do ' + role.name);
      filler = '';
    }
    else filler = members[mmbrNum].name;  // xlate from username to human
  }

  if (filler != '') filler += ' (already on roster)';
  else filler = Asgn_Role (roleNum, qs, curAsgnMmbrs) + ' (assigned)';

  return new AsgnmtRec (asgnRec.roleNum, filler);
}


function Asgn_SetDtIdx (idx)
{
  asgnDtIdx = idx;
}


function Asgn_SetMmbrAbsent (name, line)
{
  var idx = Member_FindIdxByHName (name);
  if (idx == -1)
  {
    alert ('Could not find member "' + name + '" from line "' + line + '"!');
    return;
  }
  asgnMmbrs[idx] = false;
}


function Asgn_SetRoleAsgnd (name, line)
{
  var asgnRec;
  var idx;
  var roleNum;
  
  roleNum = Role_FindIdx (name);
  if (roleNum == -1)
  {
    alert ('Could not find role "' + name + '" from line "' + line + '"!');
    return;
  }

  idx = FindInArray (asgnRoles, roleNum,
                     function (rec, num) { return rec.roleNum == num; });
  if (roleNum == -1)
  {
    alert ('Could not find role "' + name + '" from line "' + line + '"!');
    return;
  }

  asgnRec = asgnRoles[idx];
  asgnRec.asgn = true;
  asgnRoles.splice (idx, 1);

  idx = FindInArray (asgnRoles, null,
                     function (rec, ignored) { return ! rec.asgn; });
  if (idx == -1)
  {
    idx = FindInArray (roles, null,
                       function (role, ignored) { return role.IsFake(); });
  }

  asgnRoles.splice (idx, 0, asgnRec);
}


function Asgn_ShowDiv()
{
  if (! asgnInitted) Asgn_Init_Internals();
  Asgn_MkDateList();
  Asgn_MkMmbrList();
  Asgn_MkRoleList();
  ShowDiv (asgnDiv);
}


function Asgn_ToggleMmbr (idx)
{
  asgnMmbrs[idx] = ! asgnMmbrs[idx];
}


function Asgn_ToggleRole (idx)
{
  asgnRoles[idx].asgn = ! asgnRoles[idx].asgn;
}


function AsgnmtRec (roleNum, filler)
{
  this.roleNum = roleNum;
  this.filler = filler;
}


function AsgnRec (roleNum, asgn)
{
  this.roleNum = roleNum;
  this.asgn = asgn;
}


function Debug (str)
{
  debugDiv.innerHTML += str;
}


function DebugClr()
{
  debugDiv.innerHTML = '';
}


function FindDateIdx (file, dt)
{
  return FindInArray (file, dt, function (line, dt) { return line[0] == dt; });
}


function FindInArray (ary, key, compFunc)
{
  var idx;
  for (idx = 0; idx < ary.length; idx++)
  {
    if (compFunc (ary[idx], key)) return idx;
  }
  return -1;
}


// consolidate history and 'fold' it at the date in question; put 1st future
// date before previous date and keep going, interleaving further future with
// further past (or less-distant future).
function FoldHistoryAt (where)
{
  var lines = [];
  var idx;
  var ins;

  for (idx = 0; idx < historyFile.length; idx++) lines.push (historyFile[idx]);
  for (idx = 0; idx <= where; idx++) lines.push (dutyFile[idx]);
  for (ins = lines.length - 2; idx < dutyFile.length; idx++, ins--)
  {
      if (ins < 0) ins = 0;  // may be more future than past, at that date!
      lines.splice (ins, 0, dutyFile[idx]);
  }
  return lines;
}


function GetClubURL (loc)
{
  var demoSite = 'dl.dropbox.com/u/9324440/darts/'
  var fth = '.freetoasthost.';
  var idx;

  // if it's an FTH site, club url is up to just before next slash
  // else if it's my demo site, club url is up to just before / @ end of stem
  // else it's a custom domain for an FTH site,
  // so take up to just before the first slash past http://.
  idx = loc.indexOf (fth);
  if (idx != -1)
  {
    idx = loc.indexOf ('/', idx);
    siteType = 'fth';
  }
  else
  {
    idx = loc.indexOf (demoSite);
    if (idx != -1)
    {
      idx += demoSite.length - 1;
      siteType = 'demo';
    }
    else
    {
      idx = loc.indexOf ('/', 'http://'.length);
      if (idx == -1)
      {
        alert ('Error: Could not parse location "' + loc + '"');
        return null;
      }
      siteType = 'custom';
    }
  }

  return loc.substr (0, idx);
}


function LastDone (roleNum, mmbrNum)
{
  this.roleNum = roleNum;
  this.mmbrNum = mmbrNum;
  this.dt = null;
  this.rank = 0;
  this.times = 0;
}


function LastDone_AddBusyness (qs)
{
  var mmbrNum;

  for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++)
  {
    var busyness;
    var roleNum;

    busyness = 0;
    for (roleNum = 0; roleNum < roles.length; roleNum++)
    {
      if (qs[roleNum] != null) busyness += qs[roleNum][mmbrNum].rank;
    }
    busyness /= 10;
    for (roleNum = 0; roleNum < roles.length; roleNum++)
    {
      if (qs[roleNum] != null) qs[roleNum][mmbrNum].rank += busyness;
    }
  }
  return qs;
}


function LastDone_Compare (a, b)
{
  var ret;
  ret = a.rank - b.rank;
  if (ret != 0) return ret;
  ret = a.times - b.times;
  if (ret != 0) return ret;
  return 0;
}


function LastDone_PrepRawQs (hist)
{
  var dtNum;
  var len = hist.length;
  var qs = [];
  var roleNum;

  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    var role = roles[roleNum];
    if (role.base > roleNum) qs[roleNum] = null;  // it's one of many
    else
    {
      var mmbrNum;
      qs[roleNum] = [];
      for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++)
      {
        qs[roleNum][mmbrNum] = new LastDone (roleNum, mmbrNum);
      }
    }
  }

  for (dtNum = 0; dtNum < hist.length; dtNum++)
  {
    // semi-ad-hoc formula; gives credit for recent roles, and avoids div by 0.
    // doing a role that very time == 100 points, but will never happen.
    // one before/after that, 50 (i.e., 1/2), then 33 (1/3), then 25 (1/4), etc.
    LastDone_RecordDate (qs, hist[dtNum], 100.0 / (len - dtNum));
  }
  return qs;
}


function LastDone_RecordDate (qs, dateLine, points)
{
  var dt = dateLine[0];
  var roleNum;

  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    var filler;
    var mmbrNum;
    var role;
    var toCol;

    role = roles[roleNum];
    if (role.IsFake()) break;
    toCol = role.base;
    filler = dateLine[role.column];
    if (filler == '' || filler == 'X') continue;
    mmbrNum = Member_FindIdxByUName (filler);
    if (mmbrNum == -1) continue;
    qs[toCol][mmbrNum].dt = dt;
    qs[toCol][mmbrNum].rank += points;
    qs[toCol][mmbrNum].times++;
  }
}


function LastDone_SortQs (qs)
{
  var roleNum;
  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    if (qs[roleNum] != null) qs[roleNum].sort (LastDone_Compare);
  }
  return qs;
}


function Member (humanName, userName)
{
  this.name = humanName;
  this.user = userName;
  members.push (this);
}


function Member_Extract (profiles)
{
  var end = 0;
  while (true)
  {
    var name;
    var result;
    var user;

    result = Member_ExtractPiece (profiles, end, '<b>Name</b>',
                                  '<td width="100%">');
    name = result[0];
    end = result[1];
    if (name == '' || end == -1) break;
    result = Member_ExtractPiece (profiles, end, '<b>Username</b>', '<td >');
    user = result[0];
    end = result[1];
    if (user == '' || end == -1) break;
    new Member (name, user);
  }
}


function Member_ExtractPiece (profiles, end, tag, b4)
{
  var result = [ '', -1 ];
  var start = profiles.indexOf (tag, end);
  var str;

  if (start == -1) return result;
  start = profiles.indexOf (b4, start);
  if (start == -1) return result;
  start += b4.length;
  end = profiles.indexOf ('\n', start);
  str = profiles.substring (start, end);
  result[0] = str;
  result[1] = end + 1;
  return result;
}


function Member_FindByHName (name)
{
  var idx = Member_FindIdxByHName (name);
  if (idx == -1) return null;
  return members[idx];
}


function Member_FindByUName (name)
{
  var idx = Member_FindIdxByUName (name);
  if (idx == -1) return null;
  return members[idx];
}


function Member_FindIdxByHName (name)
{
  return FindInArray (members, name,
                      function (mmbr, name) { return mmbr.name == name; } );
}


function Member_FindIdxByUName (name)
{
  return FindInArray (members, name,
                      function (mmbr, name) { return mmbr.user == name; } );
}


function Member_SetList()
{
  var profilePage = AJAX_RetrieveResponse (memberReq, 'member');
  if (typeof (profilePage) == undefined || profilePage == null) return;
  Member_Extract (profilePage);
  Member_Retrieved = true;
  AJAX_ShowMainMaybe();
}


function MkDtList (radioName, funcName, curIdx)
{
  var html = '';
  var idx;

  for (idx = 0; idx < dutyFile.length; idx++)
  {
    var dt;
    var id = radioName + idx;
    dt = dutyFile[idx][0];
    html += '<input type="radio" id="' + id + '" name="' + radioName +
            '" onClick="' + funcName + '(' + idx + ')"';
    if (idx == curIdx) html += ' checked';
    html += '><span onClick="getElementById(\'' + id + '\').click()">' +
            dja_nbsp (dt) + '</span><br>\n';
  }
  return html;
}



function ParseAbsent (line, parts)
{
  var errMsg = '';
  var idx;
  var len = parts.length;
  var name;

  if (len < 2)
  {
    errMsg += 'Absence line must have at least two parts\n';
    errMsg += '("absent", and the membername),\n';
    errMsg += 'unlike "' + line + '"';
    alert (errMsg);
    return;
  }
  parts.shift();
  name = parts.join (' ');
  Asgn_SetMmbrAbsent (name, line);
}


function ParseAssign (line, parts)
{
  var errMsg = '';
  var i;
  var len = parts.length;
  var r;

  if (len < 2)
  {
    errMsg += 'Assign line must have two or more parts\n';
    errMsg += '("assign" and role name),\n';
    errMsg += 'unlike "' + line + '"';
    alert (errMsg);
    return;
  }
  parts.shift();
  name = parts.join (' ');
  Asgn_SetRoleAsgnd (name, line);
}


function ParseConfigLine (line)
{
  var parts;
  // WHY the heck is this needed?  We did it earlier on the whole thing!
  line = line.replace ('\r', '');
  if (line.length == 0) return;
  if (line.substr (0, 1) == '#') return;
  parts = line.split (' ');
  if (parts.length == 0) return;
  else if (parts[0] == 'assign') ParseAssign (line, parts);
  else if (parts[0] == 'absent') ParseAbsent (line, parts);
  else alert ('Cannot understand config line: "' + line + '" (' + parts + ')');
}


function Role (name, column)
{
  this.base = roles.length;  // default; may be changed later
  this.name = name;
  this.column = column;
  roles.push (this);
}


function Role_ExtractAll()
{
  var dateList;
  var idx;

  rolesPage = rolesPage.replace ('<td><b><a href="roster.cgi?AVAIL+', '');
  dateList = rolesPage.split ('<b>Duty Roster for ');
  dateList.shift();  // get rid of header junk
  // do ALL dates, in case they switched during this duty file period
  for (idx = 0; idx < dateList.length; idx++)
  {
    Role_ExtractFromDate (dateList[idx], dutyFile[idx]);
  }
  Role_MakeFakes();
}


function Role_ExtractFromDate (dailyRoster, dailyDuty)
{
  var cellNum;
  var colNum;
  var numCells;
  var numCols;
  var rosterRoles = dailyRoster.split ('<td><b>');

  numCells = rosterRoles.length;
  numCols = dailyDuty.length;
  // start duty file cols at 1 to skip date
  // start roster web page cells at 2 to skip header and member junk
  for (colNum = 1, cellNum = 2;
       colNum < numCols && cellNum < numCells;
       colNum++)
  {
    if (rosterRoles[cellNum][0] == '<') cellNum++;  // account for 'Available's
    if (dailyDuty[colNum] != 'X')
    {
      Role_ExtractMaybe (rosterRoles[cellNum++], dailyDuty[colNum], colNum);
    }
  }
}


function Role_ExtractMaybe (rosterCell, fillerName, column)
{
  var end;
  var role;
  var roleName;

  end = rosterCell.indexOf ('</b>');
  if (end == -1) return;  // TODO: indicate error to user
  roleName = rosterCell.substring (0, end);
  if (roleName == 'Meeting Notes:') return;  // gone too far!
  if (Role_FindIdx (roleName) == -1) new Role (roleName, column);
}


function Role_FindIdx (name)
{
  return FindInArray (roles, name,
                      function (role, name) { return role.name == name; });
}


function Role_GetBusyPpl (dateLine)
{
  var idx;
  var ret = [];

  for (idx = 0; idx < roles.length; idx++)
  {
    var mmbrNum;
    var role;
    role = roles[idx];
    if (role.IsFake()) break;
    mmbrNum = roles[idx].GetFiller (dateLine);
    if (mmbrNum != -1) ret.push (mmbrNum);
  }
  return ret;
}


Role.prototype.GetFiller = function (dateLine)
{
  var filler = dateLine[this.column];
  var idx = -1;
  if (filler != 'X' && filler != '')
  {
    idx = Member_FindIdxByUName (filler);
    if (idx == -1)
    {
      alert ('Cannot find member "' + filler + '", slated to fill role "' +
             this.name + '" on date "' + dateLine[0] + '"!');
    }
  }
  return idx;
};


Role.prototype.IsFake = function()
{
  return this.base == -1;
};


Role.prototype.IsOneOfMany = function()
{
  return this.base > Role_FindIdx (this.name);
};


function Role_MakeFakes()
{
  var roleNum;
  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    var baseName;
    var idx;
    var name;
    var role;

    role = roles[roleNum];
    if (role.IsFake()) break;
    name = role.name;
    if (name == 'Backup Speaker') baseName = 'Speaker';
    else if (name.substr (name.length - 3, 2) != ' #') continue;
    else baseName = name.substr (0, name.length - 3);
    idx = Role_FindIdx (baseName);
    if (idx == -1)
    {
      idx = roles.length;
      new Role (baseName, -1);
      roles[idx].base = -1;
    }
    roles[roleNum].base = idx * 1.0;  // make DAMN sure it's an INTEGER!  B-<
  }
}


Role.prototype.MakeTimesBox = function (num, len)
{
  return '<tr><td><input id="times' + this.name +
         '" type="text" size="1" value="1">&nbsp;' + this.name + '\n';
};


function Role_SetList()
{
  rolesPage = AJAX_RetrieveResponse (roleReq, 'role');
  if (typeof (rolesPage) != undefined && rolesPage != null)
  {
    Role_Retrieved = true;
    AJAX_ShowMainMaybe();
  }
}


function Rpt()
{
  var hist;
  var mmbrNum;
  var output;
  var qs;
  var role;
  var roleNum;
  var win;

  hist = historyFile.slice (rptsMinIdx, rptsMaxIdx+1);

  qs = LastDone_PrepRawQs (hist);

  output = '<div align="center"><h1>Roles Done from ' +
            historyFile[rptsMinIdx][0] + ' to ' + historyFile[rptsMaxIdx][0] +
            '</h1></div><p><table border="1">\n<tr><th>Member</th>';

  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    role = roles[roleNum];
    if (role.IsOneOfMany()) continue;
    output += '<th>' + role.name + '</th>';
  }
  output += '<th>TOTAL</th>';

  output += '</tr>\n';

  for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++)
  {
    var tot;
    tot = 0;
    output += '<tr><td>' + dja_nbsp (members[mmbrNum].name) + '</td>';
    for (roleNum = 0; roleNum < roles.length; roleNum++)
    {
      var times;
      role = roles[roleNum];
      if (role.IsOneOfMany()) continue;
      times = qs[roleNum][mmbrNum].times;
      output += '<td>' + times + '</td>';
      tot += times;
    }
    output += '<td>' + tot + '</td></tr>\n';
  }
  output += '</table>\n';

  win = window.open ('', 'Role_Report',
                     'location=no,menubar=no,scrollbar=yes,statusbar=no,toolbar=no');
  win.document.body.innerHTML = output;
  try { win.sizeToContent(); }
  catch (e) { /* not supported in IE7; just ignore the error */ }
}


function Rpts_Init_Internals()
{
  var tmpStr;
  tmpStr  = '<p><input type="button" value="Main Menu" onClick="ShowDiv (main)">';
  tmpStr += '<h1>Timesliced Reports</h1>';
  tmpStr += '<p>These are the dates in your history file. ';
  tmpStr += 'Select one date to begin the analysis period, and one to end it, ';
  tmpStr += 'then click the Report button.';
  tmpStr += '<p><input onClick="Rpt()" type="button" value=" Report ">';
  tmpStr += '<p><div id="rptsDtList"></div>';
  rptsDiv.innerHTML = tmpStr;
  rptsDateList = $('rptsDtList');
  rptsMaxIdx = historyFile.length - 1;
  rptsMinIdx = 0;
  rptsInitted = true;
}


function Rpts_MkDtBtn (idx, isEnabled, isChecked, funcName)
{
    var dateHTML =  '<td bgcolor="';
    if (isEnabled) dateHTML += 'green';
    else dateHTML += 'red';

    dateHTML += '"><input type="radio" ';
    if (isChecked) dateHTML += 'checked="true" ';
    if (isEnabled) dateHTML += 'onClick="' + funcName + '(' + idx + ')"';
    else dateHTML += 'disabled="true"';
    dateHTML += '></td>';
    return dateHTML;
}


function Rpts_MkDtList()
{
  var dateHTML = '<table border="1"><tr><th>Begin</th><th>End</th><th align="left">Date</th></tr>\n';
  var idx;

  for (idx = 0; idx < historyFile.length; idx++)
  {
    var dtIdx;  // index of current line *in history file*
    var maxAbled;
    var minAbled;

    dtIdx = historyFile.length - 1 - idx;
    maxAbled = dtIdx >= rptsMinIdx;
    minAbled = dtIdx <= rptsMaxIdx;

    dateHTML += '<tr>';
    dateHTML += Rpts_MkDtBtn (dtIdx, minAbled, dtIdx == rptsMinIdx,
                              'Rpts_SetMin');
    dateHTML += Rpts_MkDtBtn (dtIdx, maxAbled, dtIdx == rptsMaxIdx,
                              'Rpts_SetMax');
    dateHTML += '<td>';
    if (minAbled && maxAbled) dateHTML += '<b>';
    dateHTML += historyFile[dtIdx][0];  // show them BACKWARD!
    if (minAbled && maxAbled) dateHTML += '</b>';
    dateHTML += '</td></tr>\n';
  }
  rptsDateList.innerHTML = dateHTML + '</table>';
}


function Rpts_SetMin (minIdx)
{
  rptsMinIdx = minIdx;
  Rpts_MkDtList();
}


function Rpts_SetMax (maxIdx)
{
  rptsMaxIdx = maxIdx;
  Rpts_MkDtList();
}


function Rpts_ShowDiv()
{
  if (! rptsInitted) Rpts_Init_Internals();
  Rpts_MkDtList();
  ShowDiv (rptsDiv);
}


function SetDebugFetchingMsg()
{
  var s = 'Fetching:</ul>';
  if (typeof(dutyFile)==undefined || dutyFile==null) s += '<li>Future roles';
  if (typeof(historyFile)==undefined || historyFile==null) s += '<li>Past roles';
  if (! Member_Retrieved) s += '<li>Member list';
  if (! Role_Retrieved) s += '<li>Role list';
  if (configFile != '') s += '<li>Configuration file';
  s += '</ul>';
  DebugClr();
  Debug (s);
}



function Setup()
{
  var subsDiv;
  var tmpStr = '';

  asgn_initted = false;
  Member_Retrieved = false;
  members = [];
  Role_Retrieved = false;
  roles = [];
  rpts_initted = false;

  clubURL = GetClubURL (document.location.href);
  if (clubURL == null) return;

  mainDiv = $('main');
  Turn (mainDiv, false);
  tmpStr = [
    '<h2>Main Menu</h2>',
    '<table cellpadding="10"><tr>',
    '<th>Main Functions</th><td>&nbsp;</td><th>Raw Data</th><td>&nbsp;</td><th>Auxiliary Functions</th>',
    '</tr><tr><td align="center">',
    '<p><input type="button" value=" Assignments " onClick="Asgn_ShowDiv()">',
    '<p><input type="button" value=" Printable Agenda " onClick="Agenda_ShowDiv()">',
    '<p><input type="button" value=" Timeslices " onClick="Rpts_ShowDiv()">',
    '<p><input type="button" value=" Suggestions " onClick="Sugg()">',
    '</td><td>&nbsp;</td><td align="center">',
    '<p><input type="button" value=" Config File " onClick="window.open (\'' +
    clubURL + '/members/files/darts.cfg\')">',
    '<p><input type="button" value=" Raw History " onClick="window.open (\'' +
    clubURL + '/members/historical.txt\')">',
    '<p><input type="button" value=" Raw Duty File " onClick="window.open (\'' +
    clubURL + '/members/duty.txt\')">',
    '</td><td>&nbsp;</td><td align="center">',
    '<p><input type="button" value=" HELP! " onClick="window.open (\'' +
    'dartsHelp.html\')">',
    '<p><input type="button" value=" HIRE THE AUTHOR " onClick="window.open (\'http://www.davearonson.com/\')">',
    '</td></tr></table>'
  ].join ('\n');
  mainDiv.innerHTML = tmpStr;

  subsDiv = $('subs');
  tmpStr = '';
  tmpStr += '<div align="center" id="agenda"></div>';
  tmpStr += '<div align="center" id="asgn"></div>';
  tmpStr += '<div align="center" id="rpts"></div>';
  tmpStr += '<div align="center" id="sugg"></div>';
  subsDiv.innerHTML = tmpStr;

  agendaDiv = $('agenda');
  Turn (agendaDiv, false);

  asgnDiv = $('asgn');
  Turn (asgnDiv, false);

  rptsDiv = $('rpts');
  Turn (rptsDiv, false);

  debugDiv = $('DEBUG');

  curDiv = null;

  AJAX_FetchFiles();  // when all the files come back, that will enable main div
}


function ShowDiv (which)
{
  if (curDiv != null) Turn (curDiv, false);
  curDiv = which;
  Turn (curDiv, true);
}


function Sugg()
{
  var folded;
  var ld;
  var output = '<table border="2" cellspacing="2" cellpadding="2">\n<tr><th>Name</th>';
  var q;
  var qs;
  var mmbrNum;
  var mmbrQs;
  var roleNum;
  var win;

  if (dutyFile.length > 0) folded = FoldHistoryAt (0);
  else folded = historyFile;

  qs = LastDone_PrepRawQs (folded);
  qs = LastDone_AddBusyness (qs);
  qs = LastDone_SortQs (qs);

  mmbrQs = [];
  for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++) mmbrQs[mmbrNum] = [];

  for (roleNum = 0; roleNum < roles.length; roleNum++)
  {
    q = qs[roleNum];
    if (q == null) continue;
    for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++)
    {
      ld = q[mmbrNum];
      ld.rank = mmbrNum;
      mmbrQs[ld.mmbrNum].push(ld);
    }
  }

  output = '<div align="center"><h1>Suggested Roles</h1></div><p><table border="1">\n';
  for (mmbrNum = 0; mmbrNum < members.length; mmbrNum++)
  {
    q = mmbrQs[mmbrNum];
    q.sort (LastDone_Compare);
    output += '<tr>\n <td><b>' + members[mmbrNum].name + '</b></td>\n';
    for (roleNum = 0; roleNum < q.length; roleNum++)
    {
      ld = q[roleNum];
      output += ' <td><b>' + roles[ld.roleNum].name + '</b><br><small>(rank ' +
                ld.rank + ', done ' + ld.times + ' times';
      if (ld.times > 0) output += ',<br>last ' + ld.dt;
      output += ')</small></td>\n';
    }
    output += '</tr>\n';
  }
  output += '</table>\n';

  win = window.open ('', 'Suggested_Roles',
                     'location=no,menubar=no,scrollbar=yes,statusbar=no,toolbar=no');
  win.document.body.innerHTML = output;
  try { win.sizeToContent(); }
  catch (e) { /* not supported in IE7; just ignore the error */ }
}


function Turn (which, how)
{
  if (which == null) alert ("Error: Trying to turn a null div on or off!");
  else which.style.display = how ? '' : 'none';
}


// END OF FILE!
