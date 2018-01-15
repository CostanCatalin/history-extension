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

          usersRef.once('value', function(snapshot) {
            // If new user, add default options
            if (snapshot.val() == null) {
              usersRef.set({
                highlight_color: "#fff385",
                show_number_in_icon: false
              });
              // Else send them to extension
            } else {
              displayOptions(snapshot.val().show_number_in_icon, snapshot.val().highlight_color);
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
                    displayEnabled(true);

                    // sending jquery to content script
                    chrome.tabs.executeScript(null, {
                      file: "js/jquery-3.2.1.min.js"
                    }, function() {

                      // retrieving formatted dom from active tab
                      chrome.tabs.executeScript(tabs[0].id, {
                        code: '(' + DOMFormatter + ')();' + fullPath
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
                                dom: pageDOM,
                                custom_colour: "not_set",
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

                    if (selector != "is-enabled") {
                      var updates = {};
                      updates[mapping[selector]] = value;
                      usersRef.update(updates);
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

                            // Add dom for this URL if not existing
                            if (snapshot.exists()) {
                              var key = Object.keys(snapshot.val())[0];

                              usersRef.child("/followed_links/").child(key).child("url").set(null);
                            }
                          });
                      }
                    }

                });
              }
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
          if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // ...
          }
          // The signed-in user info.
          var user = result.user;
          console.log(result);
          // ...
        }).catch(function(error) {
          console.log(error);
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

      /**
       * Starts the sign-in process.
       */

      window.onload = function() {
        initApp();
      };


      function displayOptions(showNumber, color) {
        if (showNumber) {
          document.getElementById("icon-number").setAttribute("checked", true);
        }
        document.getElementById("hi-color").setAttribute("value", color);
      }

      function displayEnabled(isSet) {
        if (isSet) {
          document.querySelector(".container-1 label").innerText = "Enabled on this page";
          document.getElementById("is-enabled").setAttribute("checked", true);
        }
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
        var dom = $("p:not(:has(>div))");

        var allElements = [];
        for (var i = 0; i < dom.length; i++) {

          allElements[i] = {
            "selector": fullPath(dom[i]),
            "value": dom[i].innerText ? dom[i].innerText : "undefined"
          };
        }

        console.log("sending document to extension");
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