var config = {
  authDomain: 'cliw-test.firebaseapp.com',
  apiKey: "AIzaSyDNynAgYGkrXFQfoPrY2iScW8aT28yQmYk",
  databaseURL: "https://cliw-test.firebaseio.com",
  storageBucket: "gs://cliw-test.appspot.com/"
};

firebase.initializeApp(config);
var oldDOM = null;
var currentColor = null;

function initApp() {

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var currentUrl;

      userId = firebase.auth().currentUser.uid;
      var usersRef = firebase.database().ref('/users/' + userId);

      usersRef.once('value', function(snapshot) {
        // If new user, add default options
        if (snapshot.val() == null) {

          currentColor = "#fff385";

          usersRef.set({
            highlight_color: "#fff385",
            show_number_in_icon: false
          });
          // Else send data to extension
        } else {
          currentColor = snapshot.val().highlight_color;
          displayOptions(snapshot.val().show_number_in_icon, snapshot.val().highlight_color, snapshot.val().is_enabled);
        }
      });

      chrome.tabs.query({
          'active': true,
          'windowId': chrome.windows.WINDOW_ID_CURRENT
        },
        function(tabs) {
          currentUrl = tabs[0].url;

          // on-change for extension input
          var inputFields = document.querySelectorAll("input");
          var mapping = {
            "icon-number": "show_number_in_icon",
            "hi-color": "highlight_color",
            "is-enabled": "followed_links"
          };

          for (var i = 0; i < inputFields.length; i++) {
            inputFields[i].addEventListener('change', function(event) {
              var selector = event.target.id;
              var value = event.target.value;

              if (event.target.value == "on") {
                value = event.target.checked;
              }

              // update "see icon number"
              if (selector == "icon-number") {
                var updates = {};
                updates[mapping[selector]] = value;
                usersRef.update(updates);

                // update color for page
              } else if (selector == "hi-color") {
                usersRef.child("/history/").orderByChild('url')
                  .equalTo(currentUrl).once('value', function(snapshot) {
                    if (snapshot.exists()) {
                      snapshot.forEach(function(data) {
                        if (data.child("url").val() == currentUrl) {

                          var updates = {};
                          updates["/history/" + data.key + "/custom_colour"] = value;
                          currentColor = value;
                          usersRef.update(updates);
                        }
                      });
                    } else {
                      console.log("Tried to change color for current page and failed");
                    }
                  });

                // update db for is_enabled
              } else {

                // insert
                if (value) {
                  console.log("Adding to followed");

                  var newKey = usersRef.child("/followed_links/").push().key;

                  usersRef.child("/followed_links/" + newKey).set({
                    url: currentUrl
                  });

                  // delete
                } else {
                  console.log("deleting current page");

                  usersRef.child("/followed_links/").orderByChild('url')
                    .equalTo(currentUrl).once('value', function(snapshot) {

                      if (snapshot.exists()) {
                        var key = Object.keys(snapshot.val())[0];

                        usersRef.child("/followed_links/").child(key).child("url").set(null);
                      }
                    });
                }
              }

            });
          }

          // check if url in "followed" links
          usersRef.child("/followed_links/").orderByChild('url')
            .equalTo(currentUrl).once('value', function(snapshot) {
              if (snapshot.exists()) {
                displayEnabled(true);

                usersRef.child("/history/").orderByChild('url')
                  .equalTo(currentUrl).once('value', function(snapshot) {

                    if (snapshot.exists()) {
                      oldDOM = Object.entries(snapshot.val())[0][1].dom;
                    }

                    // retrieving formatted dom from active tab
                    chrome.tabs.executeScript(tabs[0].id, {
                      code: 'var currentColor = "' + currentColor + '"; var oldDOM = ' + JSON.stringify(oldDOM) + '; ' + fullPath + '; ' + setColorToChanges + '; ' + setColorToDefault + '; (' + DOMFormatter + ')();'
                    }, function(results) {
                      console.log("took DOM");
                      results = JSON.parse(results);

                      var pageDOM = JSON.stringify(results.dom);
                      var changes = results.changes ? results.changes : 0;
                      var percentage = results.percentage;

                      document.querySelector(".differences h1").innerText = changes;

                      chrome.browserAction.setBadgeText({
                        tabId: tabs[0].id,
                        text: String(changes)
                      });
                      chrome.browserAction.setBadgeBackgroundColor({
                        color: [95, 92, 100, 255]
                      });

                      // First visit to this page?              
                      usersRef.child("/history/").orderByChild('url')
                        .equalTo(currentUrl).once('value', function(snapshot) {

                          // Add dom for this URL if not existing
                          if (!snapshot.exists()) {

                            var newKey = usersRef.child("/history/").push().key;

                            usersRef.child("/history/" + newKey).set({
                              custom_colour: "not_set",
                              changes: 0,
                              changes_percentage: 0,
                              date: new Date().toLocaleString(),
                              dom: pageDOM,
                              url: currentUrl
                            });

                            // Update the dom json
                          } else {
                            var custom_colour = Object.entries(snapshot.val())[0][1].custom_colour;
                            if (custom_colour != "not_set") {
                              displayColour(custom_colour);
                              currentColor = custom_colour;

                              //resend color
                              chrome.tabs.executeScript(tabs[0].id, {
                                code: ' currentColor = "' + currentColor + '"; (' + setColorToChanges + ')();'
                              }, function() {});

                            } else {
                              console.log("colour not set");
                            }

                            snapshot.forEach(function(data) {
                              if (data.child("url").val() == currentUrl) {

                                var updates = {};
                                updates["/history/" + data.key + "/dom"] = pageDOM;
                                updates["/history/" + data.key + "/changes"] = changes;
                                updates["/history/" + data.key + "/changes_percentage"] = percentage;
                                updates["/history/" + data.key + "/date"] = new Date().toLocaleString();
                                usersRef.update(updates);
                              }
                            });
                          }

                        });
                    });
                  });

              } else {
                console.log("The url is not being followed");
              }
            });
        });
    } else {
      startAuth(true);
    }
  });

}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
  // Request an OAuth token from the Chrome Identity API.
  var provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider).then(function(result) {

  }).catch(function(error) {
    console.log(error);
    // Handle Errors here.
  });
}

