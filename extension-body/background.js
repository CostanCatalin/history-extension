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

      // If new user, add default colour
      firebase.database().ref('/users/' + userId).once('value', function(snapshot) {
        if (snapshot.val() ==  null) {
          firebase.database().ref('users/' + userId).set({
            highlight_color: "#fff385"
          });
        }
      });
    }    
    else{
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
