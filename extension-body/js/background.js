// import { getSingleSelector } from 'optimal-select';

var config = {
  authDomain: 'cliw-test.firebaseapp.com',
  apiKey: "AIzaSyDNynAgYGkrXFQfoPrY2iScW8aT28yQmYk",
  databaseURL: "https://cliw-test.firebaseio.com",
  storageBucket: "gs://cliw-test.appspot.com/"
};

firebase.initializeApp(config);

function initApp() {

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var currentUrl;

      userId = firebase.auth().currentUser.uid;
      var usersRef = firebase.database().ref('/users/' + userId);

      // If new user, add default colour
      usersRef.once('value', function(snapshot) {
        if (snapshot.val() == null) {
          usersRef.child(userId).set({
            highlight_color: "#fff385"
          });
        }
      });

      chrome.tabs.query({
          'active': true,
          'windowId': chrome.windows.WINDOW_ID_CURRENT
        },
        function(tabs) {
          currentUrl = tabs[0].url;

          // check if url in "followed" links
          usersRef.child("/followed_links/").orderByChild('url')
            .equalTo(currentUrl).once('value', function(snapshot) {
              if (snapshot.exists()) {

                // sending jquery to content script
                chrome.tabs.executeScript(null, {
                  file: "js/jquery-3.2.1.min.js"
                }, function() {

                  // retrieving formatted dom from active tab
                  chrome.tabs.executeScript(tabs[0].id, {
                    code: '(' + DOMFormatter + ')();'
                  }, function(pageDOM) {

                    pageDOM = pageDOM[0];

                    // First visit to this page?              
                    usersRef.child("/history/").orderByChild('url')
                      .equalTo(currentUrl).once('value', function(snapshot) {

                        // Add dom for this URL if not existing
                        if (!snapshot.exists()) {

                          var newKey = usersRef.child("/history/").push().key;

                          usersRef.child("/history/" + newKey).set({
                            url: currentUrl,
                            dom: pageDOM
                          });

                          // Update the dom json
                        } else {

                          snapshot.forEach(function(data) {
                            if (data.child("url").val() == currentUrl) {

                              var updates = {};
                              updates["/history/" + data.key + "/dom"] = pageDOM;
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
      var email = "test@test.test";
      var pass = "test1234";

      // startAuth(true);
      loginWithCredentials(email, pass);
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

  firebase.auth().signInWithRedirect(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    // ...
  }).catch(function(error) {
    document.querySelector(".differences h2").innerText = error.message;
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
}

function loginWithCredentials(email, pass) {
  firebase.auth().signInWithEmailAndPassword(email, pass)
    .catch(function(error) {
      document.querySelector(".differences h2").innerText = error.message;
    });
}

/**
 * Starts the sign-in process.
 */

window.onload = function() {
  initApp();
};

function DOMFormatter() {
  var dom = $("p:not(:has(>div))");
  var allElements = [];
  for (var i = 0; i < dom.length; i++) {

    allElements[i] = {
      "selector": fullPath(dom[i]),
      "value": dom[i].innerText ? dom[i].innerText : "undefined"
    };
  }

  return JSON.stringify(allElements);
}

function fullPath(el) {
  var names = [];
  while (el.parentNode) {
    if (el.id) {
      names.unshift('#' + el.id);
      break;
    } else {
      if (el == el.ownerDocument.documentElement) names.unshift(el.tagName);
      else {
        for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
        names.unshift(el.tagName + ":nth-child(" + c + ")");
      }
      el = el.parentNode;
    }
  }
  return names.join(" > ");
}