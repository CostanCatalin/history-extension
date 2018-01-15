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
            userId = firebase.auth().currentUser.uid;
            var usersRef = firebase.database().ref('/users/' + userId);

            // get history
            usersRef.child("history").on('value', function(snapshot) {
                // If new user, add default options
                if (snapshot.exists()) {
                    var historyOnjects = [];
                    for (var key in snapshot.val()) {
                        if (snapshot.val().hasOwnProperty(key)) {
                            var obj = snapshot.val()[key];
                            historyOnjects.push({
                                "url": obj.url,
                                "changes": obj.changes,
                                "changes_percentage": obj.changes_percentage,
                                "date": obj.date
                            });
                        }
                    }
                    printHistory(historyOnjects);

                } else {
                    console.log("no history");
                }
            });


            // get color
            usersRef.on('value', function(snapshot) {
                // If new user, add default options
                if (snapshot.val() != null) {
                    chosenColor(snapshot.val().highlight_color);
                } else {
                    console.log("new user");
                }
            });

            // get followed pages
            usersRef.child("followed_links").on('value', function(snapshot) {
                // If new user, add default options
                if (snapshot.val() != null) {
                    var urls = [];
                    for (var key in snapshot.val()) {
                        if (snapshot.val().hasOwnProperty(key)) {
                            var obj = snapshot.val()[key];
                            urls.push(obj.url);
                        }
                    }
                    printLinks(urls);

                } else {
                    console.log("no links");
                }
            });

        } else {
            firebase.auth().signInWithEmailAndPassword("test@test.test", "test1234").catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorCode + ": " + errorMessage);
                // ...
            });

            //startAuth(true);
        }
    });
};

function chosenColor(color) {
    document.getElementById("hi-color").setAttribute("value", color);
}

function printLinks(links) {
    $('.followed table').empty();

    for (var i = 0; i < links.length; i++) {
        element = links[i];

        $('<tr></tr>').appendTo('.followed table');
        $('.followed table tr:last-of-type').append(
            $('<td></td>').text(i + 1),
            $('<td></td>').text(links[i]),
            $('<td class=" remove" onclick="deleteLink(\'' + links[i] + '\')"><span class="glyphicon glyphicon-remove"></span><span class="hidden-xs">Remove</span></td>')
        );
    }
}

function printHistory(elements) {
    var $table = $('.history table');
    $table.empty();
    $('<tr><th>No.</th><th>URL</th><th>Changes</th><th>% Changed</th><th>Date</th></tr>').appendTo($table);
    for (var i = 0; i < elements.length; i++) {
        var current = elements[i];
        $('<tr></tr>').appendTo($table);
        $('.history table tr:last-of-type').append(
            $('<td></td>').text(i + 1),
            $('<td></td>').text(current.url),
            $('<td></td>').text(current.changes),
            $('<td></td>').text(current.changes_percentage),
            $('<td></td>').text(current.date)
        );
    }
}

function deleteLink(url) {
    var userId = firebase.auth().currentUser.uid;
    var followedRef = firebase.database().ref('/users/' + userId + '/followed_links');

    followedRef.orderByChild('url')
        .equalTo(url).once('value', function(snapshot) {

            // Add dom for this URL if not existing
            if (snapshot.exists()) {
                console.log("will delete");
                var key = Object.keys(snapshot.val())[0];

                followedRef.child(key).child("url").set(null);
            }
        });
}

function downloadObjectAsJson(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

document.addEventListener("DOMContentLoaded", function(event) {
    document.querySelector("#addPageModal .btn-success")
        .addEventListener('click', function(event) {

            var url = document.querySelector("#addPageModal #url").value;
            var expression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
            var regex = new RegExp(expression);

            if (url.match(regex)) {
                var userId = firebase.auth().currentUser.uid;
                var followedRef = firebase.database().ref('/users/' + userId + '/followed_links');
                var newKey = followedRef.push().key;

                followedRef.child(newKey).set({
                    url: url
                });
            } else {
                alert("Invalid url");
            }
            document.querySelector("#addPageModal #url").value = "";
        });

    //download config
    document.querySelector("#options .download")
        .addEventListener('click', function(event) {

            var userId = firebase.auth().currentUser.uid;
            var userRef = firebase.database().ref('/users/' + userId);

            userRef.once("value", function(snapshot) {
                if (snapshot.exists()) {
                    downloadObjectAsJson(snapshot.val(), "settings");
                }
            });


            document.querySelector("#addPageModal #url").value = "";
        });
});
/**
 * Starts the sign-in process.
 */

window.onload = function() {
    initApp();
};

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
    // Request an OAuth token from the Chrome Identity API.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
    firebase.auth().getRedirectResult().then(function(result) {
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