/**
 * Starts the sign-in process.
 */

window.onload = function() {
  initApp();
};

function displayOptions(showNumber, color, is_enabled) {
  if (showNumber) {
    document.getElementById("icon-number").setAttribute("checked", true);
  }

  displayEnabled(is_enabled);

  displayColour(color);
}

function displayEnabled(isSet) {
  if (isSet) {
    document.querySelector(".container-1 label").innerText = "Enabled on this page";
    document.getElementById("is-enabled").setAttribute("checked", true);
  }
}

function displayColour(color) {
  document.getElementById("hi-color").setAttribute("value", color);
}

function logout() {
  firebase.auth().signOut().then(function() {
      console.log("signed-out");
    })
    .catch(function(error) {
      console.log("signed-out error");
      console.log(error);
    });
}



/*Functions sent to content script*/
function DOMFormatter() {

  var appClassName = "updater-new-data-3U8ZPIKQQ6J8JZ6C7P4SJ470GR8OKKHB2R0DKUC334MV77HSNQJHPPHXHD3E";
  var hoverClass = "updater-old-data-3U8ZPIKQQ6J8JZ6C7P4SJ470GR8OKKHB2R0DKUC334MV77HSNQJHPPHXHD3E";

  var myOldDOM = null;
  if (oldDOM != undefined) {
    myOldDOM = JSON.parse(oldDOM)
  }
  myOldDOM = JSON.parse(myOldDOM);

  var myNewDOM = [];
  var contentTags = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "b",
    "i",
    "pre",
    "button",
    "img",
    "label",
    "td",
    "li",
    "input"
  ];

  for (var j = 0; j < contentTags.length; j++) {
    var elements = document.getElementsByTagName(contentTags[j]);

    for (var i = 0; i < elements.length; i++) {
      var alreadyProcessed = elements[i].querySelector("." + hoverClass);

      if (alreadyProcessed != null) {
        try {
          elements[i].removeChild(alreadyProcessed);
        } catch (e) {
          console.log("Browser quirks mode -- remove");
        }
      }

      myNewDOM[i] = {
        "selector": fullPath(elements[i]),
        "value": elements[i].innerHTML ? elements[i].innerHTML : "undefined"
      };
    }
  }
  
  var numberDifference = 0;
  var contentDifferences = 0;

  if (myOldDOM != null) {

    //check dom stuff
    numberDifference = Math.abs(myOldDOM.length - myNewDOM.length);
    
    for (var i = 0; i < myNewDOM.length; i++) {
      for (var j = 0; j < myOldDOM.length; j++) {
        if (myNewDOM[i].selector == myOldDOM[j].selector) {
          if (myNewDOM[i].value != myOldDOM[j].value) {
            contentDifferences++;

            var spacer = " ";
            if (document.querySelector(myNewDOM[i].selector).className == "") {
              spacer = "";
            }
            document.querySelector(myNewDOM[i].selector).className += spacer + appClassName;
            document.querySelector(myNewDOM[i].selector).innerHTML += "<div class=\"" + hoverClass + "\"><h2>Previous Value</h2> <div class=\"data\">" + myOldDOM[j].value + "</div></div>";
          }
        }
      }
    }
  }

  if (contentDifferences > 0) {
    setColorToChanges();

    var css = '.' + appClassName + ' {cursor: pointer;}' +
      ' .' + appClassName + ' .' + hoverClass + '{background-color: white; display: none; position: fixed; z-index:9001; top: 10px; left: 10px; box-shadow: 0 8px 17px 0 rgba(0,0,0,.2)}' +
      ' .' + appClassName + ':hover .' + hoverClass + '{ display: block; }' +
      ' .' + hoverClass + " h2{ padding: 10px 20px; background-color: #516c8d; color: white; font-weight: bold;}" +
      ' .' + hoverClass + " .data{ padding: 0 10px 15px;}";

    var style = document.createElement('style');

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
  } else {
    setColorToDefault();
  }

  var returnObj = {
    "changes": numberDifference + contentDifferences,
    "percentage": (((numberDifference + contentDifferences) / (myNewDOM.length + contentDifferences)) * 100).toFixed(2),
    "dom": JSON.stringify(myNewDOM)
  };

  return JSON.stringify(returnObj);
}

function setColorToChanges() {
  var appClassName = "updater-new-data-3U8ZPIKQQ6J8JZ6C7P4SJ470GR8OKKHB2R0DKUC334MV77HSNQJHPPHXHD3E";

  elements = document.getElementsByClassName(appClassName);
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.backgroundColor = currentColor;
  }
}

function setColorToDefault() {
  var appClassName = "updater-new-data-3U8ZPIKQQ6J8JZ6C7P4SJ470GR8OKKHB2R0DKUC334MV77HSNQJHPPHXHD3E";

  elements = document.getElementsByClassName(appClassName);
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.backgroundColor = "";
    elements[i].classList.remove(appClassName);
  }
}

function fullPath(el) {
  var names = [];
  while (el.parentNode) {
    if (el.id) {
      names.unshift('#' + el.id);
      break;
    } else {

      if (el == el.ownerDocument.documentElement) {
        names.unshift(el.tagName);
      } else {

        for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
        names.unshift(el.tagName + ":nth-child(" + c + ")");
      }
      el = el.parentNode;
    }
  }
  return names.join(" > ");
}